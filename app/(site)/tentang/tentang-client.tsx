"use client";

import { useState } from "react";
import Image from "next/image";
import type { Pengurus } from "@/lib/queries/content";

/**
 * Client island for the pengurus (organisational structure) section of the
 * /tentang page. The data is fetched server-side and passed in as props (so
 * every name is in the initial HTML); only the tab switching and image-error
 * fallback need client interactivity (Task 12).
 *
 * Logic relocated verbatim from the previous client-only tentang page —
 * heading levels adjusted (sub-groups -> h3, names -> styled <p>) and the
 * local Pengurus type replaced with the shared Drizzle-inferred type.
 */

type BidangKey = "idarah" | "imarah" | "riayah";

function groupPengurus(list: Pengurus[]) {
  const byTingkat = (t: Pengurus["tingkat"]) =>
    list.filter((p) => p.tingkat === t).sort((a, b) => a.urutan - b.urutan);

  const topSection = {
    pembina: byTingkat("pembina"),
    penasehat: byTingkat("penasehat"),
    pimpinan: byTingkat("pimpinan"),
  };

  const buildBidang = (t: BidangKey) => {
    const items = byTingkat(t);
    const koordinator =
      items.find((p) => p.jabatan === "Koordinator Bidang") || null;
    const rest = items.filter((p) => p.jabatan !== "Koordinator Bidang");
    const subMap = new Map<string, Pengurus[]>();
    for (const p of rest) {
      const key = p.subBidang || "";
      if (!subMap.has(key)) subMap.set(key, []);
      subMap.get(key)!.push(p);
    }
    const subGroups = Array.from(subMap.entries()).map(
      ([subBidang, members]) => ({ subBidang, members }),
    );
    return { koordinator, subGroups, members: rest };
  };

  return {
    topSection,
    idarah: buildBidang("idarah"),
    imarah: buildBidang("imarah"),
    riayah: buildBidang("riayah"),
  };
}

function initialsOf(nama: string): string {
  return nama
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function PengurusCard({
  p,
  priority = false,
}: {
  p: Pengurus;
  priority?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const label = p.jabatan || p.subBidang || "Anggota";

  return (
    <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gold-100 hover:shadow-md transition">
      <div className="w-20 h-20 relative mx-auto mb-3 rounded-full overflow-hidden border-2 border-gold-500 bg-gray-50">
        {imgError ? (
          <div className="w-full h-full flex items-center justify-center bg-emerald-900 text-gold-300 font-bold text-xl">
            {initialsOf(p.nama)}
          </div>
        ) : (
          <Image
            src={p.foto}
            alt={`Foto ${p.nama}, ${label} DKM Masjid Al-Kahfi`}
            fill
            sizes="80px"
            priority={priority}
            className="object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <p className="font-bold text-emerald-950 text-sm leading-tight">
        {p.nama}
      </p>
      <p className="text-[10px] text-gold-600 font-semibold uppercase mt-1">
        {label}
      </p>
    </div>
  );
}

function KoordinatorCard({ p }: { p: Pengurus }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-gold-400 w-full max-w-xs">
      <div className="w-16 h-16 relative mx-auto mb-3 rounded-full overflow-hidden border-2 border-gold-500 bg-gray-50">
        {imgError ? (
          <div className="w-full h-full flex items-center justify-center bg-emerald-900 text-gold-300 font-bold text-lg">
            {initialsOf(p.nama)}
          </div>
        ) : (
          <Image
            src={p.foto}
            alt={`Foto ${p.nama}, Koordinator Bidang DKM Masjid Al-Kahfi`}
            fill
            sizes="64px"
            className="object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <p className="text-[10px] text-gold-600 font-bold uppercase">
        Koordinator Bidang
      </p>
      <p className="font-bold text-emerald-950 text-sm">{p.nama}</p>
    </div>
  );
}

export function PengurusBoard({ pengurus }: { pengurus: Pengurus[] }) {
  const [activeBidang, setActiveBidang] = useState<BidangKey>("imarah");
  const g = groupPengurus(pengurus);

  return (
    <div className="space-y-10">
      {/* TOP SECTION: always visible */}
      {g.topSection.pembina.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-serif text-lg font-bold text-emerald-900 border-b border-gold-200 pb-2">
            Pembina
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {g.topSection.pembina.map((p) => (
              <PengurusCard key={`pembina-${p.id}`} p={p} priority />
            ))}
          </div>
        </div>
      )}

      {g.topSection.penasehat.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-serif text-lg font-bold text-emerald-900 border-b border-gold-200 pb-2">
            Penasehat
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {g.topSection.penasehat.map((p) => (
              <PengurusCard key={`penasehat-${p.id}`} p={p} priority />
            ))}
          </div>
        </div>
      )}

      {g.topSection.pimpinan.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-serif text-lg font-bold text-emerald-900 border-b border-gold-200 pb-2">
            Pimpinan Inti
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {g.topSection.pimpinan.map((p) => (
              <PengurusCard key={`pimpinan-${p.id}`} p={p} priority />
            ))}
          </div>
        </div>
      )}

      {/* TABS: Idarah / Imarah / Ri'ayah */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {(["idarah", "imarah", "riayah"] as const).map((t) => {
            const label =
              t === "idarah"
                ? "Bidang Idarah"
                : t === "imarah"
                  ? "Bidang Imarah"
                  : "Bidang Ri'ayah";
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveBidang(t)}
                aria-pressed={activeBidang === t}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                  activeBidang === t
                    ? "bg-emerald-900 text-gold-300 shadow-md"
                    : "bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="bg-emerald-50/50 rounded-2xl p-6 space-y-6">
          {(() => {
            const bidang = g[activeBidang];
            return (
              <>
                {bidang.koordinator && (
                  <div className="flex justify-center">
                    <KoordinatorCard p={bidang.koordinator} />
                  </div>
                )}

                {activeBidang === "idarah" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {bidang.members.map((p) => (
                      <PengurusCard key={`idarah-${p.id}`} p={p} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {bidang.subGroups.map((sg) => (
                      <div
                        key={`${activeBidang}-${sg.subBidang}`}
                        className="space-y-3"
                      >
                        <h3 className="font-semibold text-emerald-800 text-sm flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold-500"></span>
                          {sg.subBidang}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {sg.members.map((p) => (
                            <PengurusCard
                              key={`${activeBidang}-${p.id}`}
                              p={p}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
