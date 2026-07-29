"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Plus, Sparkles, Trash2, Save, X, Edit, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

type Campaign = {
  id: number;
  judul: string;
  slug: string;
  kategori: string;
  deskripsiSingkat: string;
  cerita: string | null;
  img: string;
  targetNominal: number;
  tanggalMulai: string;
  tanggalBerakhir: string | null;
  status: "draft" | "aktif" | "tercapai" | "berakhir" | "dibatalkan";
  featured: boolean;
  progres?: {
    terkumpul: number;
    jumlahDonatur: number;
    persentase: number;
  };
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string;
};

const KATEGORI_OPTIONS = [
  { value: "zakat", label: "Zakat" },
  { value: "sedekah", label: "Sedekah" },
  { value: "wakaf", label: "Wakaf" },
  { value: "bencana_alam", label: "Bencana Alam" },
  { value: "pembangunan", label: "Pembangunan" },
  { value: "yatim_dhuafa", label: "Yatim & Dhuafa" },
  { value: "kemanusiaan", label: "Kemanusiaan" },
  { value: "pendidikan", label: "Pendidikan" },
  { value: "operasional", label: "Operasional" },
  { value: "lainnya", label: "Lainnya" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "draft", label: "Draft" },
  { value: "aktif", label: "Aktif" },
  { value: "tercapai", label: "Tercapai" },
  { value: "berakhir", label: "Berakhir" },
  { value: "dibatalkan", label: "Dibatalkan" },
];

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-700",
  aktif: "bg-emerald-100 text-emerald-700",
  tercapai: "bg-amber-100 text-amber-700",
  berakhir: "bg-gray-100 text-gray-500",
  dibatalkan: "bg-red-100 text-red-700",
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

type FormModal = {
  mode: "create" | "edit" | null;
  data: Campaign | null;
};

export default function CampaignAdminPage() {
  const router = useRouter();
  const [data, setData] = useState<Campaign[]>([]);
  const [filtered, setFiltered] = useState<Campaign[]>([]);
  const [search, setSearch] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState<FormModal>({ mode: null, data: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    judul: "",
    kategori: "",
    deskripsiSingkat: "",
    cerita: "",
    img: "",
    targetNominal: "",
    tanggalBerakhir: "",
    status: "draft",
    featured: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = data;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((d) => d.judul.toLowerCase().includes(q));
    }
    if (kategoriFilter) {
      filtered = filtered.filter((d) => d.kategori === kategoriFilter);
    }
    if (statusFilter) {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }
    setFiltered(filtered);
  }, [data, search, kategoriFilter, statusFilter]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/campaign?admin=1");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Gagal memuat data:", e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setForm({
      judul: "",
      kategori: "",
      deskripsiSingkat: "",
      cerita: "",
      img: "",
      targetNominal: "",
      tanggalBerakhir: "",
      status: "draft",
      featured: false,
    });
    setModal({ mode: "create", data: null });
  };

  const openEditModal = (campaign: Campaign) => {
    setForm({
      judul: campaign.judul,
      kategori: campaign.kategori,
      deskripsiSingkat: campaign.deskripsiSingkat,
      cerita: campaign.cerita || "",
      img: campaign.img,
      targetNominal: String(campaign.targetNominal),
      tanggalBerakhir: campaign.tanggalBerakhir ? campaign.tanggalBerakhir.split("T")[0] : "",
      status: campaign.status,
      featured: campaign.featured,
    });
    setModal({ mode: "edit", data: campaign });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const body = {
        judul: form.judul.trim(),
        kategori: form.kategori,
        deskripsiSingkat: form.deskripsiSingkat.trim(),
        cerita: form.cerita.trim() || null,
        img: form.img.trim(),
        targetNominal: Number(form.targetNominal),
        tanggalBerakhir: form.tanggalBerakhir || null,
        status: form.status,
        featured: form.featured,
      };

      let res;
      if (modal.mode === "create") {
        res = await fetch("/api/campaign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/campaign/${modal.data?.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        fetchData();
        setModal({ mode: null, data: null });
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan campaign.");
      }
    } catch (e) {
      alert("Gagal menyimpan campaign.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus campaign ini? Semua donasi dan update akan terhapus.")) return;
    try {
      const res = await fetch(`/api/campaign/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        alert("Gagal menghapus.");
      }
    } catch (e) {
      alert("Gagal menghapus.");
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Upload gagal");
    const data = await res.json();
    return data.url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadImage(file);
      setForm({ ...form, img: url });
    } catch (err) {
      alert("Gagal mengupload gambar.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950">Campaign Donasi</h1>
          <p className="text-gray-600 text-sm">Kelola galang dana & campaign Masjid Al-Kahfi</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-emerald-900 text-white hover:bg-emerald-800 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Buat Campaign
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 w-4 h-4" />
          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Semua Kategori</option>
            {KATEGORI_OPTIONS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search || kategoriFilter || statusFilter ? "Tidak ada data yang cocok." : "Belum ada campaign."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Judul</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Kategori</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Target</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Terkumpul</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">⭐</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c, idx) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => router.push(`/admin/campaign/${c.id}`)}
                  >
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{c.judul}</div>
                      <div className="text-xs text-gray-500">{c.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {KATEGORI_OPTIONS.find((k) => k.value === c.kategori)?.label || c.kategori}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-semibold">{rupiah(c.targetNominal)}</td>
                    <td className="px-4 py-3">
                      {c.progres && (
                        <div>
                          <div className="text-xs text-gray-500">{c.progres.persentase}%</div>
                          <div className="text-emerald-700 font-semibold">{rupiah(c.progres.terkumpul)}</div>
                          <div className="bg-gray-200 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full transition-all"
                              style={{ width: `${Math.min(100, Math.max(0, c.progres.persentase))}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{c.featured && <Sparkles className="w-4 h-4 text-gold-500" />}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[c.status]}`}>
                        {STATUS_OPTIONS.find((s) => s.value === c.status)?.label || c.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {modal.mode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">
                {modal.mode === "create" ? "Buat Campaign Baru" : "Edit Campaign"}
              </h2>
              <button
                onClick={() => setModal({ mode: null, data: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Judul *
                </label>
                <input
                  type="text"
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Judul campaign"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori *
                </label>
                <select
                  value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Pilih...</option>
                  {KATEGORI_OPTIONS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi Singkat * (max 160)
                </label>
                <input
                  type="text"
                  value={form.deskripsiSingkat}
                  onChange={(e) => setForm({ ...form, deskripsiSingkat: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Deskripsi singkat untuk kartu campaign"
                />
                <div className="text-xs text-gray-500 mt-1">{form.deskripsiSingkat.length}/160</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cerita Lengkap (opsional, max 5000)
                </label>
                <textarea
                  value={form.cerita}
                  onChange={(e) => setForm({ ...form, cerita: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Cerita lengkap campaign..."
                />
                <div className="text-xs text-gray-500 mt-1">{form.cerita.length}/5000</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto Sampul *
                </label>
                <div className="space-y-2">
                  {form.img && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                      <img src={form.img} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-gray-500">Format: JPG, PNG, WEBP, GIF (max 2MB)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Nominal *
                </label>
                <input
                  type="number"
                  value={form.targetNominal}
                  onChange={(e) => setForm({ ...form, targetNominal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: 50000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Berakhir (opsional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={form.tanggalBerakhir}
                    onChange={(e) => setForm({ ...form, tanggalBerakhir: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => setForm({ ...form, tanggalBerakhir: "" })}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hapus
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Kosongkan untuk campaign tanpa batas waktu</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="draft">Draft</option>
                  <option value="aktif">Aktif</option>
                  <option value="tercapai">Tercapai</option>
                  <option value="berakhir">Berakhir</option>
                  <option value="dibatalkan">Dibatalkan</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="w-4 h-4 text-emerald-600"
                />
                <label className="text-sm text-gray-700">
                  Tampilkan sebagai unggulan (featured)
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setModal({ mode: null, data: null })}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-emerald-900 text-white hover:bg-emerald-800 disabled:bg-gray-400 rounded-lg font-semibold transition flex items-center gap-2"
              >
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
