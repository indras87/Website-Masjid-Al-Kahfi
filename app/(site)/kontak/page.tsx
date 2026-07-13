"use client";

import React, { useState, useEffect } from "react";
import { MapPin, PhoneCall, Mail, Info } from "lucide-react";

const FALLBACK_KONTAK = {
  alamat: "Jl. Cikoneng No.15, Bojongsoang, Kab. Bandung 40288",
  hotline: "+62 812-3456-7890",
  email: "alkahfi.cikoneng@gmail.com",
  jamOperasional: "Setiap Hari: 08:00 - 20:00 WIB (Bada Isya)",
  googleMapsUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15840.403487310565!2d107.65886676342774!3d-6.985587799999991!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68c22755e378c3%3A0xe5a363717dfbbf5e!2sCikoneng%2C%20Bojongsoang%2C%20Bandung%20Regency%2C%20West%20Java!5e0!3m2!1sen!2sid!4v1700000000000",
};

/** Halaman kontak yang menampilkan informasi DKM dan peta lokasi masjid. */
export default function KontakPage() {
  const [contactData, setContactData] = useState(FALLBACK_KONTAK);

  useEffect(() => {
    /** Memuat data kontak masjid dari API; jatuh ke FALLBACK_KONTAK bila gagal. */
    const fetchContact = async () => {
      try {
        const kontaktRes = await fetch("/api/kontak");
        if (kontaktRes.ok) {
          const kontaktJson = await kontaktRes.json();
          setContactData({
            alamat: kontaktJson.alamat || FALLBACK_KONTAK.alamat,
            hotline: kontaktJson.hotline || FALLBACK_KONTAK.hotline,
            email: kontaktJson.email || FALLBACK_KONTAK.email,
            jamOperasional:
              kontaktJson.jamOperasional || FALLBACK_KONTAK.jamOperasional,
            googleMapsUrl:
              kontaktJson.googleMapsUrl || FALLBACK_KONTAK.googleMapsUrl,
          });
        } else {
          setContactData(FALLBACK_KONTAK);
        }
      } catch (e) {
        console.error("Gagal memuat kontak:", e);
        setContactData(FALLBACK_KONTAK);
      }
    };

    fetchContact();
  }, []);

  return (
    <div className="pb-16">
      <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
        <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h2 className="font-serif text-4xl font-bold">Hubungi Kami</h2>
          <p className="text-gold-300 mt-2 font-medium">
            Layanan Informasi Terpadu & Layanan Sosial Darurat
          </p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="bg-white rounded-2xl p-8 border border-gold-100 shadow-md lg:col-span-5 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <span className="text-xs font-bold text-gold-600 uppercase tracking-widest">
                Informasi Kontak
              </span>
              <h3 className="font-serif text-2xl font-bold text-emerald-950">
                DKM Al-Kahfi Cikoneng
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Untuk layanan bimbingan ibadah, sewa fasilitas sosial,
                koordinasi infaq, serta layanan darurat kesehatan &
                jenazah, silakan hubungi kontak resmi kami.
              </p>
            </div>
            <div className="space-y-6 text-sm text-gray-700">
              <div className="flex items-start gap-4">
                <MapPin className="text-gold-500 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-900">Alamat Fisik</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {contactData.alamat}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <PhoneCall className="text-gold-500 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-900">Hotline DKM & Ambulans</p>
                  <p className="text-xs text-emerald-950 font-bold mt-1">
                    {contactData.hotline}{" "}
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded ml-2 uppercase font-extrabold tracking-wider">
                      Siaga 24 Jam
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="text-gold-500 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-900">Email Korespondensi</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {contactData.email}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Info className="text-gold-500 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-900">Jam Operasional Kantor</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {contactData.jamOperasional}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border-2 border-gold-200 lg:col-span-7 bg-gray-100 relative shadow-inner min-h-[400px]">
            <iframe
              src={contactData.googleMapsUrl}
              className="absolute inset-0 w-full h-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
