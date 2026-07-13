"use client";

import React from "react";
import { LayoutHeader } from "@/components/layout-header";
import { Footer } from "@/components/layout-footer";
import { ThemeSettings } from "@/components/layout-theme";
import { usePathname, useRouter } from "next/navigation";

const navLinks = [
  { id: "beranda", label: "Beranda" },
  { id: "tentang", label: "Tentang" },
  { id: "jadwal-sholat", label: "Jadwal Sholat" },
  { id: "kegiatan", label: "Kegiatan" },
  { id: "berita", label: "Berita" },
  { id: "galeri", label: "Galeri" },
  { id: "kontak", label: "Kontak" },
];

/** Kerangka utama situs publik yang menyusun header, footer, dan pengaturan tema. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  /** Menentukan tab navigasi yang aktif berdasarkan path URL saat ini. */
  const getActiveTab = () => {
    if (pathname === "/" || pathname === "/beranda") return "beranda";
    const segments = pathname.split("/").filter(Boolean);
    return segments[0] || "beranda";
  };

  /** Mengarahkan pengguna ke rute yang sesuai dengan tab navigasi yang dipilih. */
  const handleNav = (tab: string) => {
    if (tab === "beranda") {
      router.push("/beranda");
    } else if (tab === "donasi") {
      router.push("/donasi");
    } else {
      router.push(`/${tab}`);
    }
  };

  return (
    <>
      <LayoutHeader activeTab={getActiveTab()} onNav={handleNav}>
        {children}
      </LayoutHeader>
      <Footer onNav={handleNav} />
      <ThemeSettings />
    </>
  );
}
