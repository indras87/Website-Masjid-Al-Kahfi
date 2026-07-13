import type { Metadata } from "next";
import { getAllBerita } from "@/lib/queries/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/json-ld";
import { BeritaListClient } from "./berita-list-client";

export const metadata: Metadata = buildMetadata({
  title: "Berita & Kabar Masjid Al-Kahfi",
  description:
    "Kabar terbaru DKM Masjid Al-Kahfi Cikoneng — kegiatan sosial, kajian, dan pengumuman jamaah.",
  path: "/berita",
});

export default async function BeritaPage() {
  const berita = await getAllBerita();
  return (
    <div className="pb-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Beranda", path: "/beranda" },
          { name: "Berita", path: "/berita" },
        ])}
      />
      <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
        <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h1 className="font-serif text-4xl font-bold">Kabar Al-Kahfi</h1>
          <p className="text-gold-300 mt-2 font-medium">
            Berita Acara, Artikel Islami, dan Dokumentasi Sosial
          </p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-16">
        <BeritaListClient initial={berita} />
      </div>
    </div>
  );
}
