"use client";

import React from "react";

export type HeroMode = "malam" | "pagi";

export const HERO_SOURCES: Record<
  HeroMode,
  { src: string; poster: string; label: string }
> = {
  malam: {
    src: "/animasi_hero_section/masjid-alkahfi-malam-2.mp4",
    poster: "/animasi_hero_section/ezgif-frame-001.jpg",
    label: "Malam",
  },
  pagi: {
    src: "/animasi_hero_section/masjid-alkahfi-pagi-2.mp4",
    poster: "/animasi_hero_section/masjid_alkahfi_pagi.png",
    label: "Pagi",
  },
};

type MasjidNightAnimationProps = {
  mode: HeroMode;
  className?: string;
};

/**
 * Background video hero masjid. Sumber video bergantung `mode` (malam/pagi).
 * Auto-play, loop, muted, inline. Tombol toggle dirender di parent agar
 * tidak tertutup overlay gradient.
 */
export default function MasjidNightAnimation({
  mode,
  className = "",
}: MasjidNightAnimationProps) {
  const current = HERO_SOURCES[mode];

  return (
    <div className={`relative w-full h-full bg-emerald-950 ${className}`}>
      <video
        key={mode}
        className="w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={current.poster}
        aria-label={`Animasi suasana masjid Al-Kahfi (${current.label})`}
      >
        <source src={current.src} type="video/mp4" />
      </video>
    </div>
  );
}
