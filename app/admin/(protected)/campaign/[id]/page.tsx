"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Sparkles, Users, MessageCircle } from "lucide-react";

type CampaignDetail = {
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
};

type Update = {
  id: number;
  judul: string;
  isi: string;
  img: string | null;
  createdAt: string;
  createdByName: string | null;
};

type DonasiRingkasan = {
  id: number;
  namaDonatur: string;
  nominal: number;
  status: "menunggu" | "terverifikasi" | "ditolak";
  createdAt: string;
};

const STATUS_OPTIONS = [
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
  menunggu: "bg-yellow-100 text-yellow-700",
  terverifikasi: "bg-emerald-100 text-emerald-700",
  ditolak: "bg-red-100 text-red-700",
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export default function CampaignDetailAdminPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [donasi, setDonasi] = useState<DonasiRingkasan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Update form state
  const [updateForm, setUpdateForm] = useState({
    mode: "create" as "create" | "edit" | null,
    data: null as Update | null,
    judul: "",
    isi: "",
    img: "",
  });

  useEffect(() => {
    if (!id) return;
    fetchCampaign();
    fetchUpdates();
    fetchDonasi();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/campaign/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
      }
    } catch (e) {
      console.error("Gagal memuat campaign:", e);
    }
  };

  const fetchUpdates = async () => {
    try {
      const res = await fetch(`/api/campaign-update?campaignId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setUpdates(data);
      }
    } catch (e) {
      console.error("Gagal memuat updates:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonasi = async () => {
    try {
      const res = await fetch(`/api/campaign-donasi?campaignId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setDonasi(data.slice(0, 5)); // Ambil 5 terbaru
      }
    } catch (e) {
      console.error("Gagal memuat donasi:", e);
    }
  };

  const handleQuickUpdate = async (field: string, value: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/campaign/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        fetchCampaign();
      } else {
        alert("Gagal menyimpan perubahan.");
      }
    } catch (e) {
      alert("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!confirm("Yakin ingin menghapus campaign ini? Semua donasi dan update akan terhapus.")) return;
    try {
      const res = await fetch(`/api/campaign/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/campaign");
      } else {
        alert("Gagal menghapus.");
      }
    } catch (e) {
      alert("Gagal menghapus.");
    }
  };

  const openCreateUpdate = () => {
    setUpdateForm({ mode: "create", data: null, judul: "", isi: "", img: "" });
  };

  const openEditUpdate = (u: Update) => {
    setUpdateForm({ mode: "edit", data: u, judul: u.judul, isi: u.isi, img: u.img || "" });
  };

  const handleSubmitUpdate = async () => {
    setSaving(true);
    try {
      const body = {
        campaignId: id,
        judul: updateForm.judul.trim(),
        isi: updateForm.isi.trim(),
        img: updateForm.img.trim() || null,
      };

      let res;
      if (updateForm.mode === "create") {
        res = await fetch("/api/campaign-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/campaign-update/${updateForm.data?.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            judul: updateForm.judul.trim(),
            isi: updateForm.isi.trim(),
            img: updateForm.img.trim() || null,
          }),
        });
      }

      if (res.ok) {
        fetchUpdates();
        setUpdateForm({ mode: null, data: null, judul: "", isi: "", img: "" });
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan update.");
      }
    } catch (e) {
      alert("Gagal menyimpan update.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUpdate = async (updateId: number) => {
    if (!confirm("Hapus update ini?")) return;
    try {
      const res = await fetch(`/api/campaign-update/${updateId}`, { method: "DELETE" });
      if (res.ok) {
        fetchUpdates();
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
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload gagal");
    const data = await res.json();
    return data.url;
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="inline-block w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="mt-4">Memuat campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Campaign tidak ditemukan</p>
        <button onClick={() => router.push("/admin/campaign")} className="mt-4 text-emerald-700 hover:text-emerald-800 font-semibold">
          ← Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/admin/campaign")} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{campaign.judul}</h1>
          <p className="text-sm text-gray-500">{campaign.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQuickUpdate("featured", !campaign.featured)}
            disabled={saving}
            className={`p-2 rounded-lg transition ${campaign.featured ? "bg-gold-100 text-gold-700" : "bg-gray-100 text-gray-600 hover:bg-gold-50"}`}
            title="Toggle Featured"
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <select
            value={campaign.status}
            onChange={(e) => handleQuickUpdate("status", e.target.value)}
            disabled={saving}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleDeleteCampaign}
            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold"
          >
            Hapus
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Target</div>
          <div className="text-2xl font-bold text-gray-900">{rupiah(campaign.targetNominal)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Terkumpul</div>
          <div className="text-2xl font-bold text-emerald-700">
            {campaign.progres && rupiah(campaign.progres.terkumpul)}
          </div>
          <div className="text-xs text-gray-500">
            {campaign.progres?.persentase ?? 0}% • {campaign.progres?.jumlahDonatur ?? 0} donatur
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Status</div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[campaign.status]}`}>
            {STATUS_OPTIONS.find((s) => s.value === campaign.status)?.label}
          </span>
        </div>
      </div>

      {/* Updates Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Update Cerita
          </h2>
          <button
            onClick={openCreateUpdate}
            className="bg-emerald-900 text-white hover:bg-emerald-800 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Tambah Update
          </button>
        </div>
        <div className="p-4 space-y-3">
          {updates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Belum ada update</div>
          ) : (
            updates.map((u) => (
              <div key={u.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{u.judul}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditUpdate(u)}
                      className="p-1 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUpdate(u.id)}
                      className="p-1 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 text-sm mb-2 line-clamp-3">{u.isi}</p>
                {u.img && (
                  <img src={u.img} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
                )}
                <div className="text-xs text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {u.createdByName && ` • ${u.createdByName}`}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Donasi Terbaru */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Donasi Terbaru
          </h2>
          <button
            onClick={() => router.push("/admin/campaign-donasi?campaignId=" + id)}
            className="text-emerald-700 hover:text-emerald-800 text-sm font-semibold"
          >
            Lihat Semua →
          </button>
        </div>
        <div className="p-4">
          {donasi.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Belum ada donasi</div>
          ) : (
            <div className="space-y-2">
              {donasi.map((d) => (
                <div key={d.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="font-medium text-gray-900">{d.namaDonatur}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(d.createdAt).toLocaleDateString("id-ID")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-emerald-700">{rupiah(d.nominal)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status]}`}>
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Update Form */}
      {updateForm.mode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">
                {updateForm.mode === "create" ? "Tambah Update" : "Edit Update"}
              </h2>
              <button
                onClick={() => setUpdateForm({ mode: null, data: null, judul: "", isi: "", img: "" })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Judul *
                </label>
                <input
                  type="text"
                  value={updateForm.judul}
                  onChange={(e) => setUpdateForm({ ...updateForm, judul: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Judul update"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Isi Update *
                </label>
                <textarea
                  value={updateForm.isi}
                  onChange={(e) => setUpdateForm({ ...updateForm, isi: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Isi update..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto (opsional)
                </label>
                {updateForm.img && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 mb-2">
                    <img src={updateForm.img} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const url = await uploadImage(file);
                        setUpdateForm({ ...updateForm, img: url });
                      } catch (err) {
                        alert("Gagal mengupload gambar.");
                      }
                    }
                  }}
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setUpdateForm({ mode: null, data: null, judul: "", isi: "", img: "" })}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitUpdate}
                disabled={saving}
                className="px-6 py-2 bg-emerald-900 text-white hover:bg-emerald-800 disabled:bg-gray-400 rounded-lg font-semibold flex items-center gap-2"
              >
                {saving ? "Menyimpan..." : <><Save className="w-4 h-4" /> Simpan</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
