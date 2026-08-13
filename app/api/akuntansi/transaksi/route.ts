import { NextResponse } from "next/server";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { akunKas, akuntansiKategori, akuntansiTransaksi } from "@/lib/db/schema";
import { withActorNames, getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

const JENIS_VALID = ["pemasukan", "pengeluaran"];
const BULAN_REGEX = /^\d{4}-\d{2}$/;

/** Parse "YYYY-MM" menjadi rentang [awal bulan, awal bulan berikutnya). */
function parseBulanRange(bulan: string): { start: Date; end: Date } | null {
  if (!BULAN_REGEX.test(bulan)) return null;
  const [y, m] = bulan.split("-").map(Number);
  if (m < 1 || m > 12) return null;
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { start, end };
}

export async function GET(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get("bulan");
    const akunKasId = searchParams.get("akunKasId");
    const jenis = searchParams.get("jenis");

    const conditions = [];
    if (bulan) {
      const range = parseBulanRange(bulan);
      if (!range) return NextResponse.json({ error: "Format bulan tidak valid (YYYY-MM)" }, { status: 400 });
      conditions.push(gte(akuntansiTransaksi.tanggal, range.start));
      conditions.push(lt(akuntansiTransaksi.tanggal, range.end));
    }
    if (akunKasId) {
      const numId = Number(akunKasId);
      if (!Number.isInteger(numId)) return NextResponse.json({ error: "akunKasId tidak valid" }, { status: 400 });
      conditions.push(eq(akuntansiTransaksi.akunKasId, numId));
    }
    if (jenis) {
      if (!JENIS_VALID.includes(jenis)) return NextResponse.json({ error: "Jenis tidak valid" }, { status: 400 });
      conditions.push(eq(akuntansiTransaksi.jenis, jenis as "pemasukan" | "pengeluaran"));
    }

    const rows = await db
      .select({
        id: akuntansiTransaksi.id,
        tanggal: akuntansiTransaksi.tanggal,
        akunKasId: akuntansiTransaksi.akunKasId,
        akunKasNama: akunKas.nama,
        kategoriId: akuntansiTransaksi.kategoriId,
        kategoriNama: akuntansiKategori.nama,
        keterangan: akuntansiTransaksi.keterangan,
        jenis: akuntansiTransaksi.jenis,
        jumlah: akuntansiTransaksi.jumlah,
        buktiUrl: akuntansiTransaksi.buktiUrl,
        createdById: akuntansiTransaksi.createdById,
        updatedById: akuntansiTransaksi.updatedById,
        createdAt: akuntansiTransaksi.createdAt,
        updatedAt: akuntansiTransaksi.updatedAt,
      })
      .from(akuntansiTransaksi)
      .leftJoin(akunKas, eq(akuntansiTransaksi.akunKasId, akunKas.id))
      .leftJoin(akuntansiKategori, eq(akuntansiTransaksi.kategoriId, akuntansiKategori.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(akuntansiTransaksi.tanggal), desc(akuntansiTransaksi.id));

    const enriched = await withActorNames(rows);
    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("Error fetching transaksi:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    const tanggalRaw = String(body?.tanggal ?? "");
    const tanggal = new Date(tanggalRaw);
    const akunKasId = Number(body?.akunKasId);
    const kategoriId = body?.kategoriId != null ? Number(body.kategoriId) : null;
    const keterangan = String(body?.keterangan ?? "").trim();
    const jenis = String(body?.jenis ?? "");
    const jumlah = Number(body?.jumlah);
    const buktiUrl = body?.buktiUrl ? String(body.buktiUrl).trim() : null;

    if (Number.isNaN(tanggal.getTime())) {
      return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });
    }
    if (!Number.isInteger(akunKasId)) {
      return NextResponse.json({ error: "Akun kas wajib dipilih" }, { status: 400 });
    }
    const akunRows = await db.select().from(akunKas).where(eq(akunKas.id, akunKasId)).limit(1);
    if (!akunRows.length) {
      return NextResponse.json({ error: "Akun kas tidak ditemukan" }, { status: 400 });
    }
    if (!akunRows[0].aktif) {
      return NextResponse.json({ error: "Akun kas sudah tidak aktif" }, { status: 400 });
    }
    if (kategoriId !== null) {
      if (!Number.isInteger(kategoriId)) {
        return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
      }
      const katRows = await db.select().from(akuntansiKategori).where(eq(akuntansiKategori.id, kategoriId)).limit(1);
      if (!katRows.length) {
        return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 400 });
      }
    }
    if (keterangan.length < 3 || keterangan.length > 500) {
      return NextResponse.json({ error: "Keterangan wajib diisi (3–500 karakter)" }, { status: 400 });
    }
    if (!JENIS_VALID.includes(jenis)) {
      return NextResponse.json({ error: "Jenis transaksi tidak valid" }, { status: 400 });
    }
    if (!Number.isInteger(jumlah) || jumlah <= 0) {
      return NextResponse.json({ error: "Jumlah tidak valid" }, { status: 400 });
    }

    const [created] = await db
      .insert(akuntansiTransaksi)
      .values({
        tanggal,
        akunKasId,
        kategoriId,
        keterangan,
        jenis: jenis as "pemasukan" | "pengeluaran",
        jumlah,
        buktiUrl,
        createdById: actor.id,
        updatedById: actor.id,
      })
      .returning();

    return NextResponse.json(created);
  } catch (error: any) {
    console.error("Error creating transaksi:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
