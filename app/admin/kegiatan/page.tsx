'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Filter, X } from 'lucide-react';

const DEFAULT_KEGIATAN = [
  { id: 1, title: 'Tahsin & Bimbingan Mengaji Quran Dewasa', type: 'Harian', time: 'Setiap Hari (Bada Subuh)', ust: 'Ust. Sulaeman Al-Hafidz', status: 'Aktif' },
  { id: 2, title: 'Pelaksanaan Sholat Jum\'at Berjamaah', type: 'Jum\'at', time: 'Jumat (11:55 WIB)', ust: 'Khotib Bergilir (DKM Al-Kahfi)', status: 'Aktif' },
  { id: 3, title: 'Taman Pendidikan Al-Qur\'an (TPA) Anak', type: 'Harian', time: 'Senin & Kamis (Bada Ashar)', ust: 'Ustadzah Khadijah & Tim', status: 'Aktif' },
  { id: 4, title: 'Penyelenggaraan Qurban Al-Kahfi', type: 'Hari Besar', time: 'Tentative (Hari Raya)', ust: 'Panitia Qurban Bersama', status: 'Nonaktif' }
];

export default function AdminKegiatan() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('Semua');
  
  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Harian');
  const [time, setTime] = useState('');
  const [ust, setUst] = useState('');
  const [status, setStatus] = useState('Aktif');

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/kegiatan');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        console.error('Failed to fetch kegiatan');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditItem(null);
    setTitle('');
    setType('Harian');
    setTime('');
    setUst('');
    setStatus('Aktif');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditItem(item);
    setTitle(item.title);
    setType(item.type);
    setTime(item.time);
    setUst(item.ust);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) {
      try {
        const res = await fetch(`/api/kegiatan/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setData(data.filter(item => item.id !== id));
        } else {
          alert('Gagal menghapus kegiatan');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !time || !ust) {
      alert('Harap isi semua kolom!');
      return;
    }

    const payload = { title, type, time, ust, status };

    try {
      if (editItem) {
        // Update
        const res = await fetch(`/api/kegiatan/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updatedItem = await res.json();
          setData(data.map(item => item.id === editItem.id ? updatedItem : item));
          setIsModalOpen(false);
        } else {
          alert('Gagal memperbarui kegiatan');
        }
      } else {
        // Create
        const res = await fetch('/api/kegiatan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const newItem = await res.json();
          setData([...data, newItem]);
          setIsModalOpen(false);
        } else {
          alert('Gagal membuat kegiatan');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi server');
    }
  };

  // Filter and search computation
  const filteredData = data.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.ust.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'Semua' || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kelola Kegiatan</h2>
          <p className="text-sm text-gray-500 mt-1">Daftar semua kegiatan rutin dan hari besar masjid.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm hover:shadow-md w-full sm:w-auto justify-center"
        >
          <Plus size={18} /> Tambah Kegiatan
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:w-72">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input 
               type="text" 
               placeholder="Cari kegiatan..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" 
             />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Filter Kategori:</span>
             <select 
               value={filterType} 
               onChange={(e) => setFilterType(e.target.value)}
               className="text-sm text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 cursor-pointer"
             >
               <option value="Semua">Semua Kategori</option>
               <option value="Harian">Harian</option>
               <option value="Jum'at">Jum&apos;at</option>
               <option value="Hari Besar">Hari Besar</option>
             </select>
          </div>
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">Memuat data kegiatan...</td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-emerald-50/30 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900 whitespace-normal max-w-xs">{item.title}</td>
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
                        <button 
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition" 
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition" 
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">Tidak ada data kegiatan ditemukan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-xs text-gray-500">
           <span>Menampilkan {filteredData.length} entri</span>
        </div>
      </div>

      {/* CRUD MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
            <div className="bg-emerald-850 text-white p-6 flex justify-between items-center">
              <h3 className="text-lg font-bold">{editItem ? 'Edit Kegiatan Masjid' : 'Tambah Kegiatan Baru'}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Kegiatan</label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Kajian Fiqih Bulanan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Kategori</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="Harian">Harian</option>
                    <option value="Jum'at">Jum&apos;at</option>
                    <option value="Hari Besar">Hari Besar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status Keaktifan</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Waktu / Jadwal Pelaksanaan</label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Setiap Sabtu Sore (Bada Ashar)"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ustadz / Pengisi Acara</label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Ust. Hilman Fauzi"
                  value={ust}
                  onChange={(e) => setUst(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition"
                >
                  {editItem ? 'Simpan Perubahan' : 'Tambah Kegiatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
