'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Bell,
  Image as ImageIcon,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/kegiatan', label: 'Kegiatan', icon: CalendarDays },
    { href: '/admin/berita', label: 'Berita', icon: FileText },
    { href: '/admin/galeri', label: 'Galeri', icon: ImageIcon },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden bg-emerald-950 text-white p-4 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-bold font-serif text-gold-400">Admin Al-Kahfi</h2>
        <button onClick={() => setIsOpen(!isOpen)} className="text-white hover:text-gold-300 transition">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Content */}
      <aside className={`w-64 bg-emerald-950 text-white flex-col absolute md:relative z-50 h-[calc(100vh-68px)] md:h-screen transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex shrink-0`}>
        <div className="hidden md:flex p-6 border-b border-emerald-900 items-center justify-center shrink-0">
           <h2 className="text-2xl font-bold font-serif text-gold-400">Admin CMS</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
           {links.map(link => {
             const Icon = link.icon;
             const isActive = pathname === link.href;
             return (
               <Link 
                 key={link.href} 
                 href={link.href} 
                 onClick={() => setIsOpen(false)}
                 className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-emerald-900 text-gold-300 font-semibold shadow-inner' : 'text-emerald-100 hover:bg-emerald-800'}`}
               >
                  <Icon size={18} /> <span>{link.label}</span>
               </Link>
             )
           })}
        </nav>
        <div className="p-4 border-t border-emerald-900 shrink-0">
           <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900/40 text-red-300 hover:text-red-200 transition-colors">
              <LogOut size={18} /> <span>Kembali ke Web</span>
           </Link>
        </div>
      </aside>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
      )}
    </>
  );
}
