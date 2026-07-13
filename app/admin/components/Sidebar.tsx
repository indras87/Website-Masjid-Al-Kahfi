"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Bell,
  Image as ImageIcon,
  LogOut,
  Menu,
  X,
  Info,
  HandCoins,
  Users,
  Settings,
} from "lucide-react";

interface User {
  name?: string | null;
  role?: string | null;
}

interface SidebarProps {
  user?: User;
}

/** Sidebar navigasi admin dengan menu dinamis sesuai peran pengguna dan tombol logout. */
export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isSuperadmin = user?.role === "superadmin";

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/kegiatan", label: "Kegiatan", icon: CalendarDays },
    { href: "/admin/berita", label: "Berita", icon: FileText },
    { href: "/admin/galeri", label: "Galeri", icon: ImageIcon },
    { href: "/admin/tentang", label: "Tentang", icon: Info },
    { href: "/admin/kontak-donasi", label: "Kontak & Donasi", icon: HandCoins },
    { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
    ...(isSuperadmin
      ? [{ href: "/admin/users", label: "Manajemen User", icon: Users }]
      : []),
  ];

  /** Mengonfirmasi lalu melakukan logout pengguna dan mengarahkan ke halaman login. */
  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar dari panel admin?")) {
      setIsLoggingOut(true);
      try {
        await signOut();
        router.push("/admin/login");
      } catch (error) {
        console.error("Logout error:", error);
        // Fallback: force reload
        window.location.href = "/admin/login";
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden bg-emerald-950 text-white p-4 flex justify-between items-center shrink-0">
        <div className="bg-white/95 rounded-md px-2 py-1">
          <Image src="/logo.png" alt="Masjid Al-Kahfi Cikoneng" width={108} height={36} className="h-8 w-auto" />
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white hover:text-gold-300 transition"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Content */}
      <aside
        className={`w-64 bg-emerald-950 text-white flex-col absolute md:relative z-50 h-[calc(100vh-68px)] md:h-screen transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} flex shrink-0`}
      >
        <div className="hidden md:flex p-6 border-b border-emerald-900 items-center justify-center shrink-0">
          <div className="bg-white/95 rounded-md px-3 py-2">
            <Image src="/logo.png" alt="Masjid Al-Kahfi Cikoneng" width={144} height={48} className="h-10 w-auto" />
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? "bg-emerald-900 text-gold-300 font-semibold shadow-inner" : "text-emerald-100 hover:bg-emerald-800"}`}
              >
                <Icon size={18} /> <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-emerald-900 shrink-0 space-y-2">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900/40 text-red-300 hover:text-red-200 transition-colors font-medium text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut size={18} /> <span>{isLoggingOut ? "Keluar..." : "Keluar / Logout"}</span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-emerald-900/50 text-emerald-300 hover:text-emerald-200 transition-colors font-medium text-sm"
          >
            <LogOut size={18} className="rotate-180" />{" "}
            <span>Kembali ke Web</span>
          </Link>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}
