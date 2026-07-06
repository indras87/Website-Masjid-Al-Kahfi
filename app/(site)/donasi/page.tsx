"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { HandCoins, Landmark, QrCode } from "lucide-react";

const FALLBACK_DONASI = {
  namaRekening: "Bank Syariah Indonesia (BSI)",
  nomorRekening: "7123-4567-89",
  atasNamaRekening: "DKM AL-KAHFI CIKONENG",
  qrisImage: "https://placehold.co/400x400/ffffff/064e3b?text=QRIS+AL-KAHFI",
};

export default function DonasiPage() {
  const [donationData, setDonationData] = useState(FALLBACK_DONASI);

  useEffect(() => {
    const fetchDonasi = async () => {
      try {
        const donasiRes = await fetch("/api/donasi");
        if (donasiRes.ok) {
          const donasiJson = await donasiRes.json();
          setDonationData({
            namaRekening: donasiJson.namaRekening || FALLBACK_DONASI.namaRekening,
            nomorRekening: donasiJson.nomorRekening || FALLBACK_DONASI.nomorRekening,
            atasNamaRekening:
              donasiJson.atasNamaRekening || FALLBACK_DONASI.atasNamaRekening,
            qrisImage: donasiJson.qrisImage || FALLBACK_DONASI.qrisImage,
          });
        } else {
          setDonationData(FALLBACK_DONASI);
        }
      } catch (e) {
        console.error("Gagal memuat donasi:", e);
        setDonationData(FALLBACK_DONASI);
      }
    };

    fetchDonasi();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="pb-16">
      <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
        <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h2 className="font-serif text-4xl font-bold">
            Infaq, Shodaqoh, Zakat
          </h2>
          <p className="text-gold-300 mt-2 font-medium">
            Bantu Operasional & Pembangunan Sarana Masjid Al-Kahfi
          </p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gold-100 shadow-md space-y-6">
            <h3 className="font-serif text-xl font-bold text-emerald-950 flex items-center gap-2">
              <Landmark className="text-gold-500" /> Transfer Bank
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Silakan melakukan transfer ke nomor rekening resmi DKM
              Al-Kahfi di bawah ini. Harap konfirmasi via WhatsApp
              setelah transaksi agar pencatatan rapi.
            </p>
            <div className="bg-gold-50/50 p-4 rounded-xl border border-gold-100 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  {donationData.namaRekening}
                </p>
                <p className="font-mono text-base font-bold text-gray-800 mt-1">
                  {donationData.nomorRekening}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  a.n {donationData.atasNamaRekening}
                </p>
              </div>
              <button
                onClick={() => handleCopy(donationData.nomorRekening)}
                className="bg-emerald-900 text-gold-100 hover:bg-gold-500 hover:text-emerald-950 font-bold px-3 py-1.5 rounded-lg text-xs transition"
              >
                Salin
              </button>
            </div>
          </div>
          <div className="bg-emerald-950 text-white rounded-2xl p-6 sm:p-8 border-b-4 border-gold-500 shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-gold-300 flex items-center gap-2">
                <QrCode /> Scan QRIS Digital
              </h3>
              <p className="text-emerald-50 text-xs leading-relaxed">
                Dukung kemudahan donasi instan melalui scan QRIS dari
                berbagai platform uang elektronik (GoPay, OVO, Dana,
                LinkAja, BCA Mobile, dll).
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl max-w-[240px] mx-auto my-6 border-2 border-gold-400 shadow-xl relative h-56 w-56">
              <Image
                src={donationData.qrisImage}
                alt="QRIS Al Kahfi"
                fill
                sizes="224px"
                className="object-contain rounded-lg"
              />
            </div>
            <p className="text-center text-[10px] text-gold-300">
              Terverifikasi Bank Indonesia • QRIS ID: ID1023456789101
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
