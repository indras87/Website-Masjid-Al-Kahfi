# Beranda Program Masjid — Featured Kegiatan — Design Spec

**Date:** 2026-07-12
**Status:** Approved (pending spec review)
**Related:** `app/(site)/beranda/page.tsx`, `app/admin/(protected)/kegiatan/page.tsx`, `app/api/kegiatan/route.ts`, `app/api/kegiatan/[id]/route.ts`, `lib/db/schema.ts`, `docs/superpowers/specs/2026-07-12-kegiatan-image-header-design.md`

## Problem

Section "Program Masjid / Kegiatan Utama & Kemaslahatan" pada halaman Beranda saat ini **100% hardcoded** — tiga kartu statis ("Majelis Ilmu & Kajian Rutin", "Taman Pendidikan Al-Qur'an (TPA)", "Layanan Sosial & Ambulans") yang tidak terhubung ke data kegiatan. Beranda juga sudah `fetch("/api/kegiatan")` ke state `activitiesData`, tapi state itu **tidak pernah dirender** (dead data). User ingin section ini menampilkan maksimal 3 kartu kegiatan nyata yang dipilih admin.

## Context

- **Beranda** (`app/(site)/beranda/page.tsx`): client component. Sudah fetch `/api/kegiatan`, filter `status === "Aktif"`, map ke `{cat, tag, time, title, desc, ust, note, Icon, color}` (baris 303-325). Mapper saat ini **tidak** meneruskan `img` maupun `featured`.
- **Section Program Masjid** (baris 498-566): grid `grid-cols-1 md:grid-cols-3 gap-8`, tiga `<div>` statis. Tiap kartu: chip ikon (Lucide hardcoded), judul, deskripsi, link `/kegiatan` + `ChevronRight`.
- **Kegiatan schema** (`lib/db/schema.ts` baris 100-113): kolom `id, title, type, time, ust, status, desc, note, icon, color, img, createdAt`. Belum ada kolom `featured`.
- **API**: `GET /api/kegiatan` return semua baris (ada `img`); `POST`/`PUT` menerima `img`. Belum ada `featured`.
- **Form admin kegiatan** (`app/admin/(protected)/kegiatan/page.tsx`): modal dengan field `img, title, type, status, time, ust`; tabel list dgn kolom Nama/Kategori/Waktu/Pengisi/Status/Aksi. Payload (baris ~109): `{ title, type, time, ust, status, img: img || null }`.
- **Tidak ada pola "featured/pin"** sebelumnya di codebase. Analog terdekat: kolom boolean per-baris seperti `status`.
- **Pola tampilan kartu ber-image** sudah ada di halaman `/kegiatan` (baris 159-173): wrapper `relative w-full h-48` berisi `<Image fill className="object-cover">`, fallback div `act.color` + ikon `opacity-25` bila tanpa foto. Pola ini akan dipakai ulang.

## Goal

Section Program Masjid di Beranda menampilkan **3 kartu kegiatan** yang dipilih admin (via toggle `featured`), dengan gaya image-header (foto + fallback ikon/warna). Bila kegiatan featured kurang dari 3, slot diisi (backfill) oleh kegiatan Aktif lain hingga 3. Kartu link ke `/kegiatan`.

## Decisions (locked)

1. **Seleksi**: kolom boolean `featured` per kegiatan (default `false`). Admin toggle di form kegiatan.
2. **Gaya kartu**: image-header — foto di puncak (fallback ikon + `color` bila tanpa foto), lalu judul, deskripsi, link.
3. **Fallback < 3**: featured diutamakan; sisa slot diisi kegiatan Aktif lain (bukan featured) hingga 3. Section selalu 3 kartu bila data cukup.
4. **Urutan**: featured dulu (urut `id` asc, sama dgn list), lalu non-featured (urut `id` asc). Ambil 3 pertama. Tidak ada drag-reorder (YAGNI).

## Scope of Change

### 1. Schema — `lib/db/schema.ts`

Tambah kolom boolean default false pada tabel `kegiatan` (baris 100-113):

```ts
featured: boolean("featured").default(false).notNull(),
```

Sync via `npm run db:push` (workflow existing; tidak generate file migrasi).

### 2. API routes

**`app/api/kegiatan/route.ts` (POST):**
- Destructure `featured` dari `body`.
- Pada insert values: `featured: featured ?? false,`.

**`app/api/kegiatan/[id]/route.ts` (PUT):**
- Destructure `featured` dari `body`.
- Pada update set: `featured: featured ?? false,`.

GET tidak berubah (otomatis mengembalikan `featured`).

### 3. Admin form — `app/admin/(protected)/kegiatan/page.tsx`

1. State baru: `const [featured, setFeatured] = useState(false);` (sejajar state lain, baris 25-30).
2. `handleOpenAdd`: tambah `setFeatured(false);`.
3. `handleOpenEdit`: tambah `setFeatured(!!item.featured);`.
4. Payload (baris ~109): tambahkan `featured`.
5. Render toggle di modal — checkbox "Tampilkan di Beranda" dalam grid 2-kolom yang sudah ada (sebelah Status), mis.:
   ```tsx
   <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase cursor-pointer">
     <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
     Tampilkan di Beranda
   </label>
   ```
6. Badge "Beranda" pada tabel list: chip emerald kecil di-render di **kolom Status** (sebelah pill status) saat `item.featured` true, agar admin lihat pilihan featured.

### 4. Beranda section — `app/(site)/beranda/page.tsx`

1. **Mapper** (baris 303-325): teruskan field baru ke objek hasil map:
   - `img: k.img || "",`
   - `featured: !!k.featured,`
2. **`FALLBACK_KEGIATAN`** (baris 58-103): tambahkan `img: "",` dan `featured: false,` ke setiap entri agar path fallback tetap merender 3 kartu.
3. **Seleksi 3 kartu**: hitung dari `activitiesData` (sudah Aktif-only):
   ```ts
   const programKegiatan = [
     ...activitiesData.filter((a) => a.featured),
     ...activitiesData.filter((a) => !a.featured),
   ].slice(0, 3);
   ```
4. **Render**: ganti tiga `<div>` hardcoded (baris 508-565) dengan `programKegiatan.map(...)`. Tiap kartu:
   - Header: bila `act.img` → `<div className="relative w-full h-40"><Image src fill sizes className="object-cover" /></div>`; else fallback `<div className={... act.color flex items-center justify-center h-40}><act.Icon ... className="opacity-25" /></div>`.
   - Body: judul (`act.title`), deskripsi (`act.desc`), link `/kegiatan` + `ChevronRight`.
   - Pertahankan grid `grid-cols-1 md:grid-cols-3 gap-8` dan kelas kartu (`rounded-2xl overflow-hidden border shadow`).
5. Import `Image` dari `next/image` bila belum.

Catatan: `activitiesData` sudah di-fetch; spec ini mengaktifkan pemakaiannya. Heading section ("Program Masjid" / "Kegiatan Utama & Kemaslahatan") dan eyebrow tetap.

## Constraints & Notes

- **Tidak ada hard-cap 3 di admin**: admin boleh menandai >3 featured; tampilan ambil 3 pertama (prioritas featured). Mencegah lockout/friction.
- **`featured` notNull default false**: semua baris existing dapat nilai `false` saat push (aman untuk data lama).
- **Photo optional**: bila kegiatan featured tanpa foto, header pakai fallback ikon+warna (konsisten dgn `/kegiatan`).
- **Backfill**: bila 0 featured, section tetap tampil 3 kegiatan Aktif (urut id). Tidak pernah kosong selama ada ≥3 kegiatan Aktif.
- **next/image**: path lokal `/uploads/...` same-origin, tidak perlu whitelist `next.config.ts`.
- **Sync schema**: `npm run db:push` (bukan generate migrasi).

## Out of Scope (YAGNI)

- Halaman detail per-kegiatan (kartu link ke `/kegiatan`).
- Drag-to-reorder / kolom `featuredOrder`.
- Hard-cap toggle featured di admin.
- Ekspos editing `desc/note/icon/color` di admin (pre-existing gap, terpisah).
- Komponen kartu shared antar halaman (tetap inline per page, konsisten dgn现状).

## Verification

1. `npm run db:push` — kolom `featured` muncul di tabel `kegiatan` (boolean, default false).
2. `npm run build` lulus.
3. Admin `/admin/kegiatan`: toggle "Tampilkan di Beranda" di modal; badge tampil di tabel saat featured. Simpan → `featured` tersimpan di DB.
4. Beranda `/`:
   - Tandai 2 kegiatan featured → Beranda tampilkan 2 itu + 1 backfill.
   - Tandai 5 featured → Beranda tampilkan 3 pertama.
   - Tandai 0 featured → Beranda tampilkan 3 kegiatan Aktif teratas.
   - Kegiatan featured dgn foto → header foto; tanpa foto → fallback ikon+warna.
5. API down (fallback path) → section tetap 3 kartu (dari `FALLBACK_KEGIATAN`).
