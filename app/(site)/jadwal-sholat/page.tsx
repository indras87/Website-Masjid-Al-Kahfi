import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/json-ld";
import { PrayerScheduleClient } from "./jadwal-client";

export const metadata: Metadata = buildMetadata({
  title: "Jadwal Sholat Harian — Masjid Al-Kahfi Cikoneng",
  description:
    "Jadwal sholat harian (Subuh, Dzuhur, Ashar, Maghrib, Isya) untuk Cikoneng, Bojongsoang, Kab. Bandung. Metode Kementerian Agama RI, mazhab Syafi'i.",
  path: "/jadwal-sholat",
});

const FAQ = [
  {
    q: "Apakah jadwal sholat mengikuti lokasi saya?",
    a: "Ya. Bila Anda mengizinkan akses lokasi (GPS), jadwal dihitung sesuai koordinat Anda. Bila ditolak, digunakan koordinat Masjid Al-Kahfi Cikoneng.",
  },
  {
    q: "Metode perhitungan apa yang dipakai?",
    a: "Metode Kementerian Agama RI (Fajr 20°, Isya 18°) dengan mazhab Syafi'i, melalui API Aladhan.",
  },
];

export default async function JadwalSholatPage() {
  return (
    <div className="pb-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Beranda", path: "/beranda" },
          { name: "Jadwal Sholat", path: "/jadwal-sholat" },
        ])}
      />
      <JsonLd data={faqPageJsonLd(FAQ)} />
      <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
        <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h1 className="font-serif text-4xl font-bold">
            Jadwal Sholat &amp; Ibadah
          </h1>
          <p className="text-gold-300 mt-2 font-medium">
            Data real-time wilayah Cikoneng, Bojongsoang, Kab. Bandung
          </p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/*
          The island SSR-renders the fallback (Cikoneng) schedule so real
          prayer times are in the initial HTML; hydration then refines to the
          visitor's GPS location. See jadwal-client.tsx.
        */}
        <PrayerScheduleClient />

        {/* FAQ */}
        <section className="max-w-3xl mx-auto mt-16">
          <h2 className="font-serif text-2xl font-bold text-emerald-950 mb-6 text-center">
            Pertanyaan Umum Jadwal Sholat
          </h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="bg-white rounded-xl p-5 border border-gold-100 shadow-sm"
              >
                <h3 className="font-bold text-emerald-950 text-sm flex items-start gap-2">
                  <span className="text-gold-500" aria-hidden="true">
                    Q.
                  </span>
                  <span>{item.q}</span>
                </h3>
                <p className="text-gray-600 text-sm mt-2 pl-6">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
