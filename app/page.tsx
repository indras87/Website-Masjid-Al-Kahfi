'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  HeartPulse, Menu, X, Clock, HandCoins, ArrowRight, ChevronRight, ZoomIn,
  Eye, Target, User, Droplet, Ambulance, BookOpen, Car, Wifi,
  Briefcase, ShieldCheck, Receipt, Presentation, CircleUser, Mic,
  GraduationCap, Gift, AlertCircle, CalendarCheck, Landmark, QrCode,
  MapPin, PhoneCall, Mail, Info, Youtube, Instagram, MessageCircle,
  Settings, CheckCircle2, History as HistoryIcon
} from 'lucide-react';

const galleryImages = [
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1590075865003-e48277faa558?auto=format&fit=crop&q=80&w=800"
];

const activitiesData = [
  { cat: 'harian', tag: 'Harian / Rutin', time: 'Setiap Hari (Bada Subuh)', title: 'Tahsin & Bimbingan Mengaji Quran Dewasa', desc: 'Program pengentasan buta aksara Quran yang diorientasikan bagi bapak-bapak dan remaja pria di lingkungan Cikoneng. Dibimbing langsung secara privat & kelompok.', ust: 'Ust. Sulaeman Al-Hafidz', note: 'Gratis & Terbuka', Icon: CircleUser, color: 'bg-emerald-50 text-emerald-800' },
  { cat: 'sholat-jumat', tag: 'Sholat Jum\'at', time: 'Setiap Jum\'at (11:55 WIB)', title: 'Pelaksanaan Sholat Jum\'at Berjamaah', desc: 'Jadwal bergilir penceramah/Khotib berkompeten yang mengedukasi jamaah secara moderat, membangkitkan ketaqwaan, dan bersandar pada keaslian literatur dalil shahih.', ust: 'Khotib Bergilir (DKM Al-Kahfi)', note: 'Lantai Utama', Icon: Mic, color: 'bg-gold-100 text-gold-800' },
  { cat: 'harian', tag: 'Harian / Rutin', time: 'Senin & Kamis (Bada Ashar)', title: 'Taman Pendidikan Al-Qur\'an (TPA) Anak', desc: 'Wadah belajar anak usia dini hingga sekolah dasar di lingkungan Cikoneng guna mendalami adab harian, hafalan doa pendek, juz amma, dan cara penulisan huruf hijaiyah.', ust: 'Ustadzah Khadijah & Tim', note: 'Khusus Anak-anak', Icon: GraduationCap, color: 'bg-emerald-50 text-emerald-800' },
  { cat: 'hari-besar', tag: 'Hari Besar (PHBI)', time: 'Tentative (Hari Raya)', title: 'Penyelenggaraan Qurban Al-Kahfi', desc: 'Program pengumpulan, penyembelihan, dan pendistribusian daging hewan kurban secara modern, steril, tertib administrasi, dan dijamin adil bagi dhuafa Cikoneng.', ust: 'Panitia Qurban Bersama', note: 'Halaman Samping', Icon: Gift, color: 'bg-emerald-900 text-gold-300' }
];

const newsData = [
  { img: galleryImages[0], tag: 'Sosial', title: 'Penyaluran Sembako Rutin Bulanan Bagi Janda dan Lansia Dhuafa Cikoneng', desc: 'Berkat kerjasama para muhsinin dan Baitul Mal Al-Kahfi, pekan lalu dKM telah berhasil mendistribusikan sebanyak 45 paket kebutuhan pokok untuk mengurangi beban perekonomian dhuafa di RT 03 dan RT 04 Cikoneng. Agenda rutin bulanan ini diharapkan mampu meringankan belanja sembako bulanan mereka di tengah inflasi harga sembako daerah Kabupaten Bandung. Pembagian berjalan dengan santun berkat bantuan para pemuda karang taruna dan panitia ikhwan DKM Al-Kahfi.', date: '15 Juni 2026', color: 'bg-emerald-50 text-emerald-800' },
  { img: galleryImages[1], tag: 'Kebersihan', title: 'Sinergi Pemuda Cikoneng dalam Agenda Bersih-bersih Masjid dan Saluran', desc: 'DKM Al-Kahfi menggerakkan kerja bakti bersama puluhan pemuda lingkungan. Pembersihan difokuskan ke karpet utama ruang shalat serta parit luar guna mengantisipasi banjir genangan musim penghujan. Selain melatih kebersamaan antar warga dan pemuda, kebersihan fasilitas umum tempat beribadah diyakini membawa berkah ukhuwah serta menciptakan kenyamanan ekstra bagi para jamaah yang sholat.', date: '08 Juni 2026', color: 'bg-gold-50 text-gold-800' },
  { img: galleryImages[2], tag: 'Tarbiyah', title: 'Kajian Akbar Keluarga Sakinah Sambut Tahun Baru Hijriyah', desc: 'Kajian spesial yang diselenggarakan DKM dihadiri oleh ratusan ibu-ibu dan bapak-bapak Cikoneng. Menghadirkan narasumber utama Dr. KH. Mulyana membahas cara membangun keharmonisan rumah tangga di tengah tantangan teknologi modern yang melingkupi keseharian anak-anak zaman sekarang.', date: '01 Juni 2026', color: 'bg-emerald-50 text-emerald-800' }
];

const localPrayers = { subuh: "04:36", terbit: "05:54", dzuhur: "11:58", ashar: "15:18", maghrib: "17:58", isya: "19:12" };

export default function MasjidApp() {
  const [activeTab, setActiveTab] = useState('beranda');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('zamrud');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('Memuat Waktu...');
  const [countdownText, setCountdownText] = useState('Menghitung mundur...');
  const [iqomahTime, setIqomahTime] = useState('00:00');
  const [filter, setFilter] = useState('semua');
  const [selectedNews, setSelectedNews] = useState<any>(null);
  
  const [modal, setModal] = useState({ isOpen: false, title: '', desc: '' });
  const [lightbox, setLightbox] = useState({ isOpen: false, url: '' });
  const [toast, setToast] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    const savedTheme = localStorage.getItem('kahfi-theme') || 'zamrud';
    setTimeout(() => {
      setTheme(savedTheme);
    }, 0);
    document.documentElement.classList.remove('theme-zamrud', 'theme-syafii', 'theme-kasturi', 'theme-zaitun', 'theme-raudhah');
    document.documentElement.classList.add(`theme-${savedTheme}`);

    const timer = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      setCurrentTime(`${days[now.getDay()]}, ${hours}:${minutes}:${seconds}`);

      const currentMinTotal = (now.getHours() * 60) + now.getMinutes();
      const prayerMins = {
        'Subuh': (4 * 60) + 36,
        'Terbit': (5 * 60) + 54,
        'Dzuhur': (11 * 60) + 58,
        'Ashar': (15 * 60) + 18,
        'Maghrib': (17 * 60) + 58,
        'Isya': (19 * 60) + 12
      };

      let nxt = 'Subuh';
      let nxtMin = prayerMins['Subuh'] + (24 * 60);

      for (const [name, mins] of Object.entries(prayerMins)) {
        if (mins > currentMinTotal) {
          nxt = name;
          nxtMin = mins;
          break;
        }
      }

      const diff = nxtMin - currentMinTotal;
      const hLeft = Math.floor(diff / 60);
      const mLeft = diff % 60;
      
      let tStr = hLeft > 0 ? `${hLeft} jam ${mLeft} menit lagi` : `${mLeft} menit lagi`;
      const exact = localPrayers[nxt.toLowerCase() as keyof typeof localPrayers] || "00:00";
      
      setCountdownText(`Sholat Berikutnya: ${nxt} (${exact}) — ${tStr}`);

      let minsRem = 9 - (mLeft % 10);
      let secsRem = 59 - now.getSeconds();
      if (minsRem < 0) minsRem = 0;
      setIqomahTime(`${String(minsRem).padStart(2, '0')}:${String(secsRem).padStart(2, '0')}`);
      
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('kahfi-theme', newTheme);
    document.documentElement.classList.remove('theme-zamrud', 'theme-syafii', 'theme-kasturi', 'theme-zaitun', 'theme-raudhah');
    document.documentElement.classList.add(`theme-${newTheme}`);
    showToast(`Tema berhasil diubah!`);
    setIsThemeMenuOpen(false);
  };

  const showToast = (msg: string) => {
    setToast({ isOpen: true, message: msg });
    setTimeout(() => setToast({ isOpen: false, message: '' }), 3000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Nomor Rekening berhasil disalin!");
  };

  const handleNav = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'tentang', label: 'Tentang' },
    { id: 'jadwal-sholat', label: 'Jadwal Sholat' },
    { id: 'kegiatan', label: 'Kegiatan' },
    { id: 'berita', label: 'Berita' },
    { id: 'galeri', label: 'Galeri' },
    { id: 'kontak', label: 'Kontak' }
  ];

  return (
    <div className={`bg-[var(--bg-body)] text-gray-800 transition-colors duration-500 min-h-screen flex flex-col font-sans`}>
      
      {/* Top Banner */}
      <div className="bg-emerald-950 text-gold-100 py-2 px-4 text-xs font-medium border-b border-gold-500/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center overflow-hidden">
          <div className="flex items-center gap-2 flex-1">
            <span className="bg-gold-500 text-emerald-950 text-[10px] uppercase font-bold px-2 py-0.5 rounded whitespace-nowrap">Hadits Hari Ini</span>
            <div className="overflow-hidden w-full relative">
              <motion.div
                animate={{ x: ["100%", "-100%"] }}
                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                className="whitespace-nowrap text-xs"
              >
                &quot;Siapa yang membangun masjid karena Allah, maka Allah akan membangunkan baginya rumah di surga.&quot; (HR. Bukhari dan Muslim) — Selamat datang di Layanan Digital Masjid Al-Kahfi Cikoneng, Kabupaten Bandung.
              </motion.div>
            </div>
          </div>
          <div className="hidden sm:block font-mono text-gold-300 ml-4 whitespace-nowrap">
            {currentTime}
          </div>
        </div>
      </div>

      {/* Header Navigation */}
      <header className="bg-white/95 backdrop-blur-md shadow-md sticky top-0 z-40 border-b-2 border-gold-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <button onClick={() => handleNav('beranda')} className="flex items-center gap-4 group text-left">
              <div className="w-14 h-14 bg-emerald-900 border-2 border-gold-500 rounded-full flex items-center justify-center text-gold-300 font-serif text-2xl shadow-lg transition-transform duration-300 group-hover:scale-105">
                🕌
              </div>
              <div>
                <h1 className="font-serif font-bold text-xl md:text-2xl text-emerald-900 tracking-wide leading-tight">Masjid Al-Kahfi</h1>
                <p className="text-xs text-gold-600 font-semibold uppercase tracking-widest">Cikoneng • Kab. Bandung</p>
              </div>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map(link => (
                <button key={link.id} onClick={() => handleNav(link.id)} 
                  className={`px-3 py-2 rounded-md text-sm font-semibold transition duration-150 ${activeTab === link.id ? 'text-gold-500 border-b-2 border-gold-500' : 'text-gray-600 hover:text-gold-600'}`}>
                  {link.label}
                </button>
              ))}
              <button onClick={() => handleNav('donasi')} className="ml-4 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-bold text-sm px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:from-gold-600 hover:to-gold-700 transition transform hover:-translate-y-0.5 flex items-center gap-2">
                <HeartPulse size={16} /> Donasi & Infaq
              </button>
            </nav>

            {/* Mobile Nav Toggle */}
            <div className="lg:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-emerald-900 focus:outline-none p-2 rounded-md hover:bg-gold-50">
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="lg:hidden bg-white border-t border-gold-100 px-4 shadow-inner overflow-hidden">
              <div className="py-3 flex flex-col space-y-2">
                {navLinks.map(link => (
                  <button key={link.id} onClick={() => handleNav(link.id)} className={`block text-left px-4 py-2.5 rounded-md text-base font-semibold ${activeTab === link.id ? 'bg-gold-50 text-gold-600' : 'text-emerald-950 hover:bg-gold-50'}`}>
                    {link.label}
                  </button>
                ))}
                <button onClick={() => handleNav('donasi')} className="block w-full text-center bg-gold-500 text-white font-bold py-3 rounded-md shadow-md mt-2 flex justify-center items-center gap-2">
                  <HeartPulse size={16} /> Donasi & Infaq
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow islamic-pattern-light relative">
        <AnimatePresence mode="wait">
          
          {/* BERANDA */}
          {activeTab === 'beranda' && (
            <motion.section key="beranda" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="pb-16">
              
              {/* Hero */}
              <div className="relative min-h-[550px] lg:min-h-[650px] flex items-center text-white overflow-hidden border-b-4 border-gold-500">
                <Image src="https://images.unsplash.com/photo-1759167633056-75c9c63ebc22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920&q=80" alt="Hero" fill sizes="100vw" className="object-cover" referrerPolicy="no-referrer" priority />
                <div className="absolute inset-0 bg-emerald-950/80 mix-blend-multiply z-0"></div>
                <div className="absolute inset-0 opacity-10 islamic-pattern z-10"></div>
                <div className="relative z-20 max-w-7xl mx-auto px-4 py-20 flex flex-col items-center text-center">
                  <div className="w-16 h-1 bg-gold-500 mb-6"></div>
                  <p className="text-gold-300 font-serif italic text-lg sm:text-xl mb-3 tracking-widest">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                  <h2 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
                    Selamat Datang di <br/><span className="text-gold-400">Masjid Al-Kahfi Cikoneng</span>
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl text-emerald-50 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
                    Pusat Pembinaan Keimanan, Pemberdayaan Sosial Ekonomi Umat, dan Pendidikan Karakter Islami di Wilayah Cikoneng, Kabupaten Bandung.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
                    <button onClick={() => handleNav('jadwal-sholat')} className="bg-gold-500 hover:bg-gold-600 text-emerald-950 font-bold px-8 py-3.5 rounded-lg shadow-lg transition flex items-center justify-center gap-2">
                      <Clock size={18} /> Jadwal Sholat Hari Ini
                    </button>
                    <button onClick={() => handleNav('donasi')} className="bg-transparent border-2 border-gold-500 text-gold-300 hover:bg-gold-500 hover:text-emerald-950 font-semibold px-8 py-3.5 rounded-lg transition flex items-center justify-center gap-2">
                      <HandCoins size={18} /> Infaq & Sedekah
                    </button>
                  </div>
                </div>
              </div>

              {/* Prayer Times Widget */}
              <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-30">
                <div className="bg-white rounded-2xl shadow-xl border-b-4 border-gold-500 overflow-hidden">
                  <div className="bg-emerald-950 p-4 flex flex-col sm:flex-row justify-between items-center text-white gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-gold-300">Jadwal Sholat (Cikoneng & Sekitarnya)</span>
                    </div>
                    <span className="text-xs font-mono bg-emerald-900 px-3 py-1 rounded text-gold-300">{countdownText}</span>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-gray-100 text-center">
                    {Object.entries(localPrayers).map(([name, time]) => (
                      <div key={name} className={`p-4 ${name === 'maghrib' ? 'bg-gold-50/40' : ''}`}>
                        <p className={`text-xs font-semibold uppercase ${name === 'maghrib' ? 'text-emerald-900 font-bold' : 'text-gray-400'}`}>{name}</p>
                        <h4 className={`text-lg sm:text-2xl font-bold mt-1 ${name === 'maghrib' ? 'text-emerald-950' : 'text-emerald-900'}`}>{time}</h4>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Program Overview */}
              <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="text-center max-w-3xl mx-auto mb-12">
                  <span className="text-xs font-bold text-gold-600 uppercase tracking-widest bg-gold-50 px-3 py-1 rounded-full">Program Masjid</span>
                  <h2 className="font-serif text-3xl md:text-4xl font-bold text-emerald-950 mt-3">Kegiatan Utama & Kemaslahatan</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white rounded-2xl border border-gold-100 shadow-md hover:shadow-lg transition p-6 space-y-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-800"><BookOpen /></div>
                    <h4 className="font-serif text-lg font-bold text-emerald-950">Majelis Ilmu & Kajian Rutin</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">Penyelenggaraan kajian rutin mingguan dan bulanan yang dibimbing oleh ustadz berkompeten untuk mendalami tauhid, fiqih, tafsir, dan akhlak.</p>
                    <button onClick={() => handleNav('kegiatan')} className="text-xs text-emerald-900 font-bold hover:text-gold-600 transition flex items-center gap-1">Lihat Jadwal Kajian <ChevronRight size={14}/></button>
                  </div>
                  <div className="bg-white rounded-2xl border border-gold-100 shadow-md hover:shadow-lg transition p-6 space-y-4">
                    <div className="w-12 h-12 bg-gold-50 rounded-xl flex items-center justify-center text-gold-600"><GraduationCap /></div>
                    <h4 className="font-serif text-lg font-bold text-emerald-950">Taman Pendidikan Al-Qur&apos;an (TPA)</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">Membina anak-anak dan remaja di lingkungan Cikoneng agar fasih membaca, menghafal, dan mengamalkan nilai-nilai luhur Al-Qur&apos;an sejak dini.</p>
                    <button onClick={() => handleNav('kegiatan')} className="text-xs text-emerald-900 font-bold hover:text-gold-600 transition flex items-center gap-1">Detail Kurikulum TPA <ChevronRight size={14}/></button>
                  </div>
                  <div className="bg-white rounded-2xl border border-gold-100 shadow-md hover:shadow-lg transition p-6 space-y-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-800"><Ambulance /></div>
                    <h4 className="font-serif text-lg font-bold text-emerald-950">Layanan Sosial & Ambulans</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">Bantuan ambulans gratis siaga 24 jam serta penyaluran santunan sembako berkala untuk keluarga pra-sejahtera dan dhuafa di wilayah Cikoneng.</p>
                    <button onClick={() => handleNav('kontak')} className="text-xs text-emerald-900 font-bold hover:text-gold-600 transition flex items-center gap-1">Hubungi Kontak Siaga <ChevronRight size={14}/></button>
                  </div>
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
                    Salurkan infaq, shodaqoh, dan zakat Anda untuk mendukung penuh operasional dawah, pendidikan santri TPA, dan peningkatan sarana ibadah di Masjid Al-Kahfi Cikoneng.
                  </p>
                  <div className="pt-2">
                    <button onClick={() => handleNav('donasi')} className="bg-gold-500 hover:bg-gold-600 text-emerald-950 font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition inline-flex items-center gap-2">
                      <HeartPulse size={16} /> Mulai Berdonasi Sekarang
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Galeri Foto */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex flex-col sm:flex-row justify-between items-baseline mb-10 gap-2">
                  <div>
                    <span className="text-xs font-bold text-gold-600 uppercase tracking-widest">Dokumentasi</span>
                    <h2 className="font-serif text-3xl font-bold text-emerald-950 mt-1">Galeri Foto Masjid</h2>
                  </div>
                  <button onClick={() => handleNav('galeri')} className="text-emerald-900 font-bold text-sm hover:text-gold-600 transition flex items-center gap-1">
                    Lihat Seluruh Foto <ArrowRight size={14}/>
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {galleryImages.slice(0, 4).map((img, idx) => (
                    <div key={idx} onClick={() => setLightbox({ isOpen: true, url: img })} className="group relative overflow-hidden rounded-xl cursor-pointer h-40 sm:h-48">
                      <Image src={img} alt={`Preview Galeri ${idx}`} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition duration-300" />
                      <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <ZoomIn className="text-white w-8 h-8" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {/* TENTANG */}
          {activeTab === 'tentang' && (
            <motion.section key="tentang" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="pb-16">
              <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
                <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4">
                  <h2 className="font-serif text-4xl font-bold">Tentang Masjid Al-Kahfi</h2>
                  <p className="text-gold-300 mt-2 font-medium">Sejarah, Visi, Misi, Kepengurusan & Fasilitas Lengkap</p>
                </div>
              </div>
              <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
                {/* Struktur Kepengurusan */}
                <div className="space-y-8">
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-emerald-950 text-center">
                    Pengurus DKM Al-Kahfi
                  </h3>
                  <p className="text-center text-sm text-gray-500 -mt-6 mb-8">Masa Khidmat: 2024 - 2028</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gold-100 hover:shadow-md transition">
                      <div className="w-20 h-20 relative mx-auto mb-4 rounded-full overflow-hidden border-2 border-gold-500">
                        <Image src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200&h=200" alt="H. Endang Wijaya" fill sizes="80px" className="object-cover" />
                      </div>
                      <h4 className="font-bold text-emerald-950 text-base">H. Endang Wijaya, Lc.</h4>
                      <p className="text-xs text-gold-600 font-semibold uppercase mt-1">Ketua Umum DKM</p>
                      <p className="text-[10px] text-gray-400 mt-2 bg-gray-50 px-2 py-1 rounded inline-block">Periode 2024-2028</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gold-100 hover:shadow-md transition">
                      <div className="w-20 h-20 relative mx-auto mb-4 rounded-full overflow-hidden border-2 border-gold-500">
                        <Image src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200" alt="H. Ridwan Kamil" fill sizes="80px" className="object-cover" />
                      </div>
                      <h4 className="font-bold text-emerald-950 text-base">H. Ridwan Kamil, S.E.</h4>
                      <p className="text-xs text-gold-600 font-semibold uppercase mt-1">Wakil Ketua</p>
                      <p className="text-[10px] text-gray-400 mt-2 bg-gray-50 px-2 py-1 rounded inline-block">Periode 2024-2028</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gold-100 hover:shadow-md transition">
                      <div className="w-20 h-20 relative mx-auto mb-4 rounded-full overflow-hidden border-2 border-gold-500">
                        <Image src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200" alt="Bpk. Ahmad Fauzi" fill sizes="80px" className="object-cover" />
                      </div>
                      <h4 className="font-bold text-emerald-950 text-base">Bpk. Ahmad Fauzi</h4>
                      <p className="text-xs text-gold-600 font-semibold uppercase mt-1">Bendahara Ziswaf</p>
                      <p className="text-[10px] text-gray-400 mt-2 bg-gray-50 px-2 py-1 rounded inline-block">Periode 2024-2028</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gold-100 hover:shadow-md transition">
                      <div className="w-20 h-20 relative mx-auto mb-4 rounded-full overflow-hidden border-2 border-gold-500">
                        <Image src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200" alt="Ust. Syahrul Ramadhan" fill sizes="80px" className="object-cover" />
                      </div>
                      <h4 className="font-bold text-emerald-950 text-base">Ust. Syahrul Ramadhan</h4>
                      <p className="text-xs text-gold-600 font-semibold uppercase mt-1">Ketua Bidang Dakwah</p>
                      <p className="text-[10px] text-gray-400 mt-2 bg-gray-50 px-2 py-1 rounded inline-block">Periode 2024-2028</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-emerald-950 text-white rounded-2xl p-8 relative overflow-hidden border-b-4 border-gold-500 shadow-lg">
                    <div className="absolute top-0 right-0 opacity-10 islamic-pattern w-32 h-32"></div>
                    <h3 className="font-serif text-xl font-bold text-gold-300 mb-4 flex items-center gap-2"><Eye /> Visi Kami</h3>
                    <p className="text-emerald-50 leading-relaxed font-light text-sm md:text-base">&quot;Menjadi masjid yang mandiri, makmur, serta melahirkan generasi rabbani yang berilmu, bertaqwa, berakhlak mulia, dan bermanfaat sosial di Kabupaten Bandung.&quot;</p>
                  </div>
                  <div className="bg-white rounded-2xl p-8 border border-gold-200 shadow-md">
                    <h3 className="font-serif text-xl font-bold text-emerald-950 mb-4 flex items-center gap-2"><Target className="text-gold-500" /> Misi Kami</h3>
                    <ol className="space-y-3 text-sm text-gray-600">
                      <li className="flex gap-2"><span className="text-gold-500 font-bold">1.</span><span>Menyelenggarakan kegiatan ibadah fardhu & sunnah secara istiqomah sesuai tuntunan Al-Qur&apos;an dan Sunnah.</span></li>
                      <li className="flex gap-2"><span className="text-gold-500 font-bold">2.</span><span>Menyelenggarakan pendidikan agama (TPA, Kajian, Tahsin) yang terarah bagi semua kalangan usia.</span></li>
                      <li className="flex gap-2"><span className="text-gold-500 font-bold">3.</span><span>Mengembangkan pengelolaan dana ziswaf yang produktif, transparan, dan berdaya guna tinggi bagi dhuafa.</span></li>
                    </ol>
                  </div>
                </div>

                {/* Fasilitas Masjid */}
                <div className="space-y-8">
                  <div className="text-center">
                    <span className="text-xs font-bold text-gold-600 uppercase tracking-widest">Sarana Prasarana</span>
                    <h3 className="font-serif text-2xl md:text-3xl font-bold text-emerald-950 mt-2">Fasilitas Masjid Al-Kahfi</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold-100 flex gap-4">
                      <div className="text-gold-500 mt-1"><User size={24}/></div>
                      <div>
                        <h4 className="font-bold text-emerald-950 text-base">Ruang Utama Sholat</h4>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">Dilengkapi sajadah empuk, pendingin ruangan (AC), sound system berkualitas, menampung hingga 500 jamaah.</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold-100 flex gap-4">
                      <div className="text-gold-500 mt-1"><Droplet size={24}/></div>
                      <div>
                        <h4 className="font-bold text-emerald-950 text-base">Wudhu & Toilet Higienis</h4>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">Fasilitas bersuci terpisah permanen antara ikhwan dan akhwat, air bersih bersih langsung dari mata air sumur dalam.</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold-100 flex gap-4">
                      <div className="text-gold-500 mt-1"><Ambulance size={24}/></div>
                      <div>
                        <h4 className="font-bold text-emerald-950 text-base">Ambulans Gratis 24 Jam</h4>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">Siap siaga melayani kebutuhan gawat darurat dan pengantaran jenazah bagi warga Cikoneng tanpa biaya.</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold-100 flex gap-4">
                      <div className="text-gold-500 mt-1"><BookOpen size={24}/></div>
                      <div>
                        <h4 className="font-bold text-emerald-950 text-base">Ruang Belajar & TPA</h4>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">Wadah khusus pembelajaran TPA sore hari yang ramah anak, lengkap dengan koleksi kitab dan papan tulis interaktif.</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold-100 flex gap-4">
                      <div className="text-gold-500 mt-1"><Car size={24}/></div>
                      <div>
                        <h4 className="font-bold text-emerald-950 text-base">Area Parkir Ber-CCTV</h4>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">Lahan parkir kendaraan roda dua dan empat yang aman, dikontrol dengan kamera CCTV pengawas 24 jam penuh.</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold-100 flex gap-4">
                      <div className="text-gold-500 mt-1"><Wifi size={24}/></div>
                      <div>
                        <h4 className="font-bold text-emerald-950 text-base">Akses Wifi Hotspot</h4>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">Layanan internet nirkabel gratis di area teras untuk mendukung operasional dawah digital dan administrasi santri.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* JADWAL SHOLAT */}
          {activeTab === 'jadwal-sholat' && (
            <motion.section key="jadwal-sholat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="pb-16">
              <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
                <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4">
                  <h2 className="font-serif text-4xl font-bold">Jadwal Sholat & Ibadah</h2>
                  <p className="text-gold-300 mt-2 font-medium">Data real-time wilayah Cikoneng, Bojongsoang, Kab. Bandung</p>
                </div>
              </div>
              <div className="max-w-5xl mx-auto px-4 py-16 space-y-12">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {Object.entries(localPrayers).map(([name, time]) => (
                    <div key={name} className={`rounded-xl p-4 text-center border shadow-sm ${name === 'maghrib' ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-900/15' : 'bg-white border-gold-100'}`}>
                      <p className={`text-xs uppercase ${name === 'maghrib' ? 'text-emerald-800 font-bold tracking-wider' : 'text-gray-500 font-semibold'}`}>{name}</p>
                      <h4 className={`text-2xl font-bold mt-2 ${name === 'maghrib' ? 'text-emerald-950' : 'text-emerald-900'}`}>{time}</h4>
                    </div>
                  ))}
                </div>
                <div className="bg-emerald-950 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden border-b-4 border-gold-500 shadow-lg">
                  <div className="absolute inset-0 opacity-10 islamic-pattern"></div>
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-gold-300">Layanan Alert Adzan & Iqomah</h3>
                      <p className="text-emerald-50 text-xs sm:text-sm leading-relaxed">Fitur otomatisasi jam dinding pintar masjid mengacu pada waktu digital di atas. Waktu jeda Iqomah rata-rata diset 10 menit setelah adzan berkumandang untuk sholat rawatib.</p>
                      <div className="flex flex-wrap gap-3">
                        <span className="bg-emerald-900 text-gold-300 px-3 py-1.5 rounded-full text-xs font-mono">GMT+07:00 Asia/Jakarta</span>
                        <span className="bg-emerald-900 text-gold-300 px-3 py-1.5 rounded-full text-xs font-mono">Metode: KEMENAG RI</span>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
                      <p className="text-xs text-gold-300 uppercase font-semibold tracking-wider">Simulasi Timer Iqomah</p>
                      <div className="font-mono text-4xl sm:text-5xl font-bold text-white my-3">{iqomahTime}</div>
                      <p className="text-xs text-emerald-200">Menuju Iqomah Sholat Berikutnya</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* KEGIATAN */}
          {activeTab === 'kegiatan' && (
            <motion.section key="kegiatan" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="pb-16">
              <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
                <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4">
                  <h2 className="font-serif text-4xl font-bold">Kegiatan & Kajian Rutin</h2>
                  <p className="text-gold-300 mt-2 font-medium">Bina Ruhiyah & Interaksi Umat Masjid Al-Kahfi</p>
                </div>
              </div>
              <div className="max-w-5xl mx-auto px-4 py-16 space-y-12">
                <div className="flex flex-wrap gap-2 justify-center">
                  {['semua', 'harian', 'sholat-jumat', 'hari-besar'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-full text-sm font-semibold shadow ${filter === f ? 'bg-emerald-900 text-white' : 'bg-white text-emerald-950 border border-gold-200 hover:bg-gold-50'}`}>
                      {f === 'semua' ? 'Semua' : f === 'harian' ? 'Harian / Rutin' : f === 'sholat-jumat' ? "Sholat Jum'at" : 'Hari Besar (PHBI)'}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {activitiesData.filter(a => filter === 'semua' || a.cat === filter).map((act, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl overflow-hidden border border-gold-100 shadow-sm flex flex-col justify-between">
                      <div className="p-6 sm:p-8 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className={`${act.color} text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase`}>{act.tag}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12}/> {act.time}</span>
                        </div>
                        <h4 className="font-serif text-xl font-bold text-emerald-950">{act.title}</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{act.desc}</p>
                      </div>
                      <div className="bg-gold-50/50 px-6 py-4 border-t border-gold-100 flex justify-between items-center text-xs">
                        <span className="text-emerald-900 font-bold flex items-center gap-1"><act.Icon size={14}/> {act.ust}</span>
                        <span className="text-gray-500">{act.note}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {/* BERITA */}
          {activeTab === 'berita' && (
            <motion.section key="berita" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="pb-16">
              <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
                <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4">
                  <h2 className="font-serif text-4xl font-bold">Kabar Al-Kahfi</h2>
                  <p className="text-gold-300 mt-2 font-medium">Berita Acara, Artikel Islami, dan Dokumentasi Sosial</p>
                </div>
              </div>
              <div className="max-w-6xl mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {newsData.map((news, idx) => (
                    <div key={idx} className="bg-white rounded-2xl overflow-hidden border border-gold-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="relative w-full h-48"><Image src={news.img} alt={news.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></div>
                        <div className="p-6 space-y-3">
                          <span className={`text-[10px] ${news.color} font-bold px-2 py-0.5 rounded`}>{news.tag}</span>
                          <h4 className="font-serif text-lg font-bold text-emerald-950 leading-snug">{news.title}</h4>
                          <p className="text-gray-600 text-xs leading-relaxed line-clamp-3">{news.desc}</p>
                        </div>
                      </div>
                      <div className="p-6 pt-0 border-t border-gold-50/50 flex justify-between items-center text-xs text-gray-500 mt-4">
                        <span>{news.date}</span>
                        <button onClick={() => { setSelectedNews(news); handleNav('berita-detail'); }} className="text-emerald-900 font-bold hover:text-gold-600 transition flex items-center gap-1">Baca <ArrowRight size={12}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {/* BERITA DETAIL */}
          {activeTab === 'berita-detail' && selectedNews && (
            <motion.section key="berita-detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="pb-16">
              <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
                <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4">
                  <span className={`text-xs ${selectedNews.color} font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block`}>{selectedNews.tag}</span>
                  <h2 className="font-serif text-3xl md:text-5xl font-bold max-w-4xl mx-auto leading-tight">{selectedNews.title}</h2>
                  <p className="text-gold-300 mt-4 font-medium flex items-center justify-center gap-2">
                    <CalendarCheck size={16} /> Dipublikasikan pada {selectedNews.date}
                  </p>
                </div>
              </div>
              <div className="max-w-4xl mx-auto px-4 py-16">
                <button onClick={() => handleNav('berita')} className="mb-8 flex items-center gap-2 text-emerald-900 font-bold hover:text-gold-600 transition">
                  <ArrowRight size={16} className="rotate-180" /> Kembali ke Daftar Berita
                </button>
                <div className="bg-white rounded-2xl overflow-hidden border border-gold-100 shadow-md">
                  <div className="relative w-full h-[300px] md:h-[500px]">
                    <Image src={selectedNews.img} alt={selectedNews.title} fill sizes="(max-width: 768px) 100vw, 80vw" className="object-cover" />
                  </div>
                  <div className="p-8 md:p-12 space-y-6">
                    <p className="text-gray-700 leading-loose text-lg font-light">
                      {selectedNews.desc}
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* GALERI */}
          {activeTab === 'galeri' && (
            <motion.section key="galeri" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="pb-16">
              <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
                <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4">
                  <h2 className="font-serif text-4xl font-bold">Galeri Dokumentasi</h2>
                  <p className="text-gold-300 mt-2 font-medium">Rekaman Kilasan Kegiatan dan Pembangunan Masjid Al-Kahfi</p>
                </div>
              </div>
              <div className="max-w-6xl mx-auto px-4 py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {galleryImages.map((img, idx) => (
                    <div key={idx} onClick={() => setLightbox({ isOpen: true, url: img })} className="group relative overflow-hidden rounded-xl cursor-pointer h-40 sm:h-48">
                      <Image src={img} alt={`Galeri ${idx}`} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition duration-300" />
                      <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <ZoomIn className="text-white w-8 h-8" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {/* DONASI */}
          {activeTab === 'donasi' && (
            <motion.section key="donasi" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="pb-16">
              <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
                <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4">
                  <h2 className="font-serif text-4xl font-bold">Infaq, Shodaqoh, Zakat</h2>
                  <p className="text-gold-300 mt-2 font-medium">Bantu Operasional & Pembangunan Sarana Masjid Al-Kahfi</p>
                </div>
              </div>
              <div className="max-w-5xl mx-auto px-4 py-16 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gold-100 shadow-md space-y-6">
                    <h3 className="font-serif text-xl font-bold text-emerald-950 flex items-center gap-2">
                      <Landmark className="text-gold-500" /> Transfer Bank
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">Silakan melakukan transfer ke nomor rekening resmi DKM Al-Kahfi di bawah ini. Harap konfirmasi via WhatsApp setelah transaksi agar pencatatan rapi.</p>
                    <div className="space-y-4">
                      <div className="bg-gold-50/50 p-4 rounded-xl border border-gold-100 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-emerald-900">Bank Syariah Indonesia (BSI)</p>
                          <p className="font-mono text-base font-bold text-gray-800 mt-1">7123-4567-89</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">a.n DKM AL-KAHFI CIKONENG</p>
                        </div>
                        <button onClick={() => handleCopy('7123456789')} className="bg-emerald-900 text-gold-100 hover:bg-gold-500 hover:text-emerald-950 font-bold px-3 py-1.5 rounded-lg text-xs transition">Salin</button>
                      </div>
                      <div className="bg-gold-50/50 p-4 rounded-xl border border-gold-100 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-emerald-900">Bank Mandiri Syariah</p>
                          <p className="font-mono text-base font-bold text-gray-800 mt-1">131-00-9876543-2</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">a.n MASJID AL KAHFI CIKONENG</p>
                        </div>
                        <button onClick={() => handleCopy('1310098765432')} className="bg-emerald-900 text-gold-100 hover:bg-gold-500 hover:text-emerald-950 font-bold px-3 py-1.5 rounded-lg text-xs transition">Salin</button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-emerald-950 text-white rounded-2xl p-6 sm:p-8 border-b-4 border-gold-500 shadow-md flex flex-col justify-between">
                    <div className="space-y-4">
                      <h3 className="font-serif text-xl font-bold text-gold-300 flex items-center gap-2"><QrCode /> Scan QRIS Digital</h3>
                      <p className="text-emerald-50 text-xs leading-relaxed">Dukung kemudahan donasi instan melalui scan QRIS dari berbagai platform uang elektronik (GoPay, OVO, Dana, LinkAja, BCA Mobile, dll).</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl max-w-[200px] mx-auto my-6 border-2 border-gold-400 shadow-xl relative h-48 w-48">
                      <Image src="https://placehold.co/200x200/ffffff/064e3b?text=QRIS+AL-KAHFI" alt="QRIS Al Kahfi" fill sizes="192px" className="object-contain rounded-lg" />
                    </div>
                    <p className="text-center text-[10px] text-gold-300">Terverifikasi Bank Indonesia • QRIS ID: ID1023456789101</p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* KONTAK */}
          {activeTab === 'kontak' && (
            <motion.section key="kontak" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="pb-16">
              <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
                <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4">
                  <h2 className="font-serif text-4xl font-bold">Hubungi Kami</h2>
                  <p className="text-gold-300 mt-2 font-medium">Layanan Informasi Terpadu & Layanan Sosial Darurat</p>
                </div>
              </div>
              <div className="max-w-6xl mx-auto px-4 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  <div className="bg-white rounded-2xl p-8 border border-gold-100 shadow-md lg:col-span-5 flex flex-col justify-between space-y-8">
                    <div className="space-y-4">
                      <span className="text-xs font-bold text-gold-600 uppercase tracking-widest">Informasi Kontak</span>
                      <h3 className="font-serif text-2xl font-bold text-emerald-950">DKM Al-Kahfi Cikoneng</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">Untuk layanan bimbingan ibadah, sewa fasilitas sosial, koordinasi infaq, serta layanan darurat kesehatan & jenazah, silakan hubungi kontak resmi kami.</p>
                    </div>
                    <div className="space-y-6 text-sm text-gray-700">
                      <div className="flex items-start gap-4"><MapPin className="text-gold-500 shrink-0" /><div><p className="font-bold text-emerald-900">Alamat Fisik</p><p className="text-xs text-gray-500 mt-1 leading-relaxed">Jl. Cikoneng No.15, Bojongsoang, Kec. Bojongsoang, Kab. Bandung 40288</p></div></div>
                      <div className="flex items-start gap-4"><PhoneCall className="text-gold-500 shrink-0" /><div><p className="font-bold text-emerald-900">Hotline DKM & Ambulans</p><p className="text-xs text-emerald-950 font-bold mt-1">+62 812-3456-7890 <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded ml-2 uppercase font-extrabold tracking-wider">Siaga 24 Jam</span></p></div></div>
                      <div className="flex items-start gap-4"><Mail className="text-gold-500 shrink-0" /><div><p className="font-bold text-emerald-900">Email Korespondensi</p><p className="text-xs text-gray-500 mt-1">alkahfi.cikoneng@gmail.com</p></div></div>
                      <div className="flex items-start gap-4"><Info className="text-gold-500 shrink-0" /><div><p className="font-bold text-emerald-900">Jam Operasional Kantor</p><p className="text-xs text-gray-500 mt-1">Setiap Hari: 08:00 - 20:00 WIB (Bada Isya)</p></div></div>
                    </div>
                  </div>
                  <div className="rounded-2xl overflow-hidden border-2 border-gold-200 lg:col-span-7 bg-gray-100 relative shadow-inner min-h-[400px]">
                    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15840.403487310565!2d107.65886676342774!3d-6.985587799999991!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68c22755e378c3%3A0xe5a363717dfbbf5e!2sCikoneng%2C%20Bojongsoang%2C%20Bandung%20Regency%2C%20West%20Java!5e0!3m2!1sen!2sid!4v1700000000000" className="absolute inset-0 w-full h-full" style={{border:0}} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
          
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-emerald-950 text-white border-t border-gold-500/20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-gold-300 text-xl border border-gold-500/40">🕌</div>
                <h4 className="font-serif text-lg font-bold text-gold-300">Masjid Al-Kahfi</h4>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed max-w-sm">Lembaga Dakwah, Sosial, Pendidikan, dan Kemaslahatan Ummat di Cikoneng, Kabupaten Bandung. Berkhidmat melayani jamaah dengan ikhlas dan transparan.</p>
            </div>
            <div className="space-y-4">
              <h5 className="font-serif text-sm font-bold uppercase tracking-wider text-gold-400">Peta Navigasi</h5>
              <div className="grid grid-cols-2 gap-2 text-xs text-emerald-100">
                {navLinks.map(link => (
                  <button key={`footer-${link.id}`} onClick={() => handleNav(link.id)} className="text-left hover:text-gold-300 transition">{link.label}</button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="font-serif text-sm font-bold uppercase tracking-wider text-gold-400">Media Interaksi</h5>
              <div className="flex gap-4">
                <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-gold-500 hover:text-emerald-950 flex items-center justify-center text-sm transition"><Youtube size={14}/></button>
                <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-gold-500 hover:text-emerald-950 flex items-center justify-center text-sm transition"><Instagram size={14}/></button>
                <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-gold-500 hover:text-emerald-950 flex items-center justify-center text-sm transition"><MessageCircle size={14}/></button>
                <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-gold-500 hover:text-emerald-950 flex items-center justify-center text-sm transition"><Mail size={14}/></button>
              </div>
              <p className="text-[10px] text-emerald-200/60 leading-relaxed">&copy; 2026 DKM Masjid Al-Kahfi Cikoneng. <br/>All Rights Reserved. Membina Ummat Secara Istiqomah.</p>
              <div className="mt-4">
                 <Link href="/admin" className="text-xs text-gold-500/80 hover:text-gold-400 flex items-center gap-1 transition"><ChevronRight size={12}/> Login Administrator</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Theme Settings */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {isThemeMenuOpen && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gold-200 p-4 w-60 space-y-3">
              <h4 className="font-serif font-bold text-emerald-950 text-sm border-b pb-2">🎨 Sesuaikan Tema Web</h4>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'zamrud', name: 'Zamrud Klasik', col: 'bg-[#059669]' },
                  { id: 'syafii', name: 'Syafii Blue', col: 'bg-[#2563eb]' },
                  { id: 'kasturi', name: 'Kasturi Maroon', col: 'bg-[#881337]' },
                  { id: 'zaitun', name: 'Zaitun Sage', col: 'bg-[#5f7a68]' },
                  { id: 'raudhah', name: 'Ar-Raudhah', col: 'bg-[#0d9488]' }
                ].map(t => (
                  <button key={t.id} onClick={() => changeTheme(t.id)} className={`text-left flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${theme === t.id ? 'bg-gold-50 border border-gold-300' : 'hover:bg-gray-50 border border-transparent'}`}>
                    <span className={`w-4 h-4 rounded-full ${t.col} border border-gray-200`}></span>
                    <span className="text-gray-800">{t.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)} className="w-12 h-12 bg-emerald-900 text-gold-300 hover:text-emerald-950 hover:bg-gold-500 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:rotate-90">
          <Settings size={20} />
        </button>
      </div>

      {/* Custom Toast */}
      <AnimatePresence>
        {toast.isOpen && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 left-6 bg-emerald-950 text-gold-100 border border-gold-400 px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3">
            <CheckCircle2 className="text-gold-500" size={20} />
            <span className="text-xs sm:text-sm font-semibold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightbox.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox({ isOpen: false, url: '' })} className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
            <button className="absolute top-6 right-6 text-white text-3xl hover:text-gold-300"><X size={32}/></button>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="relative w-full max-w-5xl h-[80vh]" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <Image src={lightbox.url} alt="Lightbox" fill sizes="100vw" className="object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* General Modal */}
      <AnimatePresence>
        {modal.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-emerald-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 border-t-4 border-gold-500 shadow-2xl space-y-4">
              <h4 className="font-serif text-xl font-bold text-emerald-950">{modal.title}</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{modal.desc}</p>
              <div className="flex justify-end pt-2">
                <button onClick={() => setModal({ isOpen: false, title: '', desc: '' })} className="bg-emerald-900 text-gold-100 hover:bg-gold-500 hover:text-emerald-950 font-bold px-5 py-2 rounded-lg text-sm transition">Tutup</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
