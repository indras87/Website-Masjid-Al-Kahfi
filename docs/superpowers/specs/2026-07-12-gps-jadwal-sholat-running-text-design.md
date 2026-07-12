# Jadwal Sholat GPS + Running Text Editable — Design Spec

**Date:** 2026-07-12
**Status:** Approved (pending spec review)
**Related:** `app/(site)/beranda/page.tsx`, `app/(site)/jadwal-sholat/page.tsx`, `components/layout-header.tsx`, `app/admin/(protected)/layout.tsx`, `app/api/kontak/route.ts`, `lib/db/schema.ts`, `lib/db/seed.ts`, `lib/cms/settings.ts`, `test/lib/cms/settings.test.ts`

## Problem

Tiga masalah terkait pada situs publik Masjid Al-Kahfi:

1. **Jadwal sholat statis.** Waktu sholat di-hardcode sebagai konstanta `localPrayers` (Subuh 04:36, Terbit 05:54, Dzuhur 11:58, Ashar 15:18, Maghrib 17:58, Isya 19:12) yang **identik di tiga file** (`beranda/page.tsx` baris 264-271, `jadwal-sholat/page.tsx` baris 5-12, `layout-header.tsx` baris 31-38). Nilai yang sama tampil 24/7 tanpa mempedulikan tanggal atau lokasi user. User ingin jadwal sholat menyesuaikan **lokasi GPS** user, pada halaman Beranda dan halaman Jadwal Sholat.
2. **Running text terlalu cepat.** Teks berjalan di banner paling atas (`layout-header.tsx` baris 133-144) memakai Motion `transition={{ repeat: Infinity, duration: 15, ease: "linear" }}`. String panjang (hadits + sambutan) melintas dalam 15 detik — terlalu cepat untuk dibaca.
3. **Running text tidak bisa diubah dari admin.** Konten marquee adalah string literal JSX yang di-hardcode; tidak ada penyimpanan DB maupun UI admin untuk mengubahnya.

## Context

- **Beranda** (`app/(site)/beranda/page.tsx`): `"use client"`. Memiliki `localPrayers` (264-271), satu `useEffect` fetch data landing (281-359), dan satu `useEffect` timer countdown (361-417) yang menghitung sholat berikutnya dari `prayerMins` yang juga di-hardcode (377-384). `localPrayers` dipakai pada baris 404.
- **Jadwal-sholat** (`app/(site)/jadwal-sholat/page.tsx`): `"use client"`. Grid 6 kartu dirender dari `Object.entries(localPrayers)` (74-90). Timer iqomah (17-57) menghitung `prayerMins` di-hardcode; hanya `iqomahTime` yang dirender (string `tStr`/next-prayer tidak dipakai).
- **Header** (`components/layout-header.tsx`): `"use client"`. Memiliki `localPrayers` (31-38) dan blok timer (54-112) yang menghitung `countdownText` dan `iqomahTime`. **Kedua state ini dead code** — diset tapi tidak pernah dirender di JSX header (header hanya merender banner marquee + jam + navigasi). Marquee berada di baris 133-144.
- **API singleton pattern** (`app/api/kontak/route.ts`): GET select `.limit(1)` kembalikan baris atau default; PUT insert-or-update by id (`existing.length === 0 ? insert : update`). `export const dynamic = 'force-dynamic'`. **Tidak ada pengecekan session** pada route `app/api/*` manapun — proteksi hanya di layout admin.
- **Auth** (`app/admin/(protected)/layout.tsx`): cek session server-side via `auth.api.getSession({ headers: await headers() })`, `redirect("/admin/login")` bila tidak ada session.
- **Settings helper** (`lib/cms/settings.ts`): berisi default constant + getter (`getDefaultContactSettings`, `getDefaultDonationSettings`). Belum ada tabel settings/key-value; config situs disimpan sebagai singleton row (`kontak`, `donasi`, `profil_masjid`).
- **Schema** (`lib/db/schema.ts`): Drizzle + postgres-js. Belum ada tabel `pengaturan`.
- **Seed** (`lib/db/seed.ts`): `db.delete()` semua tabel lalu insert dari constant arrays. Sync via `npm run db:push` (tidak generate file migrasi).
- **Test**: `test/lib/cms/settings.test.ts`, dijalankan `npm test` = `tsx --test` (node:test).
- **Koordinat masjid** (dari embed Google Maps di beranda/kontak): **lat -6.9856, lng 107.6589** (Cikoneng, Bojongsoang, Kab. Bandung).
- **Tidak ada** penggunaan `navigator.geolocation` / lat-lng untuk perhitungan sholat di mana pun di repo.

## Goal

1. Jadwal sholat di **Beranda** dan **Jadwal Sholat** dihitung dari **lokasi GPS** user (API eksternal); bila GPS ditolak/gagal, fallback ke koordinat masjid. Tidak ada lagi waktu sholat yang di-hardcode.
2. Running text di banner atas **diperlambat** (durasi tetap baru, bukan 15 dtk).
3. Konten running text **dapat diubah dari halaman admin**, disimpan di DB.

## Decisions (locked)

1. **Sumber data sholat**: Aladhan API (`https://api.aladhan.com/v1/timings/{timestamp}`). Menerima lat/lng langsung, gratis, tanpa API key. Parameter mereplikasi **metode Kemenag RI** (Fajr 20°, Isya 18°) + **mazhab Syafi'i** (`school=0`). Nomor `method` exact diverifikasi via endpoint resmi `/v1/methods` saat implementasi; bila tidak ada built-in yang persis sama, gunakan `methodSettings` custom (`fajr_angle=20`, `isha_angle=18`) di atas base method yang netral. (Catatan: web search tentang nomor method tidak konsisten antar sumber — endpoint resmi yang menjadi sumber kebenaran.)
2. **GPS**: `navigator.geolocation.getCurrentPosition`. **Fallback bila ditolak/gagal/tidak tersedia** → koordinat masjid (-6.9856, 107.6589). Tidak ada IP-geolocation.
3. **Cache**: client-side `localStorage`, key `jadwal:{lat:.2f},{lng:.2f}:{YYYY-MM-DD}`, TTL akhir hari (invalid pada ganti tanggal). Round 2 desimal (~1 km) agar cache hit wajar tanpa melewatkan perubahan signifikan.
4. **Mapping response** ke shape yang sudah dipakai: `{ subuh: Fajr, terbit: Sunrise, dzuhur: Dhuhr, ashar: Asr, maghrib: Maghrib, isya: Isha }`. Aladhan mengembalikan field tersebut dalam format "HH:MM".
5. **Penyimpanan running text**: tabel **key-value** baru `pengaturan` (`key` PK, `value`, `updated_at`). Extensible untuk setting situs lain di masa depan. Key pertama: `running_text`.
6. **Kecepatan marquee**: **fixed di kode**, `duration: 15` → `30` (satu traverse penuh). Tidak disimpan di DB, tidak editable dari admin (YAGNI; hanya konten yang editable).
7. **Route `pengaturan` mutation di-auth**: GET publik (dipakai header publik + admin), **PUT cek session** better-auth (praktik baik, scoped ke route baru — bukan refactoring route lama).
8. **Header dead code**: blok timer prayer header (`localPrayers` + `countdownText` + `iqomahTime` + `prayerMins`) adalah dead code (tidak dirender). Dihapus sebagai cleanup terkait (menghilangkan duplikasi hardcoded terakhir). Header tetap memunculkan marquee (sekarang dari DB) + jam.
9. **DRY prayer logic**: shared client hook `hooks/use-prayer-times.ts` + pure helper (`lib/prayer-times.ts`) yang dipakai Beranda & Jadwal Sholat.

## Scope of Change

### 1. Schema — `lib/db/schema.ts`

Tambah tabel key-value:

```ts
export const pengaturan = pgTable("pengaturan", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

Sync via `npm run db:push`.

### 2. Settings helper — `lib/cms/settings.ts`

Tambah:

```ts
export const DEFAULT_RUNNING_TEXT =
  '"Siapa yang membangun masjid karena Allah, maka Allah akan membangunkan baginya rumah di surga." (HR. Bukhari dan Muslim) — Selamat datang di Layanan Digital Masjid Al-Kahfi Cikoneng, Kabupaten Bandung.';

export async function getSetting(key: string): Promise<string | null> { /* db select by key, return value or null */ }
```

(`getSetting` query DB langsung via `db`; route helper bisa juga inline — ikuti pola `kontak` route.)

### 3. API — `app/api/pengaturan/route.ts`

- `export const dynamic = 'force-dynamic'`.
- **GET** (publik): baca `running_text` dari DB; kembalikan `{ running_text: value ?? DEFAULT_RUNNING_TEXT }`.
- **PUT** (auth-gated): cek `auth.api.getSession({ headers: await headers() })` → 401 bila tidak ada. Body `{ running_text: string }`. Upsert ke tabel `pengaturan` key `running_text` (insert bila belum ada, update bila ada). Return row.
- Error handling mengikuti pola `kontak` route (try/catch, 500 dengan pesan).

### 4. Running text header — `components/layout-header.tsx`

- Hapus dead block: `localPrayers` (31-38), `countdownText`/`iqomahTime` state (51-52), `prayerMins`/perhitungan countdown dalam timer (71-108) — sisakan hanya bagian `currentTime` (jam dinding).
- Tambah state `runningText` + fetch `GET /api/pengaturan` di `useEffect`; fallback `DEFAULT_RUNNING_TEXT` (import dari `lib/cms/settings`) bila fetch gagal/kosong.
- Ganti isi `motion.div` (string hardcoded) → `{runningText}`.
- **Perlambat**: `duration: 15` → `30` (baris 136).

### 5. Admin page — `app/admin/(protected)/pengaturan/page.tsx` (baru)

- `"use client"`, ikut pola form client seperti `kontak-donasi` (state per field, fetch load, submit PUT).
- Field: `<textarea>` untuk running text (label "Teks Berjalan / Running Text"), tombol "Simpan".
- Load: `GET /api/pengaturan` → isi textarea dengan `running_text`.
- Simpan: `PUT /api/pengaturan` body `{ running_text }`; tampilkan feedback sukses/error.
- Tambah entri menu **"Pengaturan"** di `app/admin/components/Sidebar.tsx` (icon Settings/Lucide), link `/admin/pengaturan`, tampil untuk semua role (admin + superadmin).

### 6. Prayer hook + helper — `lib/prayer-times.ts` + `hooks/use-prayer-times.ts`

**`lib/prayer-times.ts`** (pure, testable, no React):

```ts
export const MASJID_COORDS = { lat: -6.9856, lng: 107.6589 };
export type PrayerTimes = { subuh: string; terbit: string; dzuhur: string; ashar: string; maghrib: string; isya: string };
export const FALLBACK_PRAYERS: PrayerTimes = { /* nilai lama sebagai last-resort */ };
export function mapAladhanToPrayers(timings: Record<string, string>): PrayerTimes; // Fajr→subuh, Sunrise→terbit, Dhuhr→dzuhur, Asr→ashar, Maghrib→maghrib, Isha→isya; potong "HH:MM" (buang zona " (WIB)" dsb bila ada)
export function buildCacheKey(lat: number, lng: number, dateStr: string): string; // `jadwal:{lat:.2f},{lng:.2f}:{YYYY-MM-DD}`
export function prayerTimesToMinutes(t: PrayerTimes): Record<string, number>; // "HH:MM" → menit total, untuk countdown
```

**`hooks/use-prayer-times.ts`** (`"use client"`):

```ts
export function usePrayerTimes(): {
  times: PrayerTimes;        // selalu terisi: cache → fetch → fallback
  loading: boolean;
  source: "gps" | "default"; // "default" = pakai koordinat masjid
};
```

Alur:
1. Init `times = FALLBACK_PRAYERS`, `loading = true`, `source = "default"`.
2. `navigator.geolocation.getCurrentPosition`: success → coords user, `source = "gps"`; error/deny → `MASJID_COORDS`, `source = "default"`. (Guard `typeof navigator !== "undefined"` untuk SSR safety.)
3. Baca cache `localStorage` via `buildCacheKey(coords, today)`. Bila ada → `times = cached`, `loading = false`, selesai.
4. Cache miss → `fetch(aladhanUrl)` dengan method/school Kemenag; `mapAladhanToPrayers`; tulis cache; `times = mapped`, `loading = false`.
5. Fetch error → pakai cache lama bila ada, else `FALLBACK_PRAYERS`; `loading = false`.

### 7. Wiring — `app/(site)/beranda/page.tsx` & `app/(site)/jadwal-sholat/page.tsx`

- Hapus `localPrayers` hardcoded.
- Panggil `const { times, loading, source } = usePrayerTimes();`.
- **Countdown** (beranda 361-417, jadwal-sholat 17-57): ganti `prayerMins` hardcoded → `prayerTimesToMinutes(times)`. Bila `loading`, tampilkan teks placeholder ("Memuat jadwal...") untuk countdown. Logika next-prayer/iqomah lainnya tidak berubah.
- **Grid jadwal-sholat** (74-90): iterasi `Object.entries(times)`; bila `loading`, tampilan kartu pakai `--:--` (atau skeleton) lalu update saat data datang.
- **Beranda section jadwal sholat**: sumber waktu diganti ke `times` (detail render mengikuti struktur yang sudah ada — implementer baca posisi render pastinya).
- Indikator lokasi opsional kecil: bila `source === "default"`, bisa tampilkan chip "Lokasi: Masjid (aktifkan GPS untuk lokasi Anda)" — nice-to-have, bukan wajib.

## Constraints & Notes

- **SSR safety**: hook mengakses `navigator`/`localStorage` hanya dalam effect/callback, di-guard `typeof window`. Header & kedua page sudah `"use client"` jadi aman.
- **HTTPS requirement**: `navigator.geolocation` hanya jalan di HTTPS (atau localhost). Produksi harus HTTPS; fallback masjid menutup kasus non-HTTPS/ditolak.
- **Satu fetch/hari/lokasi**: cache akhir-hari memastikan tidak spam API Aladhan. Round 2 desimal koordinat agar cache stabil.
- **Aladhan rate limit**: free tier derajat publik, trafik masjid kecil — tidak butuh API key. Tetap, cache client sisi perangkat meredam beban.
- **`running_text` tidak boleh kosong**: route GET selalu kembalikan `DEFAULT_RUNNING_TEXT` bila DB kosong; PUT bisa menerima string kosong tapi UI admin idealnya tidak mengizinkan total kosong (validasi minimal 1 karakter — kebijakan implementer).
- **Auth PUT**: route `pengaturan` satu-satunya route `app/api/*` yang cek session. Ini peningkatan scoped, didokumentasikan, bukan refactoring menyeluruh route lain.
- **Header jam tetap**: bagian `currentTime` (jam dinding) di header dipertahankan; hanya blok prayer dead code yang dihapus.
- **Sync schema**: `npm run db:push` (bukan file migrasi), konsisten workflow existing.

## Out of Scope (YAGNI)

- Notifikasi adzan / push notification.
- Persistensi pilihan lokasi user antar sesi selain cache jadwal harian.
- IP-based geolocation.
- Edit kecepatan marquee dari admin (kecepatan fixed 30 dtk).
- Tabel settings untuk key lain (cuma `running_text` sekarang; tabel key-value siap dipakai ulang).
- Refactor auth semua route `app/api/*` lama.
- Halaman detail/perorangan untuk jadwal sholat khusus kota.
- Prerender/server-cache jadwal sholat (client-side fetch per perangkat cukup untuk skala masjid).

## Verification

1. `npm run db:push` — tabel `pengaturan` muncul (key, value, updated_at).
2. `npm run seed` — baris `running_text` ter-seed dengan teks default (atau diisi saat pertama PUT). Verifikasi via psql/`db select`.
3. `npm test` — unit test lulus: `mapAladhanToPrayers` (respons Aladhan sample → shape benar, potong zona), `buildCacheKey` (round 2 desimal + format tanggal), `prayerTimesToMinutes`, `getSetting`/default running text.
4. `npm run build` lulus.
5. **Header**: banner atas menampilkan teks dari DB (ubah via admin → langsung berubah setelah refresh); kecepatan terlihat lebih lambat (~2x dari sebelumnya). Blok dead prayer code hilang, jam dinding tetap.
6. **Admin `/admin/pengaturan`**: textarea memuat teks saat ini; edit → Simpan → tersimpan; refresh halaman publik → teks berubah; menu "Pengaturan" tampil di sidebar. PUT tanpa session → 401.
7. **Jadwal sholat (GPS)**:
   - Izinkan lokasi → waktu sholat sesuai lokasi user (bukan nilai hardcoded 04:36/dll). Cek dengan kota lain via devtools override lokasi.
   - Tolak lokasi → waktu sholat sesuai koordinat masjid Cikoneng.
   - Offline setelah cache terisi → data tampil dari cache tanpa fetch.
   - Countdown "sholat berikutnya" & iqomah memakai waktu dinamis (bukan hardcoded).
   - `source` indikator benar ("gps" saat diizinkan, "default" saat ditolak).
