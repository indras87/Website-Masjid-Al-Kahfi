import type { Metadata } from "next";
import { getAllKegiatan } from "@/lib/queries/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { eventJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/json-ld";
import { KegiatanListClient } from "./kegiatan-list-client";

export const metadata: Metadata = buildMetadata({
  title: "Kegiatan & Kajian Rutin Masjid Al-Kahfi",
  description:
    "Jadwal kajian, TPA, sholat Jum'at, dan kegiatan rutin lainnya di Masjid Al-Kahfi Cikoneng.",
  path: "/kegiatan",
});

export default async function KegiatanPage() {
  const all = await getAllKegiatan();
  const items = all.filter((k) => k.status === "Aktif");

  return (
    <div className="pb-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Beranda", path: "/beranda" },
          { name: "Kegiatan", path: "/kegiatan" },
        ])}
      />
      {items.map((k) => (
        <JsonLd key={k.id} data={eventJsonLd(k)} />
      ))}
      <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
        <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h1 className="font-serif text-4xl font-bold">Kegiatan &amp; Kajian Rutin</h1>
          <p className="text-gold-300 mt-2 font-medium">
            Bina Ruhiyah &amp; Interaksi Umat Masjid Al-Kahfi
          </p>
        </div>
      </div>
      <KegiatanListClient initial={items} />
    </div>
  );
}
