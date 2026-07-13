"use client";

/**
 * Client island for the beranda prayer-times widget.
 *
 * Only the GPS-dependent, time-dependent UI lives here so the rest of the
 * landing page can be server-rendered (Task 10). The hook + countdown
 * algorithm are relocated verbatim from the previous client-only beranda
 * page — only the rendering location changed.
 */
import { useEffect, useState } from "react";
import { usePrayerTimes } from "@/hooks/use-prayer-times";
import { computeNextPrayer, computeCurrentPrayer } from "@/lib/prayer-times";

export function PrayerWidget() {
  const { times, loading } = usePrayerTimes();
  const [countdownText, setCountdownText] = useState("Menghitung mundur...");

  // Recompute the current prayer window on every render (cheap, pure).
  const current = loading ? null : computeCurrentPrayer(times, new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const next = computeNextPrayer(times, now);
      const currentMinTotal = now.getHours() * 60 + now.getMinutes();
      const diff = next.minutes - currentMinTotal;
      const hLeft = Math.floor(diff / 60);
      const mLeft = diff % 60;
      const tStr =
        hLeft > 0
          ? `${hLeft} jam ${mLeft} menit lagi`
          : `${mLeft} menit lagi`;
      const exact = times[next.key];

      setCountdownText(
        loading
          ? "Memuat jadwal sholat..."
          : `Sholat Berikutnya: ${next.name} (${exact}) — ${tStr}`,
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [times, loading]);

  return (
    <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-30">
      <div className="bg-white rounded-2xl shadow-xl border-b-4 border-gold-500 overflow-hidden">
        <div className="bg-emerald-950 p-4 flex flex-col sm:flex-row justify-between items-center text-white gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-300">
              Jadwal Sholat (Cikoneng & Sekitarnya)
            </span>
          </div>
          <span className="text-xs font-mono bg-emerald-900 px-3 py-1 rounded text-gold-300">
            {countdownText}
          </span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-gray-100 text-center">
          {Object.entries(times).map(([name, time]) => (
            <div
              key={name}
              className={`p-4 ${name === current?.key ? "bg-gold-50/40" : ""}`}
            >
              <p
                className={`text-xs font-semibold uppercase ${name === current?.key ? "text-emerald-900 font-bold" : "text-gray-400"}`}
              >
                {name}
              </p>
              <div
                className={`text-lg sm:text-2xl font-bold mt-1 ${name === current?.key ? "text-emerald-950" : "text-emerald-900"}`}
              >
                {loading ? "--:--" : time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
