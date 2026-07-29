import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaignDonasi, campaign } from "@/lib/db/schema";
import { desc, eq, and, inArray } from "drizzle-orm";
import { getActor, withActorNames } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const PRESET = [10000, 25000, 50000, 100000, 200000, 500000, 1000000];

/** Normalisasi nomor WhatsApp ke format 62xxx. */
function normalizeWa(input: string): string {
  let d = input.replace(/[^\d]/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  if (!d.startsWith("62")) d = "62" + d;
  return d;
}

/** GET admin: list semua donasi, filter campaignId & status. */
export async function GET(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const status = searchParams.get("status");

    let query = db.select().from(campaignDonasi);

    if (campaignId) {
      query = query.where(eq(campaignDonasi.campaignId, Number(campaignId))) as typeof query;
    }

    if (status) {
      const condition = campaignId
        ? and(eq(campaignDonasi.campaignId, Number(campaignId)), eq(campaignDonasi.status, status as any))
        : eq(campaignDonasi.status, status as any);
      query = query.where(condition) as typeof query;
    }

    const rows = await query.orderBy(desc(campaignDonasi.createdAt));
    const enriched = await withActorNames(rows);

    // Sertakan judul campaign untuk tampilan list verifikasi
    const campIds = [...new Set(rows.map((r) => r.campaignId))];
    const camps = campIds.length
      ? await db
          .select({ id: campaign.id, judul: campaign.judul })
          .from(campaign)
          .where(inArray(campaign.id, campIds))
      : [];
    const judulMap = new Map(camps.map((c) => [c.id, c.judul]));
    const withJudul = enriched.map((r) => ({
      ...r,
      campaignJudul: judulMap.get(r.campaignId) || null,
    }));

    return NextResponse.json(withJudul);
  } catch (error: any) {
    console.error("Error fetching donasi:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** POST ganda: publik submit donasi; admin input manual. */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const isAdmin = !!session;
    const actor = isAdmin ? await getActor() : null;

    const body = await request.json();
    const campaignId = Number(body?.campaignId);
    const namaDonatur = String(body?.namaDonatur ?? "").trim();
    const anonim = !!body?.anonim;
    const whatsappRaw = String(body?.whatsapp ?? "").trim();
    const nominal = Number(body?.nominal);
    const pesan = body?.pesan ? String(body.pesan).trim() : null;
    const metodePembayaran = String(body?.metodePembayaran ?? "");
    const buktiPembayaranRaw = body?.buktiPembayaran ? String(body.buktiPembayaran).trim() : null;
    // Status: publik default "menunggu"; admin bisa set langsung (default "terverifikasi")
    const status = isAdmin && body?.status ? String(body.status) : "menunggu";

    // Cek campaign exists & aktif
    const campaignRows = await db.select().from(campaign).where(eq(campaign.id, campaignId)).limit(1);
    if (!campaignRows.length) {
      return NextResponse.json({ error: "Campaign tidak ditemukan" }, { status: 400 });
    }

    const c = campaignRows[0];

    // Validasi status campaign (publik tidak bisa donasi ke draft/berakhir)
    if (!isAdmin) {
      if (c.status !== "aktif") {
        return NextResponse.json({ error: "Campaign tidak menerima donasi saat ini" }, { status: 400 });
      }

      // Cek deadline
      if (c.tanggalBerakhir && new Date(c.tanggalBerakhir) < new Date()) {
        return NextResponse.json({ error: "Campaign telah berakhir" }, { status: 400 });
      }
    }

    // Validasi server
    if (namaDonatur.length < 3 || namaDonatur.length > 100) {
      return NextResponse.json({ error: "Nama donatur wajib 3–100 karakter" }, { status: 400 });
    }

    let whatsapp: string | null = null;
    if (isAdmin) {
      // Admin manual: whatsapp opsional
      if (whatsappRaw) {
        whatsapp = normalizeWa(whatsappRaw);
        if (!/^62\d{8,13}$/.test(whatsapp)) {
          return NextResponse.json({ error: "Nomor WhatsApp tidak valid" }, { status: 400 });
        }
      }
    } else {
      // Publik: whatsapp wajib
      if (!whatsappRaw) {
        return NextResponse.json({ error: "Nomor WhatsApp wajib diisi" }, { status: 400 });
      }
      whatsapp = normalizeWa(whatsappRaw);
      if (!/^62\d{8,13}$/.test(whatsapp)) {
        return NextResponse.json({ error: "Nomor WhatsApp tidak valid" }, { status: 400 });
      }
    }

    if (!Number.isInteger(nominal) || nominal <= 0) {
      return NextResponse.json({ error: "Nominal donasi tidak valid" }, { status: 400 });
    }

    // Cek preset atau custom min 10rb
    const isPreset = PRESET.includes(nominal);
    if (!isPreset && nominal < 10000) {
      return NextResponse.json({ error: "Nominal donasi minimal Rp 10.000" }, { status: 400 });
    }

    if (pesan && pesan.length > 300) {
      return NextResponse.json({ error: "Pesan maksimal 300 karakter" }, { status: 400 });
    }

    // Publik hanya boleh transfer_bank/qris; admin boleh 3 (termasuk tunai_sekretariat)
    const METODE_PUBLIK = ["transfer_bank", "qris"];
    const METODE_ADMIN = ["transfer_bank", "qris", "tunai_sekretariat"];
    const metodeValid = isAdmin ? METODE_ADMIN : METODE_PUBLIK;
    if (!metodePembayaran || !metodeValid.includes(metodePembayaran)) {
      return NextResponse.json({ error: "Metode pembayaran tidak valid" }, { status: 400 });
    }

    // Bukti pembayaran: wajib untuk publik, opsional untuk admin input manual
    let buktiPembayaran: string | null = null;
    if (buktiPembayaranRaw) {
      if (!/^(\/uploads\/.+|https?:\/\/.+)/.test(buktiPembayaranRaw)) {
        return NextResponse.json({ error: "URL bukti pembayaran tidak valid" }, { status: 400 });
      }
      buktiPembayaran = buktiPembayaranRaw;
    }
    if (!isAdmin && !buktiPembayaran) {
      return NextResponse.json({ error: "Bukti pembayaran wajib diunggah" }, { status: 400 });
    }

    if (!["menunggu", "terverifikasi", "ditolak"].includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const [created] = await db
      .insert(campaignDonasi)
      .values({
        campaignId,
        namaDonatur,
        anonim,
        whatsapp,
        nominal,
        pesan,
        buktiPembayaran,
        metodePembayaran: metodePembayaran as "transfer_bank" | "qris" | "tunai_sekretariat",
        status: status as "menunggu" | "terverifikasi" | "ditolak",
        createdById: actor?.id ?? null,
        updatedById: actor?.id ?? null,
      })
      .returning({ id: campaignDonasi.id });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (error: any) {
    console.error("Error creating donasi:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
