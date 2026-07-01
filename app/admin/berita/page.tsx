import React from 'react';
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react';
import Image from 'next/image';

// Simulasi koneksi database (mudah diubah ke Prisma/Drizzle/Cloud SQL nantinya)
async function getBeritaData() {
  return [
    { id: 1, title: 'Penyaluran Sembako Rutin Bulanan Bagi Janda dan Lansia', date: '15 Juni 2026', author: 'Admin Sosial', tag: 'Sosial', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=150' },
    { id: 2, title: 'Sinergi Pemuda Cikoneng dalam Agenda Bersih-bersih', date: '08 Juni 2026', author: 'Ketua Pemuda', tag: 'Kebersihan', img: 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&q=80&w=150' },
    { id: 3, title: 'Kajian Akbar Keluarga Sakinah Sambut Tahun Baru Hijriyah', date: '01 Juni 2026', author: 'Seksi Dakwah', tag: 'Tarbiyah', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=150' }
  ];
}

export default async function AdminBerita() {
  const dummyData = await getBeritaData();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kelola Berita</h2>
          <p className="text-sm text-gray-500 mt-1">Daftar artikel, liputan acara, dan berita seputar masjid.</p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm hover:shadow-md w-full sm:w-auto justify-center">
          <Plus size={18} /> Tulis Berita
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:w-72">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input type="text" placeholder="Cari berita..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" />
          </div>
          <button className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 w-full sm:w-auto justify-center">
             <Filter size={16}/> Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-700 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold w-16">Thumbnail</th>
                <th className="px-6 py-4 font-semibold">Judul Berita</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold">Tanggal</th>
                <th className="px-6 py-4 font-semibold">Penulis</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dummyData.map(item => (
                <tr key={item.id} className="hover:bg-emerald-50/30 transition">
                  <td className="px-6 py-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden relative bg-gray-100 border border-gray-200">
                       <Image src={item.img} alt="thumb" fill className="object-cover" />
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900 whitespace-normal min-w-[200px]">{item.title}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                      {item.tag}
                    </span>
                  </td>
                  <td className="px-6 py-4">{item.date}</td>
                  <td className="px-6 py-4">{item.author}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Edit"><Pencil size={16} /></button>
                      <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition" title="Hapus"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-xs text-gray-500">
           <span>Menampilkan 1 hingga 3 dari 3 entri</span>
           <div className="flex gap-1">
             <button className="px-3 py-1.5 border border-gray-200 bg-white rounded hover:bg-gray-50 disabled:opacity-50" disabled>Sebelumnya</button>
             <button className="px-3 py-1.5 border border-emerald-500 bg-emerald-500 text-white rounded font-medium">1</button>
             <button className="px-3 py-1.5 border border-gray-200 bg-white rounded hover:bg-gray-50 disabled:opacity-50" disabled>Selanjutnya</button>
           </div>
        </div>
      </div>
    </div>
  );
}
