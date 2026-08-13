import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { akunKas } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await db.select().from(akunKas).orderBy(asc(akunKas.urutan), asc(akunKas.id));
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Error fetching akun kas:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const nama = String(body?.nama ?? "").trim();
    const keterangan = body?.keterangan ? String(body.keterangan).trim() : null;
    const urutan = Number.isInteger(body?.urutan) ? Number(body.urutan) : 0;

    if (nama.length < 2 || nama.length > 100) {
      return NextResponse.json({ error: "Nama akun kas wajib diisi (2–100 karakter)" }, { status: 400 });
    }

    const [created] = await db
      .insert(akunKas)
      .values({
        nama,
        keterangan,
        urutan,
        createdById: actor.id,
        updatedById: actor.id,
      })
      .returning();

    return NextResponse.json(created);
  } catch (error: any) {
    console.error("Error creating akun kas:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
