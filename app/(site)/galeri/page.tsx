import type { Metadata } from "next";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { getAllGaleri } from "@/lib/queries/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, imageCollectionJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = buildMetadata({
  title: "Galeri Dokumentasi Masjid Al-Kahfi",
  description: "Dokumentasi kegiatan dan momen ibadah di Masjid Al-Kahfi Cikoneng.",
  path: "/galeri",
});

export default async function GaleriPage() {
  const items = await getAllGaleri();

  return (
    <div className="pb-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Beranda", path: "/beranda" },
          { name: "Galeri", path: "/galeri"},
        ])}
      />
      <JsonLd data={imageCollectionJsonLd(items)} />
      <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
        <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h1 className="font-serif text-4xl font-bold">Galeri Dokumentasi</h1>
          <p className="text-gold-300 mt-2 font-medium">
            Rekaman Kilasan Kegiatan dan Pembangunan Masjid Al-Kahfi
          </p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((g) => (
            <figure
              key={g.id}
              className="group relative overflow-hidden rounded-xl cursor-pointer h-40 sm:h-48"
            >
              <Image
                src={g.img}
                alt={g.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover group-hover:scale-105 transition duration-300"
              />
              <figcaption className="sr-only">{g.title}</figcaption>
              <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition pointer-events-none">
                <ZoomIn className="text-white w-8 h-8" aria-hidden="true" />
              </div>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
