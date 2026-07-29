"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Filter, MessageCircle, CheckCircle2, XCircle, Trash2, Plus, X } from "lucide-react";

type CampaignDonasi = {
  id: number;
  campaignId: number;
  namaDonatur: string;
  anonim: boolean;
  whatsapp: string | null;
  nominal: number;
  pesan: string | null;
  buktiPembayaran: string | null;
  metodePembayaran: "transfer_bank" | "qris" | "tunai_sekretariat";
  status: "menunggu" | "terverifikasi" | "ditolak";
  catatanAdmin: string | null;
  createdAt: string;
  createdByName: string | null;
  campaignJudul?: string;
};

const STATUS_OPTIONS = [
  { value: "menunggu", label: "Menunggu" },
  { value: "terverifikasi", label: "Terverifikasi" },
  { value: "ditolak", label: "Ditolak" },
  { value: "", label: "Semua" },
];

const STATUS_COLORS = {
  menunggu: "bg-yellow-100 text-yellow-700",
  terverifikasi: "bg-emerald-100 text-emerald-700",
  ditolak: "bg-red-100 text-red-700",
};

const METODE_LABEL = {
  transfer_bank: "Transfer Bank",
  qris: "QRIS",
  tunai_sekretariat: "Tunai Sekretariat",
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export default function CampaignDonasiAdminPage() {
  const searchParams = useSearchParams();
  const campaignIdFilter = searchParams.get("campaignId");

  const [data, setData] = useState<CampaignDonasi[]>([]);
  const [filtered, setFiltered] = useState<CampaignDonasi[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(campaignIdFilter ? "" : "menunggu");
  const [selected, setSelected] = useState<CampaignDonasi | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaigns, setCampaigns] = useState<{ id: number; judul: string }[]>([]);

  // Input manual modal
  const [inputManualModal, setInputManualModal] = useState(false);
  const [inputForm, setInputForm] = useState({
    campaignId: "",
    namaDonatur: "",
    anonim: false,
    nominal: "",
    metodePembayaran: "transfer_bank" as "transfer_bank" | "qris" | "tunai_sekretariat",
    pesan: "",
    status: "terverifikasi" as "menunggu" | "terverifikasi",
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Daftar campaign untuk dropdown input manual
  useEffect(() => {
    fetch("/api/campaign?admin=1")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) =>
        setCampaigns((rows || []).map((c: any) => ({ id: c.id, judul: c.judul })))
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    let filtered = data;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.namaDonatur.toLowerCase().includes(q) ||
          (d.whatsapp && d.whatsapp.includes(q))
      );
    }
    if (statusFilter) {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }
    if (campaignIdFilter) {
      filtered = filtered.filter((d) => d.campaignId === Number(campaignIdFilter));
    }
    setFiltered(filtered);
  }, [data, search, statusFilter, campaignIdFilter]);

  const fetchData = async () => {
    try {
      const url = campaignIdFilter ? `/api/campaign-donasi?campaignId=${campaignIdFilter}` : "/api/campaign-donasi";
      const res = await fetch(url);
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

  const handleUpdateStatus = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/campaign-donasi/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selected.status,
          catatanAdmin: selected.catatanAdmin || undefined,
        }),
      });
      if (res.ok) {
        fetchData();
        setSelected(null);
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan perubahan.");
      }
    } catch (e) {
      alert("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm("Hapus donasi ini?")) return;
    try {
      const res = await fetch(`/api/campaign-donasi/${selected.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        setSelected(null);
      } else {
        alert("Gagal menghapus.");
      }
    } catch (e) {
      alert("Gagal menghapus.");
    }
  };

  const openChatWa = () => {
    if (!selected || !selected.whatsapp) return;
    const msg = `Assalamu'alaikum wr. wb. Terima kasih atas donasi Bapak/Ibu untuk campaign Masjid Al-Kahfi. Kami telah menerima pencatatan donasi sebesar ${rupiah(selected.nominal)}. Mohon konfirmasi pembayaran agar donasi Bapak/Ibu dapat diverifikasi. Jazakumullahu khairan.`;
    window.open(`https://wa.me/${selected.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleSubmitInputManual = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/campaign-donasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: Number(inputForm.campaignId),
          namaDonatur: inputForm.namaDonatur.trim(),
          anonim: inputForm.anonim,
          nominal: Number(inputForm.nominal),
          metodePembayaran: inputForm.metodePembayaran,
          pesan: inputForm.pesan.trim() || null,
          status: inputForm.status,
        }),
      });
      if (res.ok) {
        fetchData();
        setInputManualModal(false);
        setInputForm({
          campaignId: "",
          namaDonatur: "",
          anonim: false,
          nominal: "",
          metodePembayaran: "transfer_bank",
          pesan: "",
          status: "terverifikasi",
        });
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan donasi.");
      }
    } catch (e) {
      alert("Gagal menyimpan donasi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950">Verifikasi Donasi</h1>
          <p className="text-gray-600 text-sm">
            Donasi yang perlu dikonfirmasi pembayarannya
          </p>
        </div>
        <button
          onClick={() => setInputManualModal(true)}
          className="bg-emerald-900 text-white hover:bg-emerald-800 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Input Manual
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
            placeholder="Cari nama atau WhatsApp..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
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

      {/* Summary */}
      {statusFilter === "menunggu" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <Filter className="w-5 h-5" />
            <span className="font-semibold">
              {filtered.length} donasi menunggu verifikasi
            </span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search || statusFilter !== "menunggu" ? "Tidak ada data yang cocok." : "Tidak ada donasi yang menunggu verifikasi."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Campaign</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Donatur</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Nominal</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Metode</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((d, idx) => (
                  <tr
                    key={d.id}
                    onClick={() => setSelected(d)}
                    className="hover:bg-gray-50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-600">{d.campaignJudul || `Campaign #${d.campaignId}`}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {d.anonim ? "Hamba Allah" : d.namaDonatur}
                      </div>
                      {d.whatsapp && <div className="text-xs text-gray-500">{d.whatsapp}</div>}
                      {d.createdByName && <div className="text-xs text-gray-400">oleh {d.createdByName}</div>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">{rupiah(d.nominal)}</td>
                    <td className="px-4 py-3 text-gray-600">{METODE_LABEL[d.metodePembayaran]}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[d.status]}`}>
                        {STATUS_OPTIONS.find((s) => s.value === d.status)?.label || d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Detail Donasi</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-sm font-medium text-gray-700">Nama</label>
                <div className="text-gray-900">{selected.namaDonatur}</div>
              </div>
              {selected.whatsapp && (
                <div>
                  <label className="text-sm font-medium text-gray-700">WhatsApp</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900">{selected.whatsapp}</span>
                    <button
                      onClick={openChatWa}
                      className="text-emerald-700 hover:text-emerald-800 text-sm font-semibold flex items-center gap-1"
                    >
                      <MessageCircle className="w-4 h-4" /> Chat WA
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Nominal</label>
                <div className="text-emerald-700 font-bold text-lg">{rupiah(selected.nominal)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Metode</label>
                <div className="text-gray-900">{METODE_LABEL[selected.metodePembayaran]}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Bukti Pembayaran</label>
                {selected.buktiPembayaran ? (
                  <a
                    href={selected.buktiPembayaran}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-1 relative w-full h-[200px] rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-400 transition group"
                  >
                    <img
                      src={selected.buktiPembayaran}
                      alt="Bukti Pembayaran"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1 rounded">
                        Klik untuk perbesar
                      </span>
                    </div>
                  </a>
                ) : (
                  <div className="text-gray-400 text-sm italic mt-1">
                    Tidak ada bukti pembayaran
                  </div>
                )}
              </div>
              {selected.pesan && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Pesan</label>
                  <div className="text-gray-700 italic">"{selected.pesan}"</div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  value={selected.status}
                  onChange={(e) => setSelected({ ...selected, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mt-1"
                >
                  <option value="menunggu">Menunggu</option>
                  <option value="terverifikasi">Terverifikasi</option>
                  <option value="ditolak">Ditolak</option>
                </select>
              </div>
              {selected.status === "ditolak" && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Catatan Penolakan *</label>
                  <textarea
                    value={selected.catatanAdmin || ""}
                    onChange={(e) => setSelected({ ...selected, catatanAdmin: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mt-1"
                    placeholder="Alasan penolakan..."
                  />
                </div>
              )}
              {selected.status !== "ditolak" && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Catatan Admin (opsional)</label>
                  <textarea
                    value={selected.catatanAdmin || ""}
                    onChange={(e) => setSelected({ ...selected, catatanAdmin: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mt-1"
                    placeholder="Catatan internal..."
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between shrink-0">
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Hapus
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={saving || (selected.status === "ditolak" && !selected.catatanAdmin?.trim())}
                  className="px-6 py-2 bg-emerald-900 text-white hover:bg-emerald-800 disabled:bg-gray-400 rounded-lg font-semibold flex items-center gap-2"
                >
                  {saving ? "Menyimpan..." : <><CheckCircle2 className="w-4 h-4" /> Simpan</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Manual Modal */}
      {inputManualModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Input Manual Donasi</h2>
              <button
                onClick={() => setInputManualModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Campaign *</label>
                <select
                  value={inputForm.campaignId}
                  onChange={(e) => setInputForm({ ...inputForm, campaignId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mt-1"
                >
                  <option value="">Pilih campaign...</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.judul}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Nama Donatur *</label>
                <input
                  type="text"
                  value={inputForm.namaDonatur}
                  onChange={(e) => setInputForm({ ...inputForm, namaDonatur: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mt-1"
                  placeholder="Nama donatur"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={inputForm.anonim}
                  onChange={(e) => setInputForm({ ...inputForm, anonim: e.target.checked })}
                  className="w-4 h-4 text-emerald-600"
                />
                <label className="text-sm text-gray-700">Sembunyikan nama (anonim)</label>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Nominal *</label>
                <input
                  type="number"
                  value={inputForm.nominal}
                  onChange={(e) => setInputForm({ ...inputForm, nominal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mt-1"
                  placeholder="Contoh: 100000"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Metode Pembayaran *</label>
                <select
                  value={inputForm.metodePembayaran}
                  onChange={(e) => setInputForm({ ...inputForm, metodePembayaran: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mt-1"
                >
                  <option value="transfer_bank">Transfer Bank</option>
                  <option value="qris">QRIS</option>
                  <option value="tunai_sekretariat">Tunai Sekretariat</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Pesan/Doa (opsional)</label>
                <textarea
                  value={inputForm.pesan}
                  onChange={(e) => setInputForm({ ...inputForm, pesan: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mt-1"
                  placeholder="Pesan atau doa..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  value={inputForm.status}
                  onChange={(e) => setInputForm({ ...inputForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mt-1"
                >
                  <option value="terverifikasi">Terverifikasi (default)</option>
                  <option value="menunggu">Menunggu</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Input manual biasanya langsung terverifikasi</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setInputManualModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitInputManual}
                disabled={saving}
                className="px-6 py-2 bg-emerald-900 text-white hover:bg-emerald-800 disabled:bg-gray-400 rounded-lg font-semibold flex items-center gap-2"
              >
                {saving ? "Menyimpan..." : <><CheckCircle2 className="w-4 h-4" /> Simpan</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
