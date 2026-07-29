import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaignUpdate } from "@/lib/db/schema";
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
    const judul = body?.judul ? String(body.judul).trim() : undefined;
    const isi = body?.isi ? String(body.isi).trim() : undefined;
    const img = body?.img != null ? (String(body.img).trim() || null) : undefined;

    // Validasi field yang diubah
    if (judul !== undefined && (judul.length < 5 || judul.length > 120)) {
      return NextResponse.json({ error: "Judul wajib 5–120 karakter" }, { status: 400 });
    }
    if (isi !== undefined && (isi.length < 10 || isi.length > 5000)) {
      return NextResponse.json({ error: "Isi update wajib 10–5000 karakter" }, { status: 400 });
    }

    const updated = await db
      .update(campaignUpdate)
      .set({
        ...(judul !== undefined && { judul }),
        ...(isi !== undefined && { isi }),
        ...(img !== undefined && { img }),
        updatedById: actor.id,
        updatedAt: new Date(),
      })
      .where(eq(campaignUpdate.id, numId))
      .returning();

    if (!updated.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error("Error patch update:", error);
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

    const deleted = await db.delete(campaignUpdate).where(eq(campaignUpdate.id, numId)).returning({ id: campaignUpdate.id });
    if (!deleted.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error delete update:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
