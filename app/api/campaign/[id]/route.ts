import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaign, campaignDonasi, campaignStatusEnum } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";
import { computeUniqueSlug } from "@/lib/slug";

/** Hitung progres campaign: terkumpul dari donasi terverifikasi. */
async function getCampaignProgress(campaignId: number) {
  const rows = await db
    .select({
      total: sql<string | null>`coalesce(sum(${campaignDonasi.nominal}), 0)`,
      jumlah: sql<number>`count(*)`,
    })
    .from(campaignDonasi)
    .where(
      and(
        eq(campaignDonasi.campaignId, campaignId),
        eq(campaignDonasi.status, "terverifikasi")
      )
    );
  const terkumpul = parseInt(rows[0]?.total ?? "0", 10) || 0;
  const jumlahDonatur = Number(rows[0]?.jumlah ?? 0);
  return { terkumpul, jumlahDonatur };
}

/** Persentase progress untuk TAMPILAN bar. */
function withPersentase(target: number, terkumpul: number) {
  return target > 0 ? Math.min(100, Math.round((terkumpul / target) * 100)) : 0;
}

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const rows = await db.select().from(campaign).where(eq(campaign.id, numId)).limit(1);
    if (!rows.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const c = rows[0];

    // Hitung progress
    const { terkumpul, jumlahDonatur } = await getCampaignProgress(c.id);
    const persentase = withPersentase(c.targetNominal, terkumpul);

    return NextResponse.json({ ...c, progres: { terkumpul, jumlahDonatur, persentase } });
  } catch (error: any) {
    console.error("Error get campaign:", error);
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
    const judul = body?.judul ? String(body.judul).trim() : undefined;
    const kategori = body?.kategori;
    const deskripsiSingkat = body?.deskripsiSingkat ? String(body.deskripsiSingkat).trim() : undefined;
    const cerita = body?.cerita != null ? (String(body.cerita).trim() || null) : undefined;
    const img = body?.img ? String(body.img).trim() : undefined;
    const targetNominal = body?.targetNominal != null ? Number(body.targetNominal) : undefined;
    const tanggalBerakhirRaw = body?.tanggalBerakhir;
    const status = body?.status;
    const featured = body?.featured;

    // Validasi field yang diubah
    if (judul !== undefined && (judul.length < 5 || judul.length > 120)) {
      return NextResponse.json({ error: "Judul wajib 5–120 karakter" }, { status: 400 });
    }
    if (deskripsiSingkat !== undefined && (deskripsiSingkat.length < 10 || deskripsiSingkat.length > 160)) {
      return NextResponse.json({ error: "Deskripsi singkat wajib 10–160 karakter" }, { status: 400 });
    }
    if (cerita !== undefined && cerita !== null && cerita.length > 5000) {
      return NextResponse.json({ error: "Cerita maksimal 5000 karakter" }, { status: 400 });
    }
    if (targetNominal !== undefined && (!Number.isInteger(targetNominal) || targetNominal <= 0)) {
      return NextResponse.json({ error: "Target nominal tidak valid" }, { status: 400 });
    }

    let tanggalBerakhir: Date | null | undefined = undefined;
    if (tanggalBerakhirRaw !== undefined) {
      if (tanggalBerakhirRaw === null || tanggalBerakhirRaw === "") {
        tanggalBerakhir = null;
      } else {
        const parsed = new Date(tanggalBerakhirRaw);
        if (isNaN(parsed.getTime())) {
          return NextResponse.json({ error: "Format tanggal berakhir tidak valid" }, { status: 400 });
        }
        tanggalBerakhir = parsed;
      }
    }

    // Bila judul berubah, regenerate slug
    let slug: string | undefined = undefined;
    if (judul) {
      slug = await computeUniqueSlug(judul, "campaign");
    }

    const updated = await db
      .update(campaign)
      .set({
        ...(judul !== undefined && { judul, slug }),
        ...(kategori && { kategori }),
        ...(deskripsiSingkat !== undefined && { deskripsiSingkat }),
        ...(cerita !== undefined && { cerita }),
        ...(img !== undefined && { img }),
        ...(targetNominal !== undefined && { targetNominal }),
        ...(tanggalBerakhir !== undefined && { tanggalBerakhir }),
        ...(status && { status }),
        ...(featured !== undefined && { featured }),
        updatedById: actor.id,
        updatedAt: new Date(),
      })
      .where(eq(campaign.id, numId))
      .returning();

    if (!updated.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error("Error patch campaign:", error);
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

    const deleted = await db.delete(campaign).where(eq(campaign.id, numId)).returning({ id: campaign.id });
    if (!deleted.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error delete campaign:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
