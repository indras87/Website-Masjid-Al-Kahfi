"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Target, Clock, Users } from "lucide-react";
import Link from "next/link";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

type Campaign = {
  id: number;
  judul: string;
  slug: string;
  kategori: string;
  deskripsiSingkat: string;
  img: string;
  targetNominal: number;
  status: string;
  featured: boolean;
  tanggalBerakhir: string | null;
  progres: {
    terkumpul: number;
    jumlahDonatur: number;
    persentase: number;
  };
};

const KATEGORI = [
  { value: "", label: "Semua" },
  { value: "zakat", label: "Zakat" },
  { value: "sedekah", label: "Sedekah" },
  { value: "wakaf", label: "Wakaf" },
  { value: "bencana_alam", label: "Bencana Alam" },
  { value: "pembangunan", label: "Pembangunan" },
  { value: "yatim_dhuafa", label: "Yatim & Dhuafa" },
  { value: "kemanusiaan", label: "Kemanusiaan" },
  { value: "pendidikan", label: "Pendidikan" },
  { value: "operasional", label: "Operasional" },
  { value: "lainnya", label: "Lainnya" },
];

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterKategori, setFilterKategori] = useState("");

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const url = filterKategori ? `/api/campaign?kategori=${filterKategori}` : "/api/campaign";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data);
        }
      } catch (e) {
        console.error("Gagal memuat campaign:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, [filterKategori]);

  const hitungSisaHari = (tanggalBerakhir: string | null) => {
    if (!tanggalBerakhir) return null;
    const sisa = Math.ceil((new Date(tanggalBerakhir).getTime() - Date.now()) / 86_400_000);
    return sisa;
  };

  const BadgeKategori = ({ kategori }: { kategori: string }) => {
    const colorMap: Record<string, string> = {
      zakat: "bg-purple-100 text-purple-700",
      sedekah: "bg-emerald-100 text-emerald-700",
      wakaf: "bg-blue-100 text-blue-700",
      bencana_alam: "bg-red-100 text-red-700",
      pembangunan: "bg-amber-100 text-amber-700",
      yatim_dhuafa: "bg-pink-100 text-pink-700",
      kemanusiaan: "bg-rose-100 text-rose-700",
      pendidikan: "bg-cyan-100 text-cyan-700",
      operasional: "bg-gray-100 text-gray-700",
      lainnya: "bg-stone-100 text-stone-700",
    };
    const color = colorMap[kategori] || "bg-gray-100 text-gray-700";
    const label = KATEGORI.find((k) => k.value === kategori)?.label || kategori;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${color}`}>
        {label}
      </span>
    );
  };

  const CampaignCard = ({ campaign }: { campaign: Campaign }) => {
    const sisaHari = hitungSisaHari(campaign.tanggalBerakhir);
    const isBerakhir = sisaHari !== null && sisaHari < 0;
    const urgent = sisaHari !== null && sisaHari <= 7 && sisaHari >= 0;

    return (
      <Link href={`/campaign/${campaign.slug}`}>
        <div className="bg-white rounded-2xl border border-gold-100 shadow-md hover:shadow-lg transition overflow-hidden h-full flex flex-col">
          {/* Foto Sampul + Badge */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={campaign.img}
              alt={campaign.judul}
              className="w-full h-full object-cover"
            />
            {campaign.featured && (
              <div className="absolute top-3 right-3 bg-gold-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Unggulan
              </div>
            )}
            {campaign.progres.persentase >= 100 && (
              <div className="absolute bottom-3 right-3 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                🏆 Tercapai
              </div>
            )}
            <div className="absolute top-3 left-3">
              <BadgeKategori kategori={campaign.kategori} />
            </div>
          </div>

          {/* Konten */}
          <div className="p-5 flex-1 flex flex-col">
            <h3 className="font-serif text-lg font-bold text-emerald-950 mb-2 line-clamp-2">
              {campaign.judul}
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
              {campaign.deskripsiSingkat}
            </p>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, campaign.progres.persentase))}%` }}
                ></div>
              </div>
            </div>

            {/* Statistik */}
            <div className="flex justify-between items-baseline mb-4 text-sm">
              <span className="text-emerald-700 font-semibold">
                {rupiah(campaign.progres.terkumpul)}
              </span>
              <span className="text-gray-400">
                / {rupiah(campaign.targetNominal)}
              </span>
            </div>

            {/* Meta */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {campaign.progres.jumlahDonatur} donatur
              </span>
              <span className="flex items-center gap-1">
                {sisaHari === null ? (
                  "Tanpa batas waktu"
                ) : isBerakhir ? (
                  <span className="text-gray-400 font-medium">⏱ Berakhir</span>
                ) : (
                  <span className={urgent ? "text-red-600 font-semibold" : ""}>
                    ⏱ {sisaHari} hari lagi
                  </span>
                )}
              </span>
            </div>

            {/* Tombol */}
            <button
              disabled={isBerakhir}
              className={`w-full py-2.5 rounded-lg font-bold text-sm transition ${
                isBerakhir
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700"
              }`}
            >
              {isBerakhir ? "Campaign Berakhir" : "Donasi Sekarang"}
            </button>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="pb-16">
      {/* Hero */}
      <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
        <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h2 className="font-serif text-4xl font-bold">
            Galang Dana & Campaign
          </h2>
          <p className="text-gold-300 mt-3 font-medium max-w-2xl mx-auto">
            Bismillah. Salurkan donasi terbaik Bapak/Ibu untuk program & kebutuhan pilihan Masjid Al-Kahfi. Setiap rupiah yang disalurkan melalui campaign ini insya Allah menjadi amal jariyah yang mengalir tanpa henti.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filter Kategori */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {KATEGORI.map((k) => (
              <button
                key={k.value}
                onClick={() => setFilterKategori(k.value)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  filterKategori === k.value
                    ? "bg-emerald-900 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-emerald-300"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        {/* Daftar Campaign */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-4">Memuat campaign...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-serif text-xl font-bold text-gray-700 mb-2">
              Belum Ada Campaign
            </h3>
            <p className="text-gray-500">
              {filterKategori
                ? "Tidak ada campaign di kategori ini saat ini."
                : "Belum ada campaign yang aktif. Silakan cek lagi nanti."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
