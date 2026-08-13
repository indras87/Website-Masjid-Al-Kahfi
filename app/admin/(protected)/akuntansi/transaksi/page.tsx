"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Trash2, Save, X, Wallet, ArrowDownCircle, ArrowUpCircle, Settings2, LayoutDashboard } from "lucide-react";
import ImageUpload from "@/app/admin/components/ImageUpload";

type Jenis = "pemasukan" | "pengeluaran";

type AkunKas = {
  id: number;
  nama: string;
  keterangan: string | null;
  aktif: boolean;
  urutan: number;
};

type Kategori = {
  id: number;
  nama: string;
  jenis: Jenis;
  aktif: boolean;
  urutan: number;
};

type Transaksi = {
  id: number;
  tanggal: string;
  akunKasId: number;
  akunKasNama: string | null;
  kategoriId: number | null;
  kategoriNama: string | null;
  keterangan: string;
  jenis: Jenis;
  jumlah: number;
  buktiUrl: string | null;
  createdByName: string | null;
  updatedByName: string | null;
};

type Ringkasan = {
  perAkun: Array<{ akunKasId: number; akunKasNama: string; pemasukan: number; pengeluaran: number; saldo: number }>;
  total: { pemasukan: number; pengeluaran: number; saldo: number };
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

function currentBulan(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const emptyTransaksiForm = {
  tanggal: new Date().toISOString().slice(0, 10),
  akunKasId: "",
  kategoriId: "",
  keterangan: "",
  jenis: "pengeluaran" as Jenis,
  jumlah: "",
  buktiUrl: "",
};

export default function AkuntansiAdminPage() {
  const [tab, setTab] = useState<"transaksi" | "master">("transaksi");

  const [bulan, setBulan] = useState(currentBulan());
  const [akunFilter, setAkunFilter] = useState("");
  const [jenisFilter, setJenisFilter] = useState("");
  const [search, setSearch] = useState("");

  const [akunKasList, setAkunKasList] = useState<AkunKas[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyTransaksiForm);

  const [selected, setSelected] = useState<Transaksi | null>(null);

  useEffect(() => {
    fetchMaster();
  }, []);

  useEffect(() => {
    fetchTransaksiDanRingkasan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulan, akunFilter, jenisFilter]);

  const fetchMaster = async () => {
    try {
      const [akunRes, katRes] = await Promise.all([
        fetch("/api/akuntansi/akun-kas"),
        fetch("/api/akuntansi/kategori"),
      ]);
      if (akunRes.ok) setAkunKasList(await akunRes.json());
      if (katRes.ok) setKategoriList(await katRes.json());
    } catch (e) {
      console.error("Gagal memuat master data:", e);
    }
  };

  const fetchTransaksiDanRingkasan = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ bulan });
      if (akunFilter) params.set("akunKasId", akunFilter);
      if (jenisFilter) params.set("jenis", jenisFilter);

      const [txRes, ringkasanRes] = await Promise.all([
        fetch(`/api/akuntansi/transaksi?${params.toString()}`),
        fetch(`/api/akuntansi/ringkasan?bulan=${bulan}`),
      ]);
      if (txRes.ok) setTransaksiList(await txRes.json());
      if (ringkasanRes.ok) setRingkasan(await ringkasanRes.json());
    } catch (e) {
      console.error("Gagal memuat transaksi:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransaksi = useMemo(() => {
    if (!search) return transaksiList;
    const q = search.toLowerCase();
    return transaksiList.filter((t) => t.keterangan.toLowerCase().includes(q));
  }, [transaksiList, search]);

  const akunAktif = useMemo(() => akunKasList.filter((a) => a.aktif), [akunKasList]);
  const kategoriUntukJenis = useMemo(
    () => kategoriList.filter((k) => k.jenis === form.jenis && k.aktif),
    [kategoriList, form.jenis]
  );

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyTransaksiForm);
    setError(null);
    setShowForm(true);
  };

  const openEditForm = (t: Transaksi) => {
    setEditingId(t.id);
    setForm({
      tanggal: t.tanggal.slice(0, 10),
      akunKasId: String(t.akunKasId),
      kategoriId: t.kategoriId ? String(t.kategoriId) : "",
      keterangan: t.keterangan,
      jenis: t.jenis,
      jumlah: String(t.jumlah),
      buktiUrl: t.buktiUrl || "",
    });
    setSelected(null);
    setError(null);
    setShowForm(true);
  };

  const handleSubmitForm = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        tanggal: form.tanggal,
        akunKasId: Number(form.akunKasId),
        kategoriId: form.kategoriId ? Number(form.kategoriId) : null,
        keterangan: form.keterangan,
        jenis: form.jenis,
        jumlah: Number(form.jumlah),
        buktiUrl: form.buktiUrl || null,
      };

      const res = editingId
        ? await fetch(`/api/akuntansi/transaksi/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/akuntansi/transaksi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        setShowForm(false);
        fetchTransaksiDanRingkasan();
      } else {
        const err = await res.json();
        setError(err.error || "Gagal menyimpan transaksi.");
      }
    } catch (e) {
      setError("Gagal menyimpan transaksi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm("Yakin ingin menghapus transaksi ini?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/akuntansi/transaksi/${selected.id}`, { method: "DELETE" });
      if (res.ok) {
        setSelected(null);
        fetchTransaksiDanRingkasan();
      } else {
        alert("Gagal menghapus transaksi.");
      }
    } catch (e) {
      alert("Gagal menghapus transaksi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/admin/akuntansi" className="flex items-center gap-1 hover:text-emerald-800">
              <LayoutDashboard size={14} /> Ringkasan
            </Link>
            <span>/</span>
            <span className="text-emerald-900 font-medium">Transaksi</span>
          </div>
          <h1 className="text-2xl font-bold text-emerald-950">Akuntansi / Kas</h1>
          <p className="text-gray-600 text-sm">Pembukuan pemasukan dan pengeluaran kas DKM</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("transaksi")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
              tab === "transaksi" ? "bg-emerald-900 text-white" : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            Transaksi
          </button>
          <button
            onClick={() => setTab("master")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition ${
              tab === "master" ? "bg-emerald-900 text-white" : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            <Settings2 size={15} /> Master Data
          </button>
        </div>
      </div>

      {tab === "transaksi" ? (
        <>
          {/* Ringkasan Cards */}
          {ringkasan && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard label="Total Pemasukan" value={ringkasan.total.pemasukan} tone="emerald" />
                <SummaryCard label="Total Pengeluaran" value={ringkasan.total.pengeluaran} tone="red" />
                <SummaryCard label="Total Saldo" value={ringkasan.total.saldo} tone="gold" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ringkasan.perAkun.map((r) => (
                  <div key={r.akunKasId} className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm font-semibold text-emerald-950 mb-2 flex items-center gap-1.5">
                      <Wallet size={14} /> {r.akunKasNama}
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-emerald-700">
                        <span>Pemasukan</span>
                        <span className="font-medium">{rupiah(r.pemasukan)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Pengeluaran</span>
                        <span className="font-medium">{rupiah(r.pengeluaran)}</span>
                      </div>
                      <div className="flex justify-between text-gray-900 border-t border-gray-100 pt-1 mt-1 font-semibold">
                        <span>Saldo</span>
                        <span>{rupiah(r.saldo)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter & Search */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
            <input
              type="month"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            />
            <select
              value={akunFilter}
              onChange={(e) => setAkunFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            >
              <option value="">Semua Akun Kas</option>
              {akunKasList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama}
                </option>
              ))}
            </select>
            <select
              value={jenisFilter}
              onChange={(e) => setJenisFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            >
              <option value="">Semua Jenis</option>
              <option value="pemasukan">Pemasukan</option>
              <option value="pengeluaran">Pengeluaran</option>
            </select>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari keterangan..."
              className="flex-1 min-w-[160px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            />
            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 bg-emerald-900 text-white hover:bg-emerald-800 font-semibold px-4 py-2 rounded-lg transition text-sm"
            >
              <Plus size={16} /> Tambah Transaksi
            </button>
          </div>

          {/* Tabel Transaksi */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Memuat data...</div>
            ) : filteredTransaksi.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Belum ada transaksi pada periode ini.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Akun Kas</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Kategori</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Keterangan</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Jenis</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTransaksi.map((t, idx) => (
                      <tr
                        key={t.id}
                        onClick={() => setSelected(t)}
                        className="hover:bg-gray-50 cursor-pointer transition"
                      >
                        <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {new Date(t.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{t.akunKasNama || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{t.kategoriNama || "-"}</td>
                        <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{t.keterangan}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                              t.jenis === "pemasukan" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {t.jenis === "pemasukan" ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                            {t.jenis === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                            t.jenis === "pemasukan" ? "text-emerald-700" : "text-red-600"
                          }`}
                        >
                          {rupiah(t.jumlah)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <MasterDataTab
          akunKasList={akunKasList}
          kategoriList={kategoriList}
          onRefresh={fetchMaster}
        />
      )}

      {/* Modal Detail Transaksi */}
      {selected && !showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-emerald-950">Detail Transaksi</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <DetailRow label="Tanggal" value={new Date(selected.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} />
              <DetailRow label="Akun Kas" value={selected.akunKasNama || "-"} />
              <DetailRow label="Kategori" value={selected.kategoriNama || "-"} />
              <DetailRow label="Keterangan" value={selected.keterangan} />
              <DetailRow label="Jenis" value={selected.jenis === "pemasukan" ? "Pemasukan" : "Pengeluaran"} />
              <DetailRow label="Jumlah" value={rupiah(selected.jumlah)} />
              {selected.buktiUrl && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Bukti</p>
                  <img src={selected.buktiUrl} alt="Bukti transaksi" className="rounded-lg border border-gray-200 max-h-48" />
                </div>
              )}
              <DetailRow label="Dibuat Oleh" value={selected.createdByName || "-"} />
              <DetailRow label="Diperbarui Oleh" value={selected.updatedByName || "-"} />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => openEditForm(selected)}
                className="flex items-center gap-2 bg-emerald-900 text-white hover:bg-emerald-800 font-semibold px-4 py-2 rounded-lg transition"
              >
                Ubah
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 font-semibold px-4 py-2 rounded-lg transition"
              >
                <Trash2 size={16} /> Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Tambah/Edit Transaksi */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-emerald-950">
                {editingId ? "Ubah Transaksi" : "Tambah Transaksi"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Tanggal</label>
                  <input
                    type="date"
                    value={form.tanggal}
                    onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Jenis</label>
                  <select
                    value={form.jenis}
                    onChange={(e) => setForm({ ...form, jenis: e.target.value as Jenis, kategoriId: "" })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  >
                    <option value="pemasukan">Pemasukan</option>
                    <option value="pengeluaran">Pengeluaran</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Akun Kas</label>
                <select
                  value={form.akunKasId}
                  onChange={(e) => setForm({ ...form, akunKasId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                >
                  <option value="">Pilih akun kas...</option>
                  {akunAktif.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Kategori</label>
                <select
                  value={form.kategoriId}
                  onChange={(e) => setForm({ ...form, kategoriId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                >
                  <option value="">Tanpa kategori</option>
                  {kategoriUntukJenis.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Keterangan</label>
                <textarea
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  placeholder="Mis. Pembelian sikat dan pewangi lantai"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Jumlah (Rp)</label>
                <input
                  type="number"
                  min={1}
                  value={form.jumlah}
                  onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  placeholder="0"
                />
              </div>

              <ImageUpload
                value={form.buktiUrl}
                onChange={(url) => setForm({ ...form, buktiUrl: url })}
                label="Bukti (opsional)"
              />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-sm transition"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitForm}
                disabled={saving || !form.akunKasId || !form.keterangan || !form.jumlah}
                className="flex items-center gap-2 bg-emerald-900 text-white hover:bg-emerald-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold px-4 py-2 rounded-lg transition text-sm"
              >
                <Save size={16} /> {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "emerald" | "red" | "gold" }) {
  const toneClass =
    tone === "emerald" ? "text-emerald-700" : tone === "red" ? "text-red-600" : "text-emerald-950";
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
      <p className={`text-xl font-bold ${toneClass}`}>{rupiah(value)}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
      <p className="text-gray-900">{value}</p>
    </div>
  );
}

function MasterDataTab({
  akunKasList,
  kategoriList,
  onRefresh,
}: {
  akunKasList: AkunKas[];
  kategoriList: Kategori[];
  onRefresh: () => void;
}) {
  const [savingId, setSavingId] = useState<number | null>(null);

  const [showAkunForm, setShowAkunForm] = useState(false);
  const [akunNama, setAkunNama] = useState("");
  const [akunKeterangan, setAkunKeterangan] = useState("");

  const [showKatForm, setShowKatForm] = useState(false);
  const [katNama, setKatNama] = useState("");
  const [katJenis, setKatJenis] = useState<Jenis>("pengeluaran");

  const toggleAkunAktif = async (a: AkunKas) => {
    setSavingId(a.id);
    try {
      await fetch(`/api/akuntansi/akun-kas/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: !a.aktif }),
      });
      onRefresh();
    } finally {
      setSavingId(null);
    }
  };

  const deleteAkun = async (a: AkunKas) => {
    if (!confirm(`Hapus akun kas "${a.nama}"?`)) return;
    setSavingId(a.id);
    try {
      const res = await fetch(`/api/akuntansi/akun-kas/${a.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal menghapus akun kas.");
      }
      onRefresh();
    } finally {
      setSavingId(null);
    }
  };

  const submitAkun = async () => {
    if (!akunNama.trim()) return;
    await fetch("/api/akuntansi/akun-kas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: akunNama.trim(), keterangan: akunKeterangan.trim() || undefined }),
    });
    setAkunNama("");
    setAkunKeterangan("");
    setShowAkunForm(false);
    onRefresh();
  };

  const toggleKatAktif = async (k: Kategori) => {
    setSavingId(k.id);
    try {
      await fetch(`/api/akuntansi/kategori/${k.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: !k.aktif }),
      });
      onRefresh();
    } finally {
      setSavingId(null);
    }
  };

  const deleteKategori = async (k: Kategori) => {
    if (!confirm(`Hapus kategori "${k.nama}"?`)) return;
    setSavingId(k.id);
    try {
      const res = await fetch(`/api/akuntansi/kategori/${k.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal menghapus kategori.");
      }
      onRefresh();
    } finally {
      setSavingId(null);
    }
  };

  const submitKategori = async () => {
    if (!katNama.trim()) return;
    await fetch("/api/akuntansi/kategori", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: katNama.trim(), jenis: katJenis }),
    });
    setKatNama("");
    setShowKatForm(false);
    onRefresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Akun Kas */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-semibold text-emerald-950">Akun Kas</h3>
          <button
            onClick={() => setShowAkunForm(!showAkunForm)}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-900"
          >
            <Plus size={14} /> Tambah
          </button>
        </div>
        {showAkunForm && (
          <div className="p-4 border-b border-gray-100 space-y-2 bg-gray-50">
            <input
              value={akunNama}
              onChange={(e) => setAkunNama(e.target.value)}
              placeholder="Nama akun kas"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              value={akunKeterangan}
              onChange={(e) => setAkunKeterangan(e.target.value)}
              placeholder="Keterangan (opsional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={submitAkun}
              className="w-full bg-emerald-900 text-white text-sm font-semibold py-2 rounded-lg hover:bg-emerald-800"
            >
              Simpan Akun Kas
            </button>
          </div>
        )}
        <div className="divide-y divide-gray-100">
          {akunKasList.map((a) => (
            <div key={a.id} className="px-4 py-3 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-gray-900">{a.nama}</p>
                {a.keterangan && <p className="text-xs text-gray-500">{a.keterangan}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAkunAktif(a)}
                  disabled={savingId === a.id}
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    a.aktif ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {a.aktif ? "Aktif" : "Nonaktif"}
                </button>
                <button
                  onClick={() => deleteAkun(a)}
                  disabled={savingId === a.id}
                  className="text-red-500 hover:text-red-700"
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kategori */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-semibold text-emerald-950">Kategori Transaksi</h3>
          <button
            onClick={() => setShowKatForm(!showKatForm)}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-900"
          >
            <Plus size={14} /> Tambah
          </button>
        </div>
        {showKatForm && (
          <div className="p-4 border-b border-gray-100 space-y-2 bg-gray-50">
            <input
              value={katNama}
              onChange={(e) => setKatNama(e.target.value)}
              placeholder="Nama kategori"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <select
              value={katJenis}
              onChange={(e) => setKatJenis(e.target.value as Jenis)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="pemasukan">Pemasukan</option>
              <option value="pengeluaran">Pengeluaran</option>
            </select>
            <button
              onClick={submitKategori}
              className="w-full bg-emerald-900 text-white text-sm font-semibold py-2 rounded-lg hover:bg-emerald-800"
            >
              Simpan Kategori
            </button>
          </div>
        )}
        <div className="divide-y divide-gray-100">
          {kategoriList.map((k) => (
            <div key={k.id} className="px-4 py-3 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-gray-900">{k.nama}</p>
                <p className="text-xs text-gray-500 capitalize">{k.jenis}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleKatAktif(k)}
                  disabled={savingId === k.id}
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    k.aktif ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {k.aktif ? "Aktif" : "Nonaktif"}
                </button>
                <button
                  onClick={() => deleteKategori(k)}
                  disabled={savingId === k.id}
                  className="text-red-500 hover:text-red-700"
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
