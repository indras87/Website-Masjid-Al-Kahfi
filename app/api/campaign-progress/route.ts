import { db } from "@/lib/db";
import { campaignDonasi } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** API endpoint untuk progress campaign (server-only). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("id");

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID wajib diisi" }, { status: 400 });
    }

    const rows = await db
      .select({
        total: sql<string | null>`coalesce(sum(${campaignDonasi.nominal}), 0)`,
        jumlah: sql<number>`count(*)`,
      })
      .from(campaignDonasi)
      .where(
        and(
          eq(campaignDonasi.campaignId, Number(campaignId)),
          eq(campaignDonasi.status, "terverifikasi")
        )
      );

    const terkumpul = parseInt(rows[0]?.total ?? "0", 10) || 0;
    const jumlahDonatur = Number(rows[0]?.jumlah ?? 0);

    // Hitung persentase (perlu target dari campaign)
    const { campaign } = await import("@/lib/db/schema");
    const campaignRows = await db
      .select({ targetNominal: campaign.targetNominal })
      .from(campaign)
      .where(eq(campaign.id, Number(campaignId)))
      .limit(1);

    const target = campaignRows[0]?.targetNominal || 0;
    const persentase = target > 0 ? Math.min(100, Math.round((terkumpul / target) * 100)) : 0;

    return NextResponse.json({
      terkumpul,
      jumlahDonatur,
      persentase,
    });
  } catch (error: any) {
    console.error("Error fetching campaign progress:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
