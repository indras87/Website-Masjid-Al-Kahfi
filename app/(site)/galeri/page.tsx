"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  const isOpen = lightboxIndex !== null;

  /** Menutup lightbox. */
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  /** Pindah ke foto sebelumnya; membungkus ke akhir bila di awal. */
  const prevImage = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? prev : (prev - 1 + galleryImages.length) % galleryImages.length
    );
  }, [galleryImages.length]);

  /** Pindah ke foto berikutnya; membungkus ke awal bila di akhir. */
  const nextImage = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? prev : (prev + 1) % galleryImages.length
    );
  }, [galleryImages.length]);

  /** Navigasi keyboard saat lightbox terbuka: Esc tutup, panah kiri/kanan pindah foto. */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") prevImage();
      else if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeLightbox, prevImage, nextImage]);

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
            <button
              key={idx}
              type="button"
              onClick={() => setLightboxIndex(idx)}
              aria-label={`Perbesar foto galeri ${idx + 1}`}
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
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
        >
          {/* Tombol tutup */}
          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Tutup"
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-10"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Tombol sebelumnya */}
          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              aria-label="Foto sebelumnya"
              className="absolute left-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-10"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
          )}

          {/* Foto yang diperbesar */}
          <div
            className="relative w-full max-w-5xl h-[80vh] px-14"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={galleryImages[lightboxIndex as number]}
              alt={`Galeri ${lightboxIndex! + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Tombol berikutnya */}
          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              aria-label="Foto berikutnya"
              className="absolute right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-10"
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
