import React from 'react';
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react';

// Simulasi koneksi database (mudah diubah ke Prisma/Drizzle/Cloud SQL nantinya)
async function getKegiatanData() {
  // await new Promise(resolve => setTimeout(resolve, 500)); // Simulasi delay jaringan
  return [
    { id: 1, title: 'Tahsin & Bimbingan Mengaji Quran Dewasa', type: 'Harian', time: 'Setiap Hari (Bada Subuh)', ust: 'Ust. Sulaeman Al-Hafidz', status: 'Aktif' },
    { id: 2, title: 'Pelaksanaan Sholat Jum\'at Berjamaah', type: 'Jum\'at', time: 'Jumat (11:55 WIB)', ust: 'Khotib Bergilir (DKM Al-Kahfi)', status: 'Aktif' },
    { id: 3, title: 'Taman Pendidikan Al-Qur\'an (TPA) Anak', type: 'Harian', time: 'Senin & Kamis (Bada Ashar)', ust: 'Ustadzah Khadijah & Tim', status: 'Aktif' },
    { id: 4, title: 'Penyelenggaraan Qurban Al-Kahfi', type: 'Hari Besar', time: 'Tentative (Hari Raya)', ust: 'Panitia Qurban Bersama', status: 'Nonaktif' }
  ];
}

export default async function AdminKegiatan() {
  const dummyData = await getKegiatanData();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kelola Kegiatan</h2>
          <p className="text-sm text-gray-500 mt-1">Daftar semua kegiatan rutin dan hari besar masjid.</p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm hover:shadow-md w-full sm:w-auto justify-center">
          <Plus size={18} /> Tambah Kegiatan
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:w-72">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input type="text" placeholder="Cari kegiatan..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" />
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
                <th className="px-6 py-4 font-semibold">Nama Kegiatan</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold">Waktu</th>
                <th className="px-6 py-4 font-semibold">Pengisi</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dummyData.map(item => (
                <tr key={item.id} className="hover:bg-emerald-50/30 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">{item.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                      item.type === 'Harian' ? 'bg-blue-50 text-blue-700' :
                      item.type === 'Jum\'at' ? 'bg-amber-50 text-amber-700' :
                      'bg-purple-50 text-purple-700'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">{item.time}</td>
                  <td className="px-6 py-4">{item.ust}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                      {item.status}
                    </span>
                  </td>
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
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-xs text-gray-500">
           <span>Menampilkan 1 hingga 4 dari 4 entri</span>
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
