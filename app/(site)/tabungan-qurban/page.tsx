"use client";

import React, { useState } from "react";
import { Coins, User, Users, MapPin, Phone, Landmark, CreditCard, CheckCircle2, Plus, Trash2 } from "lucide-react";

type FormState = {
  namaPeserta: string;
  alamat: string;
  whatsapp: string;
  namaBank: string;
  nomorRekening: string;
  namaPemilikRekening: string;
  periode: string;
  persetujuan: boolean;
};

const tahunSekarang = new Date().getFullYear();
const PERIODE_OPTIONS = [String(tahunSekarang + 1), String(tahunSekarang + 2)];

const INPUT_CLS =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";

export default function TabunganQurbanPage() {
  const [form, setForm] = useState<FormState>({
    namaPeserta: "",
    alamat: "",
    whatsapp: "",
    namaBank: "",
    nomorRekening: "",
    namaPemilikRekening: "",
    periode: PERIODE_OPTIONS[0],
    persetujuan: false,
  });
  const [shohibul, setShohibul] = useState<string[]>([""]);
  const [sukses, setSukses] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof FormState, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const setShohibulAt = (i: number, v: string) =>
    setShohibul((arr) => arr.map((s, idx) => (idx === i ? v : s)));

  const tambahShohibul = () => {
    if (shohibul.length < 10) setShohibul((arr) => [...arr, ""]);
  };

  const hapusShohibul = (i: number) => {
    if (shohibul.length > 1) setShohibul((arr) => arr.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const shohibulBersih = shohibul.map((s) => s.trim()).filter(Boolean);
    if (
      !form.namaPeserta.trim() ||
      !form.alamat.trim() ||
      !form.whatsapp.trim() ||
      !form.namaBank.trim() ||
      !form.nomorRekening.trim() ||
      !form.namaPemilikRekening.trim()
    ) {
      setError("Mohon lengkapi semua data.");
      return;
    }
    if (shohibulBersih.length === 0) {
      setError("Mohon isi minimal satu nama shohibul qurban.");
      return;
    }
    if (!form.persetujuan) {
      setError("Mohon setujui ketentuan program tabungan qurban.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/qurban-peserta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaPeserta: form.namaPeserta.trim(),
          alamat: form.alamat.trim(),
          whatsapp: form.whatsapp.trim(),
          namaBank: form.namaBank.trim(),
          nomorRekening: form.nomorRekening.trim(),
          namaPemilikRekening: form.namaPemilikRekening.trim(),
          periode: form.periode,
          shohibul: shohibulBersih,
        }),
      });
      if (res.ok) {
        setSukses(true);
      } else {
        const err = await res.json();
        setError(err.error || "Pendaftaran gagal. Silakan coba lagi.");
      }
    } catch (e) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Hero */}
      <section className="bg-emerald-900 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-400/20 mb-4">
            <Coins className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Tabungan Qurban</h1>
          <p className="text-emerald-100 max-w-2xl mx-auto">
            Niatkan qurban dengan menabung bertahap. Daftarkan diri Anda beserta nama-nama
            shohibul qurban yang akan ditabungkan, lalu setoran dapat dilakukan bertahap
            melalui sekretariat DKM hingga memenuhi nilai qurban pada periode yang dipilih.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        {sukses ? (
          <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-emerald-900 mb-2">Pendaftaran Terkirim</h2>
            <p className="text-gray-600">
              Jazakumullahu khairan. Pendaftaran Anda sedang menunggu verifikasi admin DKM.
              Kami akan menghubungi Anda melalui WhatsApp untuk proses selanjutnya.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-emerald-950 mb-1">Form Pendaftaran</h2>
              <p className="text-sm text-gray-500">
                Data rekening digunakan sebagai rekening tujuan <strong>pemulangan dana</strong> bila
                dana qurban tidak tersalurkan — bukan rekening tujuan setoran.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 text-emerald-700" /> Nama Peserta Tabungan *
                </label>
                <input className={INPUT_CLS} value={form.namaPeserta} onChange={(e) => set("namaPeserta", e.target.value)} placeholder="Nama lengkap penabung" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Periode Qurban *</label>
                <select className={INPUT_CLS} value={form.periode} onChange={(e) => set("periode", e.target.value)}>
                  {PERIODE_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 text-emerald-700" /> Alamat Lengkap *
                </label>
                <textarea className={INPUT_CLS} rows={2} value={form.alamat} onChange={(e) => set("alamat", e.target.value)} placeholder="Alamat tempat tinggal" />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 text-emerald-700" /> Nomor WhatsApp *
                </label>
                <input className={INPUT_CLS} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="08xxxxxxxxxx" inputMode="tel" />
              </div>

              {/* Daftar shohibul dinamis */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Users className="w-4 h-4 text-emerald-700" /> Nama Shohibul Qurban / Muqorib * <span className="text-xs text-gray-400">(maks. 10)</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">Bila menabung untuk diri sendiri, isi nama Anda sendiri.</p>
                <div className="space-y-2">
                  {shohibul.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className={INPUT_CLS}
                        value={s}
                        onChange={(e) => setShohibulAt(i, e.target.value)}
                        placeholder={`Nama shohibul ${i + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => hapusShohibul(i)}
                        disabled={shohibul.length <= 1}
                        className="px-3 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={tambahShohibul}
                  disabled={shohibul.length >= 10}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-800 hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" /> Tambah Shohibul
                </button>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Landmark className="w-4 h-4 text-emerald-700" /> Nama Bank *
                </label>
                <input className={INPUT_CLS} value={form.namaBank} onChange={(e) => set("namaBank", e.target.value)} placeholder="cth. BSI, BRI, Mandiri" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <CreditCard className="w-4 h-4 text-emerald-700" /> Nomor Rekening *
                </label>
                <input className={INPUT_CLS} value={form.nomorRekening} onChange={(e) => set("nomorRekening", e.target.value)} placeholder="Nomor rekening" inputMode="numeric" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nama Pemilik Rekening *</label>
                <input className={INPUT_CLS} value={form.namaPemilikRekening} onChange={(e) => set("namaPemilikRekening", e.target.value)} placeholder="Sesuai buku tabungan" />
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.persetujuan}
                onChange={(e) => set("persetujuan", e.target.checked)}
                className="mt-1 w-4 h-4 accent-emerald-700"
              />
              <span>
                Saya menyetujui ketentuan program Tabungan Qurban Masjid Al-Kahfi, dan memahami bahwa
                setoran dilakukan melalui sekretariat DKM serta dicatat oleh pengurus.
              </span>
            </label>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-900 text-white hover:bg-emerald-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold px-6 py-3 rounded-lg transition"
            >
              {loading ? "Mengirim..." : "Daftar Tabungan Qurban"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
