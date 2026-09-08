"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, MessageCircle, Trash2, Save, X, Plus, PiggyBank, UserPlus, Users } from "lucide-react";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

type Peserta = {
  id: number;
  namaPeserta: string;
  alamat: string;
  whatsapp: string;
  namaBank: string;
  nomorRekening: string;
  namaPemilikRekening: string;
  periode: string;
  status: "baru" | "aktif" | "selesai" | "berhenti";
  catatanAdmin: string | null;
  saldo: number;
  shohibul: string[];
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string;
};

type Shohibul = { id: number; pesertaId: number; nama: string; urutan: number };

type Setoran = {
  id: number;
  pesertaId: number;
  tanggal: string;
  jumlah: number;
  metodePembayaran: "transfer_bank" | "qris" | "tunai_sekretariat";
  keterangan: string | null;
};

type Detail = Omit<Peserta, "shohibul"> & { shohibul: Shohibul[]; setoran: Setoran[] };

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "baru", label: "Baru" },
  { value: "aktif", label: "Aktif" },
  { value: "selesai", label: "Selesai" },
  { value: "berhenti", label: "Berhenti" },
];

const STATUS_COLORS: Record<string, string> = {
  baru: "bg-gray-100 text-gray-700",
  aktif: "bg-emerald-100 text-emerald-700",
  selesai: "bg-blue-100 text-blue-700",
  berhenti: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  baru: "Baru",
  aktif: "Aktif",
  selesai: "Selesai",
  berhenti: "Berhenti",
};

const METODE_LABEL: Record<string, string> = {
  transfer_bank: "Transfer Bank",
  qris: "QRIS",
  tunai_sekretariat: "Tunai Sekretariat",
};

const INPUT_CLS =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm";

export default function TabunganQurbanAdminPage() {
  const [data, setData] = useState<Peserta[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [periodeFilter, setPeriodeFilter] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form setoran baru
  const [formSetoran, setFormSetoran] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    jumlah: "",
    metodePembayaran: "tunai_sekretariat",
    keterangan: "",
  });
  // form tambah shohibul + edit nama shohibul inline
  const [namaShohibulBaru, setNamaShohibulBaru] = useState("");
  const [editShohibul, setEditShohibul] = useState<{ id: number; nama: string } | null>(null);

  const filtered = data.filter((d) => {
    if (statusFilter && d.status !== statusFilter) return false;
    if (periodeFilter && d.periode !== periodeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.namaPeserta.toLowerCase().includes(q) ||
        d.shohibul.some((s) => s.toLowerCase().includes(q)) ||
        d.whatsapp.includes(q)
      );
    }
    return true;
  });

  const periodes = Array.from(new Set(data.map((d) => d.periode))).sort().reverse();

  const fetchData = async () => {
    try {
      const res = await fetch("/api/qurban-peserta?admin=1");
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error("Gagal memuat data:", e);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (p: Peserta) => {
    setDetail({ ...p, shohibul: [], setoran: [] });
    try {
      const res = await fetch(`/api/qurban-peserta/${p.id}`);
      if (res.ok) setDetail(await res.json());
    } catch (e) {
      console.error("Gagal memuat detail:", e);
    }
  };

  const refreshDetail = async (id: number) => {
    const res = await fetch(`/api/qurban-peserta/${id}`);
    if (res.ok) setDetail(await res.json());
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCatatSetoran = async () => {
    if (!detail) return;
    const jumlah = parseInt(formSetoran.jumlah.replace(/\D/g, ""), 10);
    if (!jumlah || jumlah <= 0) {
      alert("Nominal setoran tidak valid.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/qurban-setoran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pesertaId: detail.id,
          tanggal: formSetoran.tanggal,
          jumlah,
          metodePembayaran: formSetoran.metodePembayaran,
          keterangan: formSetoran.keterangan || undefined,
        }),
      });
      if (res.ok) {
        setFormSetoran({ tanggal: new Date().toISOString().slice(0, 10), jumlah: "", metodePembayaran: "tunai_sekretariat", keterangan: "" });
        refreshDetail(detail.id);
      } else {
        const err = await res.json();
        alert(err.error || "Gagal mencatat setoran.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleHapusSetoran = async (sid: number) => {
    if (!detail || !confirm("Hapus setoran ini?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/qurban-setoran/${sid}`, { method: "DELETE" });
      if (res.ok) refreshDetail(detail.id);
      else alert("Gagal menghapus setoran.");
    } finally {
      setSaving(false);
    }
  };

  const handleTambahShohibul = async () => {
    if (!detail) return;
    const nama = namaShohibulBaru.trim();
    if (nama.length < 3) {
      alert("Nama shohibul minimal 3 karakter.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/qurban-shohibul", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pesertaId: detail.id, nama }),
      });
      if (res.ok) {
        setNamaShohibulBaru("");
        refreshDetail(detail.id);
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menambah shohibul.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSimpanNamaShohibul = async () => {
    if (!detail || !editShohibul) return;
    const nama = editShohibul.nama.trim();
    if (nama.length < 3) {
      alert("Nama shohibul minimal 3 karakter.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/qurban-shohibul/${editShohibul.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama }),
      });
      if (res.ok) {
        setEditShohibul(null);
        refreshDetail(detail.id);
      } else {
        const err = await res.json();
        alert(err.error || "Gagal mengubah nama shohibul.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleHapusShohibul = async (sid: number) => {
    if (!detail || !confirm("Hapus shohibul ini dari daftar?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/qurban-shohibul/${sid}`, { method: "DELETE" });
      if (res.ok) refreshDetail(detail.id);
      else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus shohibul.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUbahStatus = async (status: Peserta["status"]) => {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/qurban-peserta/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, catatanAdmin: detail.catatanAdmin || undefined }),
      });
      if (res.ok) refreshDetail(detail.id);
      else {
        const err = await res.json();
        alert(err.error || "Gagal mengubah status.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSimpanCatatan = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/qurban-peserta/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catatanAdmin: detail.catatanAdmin ?? "" }),
      });
      if (res.ok) refreshDetail(detail.id);
      else alert("Gagal menyimpan catatan.");
    } finally {
      setSaving(false);
    }
  };

  const handleHapusPeserta = async () => {
    if (!detail || !confirm("Yakin ingin menghapus peserta ini beserta seluruh shohibul & riwayat setorannya?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/qurban-peserta/${detail.id}`, { method: "DELETE" });
      if (res.ok) {
        setDetail(null);
        fetchData();
      } else alert("Gagal menghapus peserta.");
    } finally {
      setSaving(false);
    }
  };

  const bukaWa = (wa: string) => {
    const msg = `Assalamu'alaikum wr. wb. Terima kasih telah mendaftar Tabungan Qurban Masjid Al-Kahfi. Pendaftaran Bapak/Ibu telah kami terima dan akan diverifikasi. Barakallahu fiikum.`;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950">Tabungan Qurban</h1>
          <p className="text-gray-600 text-sm">Kelola peserta, shohibul & setoran tabungan qurban</p>
        </div>
      </div>

      {/* Filter & search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama peserta, shohibul, atau WhatsApp..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 w-4 h-4" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={periodeFilter} onChange={(e) => setPeriodeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            <option value="">Semua Periode</option>
            {periodes.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Tabel peserta */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada peserta.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Peserta</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Shohibul Qurban</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">WhatsApp</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Periode</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Saldo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((d, idx) => (
                  <tr key={d.id} onClick={() => openDetail(d)} className="hover:bg-gray-50 cursor-pointer transition">
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{d.namaPeserta}</td>
                    <td className="px-4 py-3 text-gray-600">{d.shohibul.join(", ")}</td>
                    <td className="px-4 py-3 text-gray-600">{d.whatsapp}</td>
                    <td className="px-4 py-3 text-gray-600">{d.periode}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-900">{rupiah(d.saldo)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[d.status]}`}>{STATUS_LABEL[d.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal detail */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-emerald-950 flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-emerald-700" /> Detail Peserta — Saldo {rupiah(detail.saldo)}
              </h2>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Data peserta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-semibold text-gray-500 uppercase">Nama Peserta</label><p className="font-medium text-gray-900">{detail.namaPeserta}</p></div>
                <div><label className="text-xs font-semibold text-gray-500 uppercase">Periode</label><p className="text-gray-700">{detail.periode}</p></div>
                <div className="md:col-span-2"><label className="text-xs font-semibold text-gray-500 uppercase">Alamat</label><p className="text-gray-700">{detail.alamat}</p></div>
                <div><label className="text-xs font-semibold text-gray-500 uppercase">WhatsApp</label><p className="text-gray-700">{detail.whatsapp}</p></div>
                <div><label className="text-xs font-semibold text-gray-500 uppercase">Bank</label><p className="text-gray-700">{detail.namaBank}</p></div>
                <div className="md:col-span-2"><label className="text-xs font-semibold text-gray-500 uppercase">No. Rekening</label><p className="text-gray-700">{detail.nomorRekening} — a.n. {detail.namaPemilikRekening}</p></div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Catatan Admin</label>
                  <textarea value={detail.catatanAdmin || ""} onChange={(e) => setDetail({ ...detail, catatanAdmin: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
                </div>
              </div>

              {/* Kelola shohibul */}
              <div>
                <h3 className="font-semibold text-emerald-950 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Shohibul Qurban ({detail.shohibul.length})
                </h3>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 mb-3">
                  {detail.shohibul.map((s) => (
                    <div key={s.id} className="flex justify-between items-center px-4 py-2 text-sm">
                      {editShohibul?.id === s.id ? (
                        <div className="flex gap-2 flex-1">
                          <input value={editShohibul.nama} onChange={(e) => setEditShohibul({ ...editShohibul, nama: e.target.value })} className={INPUT_CLS} />
                          <button onClick={handleSimpanNamaShohibul} disabled={saving} className="text-emerald-700 hover:text-emerald-900 px-2" title="Simpan nama"><Save size={16} /></button>
                          <button onClick={() => setEditShohibul(null)} className="text-gray-400 hover:text-gray-600 px-2" title="Batal"><X size={16} /></button>
                        </div>
                      ) : (
                        <>
                          <span className="text-gray-800">{s.nama}</span>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setEditShohibul({ id: s.id, nama: s.nama })} className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold">Ubah</button>
                            <button onClick={() => handleHapusShohibul(s.id)} className="text-red-500 hover:text-red-700" title="Hapus shohibul"><Trash2 size={16} /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={namaShohibulBaru} onChange={(e) => setNamaShohibulBaru(e.target.value)} placeholder="Nama shohibul baru" className={INPUT_CLS} />
                  <button onClick={handleTambahShohibul} disabled={saving} className="flex items-center gap-1 bg-emerald-900 text-white hover:bg-emerald-800 disabled:bg-gray-400 font-semibold px-4 py-2 rounded-lg transition text-sm whitespace-nowrap">
                    <UserPlus size={16} /> Tambah
                  </button>
                </div>
              </div>

              {/* Form catat setoran */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2"><Plus className="w-4 h-4" /> Catat Setoran</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input type="date" value={formSetoran.tanggal} onChange={(e) => setFormSetoran({ ...formSetoran, tanggal: e.target.value })} className={INPUT_CLS} />
                  <input type="text" inputMode="numeric" value={formSetoran.jumlah} onChange={(e) => setFormSetoran({ ...formSetoran, jumlah: e.target.value })} placeholder="Nominal (Rp)" className={INPUT_CLS} />
                  <select value={formSetoran.metodePembayaran} onChange={(e) => setFormSetoran({ ...formSetoran, metodePembayaran: e.target.value })} className={INPUT_CLS}>
                    <option value="transfer_bank">Transfer Bank</option>
                    <option value="qris">QRIS</option>
                    <option value="tunai_sekretariat">Tunai Sekretariat</option>
                  </select>
                  <button onClick={handleCatatSetoran} disabled={saving} className="bg-emerald-900 text-white hover:bg-emerald-800 disabled:bg-gray-400 font-semibold px-4 py-2 rounded-lg transition text-sm">
                    {saving ? "Menyimpan..." : "Simpan Setoran"}
                  </button>
                </div>
                <input type="text" value={formSetoran.keterangan} onChange={(e) => setFormSetoran({ ...formSetoran, keterangan: e.target.value })} placeholder="Keterangan (opsional)" className={`${INPUT_CLS} mt-3`} />
              </div>

              {/* Riwayat setoran */}
              <div>
                <h3 className="font-semibold text-emerald-950 mb-3">Riwayat Setoran ({detail.setoran.length})</h3>
                {detail.setoran.length === 0 ? (
                  <p className="text-sm text-gray-500">Belum ada setoran.</p>
                ) : (
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {detail.setoran.map((s) => (
                      <div key={s.id} className="flex justify-between items-center px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{rupiah(s.jumlah)} <span className="text-gray-500 font-normal">· {METODE_LABEL[s.metodePembayaran]}</span></p>
                          <p className="text-xs text-gray-500">{new Date(s.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}{s.keterangan ? ` — ${s.keterangan}` : ""}</p>
                        </div>
                        <button onClick={() => handleHapusSetoran(s.id)} className="text-red-500 hover:text-red-700" title="Hapus setoran"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer aksi */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-500 uppercase mr-2">Status:</label>
                <select value={detail.status} onChange={(e) => handleUbahStatus(e.target.value as Peserta["status"])}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm">
                  <option value="baru">Baru</option>
                  <option value="aktif">Aktif</option>
                  <option value="selesai">Selesai</option>
                  <option value="berhenti">Berhenti</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSimpanCatatan} disabled={saving} className="flex items-center gap-2 bg-emerald-900 text-white hover:bg-emerald-800 disabled:bg-gray-400 font-semibold px-4 py-2 rounded-lg transition">
                  <Save size={16} /> Simpan Catatan
                </button>
                <button onClick={() => bukaWa(detail.whatsapp)} className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 font-semibold px-4 py-2 rounded-lg transition">
                  <MessageCircle size={16} /> Chat WA
                </button>
                <button onClick={handleHapusPeserta} disabled={saving} className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 font-semibold px-4 py-2 rounded-lg transition">
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
