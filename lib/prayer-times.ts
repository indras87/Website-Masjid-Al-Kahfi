// Pure helpers for GPS-based prayer schedule (Aladhan API, Kemenag RI).
// No React / browser / DB here — keep it unit-testable.

export const MASJID_COORDS = { lat: -6.9856, lng: 107.6589 };

export const ALADHAN_METHOD = 20; // 20 = Kementerian Agama Republik Indonesia (Fajr 20°, Isya 18°)
export const ALADHAN_SCHOOL = 0; // 0 = Syafi'i

export type PrayerTimes = {
  subuh: string;
  terbit: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
};

// Last-resort static schedule shown before first load or when GPS + network fail
// and no cache exists. (Old hardcoded values, kept as graceful fallback only.)
export const FALLBACK_PRAYERS: PrayerTimes = {
  subuh: "04:36",
  terbit: "05:54",
  dzuhur: "11:58",
  ashar: "15:18",
  maghrib: "17:58",
  isya: "19:12",
};

/** Mengekstrak pola HH:MM dari string waktu, mengembalikan "--:--" bila tidak valid. */
function extractHHMM(v?: string): string {
  if (!v) return "--:--";
  const m = v.match(/\d{2}:\d{2}/);
  return m ? m[0] : "--:--";
}

/** Memetakan objek timings dari Aladhan API ke struktur PrayerTimes aplikasi. */
export function mapAladhanToPrayers(timings: Record<string, string>): PrayerTimes {
  return {
    subuh: extractHHMM(timings.Fajr),
    terbit: extractHHMM(timings.Sunrise),
    dzuhur: extractHHMM(timings.Dhuhr),
    ashar: extractHHMM(timings.Asr),
    maghrib: extractHHMM(timings.Maghrib),
    isya: extractHHMM(timings.Isha),
  };
}

/** Membuat kunci cache unik untuk jadwal sholat berdasarkan koordinat dan tanggal. */
export function buildCacheKey(lat: number, lng: number, isoDate: string): string {
  return `jadwal:${lat.toFixed(2)},${lng.toFixed(2)}:${isoDate}`;
}

/** Mengonversi setiap waktu sholat format string menjadi menit sejak tengah malam. */
export function prayerTimesToMinutes(t: PrayerTimes): Record<keyof PrayerTimes, number> {
  const parse = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  return {
    subuh: parse(t.subuh),
    terbit: parse(t.terbit),
    dzuhur: parse(t.dzuhur),
    ashar: parse(t.ashar),
    maghrib: parse(t.maghrib),
    isya: parse(t.isya),
  };
}

export type NextPrayer = { name: string; key: keyof PrayerTimes; minutes: number };

const PRAYER_ORDER: Array<{ name: string; key: keyof PrayerTimes }> = [
  { name: "Subuh", key: "subuh" },
  { name: "Terbit", key: "terbit" },
  { name: "Dzuhur", key: "dzuhur" },
  { name: "Ashar", key: "ashar" },
  { name: "Maghrib", key: "maghrib" },
  { name: "Isya", key: "isya" },
];

/** Menentukan sholat berikutnya setelah waktu sekarang beserta menitnya. */
export function computeNextPrayer(times: PrayerTimes, now: Date): NextPrayer {
  const mins = prayerTimesToMinutes(times);
  const current = now.getHours() * 60 + now.getMinutes();
  for (const p of PRAYER_ORDER) {
    if (mins[p.key] > current) {
      return { name: p.name, key: p.key, minutes: mins[p.key] };
    }
  }
  return { name: "Subuh", key: "subuh", minutes: mins.subuh + 24 * 60 };
}

export type CurrentPrayer = { name: string; key: keyof PrayerTimes };

// The prayer whose time-window we are currently in: the last entry in
// PRAYER_ORDER whose time has passed (<= now). Includes Terbit. Before Subuh
// (middle of the night) the Isya window is still active → defaults to Isya.
export function computeCurrentPrayer(times: PrayerTimes, now: Date): CurrentPrayer {
  const mins = prayerTimesToMinutes(times);
  const current = now.getHours() * 60 + now.getMinutes();
  let result: CurrentPrayer = { name: "Isya", key: "isya" };
  for (const p of PRAYER_ORDER) {
    if (mins[p.key] <= current) {
      result = { name: p.name, key: p.key };
    } else {
      break;
    }
  }
  return result;
}
