export const DEFAULT_RUNNING_TEXT =
  '"Siapa yang membangun masjid karena Allah, maka Allah akan membangunkan baginya rumah di surga." (HR. Bukhari dan Muslim) — Selamat datang di Layanan Digital Masjid Al-Kahfi Cikoneng, Kabupaten Bandung.';

export const DEFAULT_TARGET_OPERASIONAL_BULANAN = 15000000;

/** Persentase progress untuk TAMPILAN bar (client-side utility). */
export function withPersentase(target: number, terkumpul: number) {
  return target > 0 ? Math.min(100, Math.round((terkumpul / target) * 100)) : 0;
}
