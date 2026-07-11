# Pengurus DKM Hierarki — Design Spec

**Date:** 2026-07-11
**Status:** Approved (pending spec review)
**Related:** `app/(site)/tentang/page.tsx`, `lib/db/schema.ts`, `lib/db/seed.ts`, `app/api/pengurus/route.ts`, `app/admin/(protected)/tentang/page.tsx`

## Problem

Halaman "Tentang" menampilkan pengurus DKM sebagai grid datar 4 kolom. Struktur asli DKM Al-Kahfi punya 70+ pengurus dalam hierarki 3-level (Tingkat → Bidang → Sub-bidang → Anggota). Grid datar tidak mewakili struktur, halaman jadi terlalu panjang, dan foto 70+ dimuat sekaligus (berat).

## Goal

Tampilkan struktur pengurus sesuai hierarki asli, dengan foto semua orang, dalam layout yang ringkas (tab per bidang) dan performant (lazy load).

## Decisions (locked)

1. **Pertahankan hierarki penuh** — 3-level: Tingkat → Bidang → Sub-bidang → Anggota
2. **Foto semua orang** — setiap pengurus punya foto, dengan fallback avatar inisial
3. **Tab per Bidang** — Pembina/Penasehat/Pimpinan always visible di atas; 3 tab untuk Idarah/Imarah/Ri'ayah
4. **Schema A: satu tabel + kolom hierarki** — migration kecil, CRUD 1 form

## Schema Model

Ganti tabel `pengurus` di `lib/db/schema.ts`:

```typescript
export const pengurusTingkatEnum = pgEnum("pengurus_tingkat", [
  "pembina",    // Pembina
  "penasehat",  // Penasehat
  "pimpinan",   // Pimpinan Inti
  "idarah",     // Bidang Idarah (Pengurusan Umum)
  "imarah",     // Bidang Imarah (Ibadah, Dakwah & Sosial)
  "riayah",     // Bidang Ri'ayah (Pemeliharaan & Aset)
]);

export const pengurus = pgTable("pengurus", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  foto: text("foto").notNull(),
  tingkat: pengurusTingkatEnum("tingkat").notNull(),
  subBidang: text("sub_bidang"),        // nullable
  jabatan: text("jabatan"),             // nullable
  urutan: integer("urutan").default(0).notNull(),
  periode: text("periode").default("2024-2028").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Field Semantics

| Field | Pembina/Penasehat | Pimpinan | Idarah | Imarah/Ri'ayah Koordinator | Imarah/Ri'ayah Anggota |
|-------|-------------------|----------|--------|----------------------------|------------------------|
| `tingkat` | `pembina`/`penasehat` | `pimpinan` | `idarah` | `imarah`/`riayah` | `imarah`/`riayah` |
| `subBidang` | `null` | `null` | `null` | `null` | nama sub-bidang |
| `jabatan` | `null` | `Ketua`/`Wakil Ketua` | nama peran (Sekretaris, Bendahara, dll) | `Koordinator Bidang` | `null` |

### Data Rules

- Satu orang dengan beberapa peran = beberapa baris. Contoh: Irfanudin Ma'sum = 1 baris Koordinator Imarah (`jabatan="Koordinator Bidang"`, `subBidang=null`) + 1 baris anggota Syiar Islam (`subBidang="Syiar Islam"`, `jabatan=null`).
- Jabatan dengan banyak orang (mis. Humas Internal: 2 orang, AMC: 2 orang) = beberapa baris dengan `jabatan` sama, `urutan` membedakan.
- `urutan` mengatur urutan tampil dalam grup (tingkat atau sub-bidang).

## Display UX

### Layout (`app/(site)/tentang/page.tsx`)

```
┌─ PEMBINA ──────────────────────────┐
│  [foto] [foto]                      │   grid, always visible
├─ PENASEHAT ────────────────────────┤
│  [foto] [foto] [foto]               │
├─ PIMPINAN INTI ────────────────────┤
│  [foto Ketua]  [foto Wakil]         │
└─────────────────────────────────────┘
┌─ [ Idarah ] [ IMARAH ] [ Ri'ayah ] ─┐  tab (client state)
│  ⭐ Koordinator: <nama>              │  highlighted card bila ada
│  ▸ <Sub-bidang>                     │  sub-bidang heading
│    [foto][foto][foto]               │  member grid
│  ▸ <Sub-bidang>                     │
│    [foto][foto]...                  │
└──────────────────────────────────────┘
```

### Grouping Logic (client-side)

1. Pisahkan data per `tingkat`.
2. `pembina`, `penasehat`, `pimpinan` → render di atas (selalu tampil).
3. `idarah`, `imarah`, `riayah` → render sesuai tab aktif.
4. Dalam tab:
   - Cari baris `jabatan === "Koordinator Bidang"` → render card highlight di atas.
   - Sisa baris di-group per `subBidang`.
   - Untuk `idarah` (tidak ada sub-bidang): tampilkan card dengan label `jabatan`.
   - Untuk `imarah`/`riayah`: tiap nilai `subBidang` unik = satu sub-section dengan grid anggotanya.

### Card Component

- Foto: `next/image`, `loading="lazy"`, `sizes` responsif.
- `priority` HANYA untuk foto top section (Pembina/Penasehat/Pimpinan, ~7 foto).
- Label di bawah foto: nama + (jabatan ATAU sub-bidang).
- Koordinator: card dengan border/style berbeda + ikon bintang.

## Photo Handling

- Setiap pengurus punya field `foto` (URL).
- Fallback: bila `foto` kosong atau gagal load → avatar inisial nama (lingkaran berwarna + huruf depan). Implementasi via komponen `Avatar` dengan state `onError`.
- Seed awal: URL placeholder Unsplash; admin ganti ke foto asli via form.

## Admin CRUD

### Form (`app/admin/(protected)/tentang/page.tsx` + komponen)

Fields:
- `nama` (text, wajib)
- `tingkat` (select 6 opsi, wajib)
- `jabatan` (text, opsional)
- `sub_bidang` (text, opsional — muncul/aktif saat `tingkat` = `imarah`/`riayah`)
- `foto` (URL/upload, wajib)
- `urutan` (angka, default 0)

### List View

Tabel dikelompokkan per `tingkat`. Kolom: nama, jabatan, sub-bidang, urutan, aksi (edit/hapus). Header grup per tingkat.

## API (`app/api/pengurus/route.ts` + `[id]/route.ts`)

- `GET /api/pengurus` — kembalikan semua, `orderBy(tingkat, urutan)`. Klien mengelompokkan.
- `POST /api/pengurus` — terima `nama, foto, tingkat, jabatan?, subBidang?, urutan?`.
- `PUT /api/pengurus/[id]` — update field sama.
- `DELETE /api/pengurus/[id]` — hapus.

Validasi: `nama`, `foto`, `tingkat` wajib. `tingkat` harus salah satu enum value.

## Migration & Seed

### Migration

- Schema lama punya `role`, `period`, `img`, `name`. Tidak kompatibel dengan struktur baru.
- Strategi: drop & reseed (data lama hanya dummy/fallback, bukan data produksi).
- Jalankan `npm run db:push` setelah ubah schema. Drizzle akan prompt konfirmasi drop kolom.

### Seed (`lib/db/seed.ts`)

- Masukkan SEMUA ~70 entri dari struktur asli DKM Al-Kahfi (lampiran di bawah).
- Foto: placeholder Unsplash per tingkat (atau avatar-style placeholder).
- Update `FALLBACK_PENGURUS` di `app/(site)/tentang/page.tsx` ke struktur baru (array objek dengan field baru) agar fallback konsisten saat API kosong.

## Out of Scope (YAGNI)

- Multi-periode / arsip kepengurusan tahun lalu (hanya satu periode aktif, field `periode` ada untuk masa depan).
- Foto upload server-side (pakai URL dulu).
- Search/filter dalam tab (70+ orang tertangani oleh struktur tab + sub-bidang).
- Drag-and-drop reorder (pakai field `urutan` angka manual di admin).

## Lampiran: Struktur Asli DKM Al-Kahfi (sumber seed)

```
I. PEMBINA: Brio Pradiko Pero, Kurnia Aji
II. PENASEHAT: Cecep Hidayat, Tresna Acip, Ujang Saepudin
III. PIMPINAN INTI: Ketua - Budi Ramdani; Wakil Ketua - Idham Faisal
IV. BIDANG IDARAH:
    Sekretaris - Theo Ras Komara
    Bendahara - Ruhiyat
    Humas Eksternal - Khairul T S
    Humas Internal - Fauzy Al Adam, Ian Agung Prakoso
    AMC - Angga Dwi Kusumah, Rifan Sopian
    SIMA - Indra Gunawan W, Agung Yuliaji
V. BIDANG IMARAH (Koordinator: Irfanudin Ma'sum):
    Syiar Islam - Dawam, Irfanudin Ma'sum, Abdul Malik Khusaeri
    PHBI - Fauzy Al Adam, Abdul Malik Khusaeri, Jagad Sidhayoda, Sahdam Amir
    Pendidikan & TPQ - Caca Sukma, Raditiana Fatmasari, Irfanudin Ma'sum, Sri Nuryani Erwinsyah, Yunnie Cindo Raina Shari
    ZISWAF - Abdul Aziz, Denny Jatnika, Syahroni Noorman P
    Cinta Qurban - Agus Sobirin, Moch Rosin, Sigit Jaelani, Alief Muhammad
    Al-Kahfi Care - Akhmad Syarif, Dian Zaini Arief, Tresna, Sigit Jaelani, Ruhiyat
    Remaja Masjid - Muhammad Iqbal
    Majelis Taklim Al-Kahfi - Rahma Sari Ridwan, Putri Oviolanda Irianto, Sri Nuryani Erwinsyah, Maryana Saumi Ulfah, Yunnie Cindo Raina Shari, Astrylia Rosiana Wulansary, Raditiana Fatmasari, Rina Kartini, Vita Indriani, Fitriani, Santi Nopita, Neng Siti Nurmala, Eva Nur'avyani, Siska Rachman, Lia Martiyanti, Vena Monica
    BUMM - Fahmi Gerald, Sigit Jaelani
VI. BIDANG RI'AYAH (Koordinator: Dian Zaini Arief):
    Sarana & Prasarana (SARPAS) - Fahmi Gerald, Muhammad Zamzam
    Kebersihan & Keindahan - Irfan Januar, Tedi Surahman, Akhmad Syarif
    Keamanan - Aep S, Rian Sidik Permana, Rijal
    Pengembangan Aset - Sinung Wahyono, Yogi Yogaswara
```
