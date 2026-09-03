import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { qurbanShohibul } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** PATCH admin: ubah nama shohibul. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const body = await req.json();
    const nama = String(body?.nama ?? "").trim();
    if (nama.length < 3 || nama.length > 100)
      return NextResponse.json({ error: "Nama shohibul wajib diisi (3–100 karakter)" }, { status: 400 });

    const updated = await db
      .update(qurbanShohibul)
      .set({ nama, updatedById: actor.id, updatedAt: new Date() })
      .where(eq(qurbanShohibul.id, numId))
      .returning();

    if (!updated.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error("Error patch shohibul qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** DELETE admin: hapus shohibul — ditolak bila merupakan shohibul terakhir pesertanya. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const rows = await db.select().from(qurbanShohibul).where(eq(qurbanShohibul.id, numId)).limit(1);
    if (!rows.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const semua = await db.select({ id: qurbanShohibul.id }).from(qurbanShohibul).where(eq(qurbanShohibul.pesertaId, rows[0].pesertaId));
    if (semua.length <= 1)
      return NextResponse.json({ error: "Peserta minimal harus memiliki 1 shohibul" }, { status: 400 });

    await db.delete(qurbanShohibul).where(eq(qurbanShohibul.id, numId));
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error delete shohibul qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
