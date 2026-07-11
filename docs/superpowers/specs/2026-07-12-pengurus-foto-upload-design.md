# Foto Pengurus via Upload — Design Spec

**Date:** 2026-07-12
**Status:** Approved (pending spec review)
**Related:** `app/admin/(protected)/tentang/page.tsx`, `app/admin/components/ImageUpload.tsx`, `app/api/upload/route.ts`, `docs/superpowers/specs/2026-07-11-pengurus-hierarki-design.md`

## Problem

Form admin pengurus saat ini menggunakan input URL text untuk field `foto`. User ingin upload file langsung dari form (konsisten dengan cara berita & galeri), bukan paste URL.

## Context (existing infrastructure)

Project sudah punya sistem upload lengkap — tidak perlu infrastruktur baru:

- **`app/admin/components/ImageUpload.tsx`** — komponen React ("use client"). Props: `value: string`, `onChange: (url: string) => void`, `label?: string`. Fitur: validasi ukuran 2MB, kompresi WebP client-side via `compressImage` (`@/lib/image-compress`), preview + tombol hapus, POST FormData ke `/api/upload`, lalu panggil `onChange(data.url)`.
- **`app/api/upload/route.ts`** — endpoint POST. Terima FormData `file`, validasi 2MB + MIME (jpeg/png/webp/gif), simpan ke `/public/uploads/<timestamp>_<filename>`, return `{ url: "/uploads/<filename>" }`.
- **`public/uploads/`** — direktori penyimpanan (sudah ada, sudah dipakai berita/galeri).

Komponen `ImageUpload` ini dulu dipakai di form pengurus, lalu di Task 6 pengurus-hierarki diganti jadi input URL text. Spec ini mengembalikannya.

## Goal

Ganti input URL text pada field `foto` di form admin pengurus dengan komponen `ImageUpload` yang sudah ada. Field `foto` tetap menyimpan string path (`/uploads/xxx.webp` alih-alih URL eksternal).

## Decision (locked)

**Pendekatan A: Reuse `ImageUpload` yang sudah ada.**

## Scope of Change

### Yang berubah

**`app/admin/(protected)/tentang/page.tsx`** — hanya bagian form pengurus (modal "Tambah/Edit Pengguna"):

1. Tambah import: `import ImageUpload from "@/app/admin/components/ImageUpload";`
2. Ganti elemen input URL foto:
   - Hapus: blok `<input type="text" value={pFoto} onChange={(e) => setPFoto(e.target.value)} ... placeholder="https://..." />` beserta label/wrapper-nya.
   - Ganti dengan: `<ImageUpload value={pFoto} onChange={setPFoto} label="Foto" />`
3. Pertahankan validasi `!pFoto` di `handleSubmitPengurus` (ImageUpload meng-set `pFoto` ke string path via `onChange`; jika user belum upload, `pFoto` tetap `""` → validasi menolak submit, sama seperti sebelumnya).

Tidak ada perubahan lain pada file ini. Visi-misi, fasilitas, state/handler lain, dan logika pengurus lainnya tidak tersentuh.

### Yang TIDAK berubah

- **Schema (`lib/db/schema.ts`)** — kolom `pengurus.foto` tetap `text NOT NULL`. Isi berupa path `/uploads/...` atau URL eksternal sama-sama string; tidak ada perbedaan tipe.
- **API pengurus (`app/api/pengurus/route.ts`, `[id]/route.ts`)** — tetap menerima `foto` sebagai string. Tidak ada validasi format baru.
- **Halaman publik (`app/(site)/tentang/page.tsx`)** — `PengurusCard` & `KoordinatorCard` render `foto` via `next/image` + fallback inisial pada error. Path lokal `/uploads/...` adalah same-origin → tidak perlu whitelist `next.config.ts`. Tetap berfungsi.
- **Seed (`lib/db/seed.ts`)** — tetap menggunakan URL `placehold.co` sebagai placeholder awal. Foto tersebut masih render (domain sudah di-whitelist). Admin mengganti foto asli satu per satu via form upload.
- **Komponen `ImageUpload` & endpoint `/api/upload`** — dipakai apa adanya, tidak dimodifikasi.

## Constraints & Notes

- **Penyimpanan lokal**: `/public/uploads` adalah filesystem lokal. Persist di self-hosted/Docker (yang dipakai project ini); tidak persist di Vercel/serverless (read-only runtime). Karena berita & galeri sudah pakai pola yang sama, project sudah commit ke lokal storage — pengurus ikut konsisten. Bukan masalah untuk deployment saat ini.
- **Ukuran & format**: mengikuti batasan `ImageUpload` / `/api/upload` yang sudah ada — maks 2MB, format jpeg/png/webp/gif, kompresi WebP otomatis.
- **Validasi required**: `foto` tetap wajib. `ImageUpload` onChange hanya mengisi `pFoto` setelah upload sukses; jika kosong, `handleSubmitPengurus` menolak dengan alert "Nama, foto, dan tingkat wajib diisi".

## Out of Scope (YAGNI)

- Opsi paste URL sebagai fallback (user eksplisit ingin upload, bukan URL).
- Migrasi seed placehold.co ke file lokal (foto placeholder masih render; admin ganti bertahap).
- Cloud storage / S3 / Cloudinary (overkill, inkonsisten).
- Upload multiple sekaligus / bulk replace foto 71 entri seed.
- Resize/optimasi tambahan di luar kompresi WebP yang sudah dilakukan `ImageUpload`.

## Verification

1. `npm run build` lulus tanpa error.
2. Admin: buka `/admin/tentang` → tab Pengurus → "Tambah". Field foto kini berupa dropzone upload (bukan input text). Upload gambar → preview muncul, `pFoto` terisi path `/uploads/...`. Submit → entri tersimpan dengan path lokal.
3. Edit entri existing → ganti foto via upload → tersimpan.
4. Halaman publik `/tentang` → foto ter-upload tampil (bukan placehold.co).
5. Cek file fisik ada di `public/uploads/`.
