import { NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { akunKas, akuntansiTransaksi } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body?.nama !== undefined) {
      const nama = String(body.nama).trim();
      if (nama.length < 2 || nama.length > 100) {
        return NextResponse.json({ error: "Nama akun kas wajib diisi (2–100 karakter)" }, { status: 400 });
      }
      updates.nama = nama;
    }
    if (body?.keterangan !== undefined) {
      updates.keterangan = body.keterangan ? String(body.keterangan).trim() : null;
    }
    if (body?.aktif !== undefined) {
      updates.aktif = !!body.aktif;
    }
    if (body?.urutan !== undefined && Number.isInteger(body.urutan)) {
      updates.urutan = Number(body.urutan);
    }

    const updated = await db
      .update(akunKas)
      .set({ ...updates, updatedById: actor.id, updatedAt: new Date() })
      .where(eq(akunKas.id, numId))
      .returning();

    if (!updated.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error("Error patch akun kas:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const [{ value }] = await db
      .select({ value: count() })
      .from(akuntansiTransaksi)
      .where(eq(akuntansiTransaksi.akunKasId, numId));

    if (value > 0) {
      return NextResponse.json(
        { error: "Akun kas memiliki transaksi terkait dan tidak bisa dihapus. Nonaktifkan saja akun ini." },
        { status: 409 }
      );
    }

    const deleted = await db.delete(akunKas).where(eq(akunKas.id, numId)).returning({ id: akunKas.id });
    if (!deleted.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error delete akun kas:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
