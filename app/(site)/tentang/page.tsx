import type { Metadata } from "next";
import {
  Eye,
  Target,
  User,
  Droplet,
  Ambulance,
  BookOpen,
  Car,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import {
  getProfilMasjid,
  getAllFasilitas,
  getAllPengurus,
} from "@/lib/queries/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/json-ld";
import { PengurusBoard } from "./tentang-client";

export const metadata: Metadata = buildMetadata({
  title: "Tentang Masjid Al-Kahfi Cikoneng",
  description:
    "Visi, misi, sejarah, struktur kepengurusan DKM, dan fasilitas Masjid Al-Kahfi Cikoneng, Kab. Bandung.",
  path: "/tentang",
});

// lucide-react icons are server-safe (no client boundary needed).
const iconMap: Record<string, LucideIcon> = {
  User,
  Droplet,
  Ambulance,
  BookOpen,
  Car,
  Wifi,
};

export default async function TentangPage() {
  const [profil, fasilitas, pengurus] = await Promise.all([
    getProfilMasjid(),
    getAllFasilitas(),
    getAllPengurus(),
  ]);

  const misiLines = (profil?.misi ?? "")
    .split("\n")
    .filter((line) => line.trim() !== "");

  return (
    <div className="pb-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Beranda", path: "/beranda" },
          { name: "Tentang", path: "/tentang" },
        ])}
      />
      <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
        <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h1 className="font-serif text-4xl font-bold">
            Tentang Masjid Al-Kahfi
          </h1>
          <p className="text-gold-300 mt-2 font-medium">
            Sejarah, Visi, Misi, Kepengurusan &amp; Fasilitas Lengkap
          </p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
        {/* Struktur Kepengurusan */}
        <section className="space-y-8">
          <div className="text-center space-y-1">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-emerald-950">
              Pengurus DKM Al-Kahfi
            </h2>
            <p className="text-sm text-gray-500">Masa Khidmat: 2024 - 2028</p>
          </div>
          {pengurus.length > 0 ? (
            <PengurusBoard pengurus={pengurus} />
          ) : (
            <p className="text-center text-sm text-gray-500">
              Data kepengurusan belum tersedia.
            </p>
          )}
        </section>

        {/* Visi & Misi */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-emerald-950 text-white rounded-2xl p-8 relative overflow-hidden border-b-4 border-gold-500 shadow-lg">
            <div className="absolute top-0 right-0 opacity-10 islamic-pattern w-32 h-32"></div>
            <h2 className="font-serif text-xl font-bold text-gold-300 mb-4 flex items-center gap-2">
              <Eye /> Visi Kami
            </h2>
            <p className="text-emerald-50 leading-relaxed font-light text-sm md:text-base">
              &quot;{profil?.visi}&quot;
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-gold-200 shadow-md">
            <h2 className="font-serif text-xl font-bold text-emerald-950 mb-4 flex items-center gap-2">
              <Target className="text-gold-500" /> Misi Kami
            </h2>
            <ol className="space-y-3 text-sm text-gray-600">
              {misiLines.map((line, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-gold-500 font-bold">{index + 1}.</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Sejarah (only when the profile row has history text) */}
        {profil?.history && (
          <section className="bg-white rounded-2xl p-8 border border-gold-100 shadow-sm">
            <h2 className="font-serif text-2xl font-bold text-emerald-950 mb-4">
              Sejarah Masjid Al-Kahfi
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
              {profil.history}
            </p>
          </section>
        )}

        {/* Fasilitas Masjid */}
        <section className="space-y-8">
          <div className="text-center">
            <span className="text-xs font-bold text-gold-600 uppercase tracking-widest">
              Sarana Prasarana
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-emerald-950 mt-2">
              Fasilitas Masjid Al-Kahfi
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {fasilitas.map((item) => {
              const Icon = iconMap[item.icon] ?? User;
              return (
                <div
                  key={item.id}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gold-100 flex gap-4"
                >
                  <div className="text-gold-500 mt-1">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-950 text-base">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
