import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaign, campaignDonasi, campaignUpdate, campaignStatusEnum } from "@/lib/db/schema";
import { desc, eq, and, sql, inArray } from "drizzle-orm";
import { computeUniqueSlug } from "@/lib/slug";
import { withActorNames, getActor } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

// Status yang boleh tayang di publik (abaikan session admin di halaman publik).
// draft & dibatalkan disembunyikan total; tercapai/berakhir tetap tampil sebagai arsip.
const PUBLIK_STATUS = ["aktif", "tercapai", "berakhir"] as const;

/** GET dual-mode: publik → list aktif/tercapai + filter kategori; admin → semua. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const kategori = searchParams.get("kategori");
    const adminParam = searchParams.get("admin") === "1";

    const session = await auth.api.getSession({ headers: await headers() });
    const isAdmin = !!session;

    // Detail campaign by slug
    if (slug) {
      const rows = await db
        .select()
        .from(campaign)
        .where(eq(campaign.slug, slug))
        .limit(1);

      if (!rows[0]) {
        return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
      }

      const c = rows[0];

      // Publik hanya boleh akses status tayang; admin (login) tetap bisa preview
      if (!isAdmin && !PUBLIK_STATUS.includes(c.status as (typeof PUBLIK_STATUS)[number])) {
        return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 404 });
      }

      // Hitung progress
      const { terkumpul, jumlahDonatur } = await getCampaignProgress(c.id);
      const persentase = withPersentase(c.targetNominal, terkumpul);

      // Ambil updates (terbaru di atas)
      const updates = await db
        .select()
        .from(campaignUpdate)
        .where(eq(campaignUpdate.campaignId, c.id))
        .orderBy(desc(campaignUpdate.createdAt));

      // Ambil donatur terverifikasi untuk wall publik (masking anonim).
      // Wall selalu tampil terverifikasi tanpa peduli session; admin lihat donasi mentah via /api/campaign-donasi.
      const donatur = await db
            .select({
              id: campaignDonasi.id,
              namaDonatur: campaignDonasi.namaDonatur,
              anonim: campaignDonasi.anonim,
              pesan: campaignDonasi.pesan,
              nominal: campaignDonasi.nominal,
              createdAt: campaignDonasi.createdAt,
            })
            .from(campaignDonasi)
            .where(
              and(
                eq(campaignDonasi.campaignId, c.id),
                eq(campaignDonasi.status, "terverifikasi")
              )
            )
            .orderBy(desc(campaignDonasi.createdAt))
            .limit(50);

      // Masking untuk publik
      const donaturMasked = donatur.map((d) => ({
        namaTampilan: d.anonim ? "Hamba Allah" : d.namaDonatur,
        pesan: d.pesan,
        nominal: d.nominal,
        createdAt: d.createdAt,
      }));

      return NextResponse.json({
        campaign: c,
        progres: { terkumpul, jumlahDonatur, persentase },
        updates: await withActorNames(updates),
        donatur: donaturMasked,
      });
    }

    // List campaign
    const lihatSemua = adminParam && isAdmin;
    if (lihatSemua) {
      // Admin (via ?admin=1 + session): semua campaign
      const rows = await db.select().from(campaign).orderBy(desc(campaign.createdAt));
      const enriched = await withActorNames(rows);

      // Hitung progress untuk setiap campaign
      const withProgress = await Promise.all(
        enriched.map(async (c) => {
          const { terkumpul, jumlahDonatur } = await getCampaignProgress(c.id);
          const persentase = withPersentase(c.targetNominal, terkumpul);
          return { ...c, progres: { terkumpul, jumlahDonatur, persentase } };
        })
      );

      return NextResponse.json(withProgress);
    }

    // Publik: hanya status tayang (aktif/tercapai/berakhir), abaikan session.
    // draft & dibatalkan disembunyikan; tercapai/berakhir tampil sebagai arsip.
    const conditions = [inArray(campaign.status, [...PUBLIK_STATUS])];
    if (kategori) {
      conditions.push(eq(campaign.kategori, kategori as any));
    }

    const rows = await db
      .select()
      .from(campaign)
      .where(and(...conditions))
      .orderBy(
        desc(campaign.featured),
        // aktif di atas, lalu tercapai, lalu berakhir
        sql`case ${campaign.status} when 'aktif' then 0 when 'tercapai' then 1 when 'berakhir' then 2 else 3 end`,
        desc(campaign.createdAt)
      );

    // Hitung progress untuk setiap campaign
    const withProgress = await Promise.all(
      rows.map(async (c) => {
        const { terkumpul, jumlahDonatur } = await getCampaignProgress(c.id);
        const persentase = withPersentase(c.targetNominal, terkumpul);
        return { ...c, progres: { terkumpul, jumlahDonatur, persentase } };
      })
    );

    return NextResponse.json(withProgress);
  } catch (error: any) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** POST admin: buat campaign baru. */
export async function POST(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const judul = String(body?.judul ?? "").trim();
    const kategori = String(body?.kategori ?? "");
    const deskripsiSingkat = String(body?.deskripsiSingkat ?? "").trim();
    const cerita = body?.cerita ? String(body.cerita).trim() : null;
    const img = String(body?.img ?? "").trim();
    const targetNominal = Number(body?.targetNominal);
    const tanggalBerakhirRaw = body?.tanggalBerakhir;
    const status = String(body?.status ?? "draft");
    const featured = !!body?.featured;

    // Validasi
    if (judul.length < 5 || judul.length > 120) {
      return NextResponse.json({ error: "Judul wajib 5–120 karakter" }, { status: 400 });
    }
    if (!kategori) {
      return NextResponse.json({ error: "Kategori wajib diisi" }, { status: 400 });
    }
    if (deskripsiSingkat.length < 10 || deskripsiSingkat.length > 160) {
      return NextResponse.json({ error: "Deskripsi singkat wajib 10–160 karakter" }, { status: 400 });
    }
    if (cerita && cerita.length > 5000) {
      return NextResponse.json({ error: "Cerita maksimal 5000 karakter" }, { status: 400 });
    }
    if (!img) {
      return NextResponse.json({ error: "Foto sampul wajib diisi" }, { status: 400 });
    }
    if (!Number.isInteger(targetNominal) || targetNominal <= 0) {
      return NextResponse.json({ error: "Target nominal tidak valid" }, { status: 400 });
    }

    let tanggalBerakhir: Date | null = null;
    if (tanggalBerakhirRaw && typeof tanggalBerakhirRaw === "string" && tanggalBerakhirRaw.trim()) {
      const parsed = new Date(tanggalBerakhirRaw);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Format tanggal berakhir tidak valid (YYYY-MM-DD)" }, { status: 400 });
      }
      tanggalBerakhir = parsed;
    }

    // Generate slug unik
    const slug = await computeUniqueSlug(judul, "campaign");

    const [created] = await db
      .insert(campaign)
      .values({
        judul,
        slug,
        kategori: kategori as any,
        deskripsiSingkat,
        cerita,
        img,
        targetNominal,
        tanggalBerakhir,
        status: status as any,
        featured,
        createdById: actor.id,
        updatedById: actor.id,
      })
      .returning();

    return NextResponse.json({ ok: true, id: created.id, slug: created.slug });
  } catch (error: any) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
