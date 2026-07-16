"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { usePrayerTimes } from "@/hooks/use-prayer-times";
import { computeNextPrayer, computeCurrentPrayer } from "@/lib/prayer-times";
import {
  HeartPulse,
  Menu,
  X,
  Clock,
  HandCoins,
  ArrowRight,
  ChevronRight,
  ZoomIn,
  Eye,
  Target,
  User,
  Droplet,
  Ambulance,
  BookOpen,
  Car,
  Wifi,
  Briefcase,
  ShieldCheck,
  Receipt,
  Presentation,
  CircleUser,
  Mic,
  GraduationCap,
  Gift,
  AlertCircle,
  CalendarCheck,
  Landmark,
  QrCode,
  MapPin,
  PhoneCall,
  Mail,
  Info,
  Youtube,
  Instagram,
  MessageCircle,
  Settings,
  CheckCircle2,
  History as HistoryIcon,
} from "lucide-react";

const FALLBACK_GALERI = [
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1590075865003-e48277faa558?auto=format&fit=crop&q=80&w=800",
];

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
    featured: false,
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
    featured: false,
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
    featured: false,
  },
  {
    cat: "hari-besar",
    tag: "Hari Besar (PHBI)",
    time: "Tentative (Hari Raya)",
    title: "Penyelenggaraan Qurban Al-Kahfi",
    desc: "Program pengumpulan, penyembelihan, dan pendistribusian daging hewan kurban secara modern, steril, tertib administrasi, dan dijamin adil bagi dhuafa Cikoneng.",
    ust: "Panitia Qurban Bersama",
    note: "Halaman Samping",
    Icon: Gift,
    color: "bg-emerald-900 text-gold-300",
    img: "",
    featured: false,
  },
];

const FALLBACK_BERITA = [
  {
    img: FALLBACK_GALERI[0],
    tag: "Sosial",
    title:
      "Penyaluran Sembako Rutin Bulanan Bagi Janda dan Lansia Dhuafa Cikoneng",
    desc: "Berkat kerjasama para muhsinin dan Baitul Mal Al-Kahfi, pekan lalu dKM telah berhasil mendistribusikan sebanyak 45 paket kebutuhan pokok untuk mengurangi beban perekonomian dhuafa di RT 03 dan RT 04 Cikoneng. Agenda rutin bulanan ini diharapkan mampu meringankan belanja sembako bulanan mereka di tengah inflasi harga sembako daerah Kabupaten Bandung. Pembagian berjalan dengan santun berkat bantuan para pemuda karang taruna dan panitia ikhwan DKM Al-Kahfi.",
    date: "15 Juni 2026",
    color: "bg-emerald-50 text-emerald-800",
  },
  {
    img: FALLBACK_GALERI[1],
    tag: "Kebersihan",
    title:
      "Sinergi Pemuda Cikoneng dalam Agenda Bersih-bersih Masjid dan Saluran",
    desc: "DKM Al-Kahfi menggerakkan kerja bakti bersama puluhan pemuda lingkungan. Pembersihan difokuskan ke karpet utama ruang shalat serta parit luar guna mengantisipasi banjir genangan musim penghujan. Selain melatih kebersamaan antar warga dan pemuda, kebersihan fasilitas umum tempat beribadah diyakini membawa berkah ukhuwah serta menciptakan kenyamanan ekstra bagi para jamaah yang sholat.",
    date: "08 Juni 2026",
    color: "bg-gold-50 text-gold-800",
  },
  {
    img: FALLBACK_GALERI[2],
    tag: "Tarbiyah",
    title: "Kajian Akbar Keluarga Sakinah Sambut Tahun Baru Hijriyah",
    desc: "Kajian spesial yang diselenggarakan DKM dihadiri oleh ratusan ibu-ibu dan bapak-bapak Cikoneng. Menghadirkan narasumber utama Dr. KH. Mulyana membahas cara membangun keharmonisan rumah tangga di tengah tantangan teknologi modern yang melingkupi keseharian anak-anak zaman sekarang.",
    date: "01 Juni 2026",
    color: "bg-emerald-50 text-emerald-800",
  },
];

const FALLBACK_PENGURUS = [
  {
    name: "H. Endang Wijaya, Lc.",
    role: "Ketua Umum DKM",
    period: "Periode 2025-2031",
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    name: "H. Ridwan Kamil, S.E.",
    role: "Wakil Ketua",
    period: "Periode 2025-2031",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    name: "Bpk. Ahmad Fauzi",
    role: "Bendahara Ziswaf",
    period: "Periode 2025-2031",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    name: "Ust. Syahrul Ramadhan",
    role: "Ketua Bidang Dakwah",
    period: "Periode 2025-2031",
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

const FALLBACK_KONTAK = {
  alamat: "Jl. Cikoneng No.15, Bojongsoang, Kab. Bandung 40288",
  hotline: "+62 812-3456-7890",
  email: "alkahfi.cikoneng@gmail.com",
  jamOperasional: "Setiap Hari: 08:00 - 20:00 WIB (Bada Isya)",
  googleMapsUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15840.403487310565!2d107.65886676342774!3d-6.985587799999991!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68c22755e378c3%3A0xe5a363717dfbbf5e!2sCikoneng%2C%20Bojongsoang%2C%20Bandung%20Regency%2C%20West%20Java!5e0!3m2!1sen!2sid!4v1700000000000",
};

const FALLBACK_DONASI = {
  namaRekening: "Bank Syariah Indonesia (BSI)",
  nomorRekening: "7123-4567-89",
  atasNamaRekening: "DKM AL-KAHFI CIKONENG",
  qrisImage: "https://placehold.co/400x400/ffffff/064e3b?text=QRIS+AL-KAHFI",
};

const iconMap: Record<string, any> = {
  HeartPulse,
  Menu,
  X,
  Clock,
  HandCoins,
  ArrowRight,
  ChevronRight,
  ZoomIn,
  Eye,
  Target,
  User,
  Droplet,
  Ambulance,
  BookOpen,
  Car,
  Wifi,
  Briefcase,
  ShieldCheck,
  Receipt,
  Presentation,
  CircleUser,
  Mic,
  GraduationCap,
  Gift,
  AlertCircle,
  CalendarCheck,
  Landmark,
  QrCode,
  MapPin,
  PhoneCall,
  Mail,
  Info,
  Youtube,
  Instagram,
  MessageCircle,
  Settings,
  CheckCircle2,
  HistoryIcon,
};

/** Halaman beranda publik yang menampilkan hero, jadwal sholat, program, dan galeri masjid. */
export default function BerandaPage() {
  const { times, loading } = usePrayerTimes();
  const [activitiesData, setActivitiesData] = useState<any[]>([]);
  const [newsData, setNewsData] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [countdownText, setCountdownText] = useState("Menghitung mundur...");
  const [iqomahTime, setIqomahTime] = useState("00:00");
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    /** Memuat data beranda (berita, kegiatan, galeri) dari API dengan fallback bila gagal. */
    const fetchLandingData = async () => {
      try {
        setDbLoading(true);

        const beritaRes = await fetch("/api/berita");
        let finalBerita = [];
        if (beritaRes.ok) {
          const beritaJson = await beritaRes.json();
          finalBerita = beritaJson.map((b: any) => ({
            ...b,
            color:
              b.tag === "Sosial"
                ? "bg-emerald-50 text-emerald-800"
                : b.tag === "Kebersihan"
                  ? "bg-gold-50 text-gold-800"
                  : "bg-emerald-50 text-emerald-800",
          }));
        } else {
          finalBerita = FALLBACK_BERITA;
        }
        setNewsData(finalBerita);

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
              featured: !!k.featured,
            };
          });
          setActivitiesData(mappedKegiatan);
        } else {
          setActivitiesData(FALLBACK_KEGIATAN);
        }

        const galeriRes = await fetch("/api/galeri");
        if (galeriRes.ok) {
          const galeriJson = await galeriRes.json();
          setGalleryImages(galeriJson.map((g: any) => g.img));
        } else {
          setGalleryImages(FALLBACK_GALERI);
        }
      } catch (error) {
        console.error("Error fetching landing page data:", error);
        setNewsData(FALLBACK_BERITA);
        setActivitiesData(FALLBACK_KEGIATAN);
        setGalleryImages(FALLBACK_GALERI);
      } finally {
        setDbLoading(false);
      }
    };

    fetchLandingData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const next = computeNextPrayer(times, now);
      const currentMinTotal = now.getHours() * 60 + now.getMinutes();
      const diff = next.minutes - currentMinTotal;
      const hLeft = Math.floor(diff / 60);
      const mLeft = diff % 60;
      const tStr = hLeft > 0 ? `${hLeft} jam ${mLeft} menit lagi` : `${mLeft} menit lagi`;
      const exact = times[next.key];

      setCountdownText(loading
        ? "Memuat jadwal sholat..."
        : `Sholat Berikutnya: ${next.name} (${exact}) — ${tStr}`);

      let minsRem = 9 - (mLeft % 10);
      let secsRem = 59 - now.getSeconds();
      if (minsRem < 0) minsRem = 0;
      setIqomahTime(
        `${String(minsRem).padStart(2, "0")}:${String(secsRem).padStart(2, "0")}`,
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [times, loading]);

  /** Menyalin teks (mis. nomor rekening) ke clipboard pengguna. */
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const programKegiatan = [
    ...activitiesData.filter((a) => a.featured),
    ...activitiesData.filter((a) => !a.featured),
  ].slice(0, 3);

  const current = loading ? null : computeCurrentPrayer(times, new Date());

  return (
    <div className="pb-16">
      {/* Hero */}
      <div className="relative min-h-[550px] lg:min-h-[650px] flex items-center text-white overflow-hidden border-b-4 border-gold-500">
        <Image
          src="https://images.unsplash.com/photo-1759167633056-75c9c63ebc22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920&q=80"
          alt="Hero"
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
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
            Selamat Datang di <br />
            <span className="text-gold-400">
              Masjid Al-Kahfi Cikoneng
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-emerald-50 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            Pusat Pembinaan Keimanan, Pemberdayaan Sosial Ekonomi Umat,
            dan Pendidikan Karakter Islami di Wilayah Cikoneng,
            Kabupaten Bandung.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
            <a
              href="/jadwal-sholat"
              className="bg-gold-500 hover:bg-gold-600 text-emerald-950 font-bold px-8 py-3.5 rounded-lg shadow-lg transition flex items-center justify-center gap-2"
            >
              <Clock size={18} /> Jadwal Sholat Hari Ini
            </a>
            <a
              href="/donasi"
              className="bg-transparent border-2 border-gold-500 text-gold-300 hover:bg-gold-500 hover:text-emerald-950 font-semibold px-8 py-3.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              <HandCoins size={18} /> Infaq & Sedekah
            </a>
          </div>
        </div>
      </div>

      {/* Prayer Times Widget */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-30">
        <div className="bg-white rounded-2xl shadow-xl border-b-4 border-gold-500 overflow-hidden">
          <div className="bg-emerald-950 p-4 flex flex-col sm:flex-row justify-between items-center text-white gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-gold-300">
                Jadwal Sholat (Cikoneng & Sekitarnya)
              </span>
            </div>
            <span className="text-xs font-mono bg-emerald-900 px-3 py-1 rounded text-gold-300">
              {countdownText}
            </span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-gray-100 text-center">
            {Object.entries(times).map(([name, time]) => (
              <div
                key={name}
                className={`p-4 ${name === current?.key ? "bg-gold-50/40" : ""}`}
              >
                <p
                  className={`text-xs font-semibold uppercase ${name === current?.key ? "text-emerald-900 font-bold" : "text-gray-400"}`}
                >
                  {name}
                </p>
                <h4
                  className={`text-lg sm:text-2xl font-bold mt-1 ${name === current?.key ? "text-emerald-950" : "text-emerald-900"}`}
                >
                  {loading ? "--:--" : time}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Program Overview */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-gold-600 uppercase tracking-widest bg-gold-50 px-3 py-1 rounded-full">
            Program Masjid
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-emerald-950 mt-3">
            Kegiatan Utama & Kemaslahatan
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {programKegiatan.map((act, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gold-100 shadow-md hover:shadow-lg transition overflow-hidden flex flex-col"
            >
              {act.img ? (
                <div className="relative w-full h-40">
                  <Image
                    src={act.img}
                    alt={act.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className={`relative w-full h-40 flex items-center justify-center ${act.color}`}>
                  <act.Icon size={48} className="opacity-25" />
                </div>
              )}
              <div className="p-6 space-y-4 flex-1 flex flex-col">
                <h4 className="font-serif text-lg font-bold text-emerald-950">
                  {act.title}
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                  {act.desc}
                </p>
                <a
                  href="/kegiatan"
                  className="text-xs text-emerald-900 font-bold hover:text-gold-600 transition flex items-center gap-1 mt-auto"
                >
                  Lihat Detail <ChevronRight size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Banner Ajakan Donasi */}
      <div className="bg-emerald-950 text-white relative overflow-hidden py-16">
        <div className="absolute inset-0 opacity-10 islamic-pattern"></div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-6">
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
            Investasi Akhirat Terbaik, Alirkan Pahala Jariyah Anda
          </h3>
          <p className="text-emerald-100 font-light text-sm sm:text-base max-w-2xl mx-auto">
            Salurkan infaq, shodaqoh, dan zakat Anda untuk mendukung
            penuh operasional dawah, pendidikan santri TPA, dan
            peningkatan sarana ibadah di Masjid Al-Kahfi Cikoneng.
          </p>
          <div className="pt-2">
            <a
              href="/donasi"
              className="bg-gold-500 hover:bg-gold-600 text-emerald-950 font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition inline-flex items-center gap-2"
            >
              <HeartPulse size={16} /> Mulai Berdonasi Sekarang
            </a>
          </div>
        </div>
      </div>

      {/* Preview Galeri Foto */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row justify-between items-baseline mb-10 gap-2">
          <div>
            <span className="text-xs font-bold text-gold-600 uppercase tracking-widest">
              Dokumentasi
            </span>
            <h2 className="font-serif text-3xl font-bold text-emerald-950 mt-1">
              Galeri Foto Masjid
            </h2>
          </div>
          <a
            href="/galeri"
            className="text-emerald-900 font-bold text-sm hover:text-gold-600 transition flex items-center gap-1"
          >
            Lihat Seluruh Foto <ArrowRight size={14} />
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {galleryImages.slice(0, 4).map((img, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-xl cursor-pointer h-40 sm:h-48"
            >
              <Image
                src={img}
                alt={`Preview Galeri ${idx}`}
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
      </div>
    </div>
  );
}
