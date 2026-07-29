"use client";

import React, { useState, useEffect } from "react";
import {
  HeartHandshake,
  User,
  Wallet,
  CalendarClock,
  BadgeCheck,
  MessageCircle,
} from "lucide-react";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

type FormState = {
  nama: string;
  jenisKelamin: "laki-laki" | "perempuan" | "";
  whatsapp: string;
  alamat: string;
  email: string;
  nominalPreset: number | null;
  nominalLainnya: string;
  tanggalPembayaran: string;
  metodePembayaran: "transfer_bank" | "qris" | "tunai_sekretariat" | "";
  persetujuanDonatur: boolean;
  persetujuanPengingatWa: boolean;
  persetujuanLaporan: boolean;
};

const PRESET = [50000, 100000, 200000, 500000, 1000000];
const TANGGAL_VALID = ["1-5", "6-10", "11-15", "16-20", "21-25", "26-31"];
const METODE_VALID = [
  { value: "transfer_bank", label: "Transfer Bank" },
  { value: "qris", label: "QRIS" },
  { value: "tunai_sekretariat", label: "Tunai Sekretariat" },
];

export default function DonaturTetapPage() {
  const [progres, setProgres] = useState({
    jumlahDonatur: 0,
    totalKomitmen: 0,
    target: 15000000,
    persentase: 0,
  });
  const [form, setForm] = useState<FormState>({
    nama: "",
    jenisKelamin: "",
    whatsapp: "",
    alamat: "",
    email: "",
    nominalPreset: null,
    nominalLainnya: "",
    tanggalPembayaran: "",
    metodePembayaran: "",
    persetujuanDonatur: false,
    persetujuanPengingatWa: false,
    persetujuanLaporan: false,
  });
  const [sukses, setSukses] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProgres = async () => {
      try {
        const res = await fetch("/api/donatur-tetap");
        if (res.ok) {
          const data = await res.json();
          setProgres(data);
        }
      } catch (e) {
        console.error("Gagal memuat progres:", e);
      }
    };
    fetchProgres();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validasi client
    if (
      !form.nama.trim() ||
      !form.jenisKelamin ||
      !form.whatsapp.trim() ||
      !form.tanggalPembayaran ||
      !form.metodePembayaran ||
      !form.persetujuanDonatur
    ) {
      setError("Mohon lengkapi semua field wajib.");
      return;
    }

    const nominalLainnyaActive = form.nominalPreset === null && form.nominalLainnya.trim() !== "";
    const nominalBulanan = form.nominalPreset ?? parseInt(form.nominalLainnya.replace(/\D/g, ""), 10);

    if (!nominalBulanan || nominalBulanan <= 0) {
      setError("Nominal donasi tidak valid.");
      return;
    }

    if (nominalLainnyaActive && nominalBulanan < 10000) {
      setError("Nominal lainnya minimal Rp 10.000.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/donatur-tetap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: form.nama.trim(),
          jenisKelamin: form.jenisKelamin,
          whatsapp: form.whatsapp.trim(),
          alamat: form.alamat.trim() || null,
          email: form.email.trim() || null,
          nominalBulanan,
          nominalLainnya: nominalLainnyaActive,
          tanggalPembayaran: form.tanggalPembayaran,
          metodePembayaran: form.metodePembayaran,
          persetujuanDonatur: form.persetujuanDonatur,
          persetujuanPengingatWa: form.persetujuanPengingatWa,
          persetujuanLaporan: form.persetujuanLaporan,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan.");
        return;
      }

      setSukses(true);
    } catch (e) {
      setError("Gagal mengirim formulir. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (sukses) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-16">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl border-2 border-gold-400 shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BadgeCheck className="w-10 h-10 text-emerald-700" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-emerald-950 mb-4">
              Jazakumullahu Khairan
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Pendaftaran Anda telah kami terima. Tim Masjid Al-Kahfi akan
              menghubungi Anda melalui WhatsApp untuk konfirmasi dan penyampaian
              informasi rekening/QRIS donasi.
            </p>
            <blockquote className="bg-gold-50 border-l-4 border-gold-500 p-6 mb-8 text-left italic text-gray-800">
              "Perumpamaan orang yang menginfakkan hartanya di jalan Allah seperti
              sebutir biji yang menumbuhkan tujuh bulir, pada setiap bulir terdapat
              seratus biji." (QS. Al-Baqarah: 261)
            </blockquote>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => (window.location.href = "/")}
                className="bg-emerald-900 text-white hover:bg-emerald-800 font-bold px-6 py-3 rounded-lg transition"
              >
                Kembali ke Beranda
              </button>
              <button
                onClick={() => setSukses(false)}
                className="border-2 border-gold-500 text-gold-700 hover:bg-gold-50 font-bold px-6 py-3 rounded-lg transition"
              >
                Daftarkan Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Hero */}
      <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
        <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h2 className="font-serif text-4xl font-bold">
            Donatur Tetap Operasional
          </h2>
          <p className="text-gold-300 mt-2 font-medium">
            Bantu operasional masjid secara berkelanjutan
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        {/* Widget Kebutuhan Operasional */}
        <div className="bg-emerald-950 text-white rounded-2xl p-6 border-b-4 border-gold-500 shadow-md text-center">
          <h3 className="font-serif text-xl font-bold text-gold-300 mb-4 flex items-center justify-center gap-2">
            <HeartHandshake /> Kebutuhan Operasional Bulanan
          </h3>
          <p className="font-mono text-3xl sm:text-4xl font-bold">
            {rupiah(progres.target)}
          </p>
          <p className="text-emerald-200 text-sm mt-2">
            Target dana operasional Masjid Al-Kahfi setiap bulan
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gold-100 shadow-md p-6 sm:p-8">
          <div className="mb-6 pb-6 border-b border-gold-100">
            <h3 className="font-serif text-xl font-bold text-emerald-950 mb-2">
              Bismillahirrahmanirrahim
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Terima kasih atas niat Bapak/Ibu untuk berpartisipasi dalam mendukung
              operasional Masjid Al-Kahfi. Melalui program Donatur Tetap, insya Allah
              Bapak/Ibu turut berkontribusi dalam menjaga kegiatan ibadah, dakwah,
              pendidikan, kebersihan, dan kebutuhan operasional masjid secara
              berkelanjutan. Silakan isi formulir berikut dengan lengkap.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Data Donatur */}
            <div className="space-y-4">
              <h4 className="font-semibold text-emerald-900 flex items-center gap-2">
                <User className="w-4 h-4" /> Data Donatur
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Nama sesuai KTP"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={form.jenisKelamin}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        jenisKelamin: e.target.value as "laki-laki" | "perempuan" | "",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Pilih...</option>
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="08xx-xxxx-xxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat
                  </label>
                  <input
                    type="text"
                    value={form.alamat}
                    onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Alamat lengkap"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="email@contoh.com (opsional)"
                  />
                </div>
              </div>
            </div>

            {/* Komitmen Donasi */}
            <div className="space-y-4">
              <h4 className="font-semibold text-emerald-900 flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Komitmen Donasi Bulanan
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Nominal *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {PRESET.map((nom) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          nominalPreset: nom,
                          nominalLainnya: "",
                        })
                      }
                      className={`py-2 px-3 rounded-lg border-2 font-semibold text-sm transition ${
                        form.nominalPreset === nom
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 text-gray-600 hover:border-emerald-300"
                      }`}
                    >
                      {rupiah(nom)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    checked={form.nominalPreset === null}
                    onChange={() =>
                      setForm({
                        ...form,
                        nominalPreset: null,
                      })
                    }
                    className="w-4 h-4 text-emerald-600"
                  />
                  <label className="text-sm text-gray-700">Lainnya (min. Rp 10.000)</label>
                </div>
                {form.nominalPreset === null && (
                  <input
                    type="text"
                    value={form.nominalLainnya}
                    onChange={(e) => setForm({ ...form, nominalLainnya: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Masukkan nominal"
                  />
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Pembayaran *
                  </label>
                  <select
                    value={form.tanggalPembayaran}
                    onChange={(e) =>
                      setForm({ ...form, tanggalPembayaran: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Pilih...</option>
                    {TANGGAL_VALID.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metode Pembayaran *
                  </label>
                  <select
                    value={form.metodePembayaran}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        metodePembayaran: e.target
                          .value as
                          | "transfer_bank"
                          | "qris"
                          | "tunai_sekretariat"
                          | "",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Pilih...</option>
                    {METODE_VALID.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pernyataan */}
            <div className="space-y-4">
              <h4 className="font-semibold text-emerald-900 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Pernyataan
              </h4>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.persetujuanDonatur}
                    onChange={(e) =>
                      setForm({ ...form, persetujuanDonatur: e.target.checked })
                    }
                    className="w-4 h-4 mt-1 text-emerald-600"
                  />
                  <span className="text-sm text-gray-700">
                    Saya bersedia menjadi donatur tetap operasional Masjid Al-Kahfi dan
                    akan memenuhi komitmen donasi bulanan sesuai nominal yang saya
                    pilihkan. *
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.persetujuanPengingatWa}
                    onChange={(e) =>
                      setForm({ ...form, persetujuanPengingatWa: e.target.checked })
                    }
                    className="w-4 h-4 mt-1 text-emerald-600"
                  />
                  <span className="text-sm text-gray-700">
                    Saya bersedia menerima pengingat donasi melalui WhatsApp.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.persetujuanLaporan}
                    onChange={(e) =>
                      setForm({ ...form, persetujuanLaporan: e.target.checked })
                    }
                    className="w-4 h-4 mt-1 text-emerald-600"
                  />
                  <span className="text-sm text-gray-700">
                    Saya bersedia menerima laporan penggunaan dana operasional secara
                    berkala.
                  </span>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-900 text-white hover:bg-emerald-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? "Mengirim..." : "Kirim Pendaftaran"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
