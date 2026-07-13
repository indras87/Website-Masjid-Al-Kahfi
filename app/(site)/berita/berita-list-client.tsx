"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Berita } from "@/lib/queries/content";

const TAG_COLOR: Record<string, string> = {
  Sosial: "bg-emerald-50 text-emerald-800",
  Kebersihan: "bg-gold-50 text-gold-800",
  Tarbiyah: "bg-emerald-50 text-emerald-800",
};

function tagColor(tag: string) {
  return TAG_COLOR[tag] ?? "bg-emerald-50 text-emerald-800";
}

export function BeritaListClient({ initial }: { initial: Berita[] }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? initial.filter((b) =>
        [b.title, b.tag, b.desc, b.author].join(" ").toLowerCase().includes(needle),
      )
    : initial;

  return (
    <>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari berita..."
        aria-label="Cari berita"
        className="w-full md:max-w-md px-4 py-2 rounded-lg border border-gold-200 bg-white focus:outline-none focus:ring-2 focus:ring-gold-400 mb-8"
      />

      {filtered.length === 0 ? (
        <p className="text-gray-500">Tidak ada berita yang cocok dengan pencarian Anda.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filtered.map((b) => {
            const href = `/berita/${b.slug}`;
            return (
              <article
                key={b.id}
                className="bg-white rounded-2xl overflow-hidden border border-gold-100 shadow-sm flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <Link href={href} className="block relative w-full h-48">
                    <Image
                      src={b.img}
                      alt={b.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </Link>
                  <div className="p-6 space-y-3">
                    <span
                      className={`text-[10px] ${tagColor(b.tag)} font-bold px-2 py-0.5 rounded`}
                    >
                      {b.tag}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-emerald-950 leading-snug">
                      <Link href={href} className="hover:text-gold-600 transition">
                        {b.title}
                      </Link>
                    </h3>
                    <p className="text-gray-600 text-xs leading-relaxed line-clamp-3">
                      {b.desc}
                    </p>
                  </div>
                </div>
                <div className="p-6 pt-0 border-t border-gold-50/50 flex justify-between items-center text-xs text-gray-500 mt-4">
                  <span>{b.date}</span>
                  <Link
                    href={href}
                    className="text-emerald-900 font-bold hover:text-gold-600 transition"
                  >
                    Baca selengkapnya
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
