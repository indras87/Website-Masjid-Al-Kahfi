import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { donaturTetap } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

const STATUS_VALID = ["baru", "terkonfirmasi", "aktif", "berhenti"];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const rows = await db.select().from(donaturTetap).where(eq(donaturTetap.id, numId)).limit(1);
    if (!rows.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error("Error get donatur:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const body = await req.json();
    const status = String(body?.status ?? "");
    const catatanAdmin = body?.catatanAdmin != null ? String(body.catatanAdmin) : undefined;

    if (!STATUS_VALID.includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const updated = await db
      .update(donaturTetap)
      .set({
        status: status as "baru" | "terkonfirmasi" | "aktif" | "berhenti",
        ...(catatanAdmin !== undefined ? { catatanAdmin } : {}),
        updatedById: actor.id,
        updatedAt: new Date(),
      })
      .where(eq(donaturTetap.id, numId))
      .returning();

    if (!updated.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error("Error patch donatur:", error);
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

    const deleted = await db.delete(donaturTetap).where(eq(donaturTetap.id, numId)).returning({ id: donaturTetap.id });
    if (!deleted.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error delete donatur:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
