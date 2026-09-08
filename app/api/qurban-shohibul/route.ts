import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { qurbanPeserta, qurbanShohibul } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** POST admin: tambah shohibul ke peserta. */
export async function POST(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const pesertaId = Number(body?.pesertaId);
    const nama = String(body?.nama ?? "").trim();

    if (!Number.isInteger(pesertaId)) return NextResponse.json({ error: "Peserta wajib dipilih" }, { status: 400 });
    if (nama.length < 3 || nama.length > 100)
      return NextResponse.json({ error: "Nama shohibul wajib diisi (3–100 karakter)" }, { status: 400 });

    const exists = await db.select({ id: qurbanPeserta.id }).from(qurbanPeserta).where(eq(qurbanPeserta.id, pesertaId)).limit(1);
    if (!exists.length) return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 400 });

    const [{ maxUrutan }] = await db
      .select({ maxUrutan: sql<number>`coalesce(max(${qurbanShohibul.urutan}), -1)` })
      .from(qurbanShohibul)
      .where(eq(qurbanShohibul.pesertaId, pesertaId));

    const [created] = await db
      .insert(qurbanShohibul)
      .values({ pesertaId, nama, urutan: Number(maxUrutan) + 1, createdById: actor.id, updatedById: actor.id })
      .returning({ id: qurbanShohibul.id });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (error: any) {
    console.error("Error creating shohibul qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
