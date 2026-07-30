# Spec & Implementation Plan — Pendaftaran Donatur Tetap Operasional Masjid Al-Kahfi

| Field | Value |
|---|---|
| **Doc ID** | `SPEC-DDT-2026-07-16` |
| **Fitur** | Pendaftaran Donatur Tetap Operasional |
| **Tipe** | Public form + Admin CRM + DB migration |
| **Target executor** | Junior programmer / AI model tier rendah |
| **Stack** | Next.js 15 App Router · Drizzle ORM · PostgreSQL · Tailwind v4 |
| **Status** | Ready to implement |
| **Estimasi** | 1–2 hari kerja |

---

## 0. Daftar Isi

1. [Ringkasan](#1-ringkasan)
2. [Tujuan & User Stories](#2-tujuan--user-stories)
3. [In Scope / Out of Scope](#3-in-scope--out-of-scope)
4. [Desain Data (Schema + Migration)](#4-desain-data-schema--migration)
5. [Kontrak API](#5-kontrak-api)
6. [Spec UI Publik + ASCII Layout](#6-spec-ui-publik--ascii-layout)
7. [Spec UI Admin + ASCII Layout](#7-spec-ui-admin--ascii-layout)
8. [Pengaturan (Target & Progres)](#8-pengaturan-target--progres)
9. [Aturan Validasi](#9-aturan-validasi)
10. [Keamanan & Privasi](#10-keamanan--privasi)
11. [Daftar File (Create / Modify)](#11-daftar-file-create--modify)
12. [Panduan Implementasi Bertahap](#12-panduan-implementasi-bertahap)
13. [Testing Checklist](#13-testing-checklist)
14. [Acceptance Criteria](#14-acceptance-criteria)
15. [Keputusan Desain & Pertanyaan Terbuka](#15-keputusan-desain--pertanyaan-terbuka)

---

## 1. Ringkasan

Form pendaftaran publik bagi jamaah yang ingin menjadi **Donatur Tetap** Operasional Masjid Al-Kahfi. Jamaah mengisi data diri + komitmen donasi bulanan. Data masuk ke DB dan ditampilkan di dashboard admin untuk follow-up via WhatsApp. Halaman publik juga menampilkan **target kebutuhan operasional bulanan** dan **progres jumlah donatur tetap saat ini** untuk meningkatkan partisipasi.

Alur inti:
```
Jamaah buka /donatur-tetap
  -> lihat target & progres
  -> isi form (data diri, komitmen, pernyataan)
  -> POST /api/donatur-tetap  (publik, tanpa login)
  -> simpan ke tabel donatur_tetap, status = "baru"
  -> tampilkan pesan sukses (Jazakumullahu khairan)
Admin login
  -> /admin/donatur-tetap
  -> lihat daftar, ubah status, lihat detail, hapus, export CSV
```

---

## 2. Tujuan & User Stories

**Tujuan bisnis:**
- Memudahkan jamaah mendaftar sebagai donatur rutin.
- Memberi admin alat untuk mengelola & menindaklanjuti pendaftar.
- Menampilkan transparansi target operasional agar jamaah termotivasi.

**User stories:**
- `US-01` Sebagai jamaah, saya ingin mengisi formulir donatur tetap agar terdaftar.
- `US-02` Sebagai jamaah, saya ingin melihat target operasional bulanan & progres donatur agar merasa berkontribusi.
- `US-03` Sebagai jamaah, saya ingin melihat konfirmasi yang menenangkan setelah submit.
- `US-04` Sebagai admin, saya ingin melihat semua pendaftar donatur tetap beserta kontaknya.
- `US-05` Sebagai admin, saya ingin mengubah status pendaftar (baru → terkonfirmasi → aktif → berhenti).
- `US-06` Sebagai admin, saya ingin mengatur target operasional bulanan yang tampil di publik.
- `US-07` Sebagai admin, saya ingin mengunduh data donatur (CSV) untuk dijalankan WhatsApp/excel.

---

## 3. In Scope / Out of Scope

**In Scope (dibuat sekarang):**
- Form pendaftaran publik + pesan sukses.
- Tabel DB `donatur_tetap` + migration.
- API publik (POST) + API admin (GET list, GET detail, PATCH status, DELETE).
- Halaman admin list/detail + ubah status + hapus + export CSV.
- Widget progres (target vs total komitmen donatur tetap) di halaman publik.
- Pengaturan target operasional bulanan (di halaman Pengaturan yang sudah ada).
- Link navigasi "Donatur Tetap" di header & footer.

**Out of Scope (tidak dibuat sekarang, catat untuk nanti):**
- Kirim pengingat WhatsApp otomatis (butuh integrasi WA Gateway / Fonnte / Wablas). Saat ini hanya menyimpan **persetujuan** pengingat.
- Login/akun donatur (self-service portal).
- Pembayaran otomatis / verifikasi transaksi.
- Laporan publik real-time (cuma progres agregat).
- Notifikasi email otomatis ke admin saat ada pendaftar baru.

---

## 4. Desain Data (Schema + Migration)

### 4.1 Tambah ke `lib/db/schema.ts`

Tambahkan **3 enum + 1 tabel** di akhir file. Ikuti gaya kode yang sudah ada (`serial` id, `text`, `timestamp`, `pgEnum`, referensi `user` dengan `onDelete: "set null"`).

```ts
// === Donatur Tetap Operasional ===

// Jenis kelamin
export const jenisKelaminEnum = pgEnum("jenis_kelamin", ["laki-laki", "perempuan"]);

// Metode pembayaran donasi
export const metodePembayaranEnum = pgEnum("metode_pembayaran", [
  "transfer_bank",
  "qris",
  "tunai_sekretariat",
]);

// Status pengelolaan pendaftar oleh admin
export const donaturTetapStatusEnum = pgEnum("donatur_tetap_status", [
  "baru",          // baru daftar, belum dihubungi
  "terkonfirmasi", // sudah dihubungi & konfirmasi via WA
  "aktif",         // sedang aktif donasi rutin
  "berhenti",      // berhenti/keluar program
]);

export const donaturTetap = pgTable("donatur_tetap", {
  id: serial("id").primaryKey(),

  // Data Donatur
  nama: text("nama").notNull(),
  jenisKelamin: jenisKelaminEnum("jenis_kelamin").notNull(),
  whatsapp: text("whatsapp").notNull(),        // disimpan ternormalisasi: "62xxxxxxxxxxx"
  alamat: text("alamat"),                       // opsional
  email: text("email"),                          // opsional

  // Komitmen Donasi
  nominalBulanan: integer("nominal_bulanan").notNull(), // rupiah, > 0
  nominalLainnya: boolean("nominal_lainnya").default(false).notNull(), // true jika pilih "Lainnya"
  tanggalPembayaran: text("tanggal_pembayaran").notNull(), // "1-5" | "6-10" | "11-15" | "16-20" | "21-25" | "26-31"
  metodePembayaran: metodePembayaranEnum("metode_pembayaran").notNull(),

  // Pernyataan (checkbox)
  persetujuanDonatur: boolean("persetujuan_donatur").default(false).notNull(),    // WAJIB true
  persetujuanPengingatWa: boolean("persetujuan_pengingat_wa").default(false).notNull(),
  persetujuanLaporan: boolean("persetujuan_laporan").default(false).notNull(),

  // Pengelolaan admin
  status: donaturTetapStatusEnum("status").default("baru").notNull(),
  catatanAdmin: text("catatan_admin"), // catatan internal admin (nullable)

  // Audit (createdById null karena submit publik tanpa login)
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 4.2 Generate & jalankan migration

Repo memakai **drizzle-kit**. Jalankan (jangan tulis SQL manual):

```bash
npm run db:push      # dorong schema ke DB (dev)
```

`drizzle-kit push` akan membuat tabel `donatur_tetap` + 3 enum otomatis. Verifikasi dengan melihat folder `drizzle/` (snapshot `meta/` ikut terupdate). Tidak perlu `db:setup`/seed untuk fitur ini karena data diisi dari form.

> Catatan: kolom `nominal_bulanan` memakai `integer` (max ~2,1 miliar, cukup untuk rupiah per bulan). Jangan pakai `serial`/`text` untuk nominal.

---

## 5. Kontrak API

Buat route handler mengikuti pola `app/api/donasi/route.ts`: `export const dynamic = 'force-dynamic'`, import `{ db }` dari `@/lib/db`, import `{ donaturTetap }` dari `@/lib/db/schema`, gunakan `getActor()`/`withActorNames()` dari `@/lib/audit` untuk endpoint admin, dan `auth.api.getSession({ headers: await headers() })` untuk proteksi admin (lihat pola di `app/api/pengaturan/route.ts`).

### 5.1 `POST /api/donatur-tetap` — PUBLIK (tanpa login)

Submit form pendaftaran dari jamaah.

**Request body:**
```json
{
  "nama": "Ahmad Fauzi",
  "jenisKelamin": "laki-laki",
  "whatsapp": "081234567890",
  "alamat": "Jl. Cikoneng No. 1 (opsional)",
  "email": "ahmad@example.com (opsional)",
  "nominalBulanan": 100000,
  "nominalLainnya": false,
  "tanggalPembayaran": "1-5",
  "metodePembayaran": "transfer_bank",
  "persetujuanDonatur": true,
  "persetujuanPengingatWa": true,
  "persetujuanLaporan": false
}
```

**Aturan:**
- `whatsapp` dinormalisasi server-side: hilangkan spasi/tanda hubung/`+`, ganti prefix `08` → `628`, prefix `62` tetap. Simpan hasil normalisasi.
- Validasi semua field wajib (lihat [§9](#9-aturan-validasi)).
- `persetujuanDonatur` **harus** `true`, kalau tidak → 400.
- `createdById` = `null` (publik).

**Response 200:**
```json
{ "ok": true, "id": 12 }
```

**Response 400** (validasi gagal):
```json
{ "error": "Nama lengkap wajib diisi" }
```

### 5.2 `GET /api/donatur-tetap` — ganda (publik agregat / admin penuh)

Endpoint ini melayani dua peran berdasarkan sesi login:

- **Tanpa login (publik):** kembalikan HANYA agregat progres (privasi — jangan bocorkan data per orang).
- **Dengan login admin:** kembalikan daftar lengkap semua record.

Logika:
```ts
const session = await auth.api.getSession({ headers: await headers() });
const isAdmin = !!session;

if (!isAdmin) {
  // agregat publik
  const target = await getTargetOperasional(); // dari pengaturan, lihat §8
  const rows = await db.select().from(donaturTetap)
    .where(inArray(donaturTetap.status, ["terkonfirmasi", "aktif"]));
  const jumlahDonatur = rows.length;
  const totalKomitmen = rows.reduce((s, r) => s + r.nominalBulanan, 0);
  const persentase = target > 0 ? Math.min(100, Math.round(totalKomitmen / target * 100)) : 0;
  return NextResponse.json({ jumlahDonatur, totalKomitmen, target, persentase });
}

// admin: semua record, terbaru di atas
const rows = await db.select().from(donaturTetap).orderBy(desc(donaturTetap.createdAt));
const enriched = await withActorNames(rows);
return NextResponse.json(enriched);
```

### 5.3 `app/api/donatur-tetap/[id]/route.ts` — ADMIN SAJA

- `GET /api/donatur-tetap/[id]` → 1 record (404 kalau tidak ada).
- `PATCH /api/donatur-tetap/[id]` → update `{ status, catatanAdmin }` (admin). Set `updatedById: actor?.id ?? null`, `updatedAt: new Date()`.
- `DELETE /api/donatur-tetap/[id]` → hapus record.

Semua butuh sesi admin; kalau tidak login → `401`. Pakai helper `requireSession()` seperti di `app/api/pengaturan/route.ts`.

### 5.4 `GET /api/donatur-tetap/export` — ADMIN SAJA (opsional, bagus)

Kembalikan CSV (`Content-Type: text/csv`, header `Content-Disposition: attachment; filename="donatur-tetap.csv"`). Kolom: `id,nama,jenisKelamin,whatsapp,alamat,email,nominalBulanan,tanggalPembayaran,metodePembayaran,status,createdAt`. Bisa di-skip di MVP bila waktu terbatas (catat di [§3](#3-in-scope--out-of-scope)).

---

## 6. Spec UI Publik + ASCII Layout

### 6.1 File & route

- Buat `app/(site)/donatur-tetap/page.tsx` (`"use client"`).
- Halaman otomatis dapat AppShell (navbar+footer) karena ada di grup `(site)`.
- Ambil progres via `fetch('/api/donatur-tetap')` (publik → agregat).
- Submit via `fetch('/api/donatur-tetap', { method:'POST', ... })`.

### 6.2 Palette & gaya (sama dengan halaman lain)

- Header hero: `bg-emerald-900 text-white`, `border-b-4 border-gold-500`, `islamic-pattern` overlay.
- Kartu form: `bg-white rounded-2xl border border-gold-100 shadow-md`.
- Aksen: `text-gold-500`, `bg-emerald-900`, `font-serif` untuk judul.
- Tombol utama: gradient `from-gold-500 to-gold-600`.
- Ikon: `lucide-react` (`HeartHandshake`, `User`, `Wallet`, `CalendarClock`, `BadgeCheck`, `MessageCircle`).

### 6.3 ASCII Layout — Halaman Form (Desktop)

```
+============================================================================+
|  HERO  (bg-emerald-900, text-gold-300)                                     |
|     Donatur Tetap Operasional Masjid Al-Kahfi                              |
|   "Bismillahirrahmanirrahim. Terima kasih atas niat Bapak/Ibu..."          |
+============================================================================+

+--------------------------------------------------------------------------+
|  WIDGET PROGRES OPERASIONAL BULANAN   (bg-emerald-950 text-white kartu)   |
|                                                                          |
|   Target Operasional Bulanan: Rp 15.000.000                              |
|   [==============>                       ]  43%  (Rp 6.450.000 terkumpul) |
|                                                                          |
|   129 Donatur Tetap Aktif  |  Rata-rata Rp 50.000/bulan                  |
+--------------------------------------------------------------------------+

+--------------------------------------------------------------------------+
|  FORM  (bg-white rounded-2xl border-gold-100)                            |
|                                                                          |
|  -- DATA DONATUR ------------------------------------------------------  |
|   1. Nama Lengkap *                                                      |
|   [__________________________________________________________________ ]  |
|                                                                          |
|   2. Jenis Kelamin *                                                     |
|   ( ) Laki-laki    ( ) Perempuan                                         |
|                                                                          |
|   3. Nomor WhatsApp *                                                    |
|   [ 08______________________________ ]  contoh: 0812xxxx                 |
|                                                                          |
|   4. Alamat (Opsional)                                                   |
|   [__________________________________________________________________ ]  |
|                                                                          |
|   5. Email (Opsional)                                                    |
|   [__________________________________________________________________ ]  |
|                                                                          |
|  -- KOMITMEN DONASI --------------------------------------------------   |
|   6. Nominal Donasi Tetap per Bulan *                                    |
|   [ ] Rp 50.000   [ ] Rp 100.000*  [ ] Rp 200.000                        |
|   [ ] Rp 500.000  [ ] Rp 1.000.000 [x] Lainnya: [ ____ ] Rp              |
|                                                                          |
|   7. Tanggal Pembayaran yang Diinginkan *                                |
|   [ ] 1-5    [ ] 6-10   [ ] 11-15                                        |
|   [ ] 16-20  [ ] 21-25  [ ] 26-31                                        |
|                                                                          |
|   8. Metode Pembayaran *                                                 |
|   ( ) Transfer Bank   ( ) QRIS   ( ) Tunai ke Sekretariat               |
|                                                                          |
|  -- PERNYATAAN --------------------------------------------------------   |
|   [ ] Saya bersedia menjadi Donatur Tetap... (WAJIB)                     |
|   [ ] Saya bersedia menerima pengingat donasi via WhatsApp               |
|   [ ] Saya bersedia menerima laporan kegiatan & program Masjid           |
|                                                                          |
|        +--------------------------------------+                          |
|        |   DAFTAR MENJADI DONATUR TETAP       |  (gradient gold)        |
|        +--------------------------------------+                          |
+--------------------------------------------------------------------------+
```

### 6.4 ASCII Layout — State Sukses (ganti seluruh form setelah submit OK)

```
+======================================================================+
|                                                                      |
|                        (ikon BadgeCheck besar, gold)                 |
|                                                                      |
|                        Jazakumullahu khairan.                        |
|                                                                      |
|        Pendaftaran Anda telah kami terima. Tim Masjid Al-Kahfi        |
|        akan menghubungi Anda melalui WhatsApp untuk konfirmasi        |
|        dan penyampaian informasi rekening/QRIS donasi.                |
|                                                                      |
|   +------------------------------------------------------------+     |
|   |  "Perumpamaan orang yang menginfakkan hartanya di jalan    |     |
|   |   Allah seperti sebutir biji yang menumbuhkan tujuh bulir, |     |
|   |   pada setiap bulir terdapat seratus biji."                |     |
|   |                                  (QS. Al-Baqarah: 261)     |     |
|   +------------------------------------------------------------+     |
|                                                                      |
|              [ Daftar Donatur Lain ]   [ Kembali ke Beranda ]         |
|                                                                      |
+======================================================================+
```

### 6.5 ASCII Layout — Mobile (form menumpuk vertikal)

```
+----------------------------+
| HERO (centered)            |
|  Donatur Tetap Operasional |
+----------------------------+
| PROGRES kartu              |
|  Target Rp 15.000.000      |
|  [====>       ] 43%        |
|  129 Donatur Aktif         |
+----------------------------+
| FORM (1 kolom)             |
|  1. Nama Lengkap *         |
|  [________________]        |
|  2. Jenis Kelamin *        |
|  [ ] Laki-laki             |
|  [ ] Perempuan             |
|  3. WhatsApp *             |
|  [ 08__________ ]          |
|  ...                       |
|  6. Nominal (grid 2x3)     |
|  [ ]50rb [ ]100rb          |
|  [ ]200rb[ ]500rb          |
|  [ ]1jt  [x]Lainnya        |
|  [_____]                   |
|  ...                       |
|  [ DAFTAR MENJADI          |
|    DONATUR TETAP ]         |
+----------------------------+
```

### 6.6 Komponen form (state)

Pakai controlled form dengan `useState` (sama dengan pola `app/(site)/donasi/page.tsx` & `kontak-donasi`). **Tidak perlu** install library form baru — kodebase memakai plain React state. Contoh shape state:

```ts
type FormState = {
  nama: string;
  jenisKelamin: "laki-laki" | "perempuan" | "";
  whatsapp: string;
  alamat: string;
  email: string;
  // nominal: preset dipilih ATAU "lainnya"
  nominalPreset: number | null;   // 50000|100000|200000|500000|1000000|null
  nominalLainnya: string;         // string input, di-parse jadi number
  tanggalPembayaran: string;      // "1-5".."26-31"
  metodePembayaran: "transfer_bank" | "qris" | "tunai_sekretariat" | "";
  persetujuanDonatur: boolean;
  persetujuanPengingatWa: boolean;
  persetujuanLaporan: boolean;
};
```

Saat submit, hitung `nominalBulanan` final + `nominalLainnya` (boolean):
```ts
const nominalLainnya = form.nominalPreset === null && form.nominalLainnya.trim() !== "";
const nominalBulanan = form.nominalPreset ?? parseInt(form.nominalLainnya.replace(/\D/g, ""), 10);
```

---

## 7. Spec UI Admin + ASCII Layout

### 7.1 File & route

- Buat `app/admin/(protected)/donatur-tetap/page.tsx` (`"use client"`). Otomatis terproteksi sesi (layout `(protected)` sudah cek session, redirect ke `/admin/login`).
- Fetch `GET /api/donatur-tetap` (admin → array lengkap).
- Tambah link sidebar di `app/admin/components/Sidebar.tsx`.

### 7.2 ASCII Layout — Daftar Admin

```
+------------------------------------------------------------------------+
|  [logo]  Sidebar   |  Sistem Manajemen Konten            [Admin ▾]     |
|  - Dashboard       |----------------------------------------------------|
|  - Kegiatan        |  Donatur Tetap Operasional                          |
|  - Berita          |  Kelola pendaftar donatur tetap & status follow-up. |
|  - Galeri          |                                                     |
|  - Tentang         |  [Cari nama/WA___ ] [Status: Semua v] [Export CSV]  |
|  - Kontak & Donasi |                                                     |
|  > Donatur Tetap * |  +----------------------------------------------+   |
|  - Pengaturan      |  | #  Nama         WA           Nominal/bln Status|  |
|  - Manajemen User  |  |---|------------|------------|---------|-------|  |
|                    |  |12 |Ahmad Fauzi |62812xxx    |Rp100.000| Baru  |  |
|                    |  |11 |Siti Aminah |62813xxx    |Rp 50.000| Aktif |  |
|                    |  |10 |Budi S.     |62857xxx    |Rp200.000| Konf. |  |
|                    |  +----------------------------------------------+   |
|                    |  Klik baris -> buka panel detail di kanan/modal    |
+------------------------------------------------------------------------+
```

### 7.3 ASCII Layout — Detail / Edit Status (modal atau panel)

```
+----------------------------------------------------+
|  Detail Donatur Tetap                        [X]   |
+----------------------------------------------------+
|  Nama          : Ahmad Fauzi                       |
|  Jenis Kelamin : Laki-laki                         |
|  WhatsApp      : 6281234567890   [ Buka Chat WA ]  |
|  Email         : ahmad@example.com                 |
|  Alamat        : Jl. Cikoneng No. 1                |
|                                                    |
|  Nominal/Bulan : Rp 100.000                        |
|  Tgl Bayar     : 1-5                               |
|  Metode        : Transfer Bank                     |
|                                                    |
|  Persetujuan   : Donatur: YA  | Pengingat WA: YA   |
|                  Laporan  : Tidak                  |
|                                                    |
|  Status        : [ Baru      v ]   (dropdown)      |
|  Catatan Admin : [__________________________]      |
|                                                    |
|  Terdaftar : 16 Jul 2026 09:30                     |
|                                                    |
|   [ Simpan Perubahan ]   [ Hapus (merah) ]         |
+----------------------------------------------------+
```

**Tombol "Buka Chat WA"** → `https://wa.me/<whatsapp>?text=...` (template pesan konfirmasi). Ini sangat membantu admin.

**Ubah status** → `PATCH /api/donatur-tetap/[id]` body `{ status, catatanAdmin }`. Refresh list setelah simpan.

### 7.4 Tambah ke Sidebar (`app/admin/components/Sidebar.tsx`)

Di array `links`, tambahkan (pakai ikon `HandCoins` atau `HeartHandshake` dari `lucide-react`):

```ts
{ href: "/admin/donatur-tetap", label: "Donatur Tetap", icon: HeartHandshake },
```

Letakkan setelah `Kontak & Donasi`.

---

## 8. Pengaturan (Target & Progres)

Target operasional bulanan disimpan di tabel **`pengaturan`** (key/value, sudah ada) — tidak perlu tabel baru.

- **Key:** `target_operasional_bulanan`
- **Value:** string angka rupiah, contoh `"15000000"`.
- **Default** (kalau key belum ada di DB): `15000000` (Rp 15 juta). Definisikan konstanta di `lib/cms/settings.ts`:
  ```ts
  export const DEFAULT_TARGET_OPERASIONAL_BULANAN = 15000000;
  export function getDefaultTargetOperasional(): number {
    return DEFAULT_TARGET_OPERASIONAL_BULANAN;
  }
  ```

### 8.1 Helper baca target

Buat helper kecil (bisa inline di route, atau di `lib/cms/settings.ts`):
```ts
export async function getTargetOperasional(): Promise<number> {
  const rows = await db.select().from(pengaturan).where(eq(pengaturan.key, 'target_operasional_bulanan')).limit(1);
  const n = parseInt(rows[0]?.value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TARGET_OPERASIONAL_BULANAN;
}
```

### 8.2 Form pengaturan target

Tambahkan **satu input "Target Operasional Bulanan (Rp)"** di halaman `app/admin/(protected)/pengaturan/page.tsx`. Saat disimpan → `PUT /api/pengaturan` dengan key `target_operasional_bulanan`. (Pertimbangkan perluas `app/api/pengaturan/route.ts` agar menerima key generik, atau buat endpoint kecil terpisah. Pendekatan termudah: generalisasi route `pengaturan` agar PUT menerima `{ key, value }` — tapi **jangan break** pemakaian `running_text` yang sudah ada. Aman: tambahkan endpoint baru `PUT /api/pengaturan` handler key `target_operasional_bulanan` sebagai cabang tambahan, tetap kompatibel dengan lama.)

### 8.3 Widget progres (publik)

Ditampilkan di atas form (lihat [§6.3](#63-ascii-layout--halaman-form-desktop)). Data dari `GET /api/donatur-tetap` versi publik:
- `target` — dari pengaturan.
- `totalKomitmen` — sum `nominalBulanan` record ber-status `terkonfirmasi`/`aktif`.
- `jumlahDonatur` — count record ber-status `terkonfirmasi`/`aktif`.
- `persentase` — `min(100, round(totalKomitmen / target * 100))`.

Format rupiah: pakai `Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 })`.

---

## 9. Aturan Validasi

Validasi sisi **client** (UX) + **server** (keamanan, WAJIB). Server adalah source of truth.

| Field | Aturan |
|---|---|
| `nama` | Wajib, 3–100 karakter. |
| `jenisKelamin` | Wajib, salah satu `"laki-laki"` / `"perempuan"`. |
| `whatsapp` | Wajib. Hanya digit. Setelah normalisasi harus 10–15 digit & diawali `62`. |
| `alamat` | Opsional, maks 500 karakter. |
| `email` | Opsional; jika diisi harus format email valid. |
| `nominalBulanan` | Wajib, integer > 0. Preset: `50000,100000,200000,500000,1000000`. Lainnya: minimal `10000`. |
| `tanggalPembayaran` | Wajib, salah satu: `1-5,6-10,11-15,16-20,21-25,26-31`. |
| `metodePembayaran` | Wajib, salah satu enum. |
| `persetujuanDonatur` | **Harus `true`** — kalau `false`, tolak 400. |
| `persetujuanPengingatWa` | Opsional (default `false`). |
| `persetujuanLaporan` | Opsional (default `false`). |

**Normalisasi WhatsApp (server):**
```ts
function normalizeWa(input: string): string {
  let d = input.replace(/[^\d]/g, '');          // digit saja
  if (d.startsWith('0')) d = '62' + d.slice(1); // 08xxx -> 628xxx
  if (!d.startsWith('62')) d = '62' + d;        // asumsi lokal
  return d;
}
```

---

## 10. Keamanan & Privasi

- Endpoint publik `POST` **tanpa login**. Wajib validasi server ketat (di [§9](#9-aturan-validasi)).
- Pertimbangkan **rate-limit sederhana** per IP untuk POST (mis. maks 5 pendaftaran / 10 menit). MVP boleh skip bila tidak ada middleware rate-limit di repo — catat sebagai TODO.
- `GET` publik **hanya** boleh mengembalikan agregat (jumlah + total), **tidak** boleh membocorkan nama/WA/email donatur. Data per orang hanya untuk admin yang login.
- Semua endpoint selain `POST` publik butuh sesi admin (`auth.api.getSession`), else `401`.
- Data bersifat sensitif (nomor WA, alamat). Hanya admin yang boleh lihat detail. Tampilkan jumlah donatur di publik, bukan identitas.
- Lindungi dari spam: batasi panjang semua `text` input; `nominalBulanan` pakai `integer` DB (bukan string) agar tidak bisa injeksi.
- `whatsapp` disimpan ternormalisasi; tidak pernah dikirim ke pihak ketiga di MVP ini.

---

## 11. Daftar File (Create / Modify)

### CREATE (file baru)
| Path | Isi |
|---|---|
| `app/(site)/donatur-tetap/page.tsx` | Halaman form publik + widget progres + state sukses. |
| `app/api/donatur-tetap/route.ts` | `POST` (publik) + `GET` (publik agregat / admin penuh). |
| `app/api/donatur-tetap/[id]/route.ts` | `GET` / `PATCH` / `DELETE` (admin). |
| `app/api/donatur-tetap/export/route.ts` | (opsional) Export CSV admin. |
| `app/admin/(protected)/donatur-tetap/page.tsx` | Daftar + detail modal + ubah status + hapus. |

### MODIFY (file sudah ada)
| Path | Perubahan |
|---|---|
| `lib/db/schema.ts` | Tambah 3 enum + tabel `donaturTetap`. |
| `lib/cms/settings.ts` | Tambah `DEFAULT_TARGET_OPERASIONAL_BULANAN` + helper `getTargetOperasional()`. |
| `components/app-shell.tsx` | Tambah `{ id: "donatur-tetap", label: "Donatur Tetap" }` di `navLinks` + cabang `handleNav` (`router.push('/donatur-tetap')`). |
| `components/layout-header.tsx` | Tambah link "Donatur Tetap" di `navLinks` (desktop & mobile). Bisa jadi tombol kedua di samping "Donasi & Infaq", atau item nav biasa. |
| `components/layout-footer.tsx` | (Opsional) tambah link footer "Donatur Tetap". |
| `app/admin/components/Sidebar.tsx` | Tambah link `{ href: "/admin/donatur-tetap", label: "Donatur Tetap", icon: HeartHandshake }` setelah Kontak & Donasi. Import `HeartHandshake` dari `lucide-react`. |
| `app/admin/(protected)/pengaturan/page.tsx` | Tambah input "Target Operasional Bulanan". |
| `app/api/pengaturan/route.ts` | Perluas agar bisa simpan key `target_operasional_bulanan` (kompatibel dengan `running_text` yang ada). |

---

## 12. Panduan Implementasi Bertahap

Kerjakan **berurutan**. Setiap step harus bisa dites sebelum lanjut.

**Step 1 — Data layer**
1. Edit `lib/db/schema.ts` (tambah enum + tabel `donaturTetap`).
2. Tambah default target di `lib/cms/settings.ts`.
3. Jalankan `npm run db:push`. Cek tabel terbentuk di DB.

**Step 2 — API**
4. Buat `app/api/donatur-tetap/route.ts` (POST publik + GET dual-mode). Tes POST dengan `curl`/Postman.
5. Buat `app/api/donatur-tetap/[id]/route.ts` (GET/PATCH/DELETE admin).
6. (Opsional) buat `export/route.ts`.

**Step 3 — UI publik**
7. Buat `app/(site)/donatur-tetap/page.tsx`: widget progres + form + state sukses.
8. Tes submit end-to-end → cek record muncul di DB.

**Step 4 — Navigasi publik**
9. Edit `app-shell.tsx` (navLinks + handleNav) dan `layout-header.tsx` (link desktop & mobile).

**Step 5 — Admin**
10. Buat `app/admin/(protected)/donatur-tetap/page.tsx` (list + detail + status + hapus).
11. Edit `Sidebar.tsx` (tambah menu).

**Step 6 — Pengaturan target**
12. Edit `pengaturan` route + halaman `pengaturan` untuk key `target_operasional_bulanan`.
13. Verifikasi widget progres membaca target baru.

**Step 7 — Verifikasi**
14. Jalankan `npm run dev`. Uji semua alur di [§13](#13-testing-checklist).

---

## 13. Testing Checklist

Lakukan manual (belum ada harness test khusus fitur ini):

- [ ] Submit form dengan semua field valid → muncul pesan sukses + QS Al-Baqarah 261.
- [ ] Submit tanpa nama → error validasi (client + server 400).
- [ ] Submit tanpa centang pernyataan wajib → ditolak.
- [ ] Submit WA dengan format `0812-3456-7890` → tersimpan `6281234567890`.
- [ ] Pilih nominal "Lainnya" → nominal custom tersimpan, `nominalLainnya=true`.
- [ ] Halaman publik menampilkan progres (target, persentase, jumlah donatur).
- [ ] Pengguna **tidak login** coba `GET /api/donatur-tetap` → hanya agregat, tidak ada data pribadi.
- [ ] Admin login → `GET` mengembalikan daftar lengkap.
- [ ] Admin ubah status (baru → terkonfirmasi → aktif) → tersimpan & widget progres ikut update.
- [ ] Admin hapus record → hilang dari daftar.
- [ ] Tombol "Buka Chat WA" membuka `https://wa.me/...` dengan nomor benar.
- [ ] Admin ubah target operasional → widget progres publik memakai target baru.
- [ ] Tampilan responsif mobile: form 1 kolom, tombol mudah ditekan.
- [ ] `npm run build` berhasil tanpa error type.

---

## 14. Acceptance Criteria

Fitur dianggap selesai bila **semua** terpenuhi:

1. Jamaah bisa membuka `/donatur-tetap`, mengisi form, dan melihat pesan sukses.
2. Data tersimpan di tabel `donatur_tetap` dengan WA ternormalisasi & status `baru`.
3. Widget progres menampilkan target + total komitmen + jumlah donatur aktif.
4. Admin bisa lihat, cari, filter status, ubah status, hapus, dan (opsional) export.
5. Admin bisa mengubah target operasional bulanan dari halaman Pengaturan.
6. Endpoint publik tidak membocorkan data pribadi donatur.
7. Navigasi "Donatur Tetap" muncul di header (desktop+mobile) dan footer.
8. Menu "Donatur Tetap" muncul di sidebar admin.
9. `npm run build` lolos.

---

## 15. Keputusan Desain & Pertanyaan Terbuka

**Keputusan sudah diambil (ikut, jangan diubah tanpa alasan):**
- Memakai plain `useState` controlled form (konsisten dengan kodebase), **tidak** install `react-hook-form`/`zod`.
- Target operasional disimpan di tabel `pengaturan` (key/value), bukan tabel baru.
- `whatsapp` disimpan ternormalisasi format `62xxx`.
- Progres publik hanya menghitung status `terkonfirmasi` + `aktif` (bukan `baru`), supaya angka realistis.
- Status pendaftar baru selalu `baru`.

**Pertanyaan terbuka (konfirmasi ke PIC bila ragu, atau pakai default):**
- **Q1** Target operasional default `Rp 15.000.000/bulan` — sesuai? (Default: ya.)
- **Q2** Nominal "Lainnya" minimum `Rp 10.000` — boleh? (Default: ya.)
- **Q3** Apakah perlu export CSV di MVP? (Default: boleh skip, catat TODO.)
- **Q4** Apakah nominal preset perlu bisa diubah oleh admin? (Default: tidak, hardcode di kode.)
- **Q5** Link "Donatur Tetap" di header: ikon terpisah sejajar "Donasi & Infaq", atau jadi item nav biasa? (Default: item nav biasa agar tidak ramai.)

---

### Lampiran — kutipan teks siap pakai

**Hero pembuka:**
> Bismillahirrahmanirrahim. Terima kasih atas niat Bapak/Ibu untuk berpartisipasi dalam mendukung operasional Masjid Al-Kahfi. Melalui program Donatur Tetap, insya Allah Bapak/Ibu turut berkontribusi dalam menjaga kegiatan ibadah, dakwah, pendidikan, kebersihan, dan kebutuhan operasional masjid secara berkelanjutan. Silakan isi formulir berikut dengan lengkap.

**Pesan sukses:**
> Jazakumullahu khairan. Pendaftaran Anda telah kami terima. Tim Masjid Al-Kahfi akan menghubungi Anda melalui WhatsApp untuk konfirmasi dan penyampaian informasi rekening/QRIS donasi.

**Ayat:**
> "Perumpamaan orang yang menginfakkan hartanya di jalan Allah seperti sebutir biji yang menumbuhkan tujuh bulir, pada setiap bulir terdapat seratus biji." (QS. Al-Baqarah: 261)

---

*End of `SPEC-DDT-2026-07-16`.*
