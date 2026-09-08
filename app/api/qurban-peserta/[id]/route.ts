import { NextResponse } from "next/server";
import { asc, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { qurbanPeserta, qurbanShohibul, qurbanSetoran } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";
import { normalizeWa, validatePeserta } from "@/lib/qurban";

export const dynamic = "force-dynamic";

const STATUS_VALID = ["baru", "aktif", "selesai", "berhenti"];

/** GET admin: detail peserta + shohibul + saldo + riwayat setoran. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const rows = await db
      .select({
        ...getTableColumns(qurbanPeserta),
        saldo: sql<string>`coalesce(sum(${qurbanSetoran.jumlah}), 0)`,
      })
      .from(qurbanPeserta)
      .leftJoin(qurbanSetoran, eq(qurbanSetoran.pesertaId, qurbanPeserta.id))
      .where(eq(qurbanPeserta.id, numId))
      .groupBy(qurbanPeserta.id)
      .limit(1);

    if (!rows.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const shohibul = await db
      .select()
      .from(qurbanShohibul)
      .where(eq(qurbanShohibul.pesertaId, numId))
      .orderBy(asc(qurbanShohibul.urutan), asc(qurbanShohibul.id));

    const setoran = await db
      .select()
      .from(qurbanSetoran)
      .where(eq(qurbanSetoran.pesertaId, numId))
      .orderBy(desc(qurbanSetoran.tanggal));

    return NextResponse.json({ ...rows[0], saldo: Number(rows[0].saldo), shohibul, setoran });
  } catch (error: any) {
    console.error("Error get peserta qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** PATCH admin: ubah status/catatan/data peserta (subset field; shohibul via endpoint terpisah). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const body = await req.json();
    const patch: Record<string, unknown> = {};

    if (body?.status !== undefined) {
      const status = String(body.status);
      if (!STATUS_VALID.includes(status))
        return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
      patch.status = status;
    }
    if (body?.catatanAdmin !== undefined) patch.catatanAdmin = String(body.catatanAdmin).trim() || null;

    const partial: Record<string, string> = {};
    for (const f of ["namaPeserta", "alamat", "namaBank", "periode"] as const) {
      if (body?.[f] !== undefined) partial[f] = String(body[f]).trim();
    }
    if (body?.whatsapp !== undefined) partial.whatsapp = normalizeWa(String(body.whatsapp).trim());
    if (body?.nomorRekening !== undefined)
      partial.nomorRekening = String(body.nomorRekening).trim().replace(/\s+/g, "");
    if (body?.namaPemilikRekening !== undefined)
      partial.namaPemilikRekening = String(body.namaPemilikRekening).trim();

    // Reuse validasi lengkap pada subset yang dikirim (field kosong dianggap tidak dikirim
    // — kunci undefined dilewati oleh validatePeserta karena hanya field di partial yang diisi).
    const invalid = validatePeserta({
      namaPeserta: partial.namaPeserta ?? "Valid",
      alamat: partial.alamat ?? "Valid alamat",
      whatsapp: partial.whatsapp ?? "628123456789",
      namaBank: partial.namaBank ?? "BSI",
      nomorRekening: partial.nomorRekening ?? "1234567890",
      namaPemilikRekening: partial.namaPemilikRekening ?? "Valid Name",
      periode: partial.periode ?? "2027",
    });
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
    Object.assign(patch, partial);

    if (!Object.keys(patch).length)
      return NextResponse.json({ error: "Tidak ada perubahan yang dikirim" }, { status: 400 });

    const updated = await db
      .update(qurbanPeserta)
      .set({ ...patch, updatedById: actor.id, updatedAt: new Date() })
      .where(eq(qurbanPeserta.id, numId))
      .returning();

    if (!updated.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error("Error patch peserta qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** DELETE admin: hapus peserta (shohibul & setoran ikut, cascade). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const deleted = await db.delete(qurbanPeserta).where(eq(qurbanPeserta.id, numId)).returning({ id: qurbanPeserta.id });
    if (!deleted.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error delete peserta qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
