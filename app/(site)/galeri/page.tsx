"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight, ZoomIn } from "lucide-react";

const FALLBACK_GALERI = [
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1590075865003-e48277faa558?auto=format&fit=crop&q=80&w=800",
];

/** Halaman galeri yang menampilkan grid dokumentasi foto kegiatan masjid. */
export default function GaleriPage() {
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  useEffect(() => {
    /** Memuat daftar foto galeri dari API; jatuh ke FALLBACK_GALERI bila gagal. */
    const fetchData = async () => {
      try {
        const res = await fetch("/api/galeri");
        if (res.ok) {
          const json = await res.json();
          setGalleryImages(json.map((g: any) => g.img));
        } else {
          setGalleryImages(FALLBACK_GALERI);
        }
      } catch (e) {
        console.error("Gagal memuat galeri:", e);
        setGalleryImages(FALLBACK_GALERI);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="pb-16">
      <div className="bg-emerald-900 text-white py-16 text-center relative overflow-hidden border-b-4 border-gold-500">
        <div className="absolute inset-0 opacity-15 islamic-pattern"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h2 className="font-serif text-4xl font-bold">
            Galeri Dokumentasi
          </h2>
          <p className="text-gold-300 mt-2 font-medium">
            Rekaman Kilasan Kegiatan dan Pembangunan Masjid Al-Kahfi
          </p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {galleryImages.map((img, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-xl cursor-pointer h-40 sm:h-48"
            >
              <Image
                src={img}
                alt={`Galeri ${idx}`}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <ZoomIn className="text-white w-8 h-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
