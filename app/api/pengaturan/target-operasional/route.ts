import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pengaturan } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** GET admin: ambil target operasional bulanan. */
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(pengaturan)
      .where(eq(pengaturan.key, "target_operasional_bulanan"))
      .limit(1);
    const value = rows[0]?.value ?? "";
    return NextResponse.json({ value });
  } catch (error: any) {
    console.error("Error fetch target operasional:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** PUT admin: simpan target operasional bulanan. */
export async function PUT(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const n = parseInt(String(body?.value ?? ""), 10);
    if (!Number.isFinite(n) || n <= 0) {
      return NextResponse.json({ error: "Target tidak valid" }, { status: 400 });
    }

    const value = String(n);
    const existing = await db
      .select()
      .from(pengaturan)
      .where(eq(pengaturan.key, "target_operasional_bulanan"))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(pengaturan).values({
        key: "target_operasional_bulanan",
        value,
        createdById: actor.id,
        updatedById: actor.id,
        updatedAt: new Date(),
      });
    } else {
      await db
        .update(pengaturan)
        .set({ value, updatedById: actor.id, updatedAt: new Date() })
        .where(eq(pengaturan.key, "target_operasional_bulanan"));
    }

    return NextResponse.json({ ok: true, value });
  } catch (error: any) {
    console.error("Error update target operasional:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
