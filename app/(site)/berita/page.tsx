"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { HeartPulse, QrCode, Landmark } from "lucide-react";
import { useRouter } from "next/navigation";

const FALLBACK_GALERI = [
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=800",
];

const FALLBACK_BERITA = [
  {
    img: FALLBACK_GALERI[0],
    tag: "Sosial",
    title:
      "Penyaluran Sembako Rutin Bulanan Bagi Janda dan Lansia Dhuafa Cikoneng",
    desc: "Berkat kerjasama para muhsinin dan Baitul Mal Al-Kahfi, pekan lalu dKM telah berhasil mendistribusikan sebanyak 45 paket kebutuhan pokok untuk mengurangi beban perekonomian dhuafa di RT 03 dan RT 04 Cikoneng. Agenda rutin bulanan ini diharapkan mampu meringankan belanja sembako bulanan mereka di tengah inflasi harga sembako daerah Kabupaten Bandung. Pembagian berjalan dengan santun berkat bantuan para pemuda karang taruna dan panitia ikhwan DKM Al-Kahfi.",
    content: "<p>Berkat kerjasama para muhsinin dan Baitul Mal Al-Kahfi, pekan lalu dKM telah berhasil mendistribusikan sebanyak 45 paket kebutuhan pokok untuk mengurangi beban perekonomian dhuafa di RT 03 dan RT 04 Cikoneng.</p><p>Agenda rutin bulanan ini diharapkan mampu meringankan belanja sembako bulanan mereka di tengah inflasi harga sembako daerah Kabupaten Bandung. Pembagian berjalan dengan santun berkat bantuan para pemuda karang taruna dan panitia ikhwan DKM Al-Kahfi.</p>",
    date: "15 Juni 2026",
    color: "bg-emerald-50 text-emerald-800",
  },
  {
    img: FALLBACK_GALERI[1],
    tag: "Kebersihan",
    title:
      "Sinergi Pemuda Cikoneng dalam Agenda Bersih-bersih Masjid dan Saluran",
    desc: "DKM Al-Kahfi menggerakkan kerja bakti bersama puluhan pemuda lingkungan. Pembersihan difokuskan ke karpet utama ruang shalat serta parit luar guna mengantisipasi banjir genangan musim penghujan. Selain melatih kebersamaan antar warga dan pemuda, kebersihan fasilitas umum tempat beribadah diyakini membawa berkah ukhuwah serta menciptakan kenyamanan ekstra bagi para jamaah yang sholat.",
    content: "<p>DKM Al-Kahfi menggerakkan kerja bakti bersama puluhan pemuda lingkungan. Pembersihan difokuskan ke karpet utama ruang shalat serta parit luar guna mengantisipasi banjir genangan musim penghujan.</p><p>Selain melatih kebersamaan antar warga dan pemuda, kebersihan fasilitas umum tempat beribadah diyakini membawa berkah ukhuwah serta menciptakan kenyamanan ekstra bagi para jamaah yang sholat.</p>",
    date: "08 Juni 2026",
    color: "bg-gold-50 text-gold-800",
  },
  {
    img: FALLBACK_GALERI[2],
    tag: "Tarbiyah",
    title: "Kajian Akbar Keluarga Sakinah Sambut Tahun Baru Hijriyah",
    desc: "Kajian spesial yang diselenggarakan DKM dihadiri oleh ratusan ibu-ibu dan bapak-bapak Cikoneng. Menghadirkan narasumber utama Dr. KH. Mulyana membahas cara membangun keharmonisan rumah tangga di tengah tantangan teknologi modern yang melingkupi keseharian anak-anak zaman sekarang.",
    content: "<p>Kajian spesial yang diselenggarakan DKM dihadiri oleh ratusan ibu-ibu dan bapak-bapak Cikoneng. Menghadirkan narasumber utama Dr. KH. Mulyana membahas cara membangun keharmonisan rumah tangga di tengah tantangan teknologi modern yang melingkupi keseharian anak-anak zaman sekarang.</p>",
    date: "01 Juni 2026",
    color: "bg-emerald-50 text-emerald-800",
  },
];

const FALLBACK_DONASI = {
  namaRekening: "Bank Syariah Indonesia (BSI)",
  nomorRekening: "7123-4567-89",
  atasNamaRekening: "DKM AL-KAHFI CIKONENG",
  qrisImage: "https://placehold.co/400x400/ffffff/064e3b?text=QRIS+AL-KAHFI",
};

/** Halaman daftar berita masjid yang menampilkan kartu artikel dari API atau data fallback. */
export default function BeritaPage() {
  const [newsData, setNewsData] = useState<any[]>([]);
  const [donationData, setDonationData] = useState(FALLBACK_DONASI);
  const router = useRouter();

  useEffect(() => {
    /** Memuat daftar berita dari API; jatuh ke FALLBACK_BERITA bila gagal. */
    const fetchData = async () => {
      try {
        const beritaRes = await fetch("/api/berita");
        if (beritaRes.ok) {
          const beritaJson = await beritaRes.json();
          const finalBerita = beritaJson.map((b: any) => ({
            ...b,
            color:
              b.tag === "Sosial"
                ? "bg-emerald-50 text-emerald-800"
                : b.tag === "Kebersihan"
                  ? "bg-gold-50 text-gold-800"
                  : "bg-emerald-50 text-emerald-800",
          }));
          setNewsData(finalBerita);
        } else {
          setNewsData(FALLBACK_BERITA);
        }
      } catch (e) {
        console.error("Gagal memuat berita:", e);
        setNewsData(FALLBACK_BERITA);
      }
    };

    fetchData();
  }, []);

  /** Mengekstrak teks polos dari string HTML untuk pratinjau cuplikan berita. */
  const getPreviewText = (html: string) => {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  return (
    <div className="pb-16">
      <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
        <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h2 className="font-serif text-4xl font-bold">
            Kabar Al-Kahfi
          </h2>
          <p className="text-gold-300 mt-2 font-medium">
            Berita Acara, Artikel Islami, dan Dokumentasi Sosial
          </p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {newsData.map((news, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl overflow-hidden border border-gold-100 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition"
              onClick={() => router.push(`/berita/${news.slug || news.id}`)}
            >
              <div>
                <div className="relative w-full h-48">
                  <Image
                    src={news.img}
                    alt={news.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <span
                    className={`text-[10px] ${news.color} font-bold px-2 py-0.5 rounded`}
                  >
                    {news.tag}
                  </span>
                  <h4 className="font-serif text-lg font-bold text-emerald-950 leading-snug">
                    {news.title}
                  </h4>
                  <p className="text-gray-600 text-xs leading-relaxed line-clamp-3">
                    {getPreviewText(news.content || news.desc)}
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0 border-t border-gold-50/50 flex justify-between items-center text-xs text-gray-500 mt-4">
                <span>{news.date}</span>
                <span className="text-emerald-900 font-bold">
                  Baca selengkapnya
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}