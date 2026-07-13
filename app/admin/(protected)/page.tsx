import React from 'react';
import { Users, BookOpen, FileText, Image as ImageIcon, TrendingUp, Calendar as CalendarIcon, Clock, HandCoins } from 'lucide-react';
import Link from 'next/link';
import { getDashboardStats, getRecentActivity } from '@/lib/dashboard';
import { formatRelative } from '@/lib/relative-time';
import type { ActivityItem } from '@/lib/dashboard';
import type { LucideIcon } from 'lucide-react';

/** Halaman utama dashboard admin yang menampilkan statistik dan aktivitas terbaru. */
export default async function AdminDashboard() {
  const [stats, activity] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(8),
  ]);

  const ENTITY_META: Record<
    ActivityItem["entity"],
    { icon: LucideIcon; label: string; color: string }
  > = {
    berita: { icon: FileText, label: "Berita", color: "text-blue-500" },
    kegiatan: { icon: CalendarIcon, label: "Kegiatan", color: "text-amber-500" },
    galeri: { icon: ImageIcon, label: "Galeri", color: "text-purple-500" },
    pengurus: { icon: Users, label: "Pengurus", color: "text-emerald-500" },
    fasilitas: { icon: BookOpen, label: "Fasilitas", color: "text-sky-500" },
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Ringkasan Sistem</h2>
        <p className="text-sm text-gray-500 mt-1">Pantau statistik dan aktivitas terbaru pada website.</p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Kegiatan</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.kegiatan}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <FileText size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Berita Terpublikasi</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.berita}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pengurus DKM</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pengurus}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <ImageIcon size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Foto Galeri</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.galeri}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><TrendingUp size={20} className="text-emerald-600"/> Aktivitas Terbaru</h3>
            <Link href="/admin/berita" className="text-sm text-emerald-600 font-semibold hover:text-emerald-700">Lihat Semua</Link>
          </div>
          <div className="space-y-5 flex-1">
            {activity.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada aktivitas.</p>
            ) : (
              activity.map((a, i) => {
                const meta = ENTITY_META[a.entity];
                const Icon = meta.icon;
                return (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-1">
                      <Icon size={18} className={meta.color} />
                    </div>
                    <div className="flex-1 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                      <p className="text-sm font-semibold text-gray-800 leading-snug">
                        {a.updatedByName || "Sistem"} {a.action === "create" ? "menambahkan" : "memperbarui"} {meta.label} &ldquo;{a.title}&rdquo;
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock size={12} /> {formatRelative(a.updatedAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Aksi Cepat</h3>
          <div className="grid grid-cols-1 gap-3">
             <Link href="/admin/berita" className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition group">
                <div className="bg-white group-hover:bg-emerald-100 p-2 rounded-lg transition"><FileText size={20} /></div>
                <span className="font-semibold text-sm">Tulis Berita Baru</span>
             </Link>
             <Link href="/admin/kegiatan" className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 transition group">
                <div className="bg-white group-hover:bg-amber-100 p-2 rounded-lg transition"><CalendarIcon size={20} /></div>
                <span className="font-semibold text-sm">Jadwalkan Kegiatan</span>
             </Link>
             <Link href="/admin/galeri" className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 transition group">
                <div className="bg-white group-hover:bg-purple-100 p-2 rounded-lg transition"><ImageIcon size={20} /></div>
                <span className="font-semibold text-sm">Unggah Foto Galeri</span>
             </Link>
             <Link href="/admin/kontak-donasi" className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 transition group">
                <div className="bg-white group-hover:bg-amber-100 p-2 rounded-lg transition"><HandCoins size={20} /></div>
                <span className="font-semibold text-sm">Edit Kontak & Donasi</span>
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
