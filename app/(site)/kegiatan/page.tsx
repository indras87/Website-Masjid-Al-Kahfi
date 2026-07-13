"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Clock, ChevronRight } from "lucide-react";
import { CircleUser, Mic, GraduationCap, Gift } from "lucide-react";
import Image from "next/image";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  CircleUser,
  Mic,
  GraduationCap,
  Gift,
};

const FALLBACK_KEGIATAN = [
  {
    cat: "harian",
    tag: "Harian / Rutin",
    time: "Setiap Hari (Bada Subuh)",
    title: "Tahsin & Bimbingan Mengaji Quran Dewasa",
    desc: "Program pengentasan buta aksara Quran yang diorientasikan bagi bapak-bapak dan remaja pria di lingkungan Cikoneng. Dibimbing langsung secara privat & kelompok.",
    ust: "Ust. Sulaeman Al-Hafidz",
    note: "Gratis & Terbuka",
    Icon: CircleUser,
    color: "bg-emerald-50 text-emerald-800",
    img: "",
  },
  {
    cat: "sholat-jumat",
    tag: "Sholat Jum'at",
    time: "Setiap Jum'at (11:55 WIB)",
    title: "Pelaksanaan Sholat Jum'at Berjamaah",
    desc: "Jadwal bergilir penceramah/Khotib berkompeten yang mengedukasi jamaah secara moderat, membangkitkan ketaqwaan, dan bersandar pada keaslian literatur dalil shahih.",
    ust: "Khotib Bergilir (DKM Al-Kahfi)",
    note: "Lantai Utama",
    Icon: Mic,
    color: "bg-gold-100 text-gold-800",
    img: "",
  },
  {
    cat: "harian",
    tag: "Harian / Rutin",
    time: "Senin & Kamis (Bada Ashar)",
    title: "Taman Pendidikan Al-Qur'an (TPA) Anak",
    desc: "Wadah belajar anak usia dini hingga sekolah dasar di lingkungan Cikoneng guna mendalami adab harian, hafalan doa pendek, juz amma, dan cara penulisan huruf hijaiyah.",
    ust: "Ustadzah Khadijah & Tim",
    note: "Khusus Anak-anak",
    Icon: GraduationCap,
    color: "bg-emerald-50 text-emerald-800",
    img: "",
  },
  {
    cat: "hari-besar",
    tag: "Hari Besar (PHBI)",
    time: "Tentative (Hari Raya)",
    title: "Penyelenggaraan Qurban Al-Kahfi",
    desc: "Program pengumpulan, penyembelihasan, dan pendistribusian daging hewan kurban secara modern, steril, tertib administrasi, dan dijamin adil bagi dhuafa Cikoneng.",
    ust: "Panitia Qurban Bersama",
    note: "Halaman Samping",
    Icon: Gift,
    color: "bg-emerald-900 text-gold-300",
    img: "",
  },
];

/** Halaman daftar kegiatan & kajian rutin masjid dengan filter kategori. */
export default function KegiatanPage() {
  const [activitiesData, setActivitiesData] = useState<any[]>([]);
  const [filter, setFilter] = useState("semua");

  useEffect(() => {
    /** Memuat daftar kegiatan aktif dari API; jatuh ke FALLBACK_KEGIATAN bila gagal. */
    const fetchData = async () => {
      try {
        const kegiatanRes = await fetch("/api/kegiatan");
        if (kegiatanRes.ok) {
          const kegiatanJson = await kegiatanRes.json();
          const activeKegiatan = kegiatanJson.filter(
            (k: any) => k.status === "Aktif",
          );

          const mappedKegiatan = activeKegiatan.map((k: any) => {
            const catMap: Record<string, string> = {
              Harian: "harian",
              "Jum'at": "sholat-jumat",
              "Hari Besar": "hari-besar",
            };
            const tagMap: Record<string, string> = {
              Harian: "Harian / Rutin",
              "Jum'at": "Sholat Jum'at",
              "Hari Besar": "Hari Besar (PHBI)",
            };
            return {
              cat: catMap[k.type] || "harian",
              tag: tagMap[k.type] || "Harian / Rutin",
              time: k.time,
              title: k.title,
              desc: k.desc || "",
              ust: k.ust,
              note: k.note || "",
              Icon: iconMap[k.icon] || CircleUser,
              color: k.color || "bg-emerald-50 text-emerald-800",
              img: k.img || "",
            };
          });
          setActivitiesData(mappedKegiatan);
        } else {
          setActivitiesData(FALLBACK_KEGIATAN);
        }
      } catch (e) {
        console.error("Gagal memuat kegiatan:", e);
        setActivitiesData(FALLBACK_KEGIATAN);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="pb-16">
      <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
        <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h2 className="font-serif text-4xl font-bold">
            Kegiatan & Kajian Rutin
          </h2>
          <p className="text-gold-300 mt-2 font-medium">
            Bina Ruhiyah & Interaksi Umat Masjid Al-Kahfi
          </p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-12">
        <div className="flex flex-wrap gap-2 justify-center">
          {["semua", "harian", "sholat-jumat", "hari-besar"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-sm font-semibold shadow ${filter === f ? "bg-emerald-900 text-white" : "bg-white text-emerald-950 border border-gold-200 hover:bg-gold-50"}`}
            >
              {f === "semua"
                ? "Semua"
                : f === "harian"
                  ? "Harian / Rutin"
                  : f === "sholat-jumat"
                    ? "Sholat Jum'at"
                    : "Hari Besar (PHBI)"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {activitiesData
            .filter((a) => filter === "semua" || a.cat === filter)
            .map((act, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
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
                    <act.Icon size={56} className="opacity-25" />
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
                      <Clock size={12} /> {act.time}
                    </span>
                  </div>
                  <h4 className="font-serif text-xl font-bold text-emerald-950">
                    {act.title}
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {act.desc}
                  </p>
                </div>
                <div className="bg-gold-50/50 px-6 py-4 border-t border-gold-100 flex justify-between items-center text-xs">
                  <span className="text-emerald-900 font-bold flex items-center gap-1">
                    <act.Icon size={14} /> {act.ust}
                  </span>
                  <span className="text-gray-500">{act.note}</span>
                </div>
              </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
}
