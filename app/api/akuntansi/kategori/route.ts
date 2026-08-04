import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { akuntansiKategori } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

const JENIS_VALID = ["pemasukan", "pengeluaran"];

export async function GET() {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await db
      .select()
      .from(akuntansiKategori)
      .orderBy(asc(akuntansiKategori.urutan), asc(akuntansiKategori.id));
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Error fetching kategori:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const nama = String(body?.nama ?? "").trim();
    const jenis = String(body?.jenis ?? "");
    const urutan = Number.isInteger(body?.urutan) ? Number(body.urutan) : 0;

    if (nama.length < 2 || nama.length > 100) {
      return NextResponse.json({ error: "Nama kategori wajib diisi (2–100 karakter)" }, { status: 400 });
    }
    if (!JENIS_VALID.includes(jenis)) {
      return NextResponse.json({ error: "Jenis kategori tidak valid" }, { status: 400 });
    }

    const [created] = await db
      .insert(akuntansiKategori)
      .values({
        nama,
        jenis: jenis as "pemasukan" | "pengeluaran",
        urutan,
        createdById: actor.id,
        updatedById: actor.id,
      })
      .returning();

    return NextResponse.json(created);
  } catch (error: any) {
    console.error("Error creating kategori:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
