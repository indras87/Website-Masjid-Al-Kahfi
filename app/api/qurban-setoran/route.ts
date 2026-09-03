import { NextResponse } from "next/server";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { db } from "@/lib/db";
import { qurbanPeserta, qurbanSetoran } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

const METODE_VALID = ["transfer_bank", "qris", "tunai_sekretariat"];

/** GET admin: riwayat setoran, opsional filter ?pesertaId=. */
export async function GET(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const pesertaParam = searchParams.get("pesertaId");

    const rows = await db
      .select({
        ...getTableColumns(qurbanSetoran),
        namaPeserta: qurbanPeserta.namaPeserta,
      })
      .from(qurbanSetoran)
      .innerJoin(qurbanPeserta, eq(qurbanPeserta.id, qurbanSetoran.pesertaId))
      .where(
        pesertaParam && Number.isInteger(Number(pesertaParam))
          ? eq(qurbanSetoran.pesertaId, Number(pesertaParam))
          : undefined
      )
      .orderBy(desc(qurbanSetoran.tanggal), desc(qurbanSetoran.id));

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Error fetching setoran qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** POST admin: catat setoran baru. */
export async function POST(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const pesertaId = Number(body?.pesertaId);
    const tanggal = new Date(String(body?.tanggal ?? ""));
    const jumlah = Number(body?.jumlah);
    const metodePembayaran = String(body?.metodePembayaran ?? "");
    const keterangan = body?.keterangan ? String(body.keterangan).trim() : null;

    if (!Number.isInteger(pesertaId)) {
      return NextResponse.json({ error: "Peserta wajib dipilih" }, { status: 400 });
    }
    const exists = await db.select({ id: qurbanPeserta.id }).from(qurbanPeserta).where(eq(qurbanPeserta.id, pesertaId)).limit(1);
    if (!exists.length) return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 400 });
    if (Number.isNaN(tanggal.getTime())) return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });
    if (!Number.isInteger(jumlah) || jumlah <= 0) return NextResponse.json({ error: "Jumlah setoran tidak valid (> 0)" }, { status: 400 });
    if (!METODE_VALID.includes(metodePembayaran)) return NextResponse.json({ error: "Metode pembayaran tidak valid" }, { status: 400 });
    if (keterangan && keterangan.length > 500) return NextResponse.json({ error: "Keterangan maksimal 500 karakter" }, { status: 400 });

    const [created] = await db
      .insert(qurbanSetoran)
      .values({
        pesertaId,
        tanggal,
        jumlah,
        metodePembayaran: metodePembayaran as "transfer_bank" | "qris" | "tunai_sekretariat",
        keterangan,
        createdById: actor.id,
        updatedById: actor.id,
      })
      .returning({ id: qurbanSetoran.id });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (error: any) {
    console.error("Error creating setoran qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
