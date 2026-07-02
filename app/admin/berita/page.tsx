'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Filter, X } from 'lucide-react';
import Image from 'next/image';

const DEFAULT_BERITA = [
  { 
    id: 1, 
    title: 'Penyaluran Sembako Rutin Bulanan Bagi Janda dan Lansia Dhuafa Cikoneng', 
    date: '15 Juni 2026', 
    author: 'Admin Sosial', 
    tag: 'Sosial', 
    img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300',
    desc: 'Berkat kerjasama para muhsinin dan Baitul Mal Al-Kahfi, pekan lalu DKM telah berhasil mendistribusikan sebanyak 45 paket kebutuhan pokok untuk mengurangi beban perekonomian dhuafa di RT 03 dan RT 04 Cikoneng. Agenda rutin bulanan ini diharapkan mampu meringankan belanja sembako bulanan mereka di tengah inflasi harga sembako daerah Kabupaten Bandung. Pembagian berjalan dengan santun berkat bantuan para pemuda karang taruna dan panitia ikhwan DKM Al-Kahfi.'
  },
  { 
    id: 2, 
    title: 'Sinergi Pemuda Cikoneng dalam Agenda Bersih-bersih Masjid', 
    date: '08 Juni 2026', 
    author: 'Ketua Pemuda', 
    tag: 'Kebersihan', 
    img: 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&q=80&w=300',
    desc: 'DKM Al-Kahfi menggerakkan kerja bakti bersama puluhan pemuda lingkungan. Pembersihan difokuskan ke karpet utama ruang shalat serta parit luar guna mengantisipasi banjir genangan musim penghujan. Selain melatih kebersamaan antar warga dan pemuda, kebersihan fasilitas umum tempat beribadah diyakini membawa berkah ukhuwah serta menciptakan kenyamanan ekstra bagi para jamaah yang sholat.'
  },
  { 
    id: 3, 
    title: 'Kajian Akbar Keluarga Sakinah Sambut Tahun Baru Hijriyah', 
    date: '01 Juni 2026', 
    author: 'Seksi Dakwah', 
    tag: 'Tarbiyah', 
    img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=300',
    desc: 'Kajian spesial yang diselenggarakan DKM dihadiri oleh ratusan ibu-ibu dan bapak-bapak Cikoneng. Menghadirkan narasumber utama Dr. KH. Mulyana membahas cara membangun keharmonisan rumah tangga di tengah tantangan teknologi modern yang melingkupi keseharian anak-anak zaman sekarang.'
  }
];

export default function AdminBerita() {
  const [data, setData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('Semua');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('Sosial');
  const [author, setAuthor] = useState('Admin');
  const [img, setImg] = useState('');
  const [desc, setDesc] = useState('');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kahfi_berita');
    setTimeout(() => {
      if (saved) {
        try {
          setData(JSON.parse(saved));
        } catch (e) {
          setData(DEFAULT_BERITA);
        }
      } else {
        setData(DEFAULT_BERITA);
        localStorage.setItem('kahfi_berita', JSON.stringify(DEFAULT_BERITA));
      }
    }, 0);
  }, []);

  const saveToStorage = (newData: any[]) => {
    setData(newData);
    localStorage.setItem('kahfi_berita', JSON.stringify(newData));
  };

  const handleOpenAdd = () => {
    setEditItem(null);
    setTitle('');
    setTag('Sosial');
    setAuthor('Admin');
    setImg('');
    setDesc('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditItem(item);
    setTitle(item.title);
    setTag(item.tag);
    setAuthor(item.author);
    setImg(item.img || '');
    setDesc(item.desc || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus berita ini?')) {
      const filtered = data.filter(item => item.id !== id);
      saveToStorage(filtered);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc) {
      alert('Judul dan Isi Berita harus diisi!');
      return;
    }

    const defaultImages = [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=300'
    ];
    const finalImg = img.trim() || defaultImages[Math.floor(Math.random() * defaultImages.length)];

    const options = { day: 'numeric', month: 'long', year: 'numeric' } as const;
    const formattedDate = new Date().toLocaleDateString('id-ID', options);

    if (editItem) {
      // Update
      const updated = data.map(item => {
        if (item.id === editItem.id) {
          return { ...item, title, tag, author, img: finalImg, desc };
        }
        return item;
      });
      saveToStorage(updated);
    } else {
      // Create
      const newId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
      const newItem = {
        id: newId,
        title,
        tag,
        author,
        date: formattedDate,
        img: finalImg,
        desc
      };
      saveToStorage([...data, newItem]);
    }
    setIsModalOpen(false);
  };

  // Filter and Search computation
  const filteredData = data.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterTag === 'Semua' || item.tag === filterTag;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kelola Berita</h2>
          <p className="text-sm text-gray-500 mt-1">Daftar artikel, liputan acara, dan berita seputar masjid.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm hover:shadow-md w-full sm:w-auto justify-center"
        >
          <Plus size={18} /> Tulis Berita
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:w-72">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input 
               type="text" 
               placeholder="Cari berita..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" 
             />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Filter Kategori:</span>
             <select 
               value={filterTag} 
               onChange={(e) => setFilterTag(e.target.value)}
               className="text-sm text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 cursor-pointer"
             >
               <option value="Semua">Semua Kategori</option>
               <option value="Sosial">Sosial</option>
               <option value="Kebersihan">Kebersihan</option>
               <option value="Tarbiyah">Tarbiyah</option>
             </select>
          </div>
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
              {filteredData.length > 0 ? (
                filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-emerald-50/30 transition">
                    <td className="px-6 py-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden relative bg-gray-100 border border-gray-200">
                         <Image src={item.img} alt="thumb" fill className="object-cover" referrerPolicy="no-referrer" />
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
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">Tidak ada berita ditemukan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-xs text-gray-500">
           <span>Menampilkan {filteredData.length} entri</span>
        </div>
      </div>

      {/* CRUD MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-emerald-850 text-white p-6 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold">{editItem ? 'Edit Berita Masjid' : 'Tulis Berita Baru'}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Judul Berita</label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Penyaluran Paket Makanan Jumat Berkah"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Kategori Berita</label>
                  <select 
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="Sosial">Sosial</option>
                    <option value="Kebersihan">Kebersihan</option>
                    <option value="Tarbiyah">Tarbiyah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Penulis</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Admin Sosial"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">URL Gambar Thumbnail (Opsional)</label>
                <input 
                  type="text"
                  placeholder="Isi untuk URL kustom atau kosongi untuk otomatis"
                  value={img}
                  onChange={(e) => setImg(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Isi Konten Berita</label>
                <textarea 
                  required
                  rows={6}
                  placeholder="Tulis artikel atau liputan kegiatan selengkapnya disini..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 shrink-0">
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
                  {editItem ? 'Simpan Perubahan' : 'Terbitkan Berita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
