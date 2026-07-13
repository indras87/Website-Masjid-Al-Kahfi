"use client";

import { useState, useEffect } from "react";
import { usePrayerTimes } from "@/hooks/use-prayer-times";
import { computeNextPrayer, computeCurrentPrayer } from "@/lib/prayer-times";

/**
 * Client island for the jadwal-sholat page.
 *
 * GPS auto-locate (usePrayerTimes), current-prayer highlight, and the Iqomah
 * countdown timer live here. The schedule grid renders the fallback (Cikoneng)
 * times during SSR so real prayer times are present in the initial HTML; on
 * hydration the hook refines them to the visitor's GPS coordinates (falling
 * back to the masjid location when permission is denied).
 *
 * Relocated verbatim (logic) from the previous client-only jadwal-sholat
 * page — only the rendering location and the SSR time display changed
 * (times are shown immediately rather than "--:--" while loading).
 */
export function PrayerScheduleClient() {
  const { times, loading, source } = usePrayerTimes();
  const [iqomahTime, setIqomahTime] = useState("00:00");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const next = computeNextPrayer(times, now);
      const currentMinTotal = now.getHours() * 60 + now.getMinutes();
      const diff = next.minutes - currentMinTotal;
      const mLeft = diff < 0 ? 0 : diff;

      let minsRem = 9 - (mLeft % 10);
      let secsRem = 59 - now.getSeconds();
      if (minsRem < 0) minsRem = 0;
      setIqomahTime(
        `${String(minsRem).padStart(2, "0")}:${String(secsRem).padStart(2, "0")}`,
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [times]);

  const current = loading ? null : computeCurrentPrayer(times, new Date());

  return (
    <div className="space-y-12">
      <div className="text-center">
        <span className="inline-block bg-emerald-900 text-gold-300 px-3 py-1.5 rounded-full text-xs font-mono border border-gold-500/30">
          Sumber:{" "}
          {source === "gps" ? "Lokasi Anda (GPS)" : "Lokasi Masjid (Cikoneng)"}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {Object.entries(times).map(([name, time]) => (
          <div
            key={name}
            className={`rounded-xl p-4 text-center border shadow-sm ${
              name === current?.key
                ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-900/15"
                : "bg-white border-gold-100"
            }`}
          >
            <p
              className={`text-xs uppercase ${
                name === current?.key
                  ? "text-emerald-800 font-bold tracking-wider"
                  : "text-gray-500 font-semibold"
              }`}
            >
              {name}
            </p>
            <p
              className={`text-2xl font-bold mt-2 ${
                name === current?.key ? "text-emerald-950" : "text-emerald-900"
              }`}
            >
              {time}
            </p>
          </div>
        ))}
      </div>
      <div className="bg-emerald-950 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden border-b-4 border-gold-500 shadow-lg">
        <div className="absolute inset-0 opacity-10 islamic-pattern"></div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-gold-300">
              Layanan Alert Adzan &amp; Iqomah
            </h2>
            <p className="text-emerald-50 text-xs sm:text-sm leading-relaxed">
              Fitur otomatisasi jam dinding pintar masjid mengacu pada waktu
              digital di atas. Waktu jeda Iqomah rata-rata diset 10 menit
              setelah adzan berkumandang untuk sholat rawatib.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="bg-emerald-900 text-gold-300 px-3 py-1.5 rounded-full text-xs font-mono">
                GMT+07:00 Asia/Jakarta
              </span>
              <span className="bg-emerald-900 text-gold-300 px-3 py-1.5 rounded-full text-xs font-mono">
                Metode: KEMENAG RI
              </span>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
            <p className="text-xs text-gold-300 uppercase font-semibold tracking-wider">
              Simulasi Timer Iqomah
            </p>
            <div className="font-mono text-4xl sm:text-5xl font-bold text-white my-3">
              {iqomahTime}
            </div>
            <p className="text-xs text-emerald-200">
              Menuju Iqomah Sholat Berikutnya
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
