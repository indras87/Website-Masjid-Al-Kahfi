"use client";

import { useEffect, useState } from "react";
import {
  MASJID_COORDS,
  FALLBACK_PRAYERS,
  ALADHAN_METHOD,
  ALADHAN_SCHOOL,
  mapAladhanToPrayers,
  buildCacheKey,
  type PrayerTimes,
} from "@/lib/prayer-times";

export type PrayerSource = "gps" | "default";

function isoToday(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function aladhanPathToday(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

export function usePrayerTimes(): {
  times: PrayerTimes;
  loading: boolean;
  source: PrayerSource;
} {
  const [times, setTimes] = useState<PrayerTimes>(FALLBACK_PRAYERS);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<PrayerSource>("default");

  useEffect(() => {
    let cancelled = false;
    const iso = isoToday();

    const load = async (lat: number, lng: number, src: PrayerSource) => {
      if (cancelled) return;
      setSource(src);
      const cacheKey = buildCacheKey(lat, lng, iso);

      // 1. cache
      try {
        const raw = window.localStorage.getItem(cacheKey);
        if (raw) {
          setTimes(JSON.parse(raw) as PrayerTimes);
          setLoading(false);
          return;
        }
      } catch {
        /* ignore storage errors */
      }

      // 2. fetch Aladhan
      try {
        const url = `https://api.aladhan.com/v1/timings/${aladhanPathToday()}?latitude=${lat}&longitude=${lng}&method=${ALADHAN_METHOD}&school=${ALADHAN_SCHOOL}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Aladhan HTTP ${res.status}`);
        const json = await res.json();
        const mapped = mapAladhanToPrayers(json?.data?.timings ?? {});
        if (cancelled) return;
        setTimes(mapped);
        try {
          window.localStorage.setItem(cacheKey, JSON.stringify(mapped));
        } catch {
          /* ignore */
        }
      } catch {
        // keep FALLBACK_PRAYERS (already set as initial state)
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      load(MASJID_COORDS.lat, MASJID_COORDS.lng, "default");
      return () => {
        cancelled = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => load(pos.coords.latitude, pos.coords.longitude, "gps"),
      () => load(MASJID_COORDS.lat, MASJID_COORDS.lng, "default"),
      { timeout: 10000, maximumAge: 600000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return { times, loading, source };
}
