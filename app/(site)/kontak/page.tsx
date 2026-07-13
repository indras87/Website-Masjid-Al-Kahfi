import type { Metadata } from "next";
import { MapPin, PhoneCall, Mail, Info } from "lucide-react";
import { getKontak } from "@/lib/queries/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = buildMetadata({
  title: "Kontak & Lokasi Masjid Al-Kahfi",
  description:
    "Alamat, peta, jam operasional, dan informasi kontak resmi DKM Masjid Al-Kahfi Cikoneng, Bojongsoang, Kab. Bandung.",
  path: "/kontak",
});

export default async function KontakPage() {
  const k = await getKontak();

  return (
    <div className="pb-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Beranda", path: "/beranda" },
          { name: "Kontak", path: "/kontak" },
        ])}
      />
      <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
        <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h1 className="font-serif text-4xl font-bold">Hubungi Kami</h1>
          <p className="text-gold-300 mt-2 font-medium">
            Layanan Informasi Terpadu &amp; Layanan Sosial Darurat
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
              <h2 className="font-serif text-2xl font-bold text-emerald-950">
                DKM Al-Kahfi Cikoneng
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Untuk layanan bimbingan ibadah, sewa fasilitas sosial,
                koordinasi infaq, serta layanan darurat kesehatan &amp;
                jenazah, silakan hubungi kontak resmi kami.
              </p>
            </div>
            <div className="space-y-6 text-sm text-gray-700">
              <div className="flex items-start gap-4">
                <MapPin className="text-gold-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-emerald-900">Alamat Fisik</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {k?.alamat}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <PhoneCall className="text-gold-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-emerald-900">
                    Hotline DKM &amp; Ambulans
                  </h3>
                  <p className="text-xs text-emerald-950 font-bold mt-1">
                    {k?.hotline}{" "}
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded ml-2 uppercase font-extrabold tracking-wider">
                      Siaga 24 Jam
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="text-gold-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-emerald-900">
                    Email Korespondensi
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    <a
                      href={`mailto:${k?.email}`}
                      className="text-emerald-700 hover:underline"
                    >
                      {k?.email}
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Info className="text-gold-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-emerald-900">
                    Jam Operasional Kantor
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {k?.jamOperasional}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border-2 border-gold-200 lg:col-span-7 bg-gray-100 relative shadow-inner min-h-[400px]">
            {/* sr-only heading gives the map region a semantic label without
                altering the visual design (Task 12 heading-hierarchy cleanup). */}
            <h2 className="sr-only">Peta Lokasi Masjid Al-Kahfi</h2>
            {k?.googleMapsUrl && (
              <iframe
                src={k.googleMapsUrl}
                title="Lokasi Masjid Al-Kahfi di peta"
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
