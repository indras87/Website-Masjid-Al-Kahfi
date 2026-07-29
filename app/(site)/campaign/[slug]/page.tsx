"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Heart,
  Target,
  Clock,
  Users,
  BadgeCheck,
  MessageCircle,
  Share2,
  Copy,
  Download,
} from "lucide-react";
import Link from "next/link";
import ImageUpload from "@/app/admin/components/ImageUpload";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

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
  status: string;
  featured: boolean;
};

type Progres = {
  terkumpul: number;
  jumlahDonatur: number;
  persentase: number;
};

type Update = {
  id: number;
  judul: string;
  isi: string;
  img: string | null;
  createdAt: string;
};

type Donatur = {
  namaTampilan: string;
  pesan: string | null;
  nominal: number;
  createdAt: string;
};

type DonasiInfo = {
  namaRekening: string;
  nomorRekening: string;
  atasNamaRekening: string;
  qrisImage: string;
};

type FormState = {
  nominalPreset: number | null;
  nominalLainnya: string;
  namaDonatur: string;
  anonim: boolean;
  whatsapp: string;
  pesan: string;
  metodePembayaran: "transfer_bank" | "qris" | "";
  buktiPembayaran: string;
};

const PRESET = [10000, 25000, 50000, 100000, 200000, 500000, 1000000];
const METODE_VALID = [
  { value: "transfer_bank", label: "Transfer Bank" },
  { value: "qris", label: "QRIS" },
];

export default function CampaignDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [progres, setProgres] = useState<Progres | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [donatur, setDonatur] = useState<Donatur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [donasiInfo, setDonasiInfo] = useState<DonasiInfo | null>(null);

  // Form state
  const [form, setForm] = useState<FormState>({
    nominalPreset: null,
    nominalLainnya: "",
    namaDonatur: "",
    anonim: false,
    whatsapp: "",
    pesan: "",
    metodePembayaran: "",
    buktiPembayaran: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [sukses, setSukses] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fetch(`/api/campaign?slug=${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Campaign tidak ditemukan");
          } else {
            setError("Gagal memuat campaign");
          }
          return;
        }
        const data = await res.json();
        setCampaign(data.campaign);
        setProgres(data.progres);
        setUpdates(data.updates || []);
        setDonatur(data.donatur || []);
      } catch (e) {
        console.error("Gagal memuat campaign:", e);
        setError("Gagal memuat campaign");
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [slug]);

  // Ambil info rekening & gambar QRIS dari pengaturan donasi
  useEffect(() => {
    fetch("/api/donasi")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setDonasiInfo(data as DonasiInfo);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validasi client
    if (!form.namaDonatur.trim() || !form.whatsapp.trim() || !form.metodePembayaran) {
      setFormError("Mohon lengkapi semua field wajib.");
      return;
    }

    if (!form.buktiPembayaran) {
      setFormError("Bukti pembayaran wajib diunggah.");
      return;
    }

    const nominalLainnyaActive = form.nominalPreset === null && form.nominalLainnya.trim() !== "";
    const nominal = form.nominalPreset ?? parseInt(form.nominalLainnya.replace(/\D/g, ""), 10);

    if (!nominal || nominal <= 0) {
      setFormError("Nominal donasi tidak valid.");
      return;
    }

    if (nominalLainnyaActive && nominal < 10000) {
      setFormError("Nominal lainnya minimal Rp 10.000.");
      return;
    }

    // Validasi WhatsApp
    const waRaw = form.whatsapp.trim();
    const waDigits = waRaw.replace(/[^\d]/g, "");
    if (
      !(
        (waRaw.startsWith("0") && waDigits.length >= 10 && waDigits.length <= 15) ||
        (waRaw.startsWith("62") && waDigits.length >= 10 && waDigits.length <= 15)
      )
    ) {
      setFormError("Nomor WhatsApp tidak valid.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/campaign-donasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign?.id,
          namaDonatur: form.namaDonatur.trim(),
          anonim: form.anonim,
          whatsapp: form.whatsapp.trim(),
          nominal,
          pesan: form.pesan.trim() || null,
          metodePembayaran: form.metodePembayaran,
          buktiPembayaran: form.buktiPembayaran,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Terjadi kesalahan.");
        return;
      }

      setSukses(true);
    } catch (e) {
      setFormError("Gagal mengirim formulir. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const hitungSisaHari = (tanggalBerakhir: string | null) => {
    if (!tanggalBerakhir) return null;
    const sisa = Math.ceil((new Date(tanggalBerakhir).getTime() - Date.now()) / 86_400_000);
    return sisa;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 mt-4">Memuat campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-serif text-xl font-bold text-gray-700 mb-2">
            {error || "Campaign Tidak Ditemukan"}
          </h3>
          <Link
            href="/campaign"
            className="inline-block mt-4 text-emerald-700 hover:text-emerald-800 font-semibold"
          >
            ← Kembali ke Daftar Campaign
          </Link>
        </div>
      </div>
    );
  }

  const sisaHari = hitungSisaHari(campaign.tanggalBerakhir);
  const isBerakhir = (sisaHari !== null && sisaHari < 0) || campaign.status === "berakhir";
  const isTercapai = campaign.status === "tercapai";

  // State sukses: tampilkan pesan
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
              Donasi dan bukti pembayaran Anda telah kami catat. Tim Masjid Al-Kahfi
              akan memverifikasi pembayaran Bapak/Ibu, dan nominal donasi akan masuk
              ke progress campaign setelah terverifikasi.
            </p>
            <blockquote className="bg-gold-50 border-l-4 border-gold-500 p-6 mb-8 text-left italic text-gray-800">
              "Perumpamaan orang yang menginfakkan hartanya di jalan Allah seperti
              sebutir biji yang menumbuhkan tujuh bulir, pada setiap bulir terdapat
              seratus biji." (QS. Al-Baqarah: 261)
            </blockquote>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setForm({
                    nominalPreset: null,
                    nominalLainnya: "",
                    namaDonatur: "",
                    anonim: false,
                    whatsapp: "",
                    pesan: "",
                    metodePembayaran: "",
                    buktiPembayaran: "",
                  });
                  setSukses(false);
                }}
                className="bg-emerald-900 text-white hover:bg-emerald-800 font-bold px-6 py-3 rounded-lg transition"
              >
                Donasi Lagi
              </button>
              <Link
                href="/campaign"
                className="border-2 border-gold-500 text-gold-700 hover:bg-gold-50 font-bold px-6 py-3 rounded-lg transition text-center"
              >
                Kembali ke Daftar
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Header Hero */}
      <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
        {campaign.img && (
          <img src={campaign.img} alt={campaign.judul} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-emerald-900/80"></div>
        <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="bg-gold-500/20 text-gold-300 px-3 py-1 rounded-full text-sm font-semibold uppercase">
              {campaign.kategori.replace(/_/g, " ")}
            </span>
            {isBerakhir ? (
              <span className="bg-gray-500/30 text-gray-100 px-3 py-1 rounded-full text-sm font-semibold">
                ⏱ Berakhir
              </span>
            ) : isTercapai ? (
              <span className="bg-emerald-500/30 text-emerald-100 px-3 py-1 rounded-full text-sm font-semibold">
                🏆 Tercapai
              </span>
            ) : sisaHari !== null ? (
              <span className="flex items-center gap-1 text-gold-300 text-sm">
                <Clock className="w-4 h-4" />
                {sisaHari <= 7
                  ? `${sisaHari} hari lagi`
                  : sisaHari}
              </span>
            ) : (
              <span className="text-gold-300 text-sm">Tanpa batas waktu</span>
            )}
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
            {campaign.judul}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom Kiri: Cerita + Updates + Wall Donatur */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cerita Campaign */}
            <div className="bg-white rounded-2xl border border-gold-100 shadow-md p-6">
              <h2 className="font-serif text-xl font-bold text-emerald-950 mb-4">
                Tentang Campaign Ini
              </h2>
              {campaign.img && (
                <img
                  src={campaign.img}
                  alt={campaign.judul}
                  className="w-full max-h-[420px] object-contain rounded-xl mb-4 bg-gray-50 border border-gold-100"
                />
              )}
              {campaign.cerita ? (
                <div className="prose prose-emerald max-w-none text-gray-700">
                  {campaign.cerita.split("\n\n").map((par, i) => (
                    <p key={i} className="mb-4">
                      {par}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">{campaign.deskripsiSingkat}</p>
              )}
            </div>

            {/* Updates Terbaru */}
            {updates.length > 0 && (
              <div className="bg-white rounded-2xl border border-gold-100 shadow-md p-6">
                <h2 className="font-serif text-xl font-bold text-emerald-950 mb-4">
                  Update Terbaru
                </h2>
                <div className="space-y-4">
                  {updates.slice(0, 3).map((u) => (
                    <div key={u.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <h3 className="font-semibold text-emerald-900 mb-1">{u.judul}</h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {new Date(u.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      {u.img && (
                        <img
                          src={u.img}
                          alt={u.judul}
                          className="w-full max-h-80 object-contain rounded-lg mb-2 bg-gray-50 border border-gray-100"
                        />
                      )}
                      <p className="text-gray-700 text-sm line-clamp-3">{u.isi}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wall Donatur */}
            <div className="bg-white rounded-2xl border border-gold-100 shadow-md p-6">
              <h2 className="font-serif text-xl font-bold text-emerald-950 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Doa & Pesan Donatur ({donatur.length})
              </h2>
              {donatur.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Jadilah donatur pertama untuk campaign ini 🤲</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {donatur.slice(0, 10).map((d, i) => (
                    <div key={i} className="bg-gold-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-emerald-900">
                          {d.namaTampilan}
                        </span>
                        <span className="text-sm font-semibold text-emerald-700">
                          {rupiah(d.nominal)}
                        </span>
                      </div>
                      {d.pesan && (
                        <p className="text-gray-600 text-sm italic mb-1">"{d.pesan}"</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(d.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Kartu Donasi */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border-2 border-gold-100 shadow-lg p-6 sticky top-4">
              {/* Progress Widget */}
              <div className="mb-6 pb-6 border-b border-gold-100">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500 mb-1">Terkumpul</p>
                  <p className="text-3xl font-bold text-emerald-700">
                    {progres && rupiah(progres.terkumpul)}
                  </p>
                  <p className="text-sm text-gray-400">
                    dari {rupiah(campaign.targetNominal)}
                  </p>
                </div>
                {progres && (
                  <>
                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, progres.persentase))}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{progres.persentase}% tercapai</span>
                      <span>{progres.jumlahDonatur} donatur</span>
                    </div>
                  </>
                )}
              </div>

              {/* Form Donasi */}
              {isBerakhir ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-semibold">Campaign telah berakhir</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Terima kasih atas dukungan Anda
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nominal Preset */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pilih Nominal *
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
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
                        onChange={(e) =>
                          setForm({ ...form, nominalLainnya: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Masukkan nominal"
                      />
                    )}
                  </div>

                  {/* Data Donatur */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      value={form.namaDonatur}
                      onChange={(e) =>
                        setForm({ ...form, namaDonatur: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Nama sesuai KTP"
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={form.anonim}
                      onChange={(e) =>
                        setForm({ ...form, anonim: e.target.checked })
                      }
                      className="w-4 h-4 mt-1 text-emerald-600"
                    />
                    <label className="text-sm text-gray-700">
                      Sembunyikan nama (tampil sebagai "Hamba Allah")
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      WhatsApp *
                    </label>
                    <input
                      type="text"
                      value={form.whatsapp}
                      onChange={(e) =>
                        setForm({ ...form, whatsapp: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="08xx-xxxx-xxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pesan / Doa (opsional)
                    </label>
                    <textarea
                      value={form.pesan}
                      onChange={(e) =>
                        setForm({ ...form, pesan: e.target.value })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Pesan atau doa baik..."
                    />
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
                            .value as FormState["metodePembayaran"],
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

                  {/* Info pembayaran dinamis sesuai metode */}
                  {form.metodePembayaran === "transfer_bank" && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-1">
                      <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                        Transfer ke Rekening
                      </p>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-500">
                            {donasiInfo?.namaRekening || "—"}
                          </p>
                          <p className="text-xl font-bold tracking-wider text-emerald-900 font-mono break-all">
                            {donasiInfo?.nomorRekening || "—"}
                          </p>
                          <p className="text-sm text-gray-700">
                            a.n. {donasiInfo?.atasNamaRekening || "—"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            navigator.clipboard?.writeText(
                              donasiInfo?.nomorRekening || ""
                            )
                          }
                          className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 border border-emerald-300 hover:border-emerald-500 rounded-md px-2 py-1"
                        >
                          <Copy className="w-3.5 h-3.5" /> Salin
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 pt-1">
                        Transfer sesuai nominal, lalu unggah bukti di bawah.
                      </p>
                    </div>
                  )}

                  {form.metodePembayaran === "qris" && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center space-y-2">
                      <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                        Scan QRIS
                      </p>
                      {donasiInfo?.qrisImage ? (
                        <div className="space-y-2">
                          <img
                            src={donasiInfo.qrisImage}
                            alt="QRIS Masjid Al-Kahfi"
                            className="mx-auto w-48 h-48 object-contain bg-white rounded-lg border border-emerald-100"
                          />
                          <a
                            href={donasiInfo.qrisImage}
                            download
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                          >
                            <Download className="w-3.5 h-3.5" /> Unduh QRIS
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Gambar QRIS belum diset admin.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Upload bukti pembayaran (wajib) */}
                  {form.metodePembayaran && (
                    <ImageUpload
                      value={form.buktiPembayaran}
                      onChange={(url) =>
                        setForm({ ...form, buktiPembayaran: url })
                      }
                      label="Unggah Bukti Pembayaran * (wajib, maks 2MB)"
                    />
                  )}

                  {formError && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700">
                      {formError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold py-3 px-6 rounded-lg transition"
                  >
                    {submitting ? "Memproses..." : "Donasi Sekarang"}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: campaign.judul,
                            url: window.location.href,
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          alert("Link berhasil disalin!");
                        }
                      }}
                      className="text-sm text-emerald-700 hover:text-emerald-800 font-semibold flex items-center justify-center gap-1"
                    >
                      <Share2 className="w-4 h-4" />
                      Bagikan Campaign
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
