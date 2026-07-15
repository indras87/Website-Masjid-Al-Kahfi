"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DEFAULT_RUNNING_TEXT } from "@/lib/cms/settings";
import Image from "next/image";
import {
  HeartPulse,
  Menu,
  X,
  Clock,
  HandCoins,
  ArrowRight,
  ChevronRight,
  Settings,
  CheckCircle2,
  History as HistoryIcon,
} from "lucide-react";

const iconMap = {
  HeartPulse,
  Menu,
  X,
  Clock,
  HandCoins,
  ArrowRight,
  ChevronRight,
  Settings,
  CheckCircle2,
  HistoryIcon,
};

/** Header situs publik dengan running text hadits, jam digital, dan navigasi responsif. */
export function LayoutHeader({
  children,
  activeTab,
  onNav,
}: {
  children: React.ReactNode;
  activeTab: string;
  onNav: (tab: string) => void;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("Memuat Waktu...");
  const [runningText, setRunningText] = useState(DEFAULT_RUNNING_TEXT);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const days = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      setCurrentTime(`${days[now.getDay()]}, ${hours}:${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/pengaturan")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && typeof data.running_text === "string" && data.running_text.trim()) {
          setRunningText(data.running_text);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const navLinks = [
    { id: "beranda", label: "Beranda" },
    { id: "tentang", label: "Tentang" },
    { id: "jadwal-sholat", label: "Jadwal Sholat" },
    { id: "kegiatan", label: "Kegiatan" },
    { id: "berita", label: "Berita" },
    { id: "galeri", label: "Galeri" },
    { id: "kontak", label: "Kontak" },
  ];

  return (
    <>
      {/* Top Banner */}
      <div className="bg-emerald-950 text-gold-100 py-2 px-4 text-xs font-medium border-b border-gold-500/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center overflow-hidden">
          <div className="flex items-center gap-2 flex-1">
            <span className="bg-gold-500 text-emerald-950 text-[10px] uppercase font-bold px-2 py-0.5 rounded whitespace-nowrap">
              Hadits Hari Ini
            </span>
            <div className="overflow-hidden w-full relative">
              <motion.div
                animate={{ x: ["100%", "-100%"] }}
                transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                className="whitespace-nowrap text-xs"
              >
                {runningText}
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
            <button
              onClick={() => onNav("beranda")}
              className="flex items-center group text-left"
            >
              <Image
                src="/logo.png"
                alt="Masjid Al-Kahfi Cikoneng"
                width={192}
                height={64}
                className="h-14 w-auto transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </button>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => onNav(link.id)}
                  className={`px-3 py-2 rounded-md text-sm font-semibold transition duration-150 ${activeTab === link.id ? "text-gold-500 border-b-2 border-gold-500" : "text-gray-600 hover:text-gold-600"}`}
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => onNav("donasi")}
                className="ml-4 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-bold text-sm px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:from-gold-600 hover:to-gold-700 transition transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <HeartPulse size={16} /> Donasi & Infaq
              </button>
            </nav>

            {/* Mobile Nav Toggle */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-emerald-900 focus:outline-none p-2 rounded-md hover:bg-gold-50"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-white border-t border-gold-100 px-4 shadow-inner overflow-hidden"
            >
              <div className="py-3 flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => {
                      onNav(link.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`block text-left px-4 py-2.5 rounded-md text-base font-semibold ${activeTab === link.id ? "bg-gold-50 text-gold-600" : "text-emerald-950 hover:bg-gold-50"}`}
                  >
                    {link.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    onNav("donasi");
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-center bg-gold-500 text-white font-bold py-3 rounded-md shadow-md mt-2 flex justify-center items-center gap-2"
                >
                  <HeartPulse size={16} /> Donasi & Infaq
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="flex-grow islamic-pattern-light relative">{children}</div>
    </>
  );
}
