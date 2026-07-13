import type { Metadata } from "next";
import Image from "next/image";
import { Landmark, QrCode } from "lucide-react";
import { getDonasi } from "@/lib/queries/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/json-ld";
import { CopyRekeningButton } from "./donasi-client";

export const metadata: Metadata = buildMetadata({
  title: "Donasi, Infaq & Zakat Masjid Al-Kahfi",
  description:
    "Saluran donasi resmi DKM Masjid Al-Kahfi Cikoneng: transfer rekening BSI dan QRIS untuk infaq, shodaqoh, dan zakat (ZISWAF).",
  path: "/donasi",
});

const FAQ = [
  {
    q: "Bagaimana cara berinfaq atau zakat?",
    a: "Anda dapat transfer ke rekening resmi DKM atau scan QRIS di halaman donasi. Konfirmasi via email/WhatsApp admin bila memerlukan tanda terima.",
  },
  {
    q: "Apakah dana dikelola transparan?",
    a: "Ya. DKM Masjid Al-Kahfi mencatat dan melaporkan dana ZISWAF secara periodik kepada jamaah.",
  },
];

export default async function DonasiPage() {
  const d = await getDonasi();

  return (
    <div className="pb-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Beranda", path: "/beranda" },
          { name: "Donasi & Infaq", path: "/donasi" },
        ])}
      />
      <JsonLd data={faqPageJsonLd(FAQ)} />
      <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
        <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h1 className="font-serif text-4xl font-bold">
            Infaq, Shodaqoh, Zakat
          </h1>
          <p className="text-gold-300 mt-2 font-medium">
            Bantu Operasional &amp; Pembangunan Sarana Masjid Al-Kahfi
          </p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gold-100 shadow-md space-y-6">
            <h2 className="font-serif text-xl font-bold text-emerald-950 flex items-center gap-2">
              <Landmark className="text-gold-500" /> Transfer Bank
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Silakan melakukan transfer ke nomor rekening resmi DKM Al-Kahfi
              di bawah ini. Harap konfirmasi via WhatsApp setelah transaksi
              agar pencatatan rapi.
            </p>
            <div className="bg-gold-50/50 p-4 rounded-xl border border-gold-100 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              {d?.nomorRekening ? (
                <div>
                  <p className="text-xs font-bold text-emerald-900">
                    {d.namaRekening || "Bank"}
                  </p>
                  <p className="font-mono text-base font-bold text-gray-800 mt-1">
                    {d.nomorRekening}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    a.n {d.atasNamaRekening || "-"}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  Informasi rekening belum tersedia. Silakan hubungi DKM.
                </p>
              )}
              {d?.nomorRekening && (
                <CopyRekeningButton nomorRekening={d.nomorRekening} />
              )}
            </div>
          </div>
          <div className="bg-emerald-950 text-white rounded-2xl p-6 sm:p-8 border-b-4 border-gold-500 shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-gold-300 flex items-center gap-2">
                <QrCode /> Scan QRIS Digital
              </h2>
              <p className="text-emerald-50 text-xs leading-relaxed">
                Dukung kemudahan donasi instan melalui scan QRIS dari berbagai
                platform uang elektronik (GoPay, OVO, Dana, LinkAja, BCA Mobile,
                dll).
              </p>
            </div>
            {d?.qrisImage && (
              <div className="bg-white p-4 rounded-xl max-w-[240px] mx-auto my-6 border-2 border-gold-400 shadow-xl relative h-56 w-56">
                <Image
                  src={d.qrisImage}
                  alt="QRIS Masjid Al-Kahfi"
                  fill
                  sizes="224px"
                  className="object-contain rounded-lg"
                />
              </div>
            )}
            <p className="text-center text-[10px] text-gold-300">
              Terverifikasi Bank Indonesia • QRIS ID: ID1023456789101
            </p>
          </div>
        </div>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-emerald-950 mb-6 text-center">
            Pertanyaan Umum Donasi
          </h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="bg-white rounded-xl p-5 border border-gold-100 shadow-sm"
              >
                <h3 className="font-bold text-emerald-950 text-sm flex items-start gap-2">
                  <span className="text-gold-500" aria-hidden="true">
                    Q.
                  </span>
                  <span>{item.q}</span>
                </h3>
                <p className="text-gray-600 text-sm mt-2 pl-6">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
