'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, Save, Users, Eye, Target, Sparkles,
  User, Droplet, Ambulance, BookOpen, Car, Wifi, Clock, HeartPulse, Loader2
} from 'lucide-react';
import Image from 'next/image';
import ImageUpload from '@/app/admin/components/ImageUpload';

const ICON_OPTIONS = [
  { value: 'User', label: 'Sajadah / Jamaah (User)' },
  { value: 'Droplet', label: 'Wudhu / Air (Droplet)' },
  { value: 'Ambulance', label: 'Layanan Ambulans (Ambulance)' },
  { value: 'BookOpen', label: 'Ruang Belajar / TPA (BookOpen)' },
  { value: 'Car', label: 'Area Parkir (Car)' },
  { value: 'Wifi', label: 'Internet nirkabel (Wifi)' },
  { value: 'Clock', label: 'Layanan Waktu (Clock)' },
  { value: 'HeartPulse', label: 'Layanan Kesehatan (HeartPulse)' }
];

export default function AdminTentang() {
  const [activeTab, setActiveTab] = useState<'pengurus' | 'visi-misi' | 'fasilitas'>('pengurus');
  const [loading, setLoading] = useState(false);

  // ==========================================
  // STATE KEPENGURUSAN
  // ==========================================
  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [isPengurusModalOpen, setIsPengurusModalOpen] = useState(false);
  const [editPengurus, setEditPengurus] = useState<any>(null);
  const [pName, setPName] = useState('');
  const [pRole, setPRole] = useState('');
  const [pPeriod, setPPeriod] = useState('Periode 2024-2028');
  const [pImg, setPImg] = useState('');

  // ==========================================
  // STATE VISI & MISI
  // ==========================================
  const [visi, setVisi] = useState('');
  const [misi, setMisi] = useState(''); // Textarea string, split by newline

  // ==========================================
  // STATE FASILITAS
  // ==========================================
  const [fasilitasList, setFasilitasList] = useState<any[]>([]);
  const [isFasilitasModalOpen, setIsFasilitasModalOpen] = useState(false);
  const [editFasilitas, setEditFasilitas] = useState<any>(null);
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fIcon, setFIcon] = useState('User');

  // ==========================================
  // LOAD ALL DATA
  // ==========================================
  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch Pengurus
      const pRes = await fetch('/api/pengurus');
      if (pRes.ok) setPengurusList(await pRes.json());

      // Fetch Visi Misi
      const vRes = await fetch('/api/profil');
      if (vRes.ok) {
        const pData = await vRes.json();
        setVisi(pData.visi || '');
        setMisi(pData.misi || '');
      }

      // Fetch Fasilitas
      const fRes = await fetch('/api/fasilitas');
      if (fRes.ok) setFasilitasList(await fRes.json());

    } catch (err) {
      console.error('Gagal mengambil data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================
  // ACTIONS KEPENGURUSAN
  // ==========================================
  const handleOpenAddPengurus = () => {
    setEditPengurus(null);
    setPName('');
    setPRole('');
    setPPeriod('Periode 2024-2028');
    setPImg('');
    setIsPengurusModalOpen(true);
  };

  const handleOpenEditPengurus = (item: any) => {
    setEditPengurus(item);
    setPName(item.name);
    setPRole(item.role);
    setPPeriod(item.period);
    setPImg(item.img);
    setIsPengurusModalOpen(true);
  };

  const handleDeletePengurus = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengurus ini?')) return;
    try {
      const res = await fetch(`/api/pengurus/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPengurusList(pengurusList.filter(item => item.id !== id));
      } else {
        alert('Gagal menghapus pengurus');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitPengurus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pRole || !pImg) {
      alert('Semua bidang (Nama, Jabatan, Foto) harus diisi!');
      return;
    }

    const payload = { name: pName, role: pRole, period: pPeriod, img: pImg };

    try {
      if (editPengurus) {
        // Update
        const res = await fetch(`/api/pengurus/${editPengurus.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setPengurusList(pengurusList.map(item => item.id === editPengurus.id ? updated : item));
          setIsPengurusModalOpen(false);
        } else {
          alert('Gagal memperbarui pengurus');
        }
      } else {
        // Create
        const res = await fetch('/api/pengurus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setPengurusList([...pengurusList, created]);
          setIsPengurusModalOpen(false);
        } else {
          alert('Gagal menambah pengurus');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // ACTIONS VISI & MISI
  // ==========================================
  const handleSaveVisiMisi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visi || !misi) {
      alert('Visi dan Misi tidak boleh kosong!');
      return;
    }

    try {
      const res = await fetch('/api/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visi, misi }),
      });
      if (res.ok) {
        alert('Visi & Misi berhasil disimpan!');
      } else {
        alert('Gagal menyimpan Visi & Misi');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // ACTIONS FASILITAS
  // ==========================================
  const handleOpenAddFasilitas = () => {
    setEditFasilitas(null);
    setFTitle('');
    setFDesc('');
    setFIcon('User');
    setIsFasilitasModalOpen(true);
  };

  const handleOpenEditFasilitas = (item: any) => {
    setEditFasilitas(item);
    setFTitle(item.title);
    setFDesc(item.desc);
    setFIcon(item.icon);
    setIsFasilitasModalOpen(true);
  };

  const handleDeleteFasilitas = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus fasilitas ini?')) return;
    try {
      const res = await fetch(`/api/fasilitas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFasilitasList(fasilitasList.filter(item => item.id !== id));
      } else {
        alert('Gagal menghapus fasilitas');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitFasilitas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fTitle || !fDesc || !fIcon) {
      alert('Semua bidang wajib diisi!');
      return;
    }

    const payload = { title: fTitle, desc: fDesc, icon: fIcon };

    try {
      if (editFasilitas) {
        // Update
        const res = await fetch(`/api/fasilitas/${editFasilitas.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setFasilitasList(fasilitasList.map(item => item.id === editFasilitas.id ? updated : item));
          setIsFasilitasModalOpen(false);
        } else {
          alert('Gagal memperbarui fasilitas');
        }
      } else {
        // Create
        const res = await fetch('/api/fasilitas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setFasilitasList([...fasilitasList, created]);
          setIsFasilitasModalOpen(false);
        } else {
          alert('Gagal menambah fasilitas');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper render icon Lucide berdasarkan nama string
  const renderIcon = (name: string) => {
    switch (name) {
      case 'User': return <User size={20} />;
      case 'Droplet': return <Droplet size={20} />;
      case 'Ambulance': return <Ambulance size={20} />;
      case 'BookOpen': return <BookOpen size={20} />;
      case 'Car': return <Car size={20} />;
      case 'Wifi': return <Wifi size={20} />;
      case 'Clock': return <Clock size={20} />;
      case 'HeartPulse': return <HeartPulse size={20} />;
      default: return <User size={20} />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Kelola Informasi "Tentang Masjid"</h2>
        <p className="text-sm text-gray-500 mt-1">Atur profil kepengurusan, visi & misi, serta fasilitas sarana prasarana Masjid Al-Kahfi.</p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-gray-200 gap-1 bg-white p-1 rounded-xl shadow-sm shrink-0">
        <button
          onClick={() => setActiveTab('pengurus')}
          className={`flex-1 py-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
            activeTab === 'pengurus'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users size={16} /> Pengurus DKM
        </button>
        <button
          onClick={() => setActiveTab('visi-misi')}
          className={`flex-1 py-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
            activeTab === 'visi-misi'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Sparkles size={16} /> Visi & Misi
        </button>
        <button
          onClick={() => setActiveTab('fasilitas')}
          className={`flex-1 py-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
            activeTab === 'fasilitas'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Droplet size={16} /> Fasilitas Masjid
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-2 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="animate-spin text-emerald-600" size={36} />
          <p className="text-sm font-medium">Memuat data...</p>
        </div>
      ) : (
        <>
          {/* ========================================================= */}
          {/* TAB 1: KEPENGURUSAN */}
          {/* ========================================================= */}
          {activeTab === 'pengurus' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase">Jumlah Pengurus: {pengurusList.length} Orang</span>
                <button
                  onClick={handleOpenAddPengurus}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Plus size={16} /> Tambah Pengurus
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {pengurusList.length > 0 ? (
                  pengurusList.map(item => (
                    <div key={item.id} className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition relative group">
                      <div>
                        <div className="w-20 h-20 relative mx-auto mb-3 rounded-full overflow-hidden border-2 border-emerald-500 bg-gray-50">
                          <Image src={item.img} alt={item.name} fill sizes="80px" className="object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm leading-snug">{item.name}</h4>
                        <p className="text-xs text-emerald-600 font-semibold uppercase mt-1">{item.role}</p>
                        <p className="text-[10px] text-gray-400 mt-2 bg-gray-50 px-2.5 py-0.5 rounded-full inline-block">{item.period}</p>
                      </div>

                      <div className="flex justify-center gap-2 mt-4 pt-3 border-t border-gray-50">
                        <button
                          onClick={() => handleOpenEditPengurus(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeletePengurus(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
                    Belum ada data pengurus dimasukkan.
                  </div>
                )}
              </div>

              {/* MODAL PENGURUS */}
              {isPengurusModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
                    <div className="bg-emerald-850 text-white p-6 flex justify-between items-center">
                      <h3 className="text-lg font-bold">{editPengurus ? 'Edit Anggota Pengurus' : 'Tambah Anggota Pengurus'}</h3>
                      <button onClick={() => setIsPengurusModalOpen(false)} className="text-white/80 hover:text-white">&times;</button>
                    </div>

                    <form onSubmit={handleSubmitPengurus} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Lengkap & Gelar</label>
                        <input
                          type="text" required placeholder="Contoh: H. Endang Wijaya, Lc." value={pName}
                          onChange={(e) => setPName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Jabatan Kepengurusan</label>
                        <input
                          type="text" required placeholder="Contoh: Wakil Ketua" value={pRole}
                          onChange={(e) => setPRole(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Masa Jabatan / Periode</label>
                        <input
                          type="text" required value={pPeriod}
                          onChange={(e) => setPPeriod(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <ImageUpload value={pImg} onChange={setPImg} label="Foto Profil Pengurus (Maksimal 2MB)" />

                      <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                        <button
                          type="button" onClick={() => setIsPengurusModalOpen(false)}
                          className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                        >
                          Batal
                        </button>
                        <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition">
                          Simpan
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: VISI & MISI */}
          {/* ========================================================= */}
          {activeTab === 'visi-misi' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <form onSubmit={handleSaveVisiMisi} className="space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-50">
                  <Eye className="text-emerald-600" size={22} />
                  <h3 className="font-serif text-lg font-bold text-gray-800">Ubah Visi Masjid</h3>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pernyataan Visi Utama</label>
                  <textarea
                    required rows={3} value={visi} onChange={(e) => setVisi(e.target.value)}
                    placeholder="Contoh: Menjadi masjid yang mandiri, makmur, serta melahirkan generasi rabbani..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed bg-gray-50/50"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4 pb-4 border-b border-gray-50">
                  <Target className="text-gold-500" size={22} />
                  <h3 className="font-serif text-lg font-bold text-gray-800">Ubah Misi Masjid</h3>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Daftar Poin Misi</label>
                  <p className="text-[11px] text-gray-400 mb-3">Ketikkan misi masjid Anda. **Tuliskan satu poin misi pada setiap baris** (tekan Enter untuk baris baru).</p>
                  <textarea
                    required rows={6} value={misi} onChange={(e) => setMisi(e.target.value)}
                    placeholder="Misi 1&#10;Misi 2&#10;Misi 3"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed bg-gray-50/50 font-mono"
                  />
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm"
                  >
                    <Save size={18} /> Simpan Perubahan Visi Misi
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: FASILITAS */}
          {/* ========================================================= */}
          {activeTab === 'fasilitas' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase">Jumlah Fasilitas: {fasilitasList.length} Item</span>
                <button
                  onClick={handleOpenAddFasilitas}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Plus size={16} /> Tambah Fasilitas
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {fasilitasList.length > 0 ? (
                  fasilitasList.map(item => (
                    <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center shrink-0 mt-1">
                          {renderIcon(item.icon)}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-base leading-snug">{item.title}</h4>
                          <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-50">
                        <button
                          onClick={() => handleOpenEditFasilitas(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteFasilitas(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
                    Belum ada sarana prasarana yang dimasukkan.
                  </div>
                )}
              </div>

              {/* MODAL FASILITAS */}
              {isFasilitasModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
                    <div className="bg-emerald-850 text-white p-6 flex justify-between items-center">
                      <h3 className="text-lg font-bold">{editFasilitas ? 'Edit Fasilitas Masjid' : 'Tambah Fasilitas Baru'}</h3>
                      <button onClick={() => setIsFasilitasModalOpen(false)} className="text-white/80 hover:text-white">&times;</button>
                    </div>

                    <form onSubmit={handleSubmitFasilitas} className="p-6 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Fasilitas / Sarana</label>
                        <input
                          type="text" required placeholder="Contoh: Wudhu & Toilet Higienis" value={fTitle}
                          onChange={(e) => setFTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Deskripsi Singkat</label>
                        <textarea
                          required rows={3} placeholder="Sebutkan kapasitas, kegunaan, atau kelengkapan..." value={fDesc}
                          onChange={(e) => setFDesc(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Pilih Ikon Representatif</label>
                        <select
                          value={fIcon} onChange={(e) => setFIcon(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-500"
                        >
                          {ICON_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                        <button
                          type="button" onClick={() => setIsFasilitasModalOpen(false)}
                          className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                        >
                          Batal
                        </button>
                        <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition">
                          Simpan
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
