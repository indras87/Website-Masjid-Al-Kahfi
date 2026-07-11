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

type Pengurus = {
  id: number;
  nama: string;
  foto: string;
  tingkat: "pembina" | "penasehat" | "pimpinan" | "idarah" | "imarah" | "riayah";
  subBidang: string | null;
  jabatan: string | null;
  urutan: number;
  periode: string;
};

const FALLBACK_PENGURUS: Pengurus[] = [
  { id: 1, nama: "Budi Ramdani", foto: "https://placehold.co/200x200/064e3b/fbbf24?text=BR", tingkat: "pimpinan", subBidang: null, jabatan: "Ketua", urutan: 1, periode: "2024-2028" },
  { id: 2, nama: "Idham Faisal", foto: "https://placehold.co/200x200/064e3b/fbbf24?text=IF", tingkat: "pimpinan", subBidang: null, jabatan: "Wakil Ketua", urutan: 2, periode: "2024-2028" },
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

function groupPengurus(list: Pengurus[]) {
  const byTingkat = (t: Pengurus["tingkat"]) =>
    list.filter((p) => p.tingkat === t).sort((a, b) => a.urutan - b.urutan);

  const topSection = {
    pembina: byTingkat("pembina"),
    penasehat: byTingkat("penasehat"),
    pimpinan: byTingkat("pimpinan"),
  };

  const buildBidang = (t: "idarah" | "imarah" | "riayah") => {
    const items = byTingkat(t);
    const koordinator = items.find((p) => p.jabatan === "Koordinator Bidang") || null;
    const rest = items.filter((p) => p.jabatan !== "Koordinator Bidang");
    const subMap = new Map<string, Pengurus[]>();
    for (const p of rest) {
      const key = p.subBidang || "";
      if (!subMap.has(key)) subMap.set(key, []);
      subMap.get(key)!.push(p);
    }
    const subGroups = Array.from(subMap.entries()).map(([subBidang, members]) => ({
      subBidang,
      members,
    }));
    return { koordinator, subGroups, members: rest };
  };

  return {
    topSection,
    idarah: buildBidang("idarah"),
    imarah: buildBidang("imarah"),
    riayah: buildBidang("riayah"),
  };
}

function PengurusCard({ p, priority = false }: { p: Pengurus; priority?: boolean }) {
  const [imgError, setImgError] = useState(false);
  const initials = p.nama
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const label = p.jabatan || p.subBidang || "Anggota";

  return (
    <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gold-100 hover:shadow-md transition">
      <div className="w-20 h-20 relative mx-auto mb-3 rounded-full overflow-hidden border-2 border-gold-500 bg-gray-50">
        {imgError ? (
          <div className="w-full h-full flex items-center justify-center bg-emerald-900 text-gold-300 font-bold text-xl">
            {initials}
          </div>
        ) : (
          <Image
            src={p.foto}
            alt={p.nama}
            fill
            sizes="80px"
            priority={priority}
            className="object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <h4 className="font-bold text-emerald-950 text-sm leading-tight">{p.nama}</h4>
      <p className="text-[10px] text-gold-600 font-semibold uppercase mt-1">{label}</p>
    </div>
  );
}

export default function TentangPage() {
  const [pengurusData, setPengurusData] = useState<Pengurus[]>([]);
  const [activeBidang, setActiveBidang] = useState<"idarah" | "imarah" | "riayah">("imarah");
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
          <p className="text-center text-sm text-gray-500 -mt-6 mb-4">
            Masa Khidmat: 2024 - 2028
          </p>

          {(() => {
            const g = groupPengurus(pengurusData);
            return (
              <div className="space-y-10">
                {/* TOP SECTION: selalu tampil */}
                {g.topSection.pembina.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-serif text-lg font-bold text-emerald-900 border-b border-gold-200 pb-2">
                      Pembina
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {g.topSection.pembina.map((p) => (
                        <PengurusCard key={`pembina-${p.id}`} p={p} priority />
                      ))}
                    </div>
                  </div>
                )}

                {g.topSection.penasehat.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-serif text-lg font-bold text-emerald-900 border-b border-gold-200 pb-2">
                      Penasehat
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {g.topSection.penasehat.map((p) => (
                        <PengurusCard key={`penasehat-${p.id}`} p={p} priority />
                      ))}
                    </div>
                  </div>
                )}

                {g.topSection.pimpinan.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-serif text-lg font-bold text-emerald-900 border-b border-gold-200 pb-2">
                      Pimpinan Inti
                    </h4>
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
                        t === "idarah" ? "Bidang Idarah" : t === "imarah" ? "Bidang Imarah" : "Bidang Ri'ayah";
                      return (
                        <button
                          key={t}
                          onClick={() => setActiveBidang(t)}
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
                              <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-gold-400 w-full max-w-xs">
                                <div className="w-16 h-16 relative mx-auto mb-3 rounded-full overflow-hidden border-2 border-gold-500 bg-gray-50">
                                  <Image
                                    src={bidang.koordinator.foto}
                                    alt={bidang.koordinator.nama}
                                    fill
                                    sizes="64px"
                                    className="object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <p className="text-[10px] text-gold-600 font-bold uppercase">Koordinator Bidang</p>
                                <h4 className="font-bold text-emerald-950 text-sm">
                                  {bidang.koordinator.nama}
                                </h4>
                              </div>
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
                                <div key={`${activeBidang}-${sg.subBidang}`} className="space-y-3">
                                  <h5 className="font-semibold text-emerald-800 text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500"></span>
                                    {sg.subBidang}
                                  </h5>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {sg.members.map((p) => (
                                      <PengurusCard key={`${activeBidang}-${p.id}`} p={p} />
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
          })()}
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
