'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, X } from 'lucide-react';
import Image from 'next/image';

const DEFAULT_GALERI = [
  { id: 1, title: 'Kajian Rutin', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300' },
  { id: 2, title: 'Pembagian Sembako', img: 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&q=80&w=300' },
  { id: 3, title: 'Pengajian Ibu-ibu', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=300' },
  { id: 4, title: 'Kerja Bakti', img: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=300' },
  { id: 5, title: 'TPA Anak', img: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=300' }
];

export default function AdminGaleri() {
  const [data, setData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Upload State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [img, setImg] = useState('');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kahfi_galeri');
    setTimeout(() => {
      if (saved) {
        try {
          setData(JSON.parse(saved));
        } catch (e) {
          setData(DEFAULT_GALERI);
        }
      } else {
        setData(DEFAULT_GALERI);
        localStorage.setItem('kahfi_galeri', JSON.stringify(DEFAULT_GALERI));
      }
    }, 0);
  }, []);

  const saveToStorage = (newData: any[]) => {
    setData(newData);
    localStorage.setItem('kahfi_galeri', JSON.stringify(newData));
  };

  const handleOpenAdd = () => {
    setTitle('');
    setImg('');
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus foto ini dari galeri?')) {
      const filtered = data.filter(item => item.id !== id);
      saveToStorage(filtered);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('Judul foto wajib diisi!');
      return;
    }

    const defaultImages = [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=300'
    ];
    const finalImg = img.trim() || defaultImages[Math.floor(Math.random() * defaultImages.length)];

    const newId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
    const newItem = { id: newId, title, img: finalImg };
    
    saveToStorage([newItem, ...data]);
    setIsModalOpen(false);
  };

  // Search Filter
  const filteredData = data.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kelola Galeri</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola dokumentasi foto kegiatan masjid.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm hover:shadow-md w-full sm:w-auto justify-center"
        >
          <Plus size={18} /> Unggah Foto
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <div className="relative w-full sm:w-72">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input 
               type="text" 
               placeholder="Cari foto..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" 
             />
          </div>
          <span className="text-xs text-gray-400 font-medium">Total: {filteredData.length} Foto</span>
        </div>

        {filteredData.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredData.map(item => (
              <div key={item.id} className="group relative rounded-xl overflow-hidden border border-gray-200 aspect-square">
                <Image src={item.img} alt={item.title} fill className="object-cover group-hover:scale-105 transition duration-500" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-3">
                   <p className="text-white text-xs font-semibold truncate mb-2">{item.title}</p>
                   <button 
                     onClick={() => handleDelete(item.id)}
                     className="bg-red-500 hover:bg-red-600 text-white p-2 rounded flex items-center justify-center transition w-8 h-8"
                     title="Hapus Foto"
                   >
                     <Trash2 size={14} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400">
            Tidak ada foto ditemukan di galeri.
          </div>
        )}
      </div>

      {/* UPLOAD PHOTO MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
            <div className="bg-emerald-850 text-white p-6 flex justify-between items-center">
              <h3 className="text-lg font-bold">Unggah Foto Baru</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Judul / Keterangan Foto</label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Dokumentasi Kajian Bulanan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">URL Gambar (Opsional)</label>
                <input 
                  type="text"
                  placeholder="Isi dengan link gambar, atau kosongkan untuk acak"
                  value={img}
                  onChange={(e) => setImg(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Gunakan link Unsplash kustom jika Anda memilikinya, jika kosong kami akan memilihkan foto masjid/kegiatan yang menawan secara acak.</p>
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
                  Unggah Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
