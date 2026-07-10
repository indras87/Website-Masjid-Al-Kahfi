import React from 'react';
import { Users, BookOpen, FileText, Image as ImageIcon, TrendingUp, Calendar as CalendarIcon, Clock, HandCoins } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
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
            <p className="text-3xl font-bold text-gray-900 mt-1">12</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <FileText size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Berita Terpublikasi</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">24</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Jumlah Jamaah</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">1.2K</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <ImageIcon size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Foto Galeri</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">45</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Recent Activity Placeholder */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><TrendingUp size={20} className="text-emerald-600"/> Aktivitas Terbaru</h3>
            <Link href="/admin/berita" className="text-sm text-emerald-600 font-semibold hover:text-emerald-700">Lihat Semua</Link>
          </div>
          <div className="space-y-5 flex-1">
            {[
              { title: 'Menambahkan Berita Baru: "Penyaluran Sembako Rutin Bulanan"', time: '2 jam yang lalu', type: 'berita' },
              { title: 'Mengubah Jadwal Kegiatan: "Taman Pendidikan Al-Qur\'an (TPA)"', time: '5 jam yang lalu', type: 'kegiatan' },
              { title: 'Mengunggah 3 Foto Baru ke Galeri', time: 'Kemarin, 14:30 WIB', type: 'galeri' }
            ].map((activity, i) => (
               <div key={i} className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-1">
                   {activity.type === 'berita' && <FileText size={18} className="text-blue-500" />}
                   {activity.type === 'kegiatan' && <CalendarIcon size={18} className="text-amber-500" />}
                   {activity.type === 'galeri' && <ImageIcon size={18} className="text-purple-500" />}
                 </div>
                 <div className="flex-1 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                   <p className="text-sm font-semibold text-gray-800 leading-snug">{activity.title}</p>
                   <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock size={12}/> Oleh Admin Utama • {activity.time}</p>
                 </div>
               </div>
            ))}
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
