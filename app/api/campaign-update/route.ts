import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaignUpdate, campaign } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getActor, withActorNames } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

/** GET publik: list update by campaignId (terbaru di atas). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId wajib diisi" }, { status: 400 });
    }

    const rows = await db
      .select()
      .from(campaignUpdate)
      .where(eq(campaignUpdate.campaignId, Number(campaignId)))
      .orderBy(desc(campaignUpdate.createdAt));

    const enriched = await withActorNames(rows);
    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("Error fetching updates:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** POST admin: buat update campaign baru. */
export async function POST(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const campaignId = Number(body?.campaignId);
    const judul = String(body?.judul ?? "").trim();
    const isi = String(body?.isi ?? "").trim();
    const img = body?.img ? String(body.img).trim() : null;

    // Cek campaign exists
    const campaignRows = await db.select().from(campaign).where(eq(campaign.id, campaignId)).limit(1);
    if (!campaignRows.length) {
      return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 400 });
    }

    // Validasi
    if (judul.length < 5 || judul.length > 120) {
      return NextResponse.json({ error: "Judul wajib 5–120 karakter" }, { status: 400 });
    }
    if (isi.length < 10 || isi.length > 5000) {
      return NextResponse.json({ error: "Isi update wajib 10–5000 karakter" }, { status: 400 });
    }

    const [created] = await db
      .insert(campaignUpdate)
      .values({
        campaignId,
        judul,
        isi,
        img,
        createdById: actor.id,
        updatedById: actor.id,
      })
      .returning();

    return NextResponse.json({ ok: true, id: created.id });
  } catch (error: any) {
    console.error("Error creating update:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
