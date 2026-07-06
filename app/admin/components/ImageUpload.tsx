'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { compressImage } from '@/lib/image-compress';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = 'Gambar/Foto' }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // 1. Validasi Ukuran File Mentah (Maksimal 2MB)
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      setError('Ukuran file asli melebihi 2MB! Silakan pilih file yang lebih kecil.');
      return;
    }

    try {
      setLoading(true);

      // 2. Kompresi gambar menjadi WebP di sisi Browser (Max 1000px, Kualitas 80%)
      const compressedFile = await compressImage(file, 1000, 1000, 0.8);

      // Log perbandingan ukuran file untuk debugging & membuktikan keefektifannya
      const originalKB = (file.size / 1024).toFixed(1);
      const compressedKB = (compressedFile.size / 1024).toFixed(1);
      console.log(`[Image Compressor] Sebelum: ${originalKB}KB | Sesudah: ${compressedKB}KB (Menghemat ${(100 - (compressedFile.size / file.size * 100)).toFixed(0)}%)`);

      // 3. Persiapkan FormData untuk diupload ke server
      const formData = new FormData();
      formData.append('file', compressedFile);

      // 4. Kirim file hasil kompresi ke API
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Gagal mengunggah file.');
      }

      const data = await res.json();

      // 5. Update state di parent component
      onChange(data.url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat mengunggah gambar.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
        {label}
      </label>

      {/* Upload Zone / Preview */}
      <div
        onClick={!value && !loading ? triggerSelectFile : undefined}
        className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-all duration-300 min-h-[160px] ${
          value
            ? 'border-emerald-500 bg-emerald-50/10'
            : 'border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={loading}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-2 text-emerald-600 p-6">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-semibold">Mengompresi & mengunggah gambar...</p>
          </div>
        ) : value ? (
          // Preview Gambar
          <div className="relative w-full h-[200px] group">
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-cover"
            />
            {/* Overlay untuk menghapus gambar */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={handleRemove}
                className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition duration-200 transform scale-90 group-hover:scale-100"
                title="Hapus Gambar"
              >
                <X size={20} />
              </button>
            </div>
            {/* Info Badge */}
            <div className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[10px] px-2.5 py-1 rounded font-bold shadow-sm">
              Tautan Aktif: {value}
            </div>
          </div>
        ) : (
          // Placeholder Belum Ada Gambar
          <div className="flex flex-col items-center gap-2 text-gray-400 p-6 text-center select-none">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400 mb-1">
              <Upload size={22} />
            </div>
            <p className="text-sm font-semibold text-gray-700">Pilih berkas atau seret foto kesini</p>
            <p className="text-xs text-gray-400">PNG, JPG, WEBP, atau GIF (Maksimal 2MB)</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
