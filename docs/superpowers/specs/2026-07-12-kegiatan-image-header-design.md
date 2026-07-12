# Image Header Kartu Kegiatan — Design Spec

**Date:** 2026-07-12
**Status:** Approved (pending spec review)
**Related:** `app/(site)/kegiatan/page.tsx`, `app/admin/(protected)/kegiatan/page.tsx`, `app/api/kegiatan/route.ts`, `app/api/kegiatan/[id]/route.ts`, `lib/db/schema.ts`, `app/admin/components/ImageUpload.tsx`, `docs/superpowers/specs/2026-07-12-pengurus-foto-upload-design.md`

## Problem

Halaman publik Kegiatan (`/kegiatan`) saat ini menampilkan kartu kegiatan tanpa gambar header — hanya tag kategori, waktu, judul, deskripsi, ustadz, dan catatan. User ingin setiap kartu kegiatan memiliki image header (foto kegiatan) di bagian atas kartu, seperti yang sudah ada pada kartu Berita.

## Context (existing infrastructure)

Project sudah punya pipeline upload lengkap (sama yang dipakai berita/galeri/pengurus) — tidak perlu infrastruktur baru:

- **`app/admin/components/ImageUpload.tsx`** — komponen React (`"use client"`). Props: `value: string`, `onChange: (url: string) => void`, `label?: string`. Fitur: validasi 2MB, kompresi WebP client-side via `compressImage` (`@/lib/image-compress`), preview + tombol hapus, POST FormData ke `/api/upload`, lalu panggil `onChange(data.url)`.
- **`app/api/upload/route.ts`** — endpoint POST. Terima FormData `file`, validasi 2MB + MIME (jpeg/png/webp/gif), simpan ke `public/uploads/<timestamp>_<filename>`, return `{ url: "/uploads/<filename>" }`.
- **`public/uploads/`** — direktori penyimpanan (sudah ada, sudah dipakai berita/galeri/pengurus; berisi ~16 file `.webp`).
- **Pola tampilan kartu Berita** (`app/(site)/berita/page.tsx:116-124`) — wrapper `<div className="relative w-full h-48">` berisi `<Image fill className="object-cover" sizes="..." />`, sebagai elemen teratas di dalam kartu `overflow-hidden rounded-2xl`. Inilah konvensi yang diikuti.

### Data model saat ini

Tabel `kegiatan` (`lib/db/schema.ts:100-112`) punya kolom: `id, title, type, time, ust, status, desc, note, icon, color, createdAt`. **Belum ada kolom gambar** (berbeda dari `berita.img`, `galeri.img`, `pengurus.foto` yang sudah ada).

- `type` — text, berperan sebagai kategori: `"Harian"`, `"Jum'at"`, `"Hari Besar"`.
- `icon` — text, nama ikon Lucide (`CircleUser`, `Mic`, `Gift`, ...) di-resolve via `iconMap` di halaman publik. Default diturunkan dari `type` di API POST.
- `color` — text, string kelas Tailwind dua bagian (`"bg-emerald-50 text-emerald-800"`, `"bg-gold-100 text-gold-800"`, `"bg-emerald-900 text-gold-300"`). Default diturunkan dari `type` di API POST. Dipakai sebagai background + warna teks pada tag pill.

### Yang penting untuk fallback

Karena data kegiatan yang sudah ada belum punya gambar, dan gambar bersifat opsional, fallback harus terlihat intentional. Kombinasi `color` + `Icon` yang sudah ada di tiap kegiatan langsung memberi header bermakna tanpa upload.

## Goal

Tambahkan kemampuan menyimpan satu foto header per kegiatan (opsional), upload via form admin memakai `ImageUpload`, dan tampilkan sebagai image header full-width di puncak kartu pada halaman publik `/kegiatan`. Jika tidak ada foto, tampilkan fallback: bidang berwarna sesuai `color` kegiatan + ikon kategori semi-transparan.

## Decisions (locked)

1. **Kolom baru `img`** (nullable) pada `kegiatan`. Nama `img` mengikuti konvensi `berita.img` / `galeri.img`.
2. **Gambar opsional** dengan **fallback ikon** (bukan wajib, bukan placeholder netral). Alasan: data lama belum punya gambar; fallback `color`+`Icon` terlihat rapi & on-brand tanpa memaksa upload.
3. **Layout stacked** — gambar full-width di puncak kartu, body kartu (tag, waktu, judul, deskripsi, footer) tidak berubah. Mengikuti konvensi kartu Berita persis.

## Scope of Change

### 1. Schema — `lib/db/schema.ts`

Tambahkan kolom nullable pada tabel `kegiatan` (sekitar baris 100-112):

```ts
img: text("img"),
```

Sinkronkan ke database memakai workflow yang sudah ada di project ini (sama seperti fitur pengurus-hierarki): jalankan `npm run db:push`. Drizzle akan menambah kolom `img` ke tabel `kegiatan`. **Tidak ada file migrasi yang di-generate** — project memakai `drizzle-kit push` (schema-direct sync), bukan `generate` + `migrate`.

### 2. API routes

**`app/api/kegiatan/route.ts` (POST, baris 18-58):**
- Destructure `img` dari `body`.
- Sertakan `img: img || null` pada `db.insert(...).values({...})`.

**`app/api/kegiatan/[id]/route.ts` (PUT):**
- Destructure `img` dari `body`.
- Sertakan `img: img || null` pada `db.update(...).set({...})`. (String kosong → `null` agar fallback tampil.)

Tidak ada perubahan pada GET.

### 3. Admin form — `app/admin/(protected)/kegiatan/page.tsx`

Pada modal Tambah/Edit Kegiatan:

1. Import: `import ImageUpload from "@/app/admin/components/ImageUpload";`
2. Tambah state `img` (string): seed `""` saat tambah, seed `item.img || ""` saat edit (sejajar dengan state `title, type, time, ust, status` di baris 25-29).
3. Render widget di dalam modal, sebelum/bersama field lain: `<ImageUpload value={img} onChange={setImg} label="Foto Header Kegiatan (Maksimal 2MB)" />`.
4. Sertakan `img` pada payload POST (baris ~125) dan PUT (baris ~111): `img: img || null`.
5. Reset `img` ke `""` bersama reset state lain saat modal ditutup/dibuka ulang.

Tidak ada validasi required untuk `img` (opsional).

### 4. Halaman publik — `app/(site)/kegiatan/page.tsx`

1. Import: `import Image from "next/image";`
2. Pada mapper fetch (baris 76-98), teruskan field: tambahkan `img: k.img || ""` ke objek return.
3. Tambah `img: ""` ke setiap entri `FALLBACK_KEGIATAN` (baris 15-60) agar fallback tampil untuk data fallback.
4. Sisipkan blok header di puncak kartu, **sebelum** `<div className="p-6 sm:p-8 space-y-4">` (baris 153), memakai kondisi `act.img`:

```tsx
{act.img ? (
  <div className="relative w-full h-48">
    <Image
      src={act.img}
      alt={act.title}
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      className="object-cover"
    />
  </div>
) : (
  <div className={`relative w-full h-48 flex items-center justify-center ${act.color}`}>
    <act.Icon size={56} className="opacity-25" />
  </div>
)}
```

Kartu sudah memiliki `overflow-hidden rounded-2xl` (baris 151) sehingga sudut gambar ter-clip rapi. Fallback memakai `color` kegiatan sendiri sebagai background + `Icon` kategori semi-transparan (`opacity-25`), sehingga kartu tanpa foto tetap terlihat disengaja dan konsisten dengan tema.

## Constraints & Notes

- **Penyimpanan lokal**: `/public/uploads` adalah filesystem lokal (persist di self-hosted/Docker; tidak persist di serverless/Vercel read-only runtime). Project sudah commit ke pola ini via berita/galeri/pengurus — kegiatan ikut konsisten.
- **Ukuran & format**: mengikuti batasan `ImageUpload` / `/api/upload` — maks 2MB, jpeg/png/webp/gif, kompresi WebP otomatis.
- **next/image**: path lokal `/uploads/...` adalah same-origin → tidak perlu whitelist `next.config.ts`. Konfigurasi gambar yang ada sudah mendukung tanpa perubahan.
- **Kolom nullable**: `img` boleh `null`/kosong. Fallback menangani render ketika kosong.
- **Client component**: halaman publik sudah `"use client"`; `next/image` berfungsi normal di client component.

## Out of Scope (YAGNI)

- Mengedit field `desc`, `note`, `icon`, `color` lewat form admin (kepengusan terpisah; form admin saat ini memang hanya mengelola 5 field inti).
- Menambahkan gambar ke data seed kegiatan (fallback menangani baris existing).
- Cloud storage / S3 / Cloudinary (overkill, inkonsisten dengan pola existing).
- Multiple gambar / galeri per kegiatan (cukup satu header).
- Optimasi/resize tambahan di luar kompresi WebP `ImageUpload`.
- Perubahan `next.config.ts`.

## Verification

1. `npm run db:push` — kolom `img` muncul di tabel `kegiatan` (cek via psql/query `SELECT img FROM kegiatan LIMIT 1`).
2. `npm run build` lulus tanpa error.
3. Admin: buka `/admin/kegiatan` → "Tambah". Field foto header berupa dropzone upload. Upload gambar → preview muncul. Submit → entri tersimpan dengan path `/uploads/...` pada kolom `img`.
4. Admin: tambah kegiatan lain **tanpa** upload foto → tersimpan dengan `img` null.
5. Publik `/kegiatan`:
   - Kegiatan dengan foto → image header tampil di puncak kartu.
   - Kegiatan tanpa foto → fallback (bidang `color` + ikon kategori semi-transparan) tampil.
   - `FALLBACK_KEGIATAN` (saat API gagal) → semua kartu menampilkan fallback.
6. Edit kegiatan existing → ganti/hapus foto → perubahan tercermin di halaman publik.
