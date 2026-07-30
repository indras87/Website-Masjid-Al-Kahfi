"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, MessageCircle, Trash2, Save, X } from "lucide-react";

type DonaturTetap = {
  id: number;
  nama: string;
  jenisKelamin: "laki-laki" | "perempuan";
  whatsapp: string;
  alamat: string | null;
  email: string | null;
  nominalBulanan: number;
  nominalLainnya: boolean;
  tanggalPembayaran: string;
  metodePembayaran: "transfer_bank" | "qris" | "tunai_sekretariat";
  status: "baru" | "terkonfirmasi" | "aktif" | "berhenti";
  catatanAdmin: string | null;
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string;
};

const STATUS_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "baru", label: "Baru" },
  { value: "terkonfirmasi", label: "Terkonfirmasi" },
  { value: "aktif", label: "Aktif" },
  { value: "berhenti", label: "Berhenti" },
];

const STATUS_COLORS = {
  baru: "bg-gray-100 text-gray-700",
  terkonfirmasi: "bg-blue-100 text-blue-700",
  aktif: "bg-emerald-100 text-emerald-700",
  berhenti: "bg-red-100 text-red-700",
};

export default function DonaturTetapAdminPage() {
  const [data, setData] = useState<DonaturTetap[]>([]);
  const [filtered, setFiltered] = useState<DonaturTetap[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<DonaturTetap | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = data;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.nama.toLowerCase().includes(q) || d.whatsapp.includes(q)
      );
    }
    if (statusFilter) {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }
    setFiltered(filtered);
  }, [data, search, statusFilter]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/donatur-tetap?admin=1");
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

  const handleSaveStatus = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/donatur-tetap/${selected.id}`, {
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
    if (!confirm("Yakin ingin menghapus donatur ini?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/donatur-tetap/${selected.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
        setSelected(null);
      } else {
        alert("Gagal menghapus.");
      }
    } catch (e) {
      alert("Gagal menghapus.");
    } finally {
      setSaving(false);
    }
  };

  const openChatWa = () => {
    if (!selected) return;
    const msg = `Assalamu'alaikum wr. wb. Terima kasih atas niat baik Bapak/Ibu untuk menjadi donatur tetap Masjid Al-Kahfi. Mohon konfirmasi untuk proses selanjutnya.`;
    window.open(`https://wa.me/${selected.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950">Donatur Tetap</h1>
          <p className="text-gray-600 text-sm">Kelola pendaftaran donatur tetap operasional</p>
        </div>
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

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search || statusFilter ? "Tidak ada data yang cocok." : "Belum ada data."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Nama</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">WhatsApp</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Nominal/bln</th>
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
                    <td className="px-4 py-3 font-medium text-gray-900">{d.nama}</td>
                    <td className="px-4 py-3 text-gray-600">{d.whatsapp}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(d.nominalBulanan)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[d.status]}`}>
                        {d.status === "baru" && "Baru"}
                        {d.status === "terkonfirmasi" && "Terkonfirmasi"}
                        {d.status === "aktif" && "Aktif"}
                        {d.status === "berhenti" && "Berhenti"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-emerald-950">Detail Donatur</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Nama</label>
                  <p className="font-medium text-gray-900">{selected.nama}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Jenis Kelamin</label>
                  <p className="text-gray-700 capitalize">{selected.jenisKelamin}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">WhatsApp</label>
                  <p className="text-gray-700">{selected.whatsapp}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                  <p className="text-gray-700">{selected.email || "-"}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Alamat</label>
                  <p className="text-gray-700">{selected.alamat || "-"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Nominal Bulanan</label>
                  <p className="font-medium text-emerald-900">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(selected.nominalBulanan)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Tanggal Pembayaran</label>
                  <p className="text-gray-700">{selected.tanggalPembayaran}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Metode Pembayaran</label>
                  <p className="text-gray-700 capitalize">{selected.metodePembayaran.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                  <p className={`inline-block px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[selected.status]}`}>
                    {selected.status === "baru" && "Baru"}
                    {selected.status === "terkonfirmasi" && "Terkonfirmasi"}
                    {selected.status === "aktif" && "Aktif"}
                    {selected.status === "berhenti" && "Berhenti"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Catatan Admin</label>
                  <textarea
                    value={selected.catatanAdmin || ""}
                    onChange={(e) =>
                      setSelected({ ...selected, catatanAdmin: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Dibuat Oleh</label>
                  <p className="text-gray-700">{selected.createdByName || "-"}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Diperbarui Oleh</label>
                  <p className="text-gray-700">{selected.updatedByName || "-"}</p>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="flex items-center gap-3 mb-3 sm:mb-0">
                <label className="text-xs font-semibold text-gray-500 uppercase mr-2">Ubah Status:</label>
                <select
                  value={selected.status}
                  onChange={(e) =>
                    setSelected({
                      ...selected,
                      status: e.target.value as "baru" | "terkonfirmasi" | "aktif" | "berhenti",
                    })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                >
                  <option value="baru">Baru</option>
                  <option value="terkonfirmasi">Terkonfirmasi</option>
                  <option value="aktif">Aktif</option>
                  <option value="berhenti">Berhenti</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={openChatWa}
                  className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 font-semibold px-4 py-2 rounded-lg transition"
                >
                  <MessageCircle size={16} /> Buka Chat WA
                </button>
                <button
                  onClick={handleSaveStatus}
                  disabled={saving}
                  className="flex items-center gap-2 bg-emerald-900 text-white hover:bg-emerald-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold px-4 py-2 rounded-lg transition"
                >
                  <Save size={16} /> {saving ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold px-4 py-2 rounded-lg transition"
                >
                  <Trash2 size={16} /> Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
