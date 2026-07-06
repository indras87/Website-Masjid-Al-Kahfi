"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import {
  Eye,
  Target,
  User,
  Droplet,
  Ambulance,
  BookOpen,
  Car,
  Wifi,
} from "lucide-react";

const FALLBACK_PENGURUS = [
  {
    name: "H. Endang Wijaya, Lc.",
    role: "Ketua Umum DKM",
    period: "Periode 2024-2028",
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    name: "H. Ridwan Kamil, S.E.",
    role: "Wakil Ketua",
    period: "Periode 2024-2028",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    name: "Bpk. Ahmad Fauzi",
    role: "Bendahara Ziswaf",
    period: "Periode 2024-2028",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    name: "Ust. Syahrul Ramadhan",
    role: "Ketua Bidang Dakwah",
    period: "Periode 2024-2028",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200",
  },
];

const FALLBACK_VISI_MISI = {
  visi: "Menjadi masjid yang mandiri, makmur, serta melahirkan generasi rabbani yang berilmu, bertaqwa, berakhlak mulia, dan bermanfaat sosial di Kabupaten Bandung.",
  misi: "Menyelenggarakan kegiatan ibadah fardhu & sunnah secara istiqomah sesuai tuntunan Al-Qur'an dan Sunnah.\nMenyelenggarakan pendidikan agama (TPA, Kajian, Tahsin) yang terarah bagi semua kalangan usia.\nMengembangkan pengelolaan dana ziswaf yang produktif, transparan, dan berdaya guna tinggi bagi dhuafa.",
};

const FALLBACK_FASILITAS = [
  {
    title: "Ruang Utama Sholat",
    desc: "Dilengkapi sajadah empuk, pendingin ruangan (AC), sound system berkualitas, menampung hingga 500 jamaah.",
    icon: "User",
  },
  {
    title: "Wudhu & Toilet Higienis",
    desc: "Fasilitas bersuci terpisah permanen antara ikhwan dan akhwat, air bersih bersih langsung dari mata air sumur dalam.",
    icon: "Droplet",
  },
  {
    title: "Ambulans Gratis 24 Jam",
    desc: "Siap siaga melayani kebutuhan gawat darurat dan pengantaran jenazah bagi warga Cikoneng tanpa biaya.",
    icon: "Ambulance",
  },
  {
    title: "Ruang Belajar & TPA",
    desc: "Wadah khusus pembelajaran TPA sore hari yang ramah anak, lengkap dengan koleksi kitab dan papan tulis interaktif.",
    icon: "BookOpen",
  },
  {
    title: "Area Parkir Ber-CCTV",
    desc: "Lahan parkir kendaraan roda dua dan empat yang aman, dikontrol dengan kamera CCTV pengawas 24 jam penuh.",
    icon: "Car",
  },
  {
    title: "Akses Wifi Hotspot",
    desc: "Layanan internet nirkabel gratis di area teras untuk mendukung operasional dawah digital dan administrasi santri.",
    icon: "Wifi",
  },
];

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  User,
  Droplet,
  Ambulance,
  BookOpen,
  Car,
  Wifi,
};

export default function TentangPage() {
  const [pengurusData, setPengurusData] = useState<any[]>([]);
  const [visiMisi, setVisiMisi] = useState({ visi: "", misi: "" });
  const [fasilitasData, setFasilitasData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pengurusRes = await fetch("/api/pengurus");
        if (pengurusRes.ok) {
          const pengurusJson = await pengurusRes.json();
          setPengurusData(
            pengurusJson.length > 0 ? pengurusJson : FALLBACK_PENGURUS,
          );
        } else {
          setPengurusData(FALLBACK_PENGURUS);
        }
      } catch (e) {
        console.error("Gagal memuat pengurus:", e);
        setPengurusData(FALLBACK_PENGURUS);
      }

      try {
        const profilRes = await fetch("/api/profil");
        if (profilRes.ok) {
          const profilJson = await profilRes.json();
          setVisiMisi({
            visi: profilJson.visi || FALLBACK_VISI_MISI.visi,
            misi: profilJson.misi || FALLBACK_VISI_MISI.misi,
          });
        } else {
          setVisiMisi(FALLBACK_VISI_MISI);
        }
      } catch (e) {
        console.error("Gagal memuat visi-misi:", e);
        setVisiMisi(FALLBACK_VISI_MISI);
      }

      try {
        const fasilitasRes = await fetch("/api/fasilitas");
        if (fasilitasRes.ok) {
          const fasilitasJson = await fasilitasRes.json();
          setFasilitasData(
            fasilitasJson.length > 0 ? fasilitasJson : FALLBACK_FASILITAS,
          );
        } else {
          setFasilitasData(FALLBACK_FASILITAS);
        }
      } catch (e) {
        console.error("Gagal memuat fasilitas:", e);
        setFasilitasData(FALLBACK_FASILITAS);
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
            Tentang Masjid Al-Kahfi
          </h2>
          <p className="text-gold-300 mt-2 font-medium">
            Sejarah, Visi, Misi, Kepengurusan & Fasilitas Lengkap
          </p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
        {/* Struktur Kepengurusan */}
        <div className="space-y-8">
          <h3 className="font-serif text-2xl md:text-3xl font-bold text-emerald-950 text-center">
            Pengurus DKM Al-Kahfi
          </h3>
          <p className="text-center text-sm text-gray-500 -mt-6 mb-8">
            Masa Khidmat: 2024 - 2028
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pengurusData.map((item, index) => (
              <div
                key={item.id || index}
                className="bg-white rounded-xl p-6 text-center shadow-sm border border-gold-100 hover:shadow-md transition"
              >
                <div className="w-20 h-20 relative mx-auto mb-4 rounded-full overflow-hidden border-2 border-gold-500 bg-gray-50">
                  <Image
                    src={item.img}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h4 className="font-bold text-emerald-950 text-base">
                  {item.name}
                </h4>
                <p className="text-xs text-gold-600 font-semibold uppercase mt-1">
                  {item.role}
                </p>
                <p className="text-[10px] text-gray-400 mt-2 bg-gray-50 px-2 py-1 rounded inline-block">
                  {item.period}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-emerald-950 text-white rounded-2xl p-8 relative overflow-hidden border-b-4 border-gold-500 shadow-lg">
            <div className="absolute top-0 right-0 opacity-10 islamic-pattern w-32 h-32"></div>
            <h3 className="font-serif text-xl font-bold text-gold-300 mb-4 flex items-center gap-2">
              <Eye /> Visi Kami
            </h3>
            <p className="text-emerald-50 leading-relaxed font-light text-sm md:text-base">
              &quot;{visiMisi.visi}&quot;
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-gold-200 shadow-md">
            <h3 className="font-serif text-xl font-bold text-emerald-950 mb-4 flex items-center gap-2">
              <Target className="text-gold-500" /> Misi Kami
            </h3>
            <ol className="space-y-3 text-sm text-gray-600">
              {visiMisi.misi
                .split("\n")
                .filter((line) => line.trim() !== "")
                .map((line, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-gold-500 font-bold">
                      {index + 1}.
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
            </ol>
          </div>
        </div>

        {/* Fasilitas Masjid */}
        <div className="space-y-8">
          <div className="text-center">
            <span className="text-xs font-bold text-gold-600 uppercase tracking-widest">
              Sarana Prasarana
            </span>
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-emerald-950 mt-2">
              Fasilitas Masjid Al-Kahfi
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {fasilitasData.map((item, index) => {
              const IconComponent = iconMap[item.icon] || iconMap.User;
              return (
                <div
                  key={item.id || index}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gold-100 flex gap-4"
                >
                  <div className="text-gold-500 mt-1">
                    {IconComponent ? <IconComponent size={24} /> : null}
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950 text-base">
                      {item.title}
                    </h4>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
