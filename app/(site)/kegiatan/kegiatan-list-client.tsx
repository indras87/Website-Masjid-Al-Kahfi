"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import Image from "next/image";
import { Clock, CircleUser, Mic, GraduationCap, Gift } from "lucide-react";
import type { Kegiatan } from "@/lib/queries/content";

const iconMap: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  CircleUser,
  Mic,
  GraduationCap,
  Gift,
};

// Literal class strings so Tailwind's JIT detects them at build time.
const TYPE_COLOR: Record<string, string> = {
  Harian: "bg-emerald-50 text-emerald-800",
  "Jum'at": "bg-gold-100 text-gold-800",
  "Hari Besar": "bg-emerald-900 text-gold-300",
};

const CAT_MAP: Record<string, string> = {
  Harian: "harian",
  "Jum'at": "sholat-jumat",
  "Hari Besar": "hari-besar",
};

const TAG_MAP: Record<string, string> = {
  Harian: "Harian / Rutin",
  "Jum'at": "Sholat Jum'at",
  "Hari Besar": "Hari Besar (PHBI)",
};

const FILTERS = [
  { key: "semua", label: "Semua" },
  { key: "harian", label: "Harian / Rutin" },
  { key: "sholat-jumat", label: "Sholat Jum'at" },
  { key: "hari-besar", label: "Hari Besar (PHBI)" },
] as const;

type Mapped = {
  id: number;
  cat: string;
  tag: string;
  time: string;
  title: string;
  desc: string;
  ust: string;
  note: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
  color: string;
  img: string;
};

export function KegiatanListClient({ initial }: { initial: Kegiatan[] }) {
  const [filter, setFilter] = useState<string>("semua");

  const items: Mapped[] = initial.map((k) => ({
    id: k.id,
    cat: CAT_MAP[k.type] || "harian",
    tag: TAG_MAP[k.type] || "Harian / Rutin",
    time: k.time,
    title: k.title,
    desc: k.desc || "",
    ust: k.ust,
    note: k.note || "",
    Icon: iconMap[k.icon] || CircleUser,
    color: TYPE_COLOR[k.type] ?? k.color ?? "bg-emerald-50 text-emerald-800",
    img: k.img || "",
  }));

  const visible = items.filter((a) => filter === "semua" || a.cat === filter);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-12">
      <div className="flex flex-wrap gap-2 justify-center">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`px-5 py-2 rounded-full text-sm font-semibold shadow ${filter === f.key ? "bg-emerald-900 text-white" : "bg-white text-emerald-950 border border-gold-200 hover:bg-gold-50"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {visible.map((act) => (
          <article
            key={act.id}
            className="bg-white rounded-2xl overflow-hidden border border-gold-100 shadow-sm flex flex-col justify-between"
          >
            {act.img ? (
              <div className="relative w-full h-48">
                <Image
                  src={act.img}
                  alt={act.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className={`relative w-full h-48 flex items-center justify-center ${act.color}`}>
                <act.Icon size={56} className="opacity-25" aria-hidden="true" />
              </div>
            )}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span
                  className={`${act.color} text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase`}
                >
                  {act.tag}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={12} aria-hidden="true" /> {act.time}
                </span>
              </div>
              <h2 className="font-serif text-xl font-bold text-emerald-950">
                {act.title}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {act.desc}
              </p>
            </div>
            <div className="bg-gold-50/50 px-6 py-4 border-t border-gold-100 flex justify-between items-center text-xs">
              <span className="text-emerald-900 font-bold flex items-center gap-1">
                <act.Icon size={14} aria-hidden="true" /> {act.ust}
              </span>
              <span className="text-gray-500">{act.note}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
