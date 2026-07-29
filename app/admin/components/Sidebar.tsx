"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Image as ImageIcon,
  LogOut,
  Menu,
  X,
  Info,
  HandCoins,
  Users,
  Settings,
  UserCog,
  HeartHandshake,
  Megaphone,
  BadgeCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

interface User {
  name?: string | null;
  role?: string | null;
}

interface SidebarProps {
  user?: User;
}

const COLLAPSE_KEY = "admin-sidebar-collapsed";
const OPEN_GROUPS_KEY = "admin-sidebar-open-groups";

type NavLink = { href: string; label: string; icon: LucideIcon };
type NavGroup = {
  label: string;
  icon: LucideIcon;
  group: string;
  children: NavLink[];
};
type NavEntry = NavLink | NavGroup;

/** Sidebar navigasi admin dengan menu dinamis sesuai peran pengguna dan tombol logout. */
export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false); // drawer mobile
  const [collapsed, setCollapsed] = useState(false); // mode icon-only desktop
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isSuperadmin = user?.role === "superadmin";

  // Muat preferensi collapse & grup terbuka dari localStorage (hindari mismatch SSR).
  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSE_KEY) === "true") setCollapsed(true);
      const savedGroups = localStorage.getItem(OPEN_GROUPS_KEY);
      if (savedGroups) setOpenGroups(JSON.parse(savedGroups));
    } catch {
      /* localStorage mungkin tidak tersedia */
    }
  }, []);

  // Auto-expand grup yang punya child aktif (route saat ini).
  useEffect(() => {
    setOpenGroups((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const entry of navEntries) {
        if ("children" in entry) {
          const active = entry.children.some(
            (c) => pathname === c.href || pathname.startsWith(c.href + "/")
          );
          if (active && !next[entry.group]) {
            next[entry.group] = true;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleCollapse = () => {
    const n = !collapsed;
    setCollapsed(n);
    try {
      localStorage.setItem(COLLAPSE_KEY, String(n));
    } catch {
      /* noop */
    }
  };

  const toggleGroup = (g: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [g]: !prev[g] };
      try {
        localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });
  };

  const navEntries: NavEntry[] = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/kegiatan", label: "Kegiatan", icon: CalendarDays },
    { href: "/admin/berita", label: "Berita", icon: FileText },
    { href: "/admin/galeri", label: "Galeri", icon: ImageIcon },
    { href: "/admin/tentang", label: "Tentang", icon: Info },
    { href: "/admin/kontak-donasi", label: "Kontak & Donasi", icon: HandCoins },
    {
      label: "Donasi",
      icon: HeartHandshake,
      group: "donasi",
      children: [
        { href: "/admin/campaign", label: "Campaign Donasi", icon: Megaphone },
        { href: "/admin/campaign-donasi", label: "Verifikasi Donasi", icon: BadgeCheck },
        { href: "/admin/donatur-tetap", label: "Donatur Tetap", icon: HeartHandshake },
      ],
    },
    { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
    { href: "/admin/akun", label: "Akun Saya", icon: UserCog },
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
        window.location.href = "/admin/login";
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  /** Render satu baris link (flat atau child grup). */
  const renderLink = (link: NavLink, opts: { indent?: boolean } = {}) => {
    const Icon = link.icon;
    const isActive = pathname === link.href;
    const base = collapsed
      ? "md:justify-center md:px-0 px-4 py-3"
      : opts.indent
        ? "px-4 py-2.5 pl-10"
        : "px-4 py-3";
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={() => setIsOpen(false)}
        title={collapsed ? link.label : undefined}
        className={`flex items-center gap-3 rounded-lg transition-colors ${base} ${
          isActive
            ? "bg-emerald-900 text-gold-300 font-semibold shadow-inner"
            : "text-emerald-100 hover:bg-emerald-800"
        }`}
      >
        <Icon size={18} className="shrink-0" />{" "}
        <span className={collapsed ? "md:hidden" : ""}>{link.label}</span>
      </Link>
    );
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
          aria-label="Buka menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Content */}
      <aside
        className={`bg-emerald-950 text-white flex-col absolute md:relative z-50 h-[calc(100vh-68px)] md:h-screen shrink-0 transition-all duration-300 ease-in-out w-64 ${collapsed ? "md:w-20" : "md:w-64"} ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} flex`}
      >
        {/* Desktop Header + Collapse Toggle */}
        <div
          className={`hidden md:flex items-center shrink-0 border-b border-emerald-900 ${collapsed ? "justify-center p-3" : "justify-between p-4"}`}
        >
          <div className={`bg-white/95 rounded-md ${collapsed ? "px-1 py-1" : "px-3 py-2"}`}>
            <Image
              src="/logo.png"
              alt="Masjid Al-Kahfi Cikoneng"
              width={collapsed ? 32 : 144}
              height={collapsed ? 32 : 48}
              className={collapsed ? "h-8 w-8 object-contain" : "h-10 w-auto"}
            />
          </div>
          {!collapsed && (
            <button
              onClick={toggleCollapse}
              className="text-emerald-200 hover:text-gold-300 hover:bg-emerald-900 p-1.5 rounded-md transition"
              aria-label="Ciutkan sidebar"
              title="Ciutkan"
            >
              <PanelLeftClose size={20} />
            </button>
          )}
        </div>

        {/* Tombol expand saat collapsed (mobile tetap pakai drawer) */}
        {collapsed && (
          <button
            onClick={toggleCollapse}
            className="hidden md:flex items-center justify-center text-emerald-200 hover:text-gold-300 hover:bg-emerald-900 p-2 mx-auto mt-2 rounded-md transition"
            aria-label="Lebarkan sidebar"
            title="Lebarkan"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}

        <nav className="flex-1 p-2 md:p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {navEntries.map((entry) => {
            // Grup dengan sub-menu
            if ("children" in entry) {
              // Mode icon-only: render children sebagai baris icon, tanpa header grup.
              if (collapsed) {
                return (
                  <div key={entry.group} className="space-y-1">
                    {entry.children.map((c) => renderLink(c))}
                  </div>
                );
              }
              const isOpen = openGroups[entry.group];
              const GrpIcon = entry.icon;
              const childActive = entry.children.some(
                (c) => pathname === c.href || pathname.startsWith(c.href + "/")
              );
              return (
                <div key={entry.group} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(entry.group)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      childActive
                        ? "text-gold-300"
                        : "text-emerald-100 hover:bg-emerald-800"
                    }`}
                  >
                    <GrpIcon size={18} className="shrink-0" />
                    <span className="flex-1 text-left font-medium">
                      {entry.label}
                    </span>
                    {isOpen ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                  {isOpen && (
                    <div className="space-y-1">
                      {entry.children.map((c) => renderLink(c, { indent: true }))}
                    </div>
                  )}
                </div>
              );
            }
            // Item flat
            return renderLink(entry);
          })}
        </nav>
        <div className="p-2 md:p-3 border-t border-emerald-900 shrink-0 space-y-1">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={collapsed ? "Keluar / Logout" : undefined}
            className={`w-full flex items-center gap-3 rounded-lg hover:bg-red-900/40 text-red-300 hover:text-red-200 transition-colors font-medium text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed ${collapsed ? "md:justify-center md:px-0 px-4 py-3" : "px-4 py-3"}`}
          >
            <LogOut size={18} className="shrink-0" />{" "}
            <span className={collapsed ? "md:hidden" : ""}>{isLoggingOut ? "Keluar..." : "Keluar / Logout"}</span>
          </button>
          <Link
            href="/"
            title={collapsed ? "Kembali ke Web" : undefined}
            className={`flex items-center gap-3 rounded-lg hover:bg-emerald-900/50 text-emerald-300 hover:text-emerald-200 transition-colors font-medium text-sm ${collapsed ? "md:justify-center md:px-0 px-4 py-3" : "px-4 py-3"}`}
          >
            <LogOut size={18} className="rotate-180 shrink-0" />{" "}
            <span className={collapsed ? "md:hidden" : ""}>Kembali ke Web</span>
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
