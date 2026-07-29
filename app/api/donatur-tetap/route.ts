import { NextResponse } from "next/server";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { donaturTetap, pengaturan } from "@/lib/db/schema";
import { withActorNames } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const TANGGAL_VALID = ["1-5", "6-10", "11-15", "16-20", "21-25", "26-31"];
const METODE_VALID = ["transfer_bank", "qris", "tunai_sekretariat"];
const KELAMIN_VALID = ["laki-laki", "perempuan"];
const PRESET = [50000, 100000, 200000, 500000, 1000000];
const DEFAULT_TARGET_OPERASIONAL_BULANAN = 15000000;

/** Normalisasi nomor WhatsApp ke format 62xxx. */
function normalizeWa(input: string): string {
  let d = input.replace(/[^\d]/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  if (!d.startsWith("62")) d = "62" + d;
  return d;
}

/** Mengembalikan target operasional bulanan dari tabel pengaturan, atau default. */
async function getTargetOperasional(): Promise<number> {
  const rows = await db
    .select()
    .from(pengaturan)
    .where(eq(pengaturan.key, "target_operasional_bulanan"))
    .limit(1);
  const n = parseInt(rows[0]?.value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TARGET_OPERASIONAL_BULANAN;
}

/** GET dual-mode: publik → agregat (target operasional); admin → semua record via ?admin=1 + session. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminParam = searchParams.get("admin") === "1";

    const session = await auth.api.getSession({ headers: await headers() });
    const isAdmin = !!session;

    // Admin (via ?admin=1 + session): semua record donatur
    if (adminParam && isAdmin) {
      const rows = await db.select().from(donaturTetap).orderBy(desc(donaturTetap.createdAt));
      const enriched = await withActorNames(rows);
      return NextResponse.json(enriched);
    }

    // Publik: agregat (target operasional) — abaikan session agar tidak NaN saat admin login.
    const target = await getTargetOperasional();
    const rows = await db
      .select()
      .from(donaturTetap)
      .where(inArray(donaturTetap.status, ["terkonfirmasi", "aktif"]));
    const jumlahDonatur = rows.length;
    const totalKomitmen = rows.reduce((s, r) => s + r.nominalBulanan, 0);
    const persentase = target > 0 ? Math.min(100, Math.round((totalKomitmen / target) * 100)) : 0;
    return NextResponse.json({ jumlahDonatur, totalKomitmen, target, persentase });
  } catch (error: any) {
    console.error("Error fetching donatur tetap:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** POST publik: submit pendaftaran. */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nama = String(body?.nama ?? "").trim();
    const jenisKelamin = String(body?.jenisKelamin ?? "");
    const whatsappRaw = String(body?.whatsapp ?? "").trim();
    const alamat = body?.alamat ? String(body.alamat).trim() : null;
    const email = body?.email ? String(body.email).trim() : null;
    const nominalBulanan = Number(body?.nominalBulanan);
    const nominalLainnya = !!body?.nominalLainnya;
    const tanggalPembayaran = String(body?.tanggalPembayaran ?? "");
    const metodePembayaran = String(body?.metodePembayaran ?? "");
    const persetujuanDonatur = !!body?.persetujuanDonatur;
    const persetujuanPengingatWa = !!body?.persetujuanPengingatWa;
    const persetujuanLaporan = !!body?.persetujuanLaporan;

    // Validasi server
    if (nama.length < 3 || nama.length > 100) {
      return NextResponse.json({ error: "Nama lengkap wajib diisi (3–100 karakter)" }, { status: 400 });
    }
    if (!KELAMIN_VALID.includes(jenisKelamin)) {
      return NextResponse.json({ error: "Jenis kelamin tidak valid" }, { status: 400 });
    }
    const whatsapp = normalizeWa(whatsappRaw);
    if (!/^62\d{8,13}$/.test(whatsapp)) {
      return NextResponse.json({ error: "Nomor WhatsApp tidak valid" }, { status: 400 });
    }
    if (alamat && alamat.length > 500) {
      return NextResponse.json({ error: "Alamat maksimal 500 karakter" }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
    }
    if (!Number.isInteger(nominalBulanan) || nominalBulanan <= 0) {
      return NextResponse.json({ error: "Nominal donasi tidak valid" }, { status: 400 });
    }
    const isPreset = PRESET.includes(nominalBulanan);
    if (nominalLainnya && nominalBulanan < 10000) {
      return NextResponse.json({ error: "Nominal lainnya minimal Rp 10.000" }, { status: 400 });
    }
    if (!nominalLainnya && !isPreset) {
      return NextResponse.json({ error: "Nominal donasi tidak valid" }, { status: 400 });
    }
    if (!TANGGAL_VALID.includes(tanggalPembayaran)) {
      return NextResponse.json({ error: "Tanggal pembayaran tidak valid" }, { status: 400 });
    }
    if (!METODE_VALID.includes(metodePembayaran)) {
      return NextResponse.json({ error: "Metode pembayaran tidak valid" }, { status: 400 });
    }
    if (!persetujuanDonatur) {
      return NextResponse.json({ error: "Pernyataan donatur wajib disetujui" }, { status: 400 });
    }

    const [created] = await db
      .insert(donaturTetap)
      .values({
        nama,
        jenisKelamin: jenisKelamin as "laki-laki" | "perempuan",
        whatsapp,
        alamat: alamat || null,
        email: email || null,
        nominalBulanan,
        nominalLainnya,
        tanggalPembayaran,
        metodePembayaran: metodePembayaran as "transfer_bank" | "qris" | "tunai_sekretariat",
        persetujuanDonatur,
        persetujuanPengingatWa,
        persetujuanLaporan,
        status: "baru",
        createdById: null,
        updatedById: null,
      })
      .returning({ id: donaturTetap.id });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (error: any) {
    console.error("Error creating donatur tetap:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
