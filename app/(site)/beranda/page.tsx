import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  HeartPulse,
  Clock,
  HandCoins,
  ArrowRight,
  ChevronRight,
  ZoomIn,
  CircleUser,
  Mic,
  GraduationCap,
  Gift,
  type LucideIcon,
} from "lucide-react";
import {
  getFeaturedKegiatan,
  getRecentBerita,
  getRecentGaleri,
  getProfilMasjid,
  getAllKegiatan,
} from "@/lib/queries/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { PrayerWidget } from "./beranda-client";

export const metadata: Metadata = buildMetadata({
  title: undefined, // use the root default title (Masjid Al-Kahfi)
  description:
    "Masjid Al-Kahfi Cikoneng, Kab. Bandung — pusat ibadah, kajian rutin, dan pemberdayaan umat. Jadwal sholat, kegiatan, berita, dan donasi.",
  path: "/beranda",
});

// Map stored icon names -> Lucide components (server-safe: lucide-react has no
// "use client" boundary). Used for the kegiatan card icon fallback.
const iconMap: Record<string, LucideIcon> = {
  CircleUser,
  Mic,
  GraduationCap,
  Gift,
};

// Tailwind only generates classes it can see as literal text in source. The
// kegiatan `color` column stores full class strings from the DB, so we list the
// known values here to keep them in the build output.
const KEGIATAN_COLOR_CLASSES = [
  "bg-emerald-50 text-emerald-800",
  "bg-gold-100 text-gold-800",
  "bg-emerald-900 text-gold-300",
];

export default async function BerandaPage() {
  const [featured, beritaAll, galeri, profil] = await Promise.all([
    getFeaturedKegiatan(3),
    getRecentBerita(3),
    getRecentGaleri(6),
    getProfilMasjid(),
  ]);

  // Preserve the existing 3-card design: prefer featured rows, but fall back to
  // active kegiatan when none are flagged featured (the default seed flags none).
  let kegiatan = featured;
  if (kegiatan.length === 0) {
    const all = await getAllKegiatan();
    kegiatan = all
      .filter((k) => k.status === "Aktif")
      .sort((a, b) => Number(b.featured) - Number(a.featured))
      .slice(0, 3);
  }

  // Task 9 lesson: never link a berita without a slug (would 404).
  const berita = beritaAll.filter((b) => b.slug);

  const heroSubtitle =
    profil?.visi ??
    "Pusat Pembinaan Keimanan, Pemberdayaan Sosial Ekonomi Umat, dan Pendidikan Karakter Islami di Wilayah Cikoneng, Kabupaten Bandung.";

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative min-h-[550px] lg:min-h-[650px] flex items-center text-white overflow-hidden border-b-4 border-gold-500">
        <Image
          src="https://images.unsplash.com/photo-1759167633056-75c9c63ebc22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920&q=80"
          alt="Masjid Al-Kahfi Cikoneng"
          fill
          sizes="100vw"
          className="object-cover"
          referrerPolicy="no-referrer"
          priority
        />
        <div className="absolute inset-0 bg-emerald-950/80 mix-blend-multiply z-0"></div>
        <div className="absolute inset-0 opacity-10 islamic-pattern z-10"></div>
        <div className="relative z-20 max-w-7xl mx-auto px-4 py-20 flex flex-col items-center text-center">
          <div className="w-16 h-1 bg-gold-500 mb-6"></div>
          <p className="text-gold-300 font-serif italic text-lg sm:text-xl mb-3 tracking-widest">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
            Selamat Datang di <br />
            <span className="text-gold-400">Masjid Al-Kahfi Cikoneng</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-emerald-50 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            {heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
            <Link
              href="/jadwal-sholat"
              className="bg-gold-500 hover:bg-gold-600 text-emerald-950 font-bold px-8 py-3.5 rounded-lg shadow-lg transition flex items-center justify-center gap-2"
            >
              <Clock size={18} /> Jadwal Sholat Hari Ini
            </Link>
            <Link
              href="/donasi"
              className="bg-transparent border-2 border-gold-500 text-gold-300 hover:bg-gold-500 hover:text-emerald-950 font-semibold px-8 py-3.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              <HandCoins size={18} /> Infaq & Sedekah
            </Link>
          </div>
        </div>
      </section>

      {/* Prayer Times Widget (client island — GPS + countdown) */}
      <PrayerWidget />

      {/* Program Overview (Kegiatan) */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-gold-600 uppercase tracking-widest bg-gold-50 px-3 py-1 rounded-full">
            Program Masjid
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-emerald-950 mt-3">
            Kegiatan Utama & Kemaslahatan
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {kegiatan.map((k) => {
            const Icon = iconMap[k.icon ?? ""] ?? CircleUser;
            const color = k.color || KEGIATAN_COLOR_CLASSES[0];
            return (
              <article
                key={k.id}
                className="bg-white rounded-2xl border border-gold-100 shadow-md hover:shadow-lg transition overflow-hidden flex flex-col"
              >
                {k.img ? (
                  <div className="relative w-full h-40">
                    <Image
                      src={k.img}
                      alt={k.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className={`relative w-full h-40 flex items-center justify-center ${color}`}
                  >
                    <Icon size={48} className="opacity-25" />
                  </div>
                )}
                <div className="p-6 space-y-4 flex-1 flex flex-col">
                  <h3 className="font-serif text-lg font-bold text-emerald-950">
                    {k.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                    {k.desc}
                  </p>
                  <Link
                    href="/kegiatan"
                    className="text-xs text-emerald-900 font-bold hover:text-gold-600 transition flex items-center gap-1 mt-auto"
                  >
                    Lihat Detail <ChevronRight size={14} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Kabar Terbaru (Berita preview) — only when linkable (slug-bearing) items exist */}
      {berita.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex flex-col sm:flex-row justify-between items-baseline mb-10 gap-2">
            <div>
              <span className="text-xs font-bold text-gold-600 uppercase tracking-widest">
                Kabar Masjid
              </span>
              <h2 className="font-serif text-3xl font-bold text-emerald-950 mt-1">
                Kabar Terbaru
              </h2>
            </div>
            <Link
              href="/berita"
              className="text-emerald-900 font-bold text-sm hover:text-gold-600 transition flex items-center gap-1"
            >
              Lihat Semua Berita <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {berita.map((b) => (
              <article
                key={b.id}
                className="bg-white rounded-2xl border border-gold-100 shadow-md hover:shadow-lg transition overflow-hidden flex flex-col"
              >
                {b.img && (
                  <div className="relative w-full h-40">
                    <Image
                      src={b.img}
                      alt={b.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6 space-y-3 flex-1 flex flex-col">
                  {b.tag && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold-600 bg-gold-50 self-start px-2 py-0.5 rounded">
                      {b.tag}
                    </span>
                  )}
                  <h3 className="font-serif text-lg font-bold text-emerald-950">
                    <Link
                      href={`/berita/${b.slug}`}
                      className="hover:text-gold-600 transition"
                    >
                      {b.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                    {b.desc}
                  </p>
                  <span className="text-xs text-gray-400 mt-auto">{b.date}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Banner Ajakan Donasi */}
      <section className="bg-emerald-950 text-white relative overflow-hidden py-16">
        <div className="absolute inset-0 opacity-10 islamic-pattern"></div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-6">
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
            Investasi Akhirat Terbaik, Alirkan Pahala Jariyah Anda
          </h2>
          <p className="text-emerald-100 font-light text-sm sm:text-base max-w-2xl mx-auto">
            Salurkan infaq, shodaqoh, dan zakat Anda untuk mendukung penuh
            operasional dawah, pendidikan santri TPA, dan peningkatan sarana
            ibadah di Masjid Al-Kahfi Cikoneng.
          </p>
          <div className="pt-2">
            <Link
              href="/donasi"
              className="bg-gold-500 hover:bg-gold-600 text-emerald-950 font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition inline-flex items-center gap-2"
            >
              <HeartPulse size={16} /> Mulai Berdonasi Sekarang
            </Link>
          </div>
        </div>
      </section>

      {/* Preview Galeri Foto */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row justify-between items-baseline mb-10 gap-2">
          <div>
            <span className="text-xs font-bold text-gold-600 uppercase tracking-widest">
              Dokumentasi
            </span>
            <h2 className="font-serif text-3xl font-bold text-emerald-950 mt-1">
              Galeri Foto Masjid
            </h2>
          </div>
          <Link
            href="/galeri"
            className="text-emerald-900 font-bold text-sm hover:text-gold-600 transition flex items-center gap-1"
          >
            Lihat Seluruh Foto <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {galeri.slice(0, 4).map((g) => (
            <div
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
              <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <ZoomIn className="text-white w-8 h-8" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
