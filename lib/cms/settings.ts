export type ContactSettings = {
  alamat: string;
  hotline: string;
  email: string;
  jamOperasional: string;
  googleMapsUrl: string;
};

export type DonationSettings = {
  namaRekening: string;
  nomorRekening: string;
  atasNamaRekening: string;
  qrisImage: string;
};

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  alamat: '',
  hotline: '',
  email: '',
  jamOperasional: '',
  googleMapsUrl: '',
};

export const DEFAULT_DONATION_SETTINGS: DonationSettings = {
  namaRekening: '',
  nomorRekening: '',
  atasNamaRekening: '',
  qrisImage: '',
};

/** Mengembalikan salinan default pengaturan kontak masjid. */
export function getDefaultContactSettings(): ContactSettings {
  return { ...DEFAULT_CONTACT_SETTINGS };
}

/** Mengembalikan salinan default pengaturan donasi masjid. */
export function getDefaultDonationSettings(): DonationSettings {
  return { ...DEFAULT_DONATION_SETTINGS };
}

export const DEFAULT_RUNNING_TEXT =
  '"Siapa yang membangun masjid karena Allah, maka Allah akan membangunkan baginya rumah di surga." (HR. Bukhari dan Muslim) — Selamat datang di Layanan Digital Masjid Al-Kahfi Cikoneng, Kabupaten Bandung.';

export const DEFAULT_TARGET_OPERASIONAL_BULANAN = 15000000;

/** Hitung progres campaign: terkumpul dari donasi terverifikasi. */
export async function getCampaignProgress(campaignId: number) {
  const { db } = await import("@/lib/db");
  const { campaignDonasi } = await import("@/lib/db/schema");
  const { eq, and, sql } = await import("drizzle-orm");

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

/**
 * Persentase progress untuk TAMPILAN bar. Di-clamp maks 100% walau
 * terkumpul melebihi target (overfunding / infaq tambahan diperbolehkan).
 * Nominal `terkumpul` tetap menampilkan angka RIIL (bukan di-clamp).
 */
export function withPersentase(target: number, terkumpul: number) {
  return target > 0 ? Math.min(100, Math.round((terkumpul / target) * 100)) : 0;
}
