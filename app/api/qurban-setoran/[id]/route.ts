import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { qurbanSetoran } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

const METODE_VALID = ["transfer_bank", "qris", "tunai_sekretariat"];

/** PATCH admin: koreksi setoran (subset field). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const body = await req.json();
    const patch: Record<string, unknown> = {};

    if (body?.tanggal !== undefined) {
      const tanggal = new Date(String(body.tanggal));
      if (Number.isNaN(tanggal.getTime())) return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });
      patch.tanggal = tanggal;
    }
    if (body?.jumlah !== undefined) {
      const jumlah = Number(body.jumlah);
      if (!Number.isInteger(jumlah) || jumlah <= 0) return NextResponse.json({ error: "Jumlah setoran tidak valid (> 0)" }, { status: 400 });
      patch.jumlah = jumlah;
    }
    if (body?.metodePembayaran !== undefined) {
      const metode = String(body.metodePembayaran);
      if (!METODE_VALID.includes(metode)) return NextResponse.json({ error: "Metode pembayaran tidak valid" }, { status: 400 });
      patch.metodePembayaran = metode;
    }
    if (body?.keterangan !== undefined) patch.keterangan = String(body.keterangan).trim() || null;

    if (!Object.keys(patch).length)
      return NextResponse.json({ error: "Tidak ada perubahan yang dikirim" }, { status: 400 });

    const updated = await db
      .update(qurbanSetoran)
      .set({ ...patch, updatedById: actor.id, updatedAt: new Date() })
      .where(eq(qurbanSetoran.id, numId))
      .returning();

    if (!updated.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error("Error patch setoran qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** DELETE admin: hapus setoran. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const deleted = await db.delete(qurbanSetoran).where(eq(qurbanSetoran.id, numId)).returning({ id: qurbanSetoran.id });
    if (!deleted.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error delete setoran qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
