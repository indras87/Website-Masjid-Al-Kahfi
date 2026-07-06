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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveTab = () => {
    if (pathname === "/" || pathname === "/beranda") return "beranda";
    const segments = pathname.split("/").filter(Boolean);
    return segments[0] || "beranda";
  };

  const handleNav = (tab: string) => {
    if (tab === "beranda") {
      router.push("/beranda");
    } else if (tab === "donasi") {
      router.push("/donasi");
    } else if (tab === "berita-detail") {
      router.push("/berita");
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
