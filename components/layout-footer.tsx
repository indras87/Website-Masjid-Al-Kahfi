"use client";

import React from "react";
import {
  Youtube,
  Instagram,
  MessageCircle,
  Mail,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const navLinks = [
  { id: "beranda", label: "Beranda" },
  { id: "tentang", label: "Tentang" },
  { id: "jadwal-sholat", label: "Jadwal Sholat" },
  { id: "kegiatan", label: "Kegiatan" },
  { id: "berita", label: "Berita" },
  { id: "galeri", label: "Galeri" },
  { id: "kontak", label: "Kontak" },
];

export function Footer({ onNav }: { onNav: (tab: string) => void }) {
  return (
    <footer className="bg-emerald-950 text-white border-t border-gold-500/20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-gold-300 text-xl border border-gold-500/40">
                🕌
              </div>
              <h4 className="font-serif text-lg font-bold text-gold-300">
                Masjid Al-Kahfi
              </h4>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed max-w-sm">
              Lembaga Dakwah, Sosial, Pendidikan, dan Kemaslahatan Ummat di
              Cikoneng, Kabupaten Bandung. Berkhidmat melayani jamaah dengan
              ikhlas dan transparan.
            </p>
          </div>
          <div className="space-y-4">
            <h5 className="font-serif text-sm font-bold uppercase tracking-wider text-gold-400">
              Peta Navigasi
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs text-emerald-100">
              {navLinks.map((link) => (
                <button
                  key={`footer-${link.id}`}
                  onClick={() => onNav(link.id)}
                  className="text-left hover:text-gold-300 transition"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h5 className="font-serif text-sm font-bold uppercase tracking-wider text-gold-400">
              Media Interaksi
            </h5>
            <div className="flex gap-4">
              <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-gold-500 hover:text-emerald-950 flex items-center justify-center text-sm transition">
                <Youtube size={14} />
              </button>
              <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-gold-500 hover:text-emerald-950 flex items-center justify-center text-sm transition">
                <Instagram size={14} />
              </button>
              <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-gold-500 hover:text-emerald-950 flex items-center justify-center text-sm transition">
                <MessageCircle size={14} />
              </button>
              <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-gold-500 hover:text-emerald-950 flex items-center justify-center text-sm transition">
                <Mail size={14} />
              </button>
            </div>
            <p className="text-[10px] text-emerald-200/60 leading-relaxed">
              &copy; 2026 DKM Masjid Al-Kahfi Cikoneng. <br />
              All Rights Reserved. Membina Ummat Secara Istiqomah.
            </p>
            <div className="mt-4">
              <Link
                href="/admin"
                className="text-xs text-gold-500/80 hover:text-gold-400 flex items-center gap-1 transition"
              >
                <ChevronRight size={12} /> Login Administrator
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
