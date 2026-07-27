# Spec & Implementation Plan — Campaign Donasi (Kitabisa-style) Masjid Al-Kahfi

| Field | Value |
|---|---|
| **Doc ID** | `SPEC-CDK-2026-07-27` |
| **Fitur** | Campaign Donasi (galang dana publik ala kitabisa.com) |
| **Tipe** | Public campaign + Donation form + Admin CRM + DB migration |
| **Target executor** | Junior programmer / AI model tier rendah |
| **Stack** | Next.js 15 App Router · Drizzle ORM · PostgreSQL · Tailwind v4 |
| **Status** | Ready to implement |
| **Estimasi** | 2–3 hari kerja |
| **Acuan pola** | `docs/PLAN-DDT-2026-07-16-donatur-tetap.md` (donatur tetap) — ikuti pola yang sama |

---

## 0. Daftar Isi

1. [Ringkasan](#1-ringkasan)
2. [Tujuan & User Stories](#2-tujuan--user-stories)
3. [In Scope / Out of Scope](#3-in-scope--out-of-scope)
4. [Desain Data (Schema + Migration)](#4-desain-data-schema--migration)
5. [Kontrak API](#5-kontrak-api)
6. [Spec UI Publik + ASCII Layout](#6-spec-ui-publik--ascii-layout)
7. [Spec UI Admin + ASCII Layout](#7-spec-ui-admin--ascii-layout)
8. [Aturan Validasi](#8-aturan-validasi)
9. [Keamanan & Privasi](#9-keamanan--privasi)
10. [Daftar File (Create / Modify)](#10-daftar-file-create--modify)
11. [Panduan Implementasi Bertahap](#11-panduan-implementasi-bertahap)
12. [Testing Checklist](#12-testing-checklist)
13. [Acceptance Criteria](#13-acceptance-criteria)
14. [Keputusan Desain & Pertanyaan Terbuka](#14-keputusan-desain--pertanyaan-terbuka)

---

## 1. Ringkasan

Fitur **galang dana (campaign)** seperti kitabisa.com: admin masjid membuat campaign (mis. "Renovasi Tempat Wudhu", "Bantuan Korban Banjir", "Wakaf Al-Qur'an untuk Anak Yatim"). Setiap campaign punya **target nominal**, **deadline opsional**, **cerita**, **foto sampul**, dan **progress bar**. Jamaah membuka halaman campaign → melihat progres → mengisi form donasi (nominal + data diri) → admin **memverifikasi pembayaran manual** (transfer/QRIS/tunai) → nominal terverifikasi dihitung ke progress.

**Pembayaran = manual confirm** (BUKAN payment gateway), konsisten dengan fitur `donatur-tetap` dan halaman `donasi` yang sudah ada. Donatur isi form → status `menunggu` → admin konfirmasi via WhatsApp/bukti transfer → ubah ke `terverifikasi` → baru masuk hitungan progress.

Alur inti:
```
Admin login
  -> /admin/campaign  -> buat campaign (judul, kategori, target, deadline, cerita, foto)
  -> set status = "aktif"  -> campaign tampil di publik
Jamaah buka /campaign
  -> lihat daftar campaign (filter kategori) + progress bar tiap campaign
  -> klik campaign -> /campaign/[slug]
  -> lihat cerita, progres, daftar donatur, update campaign
  -> isi form donasi (nominal, nama, anonim, WA, pesan, metode)
  -> POST /api/campaign-donasi  (publik, tanpa login)
  -> simpan ke campaign_donasi, status = "menunggu"
  -> tampilkan pesan sukses (Jazakumullahu khairan)
Admin login
  -> /admin/campaign-donasi  -> lihat donasi "menunggu"
  -> verifikasi (via WA/bukti) -> PATCH status = "terverifikasi"
  -> nominal ikut ke progress campaign
  -> (alternatif) input manual donasi via WA/tunai -> langsung "terverifikasi"
  -> /admin/campaign/[id]  -> kelola campaign + posting update cerita
```

---

## 2. Tujuan & User Stories

**Tujuan bisnis:**
- Memberi masjid alat untuk menggalang dana spesifik (bukan hanya donasi umum).
- Menampilkan transparansi target & progres agar jamaah termotivasi berdonasi.
- Memberi admin alat untuk mengelola campaign + memverifikasi donasi manual.

**User stories:**
- `US-01` Sebagai admin, saya ingin membuat campaign dengan target nominal & deadline **opsional** (boleh tanpa batas waktu / open-ended).
- `US-02` Sebagai admin, saya ingin mengatur status campaign (draft/aktif/berakhir) dan menandai campaign unggulan (featured).
- `US-03` Sebagai admin, saya ingin memverifikasi donasi yang masuk (menunggu → terverifikasi/ditolak).
- `US-04` Sebagai admin, saya ingin memposting update cerita per campaign (progress report).
- `US-05` Sebagai jamaah, saya ingin melihat daftar campaign + filter kategori + progress bar.
- `US-06` Sebagai jamaah, saya ingin melihat detail campaign (cerita, progres, donatur, update).
- `US-07` Sebagai jamaah, saya ingin berdonasi pada campaign (pilih nominal, isi data, pilih anonim).
- `US-08` Sebagai jamaah, saya ingin melihat konfirmasi yang menenangkan setelah submit donasi.
- `US-09` Sebagai jamaah, saya ingin melihat daftar donatur + pesan/doa baik di wall donatur.
- `US-10` Sebagai admin, saya ingin mencatat donasi manual (via WhatsApp/tunai yang tidak lewat form publik) langsung ber-status `terverifikasi`.

---

## 3. In Scope / Out of Scope

**In Scope (dibuat sekarang):**
- Tabel DB `campaign` + `campaign_donasi` + `campaign_update` + migration (3 enum baru, reuse `metodePembayaranEnum`).
- Halaman publik: list campaign (filter kategori, featured) + detail campaign (`[slug]`).
- Form donasi publik + pesan sukses.
- Widget progress per campaign (target vs terkumpul vs jumlah donatur vs persentase).
- Wall donatur (nama/anonim + pesan) di halaman detail.
- Daftar update cerita campaign di halaman detail.
- Admin: CRUD campaign + ubah status + toggle featured.
- Admin: verifikasi donasi (menunggu → terverifikasi/ditolak) + tombol chat WA.
- Admin: input manual donasi yang masuk via WhatsApp/tunai di luar form publik (langsung `terverifikasi`).
- Admin: CRUD update cerita per campaign.
- API publik (GET list, GET detail, POST donasi) + API admin (CRUD campaign, CRUD update, verifikasi donasi).
- Link navigasi "Campaign" di header/footer + menu sidebar admin (Campaign + Verifikasi Donasi).

**Out of Scope (tidak dibuat sekarang, catat untuk nanti):**
- **Payment gateway** (Midtrans/Xendit). Sekarang manual confirm saja. Arsitektur disiapkan agar kolom `status` donasi bisa di-automasi kelak.
- Donasi recurring/berlangganan per campaign (lihat fitur `donatur-tetap` untuk donasi rutin terpisah).
- Login/akun donatur (self-service portal, riwayat donasi).
- Pengingat WhatsApp otomatis / notifikasi email otomatis ke admin.
- Campaign diajukan jamaah (moderasi) — sekarang hanya admin yang membuat campaign.
- Komentar/thread diskusi (bukan wall donatur) — wall donatur saja sudah cukup.
- Laporan keuangan publik real-time per campaign (cuma progres agregat).
- Multi-foto/gallery per campaign (cuma 1 foto sampul + 1 foto per update).

---

## 4. Desain Data (Schema + Migration)

### 4.1 Tambah ke `lib/db/schema.ts`

Tambahkan **3 enum + 3 tabel** di akhir file (setelah tabel `donaturTetap`). Ikuti gaya kode yang sudah ada. **Reuse `metodePembayaranEnum`** yang sudah didefinisikan (jangan buat enum metode pembayaran baru).

```ts
// === Campaign Donasi (kitabisa-style) ===

// Kategori campaign (untuk filter publik)
export const campaignKategoriEnum = pgEnum("campaign_kategori", [
  "zakat",
  "sedekah",
  "wakaf",
  "bencana_alam",
  "pembangunan",
  "yatim_dhuafa",
  "kemanusiaan",
  "pendidikan",
  "operasional",
  "lainnya",
]);

// Status campaign (kontrol admin)
export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",       // belum tampil di publik
  "aktif",       // tampil & menerima donasi
  "tercapai",    // target tercapai (manual)
  "berakhir",    // deadline lewat / ditutup
  "dibatalkan",  // dibatalkan
]);

// Status verifikasi donasi
export const donasiStatusEnum = pgEnum("donasi_status", [
  "menunggu",      // baru submit, belum dibayar/diverifikasi
  "terverifikasi", // admin konfirmasi pembayaran -> masuk hitungan progress
  "ditolak",       // ditolak / tidak valid
]);

export const campaign = pgTable("campaign", {
  id: serial("id").primaryKey(),
  judul: text("judul").notNull(),
  slug: text("slug"), // generated via slugify + uniqueSlug
  kategori: campaignKategoriEnum("kategori").notNull(),
  deskripsiSingkat: text("deskripsi_singkat").notNull(), // preview kartu (max ~160 char)
  cerita: text("cerita"), // cerita lengkap (boleh multi-paragraf)
  img: text("img").notNull(), // URL foto sampul (via /api/upload)
  targetNominal: integer("target_nominal").notNull(), // rupiah, > 0
  tanggalMulai: timestamp("tanggal_mulai", { withTimezone: true }).defaultNow().notNull(),
  tanggalBerakhir: timestamp("tanggal_berakhir", { withTimezone: true }), // OPSIONAL; NULL = tanpa batas waktu (open-ended)
  status: campaignStatusEnum("status").default("draft").notNull(),
  featured: boolean("featured").default(false).notNull(),
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaignDonasi = pgTable("campaign_donasi", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id")
    .references(() => campaign.id, { onDelete: "cascade" })
    .notNull(),
  namaDonatur: text("nama_donatur").notNull(),
  anonim: boolean("anonim").default(false).notNull(), // true -> wall tampil "Hamba Allah"
  whatsapp: text("whatsapp"), // ternormalisasi "62xxx"; NULL bila input manual admin tanpa WA
  nominal: integer("nominal").notNull(), // rupiah, > 0
  pesan: text("pesan"), // pesan/doa baik di wall (opsional, max 300 char)
  metodePembayaran: metodePembayaranEnum("metode_pembayaran").notNull(), // reuse enum yang ada
  status: donasiStatusEnum("status").default("menunggu").notNull(),
  catatanAdmin: text("catatan_admin"), // catatan internal admin (nullable)
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaignUpdate = pgTable("campaign_update", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id")
    .references(() => campaign.id, { onDelete: "cascade" })
    .notNull(),
  judul: text("judul").notNull(),
  isi: text("isi").notNull(),
  img: text("img"), // opsional, URL via /api/upload
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

> **Catatan desain:** `terkumpul` TIDAK disimpan sebagai kolom. Dihitung server-side dari `SUM(nominal)` pada `campaignDonasi` ber-status `terverifikasi`. Ini mencegah drift angka antara donasi & progress (single source of truth).

### 4.2 Generate & jalankan migration

Repo memakai **drizzle-kit**. Jalankan (jangan tulis SQL manual):

```bash
npm run db:push      # dorong schema ke DB (dev)
```

`drizzle-kit push` akan membuat 3 tabel + 3 enum otomatis. Verifikasi folder `drizzle/` terupdate. Tidak perlu seed untuk fitur ini — data diisi dari admin & form publik.

> Catatan: `target_nominal` & `nominal` memakai `integer` (max ~2,1 miliar, cukup untuk rupiah per campaign/donasi).

---

## 5. Kontrak API

Ikuti pola `app/api/donatur-tetap/route.ts` & `app/api/berita/route.ts`: `export const dynamic = 'force-dynamic'`, import `{ db }` dari `@/lib/db`, import tabel/enum dari `@/lib/db/schema`, gunakan `getActor()`/`withActorNames()` dari `@/lib/audit`, dan `auth.api.getSession({ headers: await headers() })` untuk proteksi admin.

### 5.0 Helper progres (taruh di `lib/cms/settings.ts` atau inline di route)

```ts
import { db } from "@/lib/db";
import { campaignDonasi } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

/** Hitung progres campaign: terkumpul dari donasi terverifikasi. */
export async function getCampaignProgress(campaignId: number) {
  const rows = await db
    .select({
      total: sql<string | null>`coalesce(sum(${campaignDonasi.nominal}), 0)`,
      jumlah: sql<number>`count(*)`,
    })
    .from(campaignDonasi)
    .where(
      and(
        eq(campaignDonasi.campaignId, campaignId),
        eq(campaignDonasi.status, "terverifikasi")
      )
    );
  const terkumpul = parseInt(rows[0]?.total ?? "0", 10) || 0;
  const jumlahDonatur = Number(rows[0]?.jumlah ?? 0);
  return { terkumpul, jumlahDonatur };
}

/**
 * Persentase progress untuk TAMPILAN bar. Di-clamp maks 100% walau
 * terkumpul melebihi target (overfunding / infaq tambahan diperbolehkan).
 * Nominal `terkumpul` tetap menampilkan angka RIIL (bukan di-clamp).
 */
function withPersentase(target: number, terkumpul: number) {
  return target > 0 ? Math.min(100, Math.round((terkumpul / target) * 100)) : 0;
}
```

### 5.1 `GET /api/campaign` + `POST /api/campaign` — ganda + admin create

Buat `app/api/campaign/route.ts`.

**`GET`** (dual-mode via query `?slug=` & `?kategori=`):
- Tanpa `?slug=`:
  - **Publik:** kembalikan campaign ber-status `aktif`/`tercapai` beserta progres. Support filter `?kategori=`.
  - **Admin (login):** kembalikan SEMUA campaign (termasuk `draft`), tanpa filter paksa.
- Dengan `?slug=<slug>`: kembalikan **1 campaign** + progres + daftar `campaignUpdate` (terbaru di atas) + daftar `campaignDonasi` ber-status `terverifikasi` (untuk wall; mask anonim). Publik boleh akses selama campaign tidak `draft` (kecuali admin).

Contoh response publik list:
```json
[
  {
    "id": 1, "judul": "Renovasi Tempat Wudhu", "slug": "renovasi-tempat-wudhu",
    "kategori": "pembangunan", "deskripsiSingkat": "...", "img": "/uploads/x.jpg",
    "targetNominal": 50000000, "status": "aktif", "featured": true,
    "tanggalBerakhir": "2026-09-30T00:00:00Z",
    "progres": { "terkumpul": 12500000, "jumlahDonatur": 42, "persentase": 25 }
  }
]
```

Contoh response publik detail (`?slug=`):
```json
{
  "campaign": { "...field campaign..." },
  "progres": { "terkumpul": 12500000, "jumlahDonatur": 42, "persentase": 25 },
  "updates": [ { "id": 3, "judul": "Peletakan batu pertama", "isi": "...", "img": "/uploads/y.jpg", "createdAt": "..." } ],
  "donatur": [ { "namaTampilan": "Ahmad Fauzi", "pesan": "Semoga berkah", "nominal": 100000, "createdAt": "..." } ]
}
```

> Masking `donatur`: untuk publik, jangan kirim field `whatsapp`/`namaDonatur` mentah. Kirim `namaTampilan` = `anonim ? "Hamba Allah" : namaDonatur`, plus `pesan` & `nominal` (boleh untuk transparansi ala kitabisa) & `createdAt`. **Nomor WhatsApp TIDAK PERNAH** dikirim ke publik.

**`POST`** (admin saja — buat campaign):
- Body: `{ judul, kategori, deskripsiSingkat, cerita?, img, targetNominal, tanggalBerakhir, status?, featured? }`.
- Generate slug unik (pola `computeUniqueSlug` seperti `app/api/berita/route.ts`, tapi query dari tabel `campaign`).
- `tanggalMulai` default `now()`. `tanggalBerakhir` **opsional**: bila dikirim (format `"YYYY-MM-DD"`) → parse ke `new Date()`; bila tidak dikirim / string kosong → simpan `null` (campaign open-ended, tanpa deadline).
- Butuh `getActor()`; kalau tidak login → `401`.

### 5.2 `app/api/campaign/[id]/route.ts` — ADMIN SAJA

- `GET` → 1 campaign + progres + updates + donatur (versi lengkap, untuk admin).
- `PATCH` → update field campaign `{ judul?, kategori?, deskripsiSingkat?, cerita?, img?, targetNominal?, tanggalBerakhir?, status?, featured? }`. Bila `judul` berubah, regenerate slug unik. Set `updatedById: actor.id`, `updatedAt: new Date()`.
- `DELETE` → hapus campaign (cascade: donasi & update ikut terhapus karena `onDelete: "cascade"`).
- Pakai `params: Promise<{ id: string }>` (Next 15 async params), persis `app/api/donatur-tetap/[id]/route.ts`.

### 5.3 `POST /api/campaign-donasi` — ganda (publik submit + admin manual input)

Buat `app/api/campaign-donasi/route.ts`.

**Request body:**
```json
{
  "campaignId": 1,
  "namaDonatur": "Ahmad Fauzi",
  "anonim": false,
  "whatsapp": "081234567890",
  "nominal": 100000,
  "pesan": "Semoga menjadi amal jariyah (opsional)",
  "metodePembayaran": "transfer_bank"
}
```

**Aturan:**
- Cek campaign exists & status `aktif` (kalau `draft`/`berakhir`/`dibatalkan` → tolak `400` "Campaign tidak menerima donasi saat ini"). Bila `tanggalBerakhir` diisi & sudah lewat hari ini → tolak `400` (campaign efektif tutup walau status masih `aktif`; konsisten dgn tombol disabled di §6.8.1).
- **Cabang publik** (tanpa login): `whatsapp` wajib & dinormalisasi server-side (copy `normalizeWa` dari `app/api/donatur-tetap/route.ts`, boleh di-extract ke `lib/`). `createdById` = `null`, status default `menunggu`.
- Validasi semua field (lihat [§8](#8-aturan-validasi)).
- **Cabang admin** (sesi login, input manual — lihat detail di bawah).

**Response 200:** `{ "ok": true, "id": 12 }`
**Response 400:** `{ "error": "Nominal donasi tidak valid" }`

**`GET`** (admin saja): daftar semua donasi, support `?campaignId=` & `?status=`. Publik (no session) → `401` (data donasi mentah hanya admin). Gunakan `withActorNames`.

**Cabang admin — Input Manual (sesi login):**
Bila `getActor()` ada (admin login), POST juga berfungsi untuk **mencatat donasi manual** (donasi via WhatsApp/tunai yang tidak lewat form publik). Perbedaan vs cabang publik:
- `whatsapp` **opsional** (boleh `null`) — donatur tunai/WA sering tidak meninggalkan nomor.
- `status` **bisa di-set langsung** (default `terverifikasi`, karena admin sudah menerima/konfirmasi pembayaran). Boleh juga `menunggu` bila baru dicatat.
- `createdById` = `actor.id`, `updatedById` = `actor.id` (tercatat admin perekam).
- `metodePembayaran` tetap wajib (mis. `tunai_sekretariat` untuk tunai).

Body admin (contoh):
```json
{ "campaignId": 1, "namaDonatur": "Hamba Allah", "anonim": true, "nominal": 250000, "metodePembayaran": "tunai_sekretariat", "status": "terverifikasi", "pesan": "Via WA langsung" }
```
Donasi hasil input manual langsung masuk hitungan progress (karena `terverifikasi`) & tampil di wall publik (masking anonim seperti biasa). Di tabel admin, `createdByName` menampilkan nama admin perekam — ini membedakan donasi manual vs submit publik.

### 5.4 `app/api/campaign-donasi/[id]/route.ts` — ADMIN SAJA

- `GET` → 1 donasi lengkap (404 kalau tidak ada).
- `PATCH` → `{ status: "terverifikasi" | "ditolak", catatanAdmin? }`. Validasi `status` di whitelist enum. Set `updatedById`, `updatedAt`.
- `DELETE` → hapus donasi.
- Pola identik dengan `app/api/donatur-tetap/[id]/route.ts` (GET/PATCH/DELETE + `getActor()` guard).

### 5.5 `app/api/campaign-update/route.ts` + `[id]/route.ts`

- `GET /api/campaign-update?campaignId=X` (publik): daftar update campaign, terbaru di atas. Publik boleh baca (untuk halaman detail).
- `POST` (admin): `{ campaignId, judul, isi, img? }` → create update. Butuh `getActor()`.
- `PATCH /api/campaign-update/[id]` (admin): update `{ judul?, isi?, img? }`.
- `DELETE /api/campaign-update/[id]` (admin): hapus update.

---

## 6. Spec UI Publik + ASCII Layout

### 6.1 File & route

- `app/(site)/campaign/page.tsx` (`"use client"`) — daftar campaign + filter kategori.
- `app/(site)/campaign/[slug]/page.tsx` (`"use client"`) — detail campaign + form donasi + wall donatur + updates.
- Otomatis dapat AppShell (navbar+footer) karena ada di grup `(site)`.
- Fetch: `GET /api/campaign` (list) / `GET /api/campaign?slug=<slug>` (detail). Submit: `POST /api/campaign-donasi`.

### 6.2 Palette & gaya (sama dengan halaman lain)

- Header hero: `bg-emerald-900 text-white`, `border-b-4 border-gold-500`, overlay `islamic-pattern`.
- Kartu campaign: `bg-white rounded-2xl border border-gold-100 shadow-md hover:shadow-lg transition`.
- Aksen: `text-gold-500`, `bg-emerald-900`, `font-serif` judul.
- Tombol donasi utama: gradient `from-gold-500 to-gold-600`.
- Progress bar: track `bg-gray-200 rounded-full`, fill `bg-gradient-to-r from-emerald-500 to-emerald-600`.
- Ikon `lucide-react`: `Sparkles`, `Heart`, `Target`, `Clock`, `Users`, `Share2`, `BadgeCheck`, `HandCoins`, `ImagePlus`.

### 6.3 ASCII Layout — Daftar Campaign (Desktop)

```
+============================================================================+
|  HERO  (bg-emerald-900, text-gold-300)                                     |
|     Galang Dana & Campaign Masjid Al-Kahfi                                 |
|   "Bismillah, salurkan donasi terbaik Bapak/Ibu untuk program pilihan..."  |
+============================================================================+

  [ SEMUA ] [ Zakat ] [ Wakaf ] [ Pembangunan ] [ Yatim ] [ Bencana ] ...    (chip filter)

  +----------------+  +----------------+  +----------------+
  | [foto sampul]  |  | [foto sampul]  |  | [foto sampul]  |   <- featured (ribbon)
  | Renovasi Wudhu |  | Wakaf Qur'an   |  | Bantuan Banjir |
  | PEMBANGUNAN    |  | WAKAF          |  | BENCANA ALAM   |
  | [====>    ] 25%|  | [========>] 80%|  | [==>]      10% |
  | Rp 12.5 / 50 jt|  | Rp 8 / 10 jt   |  | Rp 1 / 10 jt   |
  | 42 donatur     |  | 120 donatur    |  | 15 donatur     |
  | Berakhir: 30 Sep| | Berakhir: 31 Des| | Berakhir: 15 Agt|
  | [ Donasi Sekarang ]  (gradient gold)                                    |
  +----------------+  +----------------+  +----------------+
```

### 6.4 ASCII Layout — Detail Campaign `/campaign/[slug]` (Desktop)

```
+============================================================================+
|  [ FOTO SAMPUL BESAR (bg cover) ]                                          |
|     Renovasi Tempat Wudhu Lantai 2                                         |
|     [ PEMBANGUNAN ]   ⏱ Berakhir dalam 65 hari                             |
+============================================================================+

+-----------------------------------------+  +-------------------------------+
|  CERITA CAMPAIGN                        |  |  KARTU DONASI (sticky)        |
|                                         |  |  Rp 12.500.000                |
|  Deskripsi lengkap multi-paragraf...    |  |  dari Rp 50.000.000           |
|                                         |  |  [========>........] 25%      |
|  -- UPDATE TERBARU ------------------   |  |  42 donatur • sisa 65 hari    |
|  📌 Peletakan Batu Pertama (12 Jul)     |  |                               |
|     Sudah dimulai pengerjaan... [foto]  |  |  Pilih Nominal Donasi:        |
|  📌 Penggalangan Dimulai (1 Jul)        |  |  [10rb][25rb][50rb*][100rb]   |
|                                         |  |  [200rb][500rb][1jt][Lainnya] |
|  -- DONATUR (42) --------------------   |  |  Lainnya: [ ________ ] Rp     |
|  💚 Ahmad Fauzi     Rp 100.000          |  |                               |
|     "Semoga berkah"                     |  |  Nama: [__________________]   |
|  💚 Hamba Allah     Rp 50.000 (anonim)  |  |  [x] Sembunyikan nama (anonim)|
|  💚 Siti Aminah     Rp 25.000           |  |  WhatsApp: [ 08__________ ]   |
|     "Barakallahu fiikum"                |  |  Pesan/Doa (opsional):        |
|                                         |  |  [______________________]     |
|                                         |  |  Metode: ()Transfer ()QRIS ()Tunai |
|                                         |  |                               |
|                                         |  |  [ DONASI SEKARANG ] (gold)  |
+-----------------------------------------+  +-------------------------------+
```

### 6.5 ASCII Layout — State Sukses (ganti kartu form setelah submit OK)

```
+--------------------------------------+
|                                      |
|            (ikon BadgeCheck, gold)   |
|                                      |
|         Jazakumullahu khairan.       |
|                                      |
|   Donasi Anda telah kami catat.      |
|   Silakan transfer ke rekening/QRIS  |
|   yang tertera. Tim Masjid akan      |
|   menghubungi Anda via WhatsApp      |
|   untuk verifikasi.                  |
|                                      |
|   [ Lihat Rekening/QRIS ]  [ Kembali ]|
+--------------------------------------+
```

### 6.6 ASCII Layout — Mobile

Daftar: 1 kolom kartu menumpuk. Detail: cerita di atas, kartu donasi menempel di bawah (tidak sticky di mobile). Form 1 kolom, nominal grid 4x2 → 2x4 di layar kecil.

### 6.7 Komponen form donasi (state)

Pakai controlled form dengan `useState` (pola sama dengan `app/(site)/donatur-tetap/page.tsx`). **Tidak perlu** install library form baru.

```ts
type DonasiForm = {
  nominalPreset: number | null; // 10000|25000|50000|100000|200000|500000|1000000|null
  nominalLainnya: string;       // di-parse jadi number saat submit
  namaDonatur: string;
  anonim: boolean;
  whatsapp: string;
  pesan: string;
  metodePembayaran: "transfer_bank" | "qris" | "tunai_sekretariat" | "";
};
```

Saat submit, hitung nominal final:
```ts
const nominalLainnya = form.nominalPreset === null && form.nominalLainnya.trim() !== "";
const nominal = form.nominalPreset ?? parseInt(form.nominalLainnya.replace(/\D/g, ""), 10);
```

Preset nominal campaign (boleh beda dari donatur-tetap): `10000, 25000, 50000, 100000, 200000, 500000, 1000000`.

Format rupiah: `new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })`.

### 6.8 Anatomi Komponen & State Detail (untuk implementasi presisi)

Bagian ini memperdalam komponen UI publik agar implementasi konsisten & tidak ambigu. Saran struktur: taruh komponen reusable di folder `components/campaign/`:

```
components/campaign/
  CampaignCard.tsx      <- kartu di halaman daftar
  ProgressBar.tsx       <- bar progress (dipakai kartu + detail)
  DeadlineBadge.tsx     <- label deadline (tangani null)
  DonasiForm.tsx        <- form donasi + state sukses
  DonaturWall.tsx       <- wall donatur (masked)
  CampaignDetail.tsx    <- konten detail (cerita + updates + wall)
```

#### 6.8.1 Kartu Campaign (`<CampaignCard campaign={...} progres={...} />`)

Anatomi (atas → bawah):
```
+------------------------------------------+
| [ FOTO SAMPUL 16:9 ]         ⭐ featured |  <- object-cover; ribbon ⭐ pojok kanan atas
| [badge kategori]            🏆 TERCAPAI  |  <- overlay badge status di pojok kanan bawah foto
+------------------------------------------+
| Renovasi Tempat Wudhu Lantai 2           |  <- judul, font-serif, line-clamp-2
| Deskripsi singkat max 2 baris...         |  <- deskripsiSingkat, line-clamp-2, text-gray-600
|                                          |
| [========>..........] 25%                |  <- <ProgressBar value={persentase}>
| Rp 12.500.000  /  Rp 50.000.000          |  <- terkumpul (text-emerald-700) / target (text-gray-400)
| 👥 42 donatur    ⏱ 65 hari lagi          |  <- meta row; ⏱ BISA diganti "Tanpa batas waktu"
|                                          |
| [         Donasi Sekarang          ]     |  <- full-width, gradient from-gold-500 to-gold-600
+------------------------------------------+
```

Seluruh kartu dibungkus `<Link href={`/campaign/${slug}`}>` agar seluruh area bisa diklik. Tombol "Donasi Sekarang" adalah anchor/bagian dari link (bukan `<button>` terpisah yang fetch) — hindari nested interactive (`<a>` di dalam `<a>`).

State kartu:
| Kondisi | Tampilan |
|---|---|
| `persentase < 100` | progress normal, badge kategori saja |
| `persentase >= 100` (tercapai) | overlay 🏆 "Tercapai" di foto; tombol donasi tetap aktif (infaq tambahan diperbolehkan) |
| `featured === true` | ribbon ⭐ di pojok kanan atas foto |
| `tanggalBerakhir === null` | meta row tampil "Tanpa batas waktu" (tanpa ikon ⏱) |
| `tanggalBerakhir` < hari ini | badge "Berakhir" (abu); tombol donasi disabled |
| `tanggalBerakhir` ≤ 7 hari lagi | ikon ⏱ + teks merah "X hari lagi" (urgency) |
| status `draft` / `dibatalkan` | TIDAK dirender di publik (sudah difilter di API GET) |

#### 6.8.2 Progress Bar + Logika Deadline

**`<ProgressBar value={persentase} />`** — komponen murni presentational:
- track: `w-full bg-gray-200 rounded-full h-2.5`
- fill: `bg-gradient-to-r from-emerald-500 to-emerald-600 h-2.5 rounded-full transition-all duration-500`
- width di-**clamp** 0–100: `style={{ width: \`${Math.min(100, Math.max(0, persentase))}%\` }}` (jangan overflow walau terkumpul > target)
- label persentase di kanan luar: `text-sm font-semibold text-emerald-700`

**`<DeadlineBadge tanggalBerakhir={...} />`** — wajib tangani `null`:
```tsx
function DeadlineBadge({ tanggalBerakhir }: { tanggalBerakhir: string | null }) {
  if (!tanggalBerakhir) {
    return <span className="text-gray-500 text-sm">Tanpa batas waktu</span>;
  }
  const sisa = Math.ceil((new Date(tanggalBerakhir).getTime() - Date.now()) / 86_400_000);
  if (sisa < 0)  return <span className="text-gray-500 text-sm font-medium">⏱ Berakhir</span>;
  if (sisa <= 7) return <span className="text-red-600 text-sm font-semibold">⏱ {sisa} hari lagi</span>;
  return <span className="text-gray-500 text-sm">⏱ {sisa} hari lagi</span>;
}
```
Catatan: `Date.now()` aman di komponen `"use client"`. Jangan pakai di Server Component (hydration mismatch). Karena halaman publik sudah `"use client"`, aman.

#### 6.8.3 Form Donasi — State Machine & Validasi

State utama: `idle → submitting → success | error`.

```
[idle]
  │  klik "Donasi Sekarang"
  ▼
[validasi client] ──invalid──> [error per-field, kembali idle]
  │  semua valid
  ▼
[submitting: POST /api/campaign-donasi] ──5xx──> [error global "Terjadi kesalahan", kembali idle]
  │  200
  ▼
[success]  (kartu form diganti §6.5)
```

Aturan interaksi (client-side, sebelum POST; server tetap source of truth):
| Interaksi / kondisi | Perilaku |
|---|---|
| Klik preset nominal | `nominalPreset = value`; clear `nominalLainnya` |
| Ketik di input "Lainnya" | `nominalPreset = null`; fokus pindah ke input tersebut |
| `nominalLainnya` < 10000 | tombol disabled + hint kecil "Minimal Rp 10.000" |
| `namaDonatur.length < 3` | tombol disabled |
| WhatsApp tidak valid format | tombol disabled |
| `metodePembayaran === ""` | tombol disabled |
| Klik donasi saat semua valid | `submitting=true`; tombol → spinner "Memproses..." (`disabled`) |
| Response `200` | state `success` |
| Response `400` | tampilkan `error` server di atas form (kotak merah) |
| Response `5xx` | "Terjadi kesalahan, coba lagi." tetap di form |

Preview validasi WhatsApp client:
```ts
const waValid = (raw: string) => {
  const d = raw.replace(/[^\d]/g, "");
  if (d.startsWith("0"))  return d.length >= 10 && d.length <= 15;
  if (d.startsWith("62")) return d.length >= 10 && d.length <= 15;
  return false;
};
```

> Tombol donasi: `disabled` SAAT salah satu validasi gagal ATAU `submitting === true`. Tampilkan pesan error sebagai teks kecil di bawah field, **bukan** `alert()`. Setelah `success`, **kosongkan** state form agar refresh halaman tidak re-submit ganda.

#### 6.8.4 Wall Donatur (`<DonaturWall donatur={...} />`)

Data dari `GET /api/campaign?slug=` → array `donatur` (sudah di-mask di server, lihat §5.1). Komponen hanya menampilkan, tidak boleh memutuskan masking sendiri.

Aturan masking (konfirmasi UI — data sudah bersih dari server):
| `anonim` | `namaTampilan` |
|---|---|
| `true` | "Hamba Allah" |
| `false` | `namaDonatur` asli |

Layout item donatur:
```
+----------------------------------------+
| 💚 Ahmad Fauzi                 Rp100.000|  <- nama bold; nominal text-emerald-700
|    "Semoga berkah & jariyah"            |  <- pesan opsional, text-gray-500, italic
|    2 hari yang lalu                     |  <- relative time (pakai lib/relative-time.ts yang sudah ada)
+----------------------------------------+
```

State:
| Kondisi | Tampilan |
|---|---|
| `donatur.length === 0` | empty state ramah: "Jadilah donatur pertama untuk campaign ini 🤲" |
| 1–10 donatur | tampilkan semua |
| > 10 donatur | tampilkan 10 terbaru + tombol "Lihat semua (N)" → expand list penuh (state lokal `showAll`) |

Sort: **terbaru di atas** (`createdAt` desc — urutan sudah dari server). Semua item di wall WAJIB `terverifikasi` (filter di server, bukan di client).

---

## 7. Spec UI Admin + ASCII Layout

### 7.1 File & route

- `app/admin/(protected)/campaign/page.tsx` — daftar campaign + create/edit (modal form).
- `app/admin/(protected)/campaign/[id]/page.tsx` — detail: edit campaign + kelola update cerita + ringkasan donasi.
- `app/admin/(protected)/campaign-donasi/page.tsx` — verifikasi donasi (semua campaign).
- Tambah 2 link sidebar di `app/admin/components/Sidebar.tsx`.

### 7.2 ASCII Layout — Daftar Campaign (`/admin/campaign`)

```
+------------------------------------------------------------------------+
| [Sidebar] |  Campaign Donasi                          [+ Buat Campaign]|
|           |  Kelola galang dana & status campaign.                    |
|           |                                                            |
|           |  [Cari judul___] [Kategori: Semua v] [Status: Semua v]    |
|           |  +--------------------------------------------------------+|
|           |  |# | Judul          | Kategori    | Target  | Terkumpul|S|  |
|           |  |--|----------------|-------------|---------|----------|-|  |
|           |  |1 |Renovasi Wudhu  | Pembangunan |50 jt    |12.5 jt 25|A|  |
|           |  |2 |Wakaf Qur'an    | Wakaf       |10 jt    |8 jt   80|A|  |
|           |  |3 |Bantuan Banjir  | Bencana     |10 jt    |1 jt   10|D|  |  (D=draft)
|           |  +--------------------------------------------------------+|
|           |  Klik baris -> /admin/campaign/[id] (kelola detail)        |
+------------------------------------------------------------------------+
```

Tabel menampilkan `Terkumpul` (dihitung dari `getCampaignProgress`) + badge status + ikon featured (⭐).

### 7.3 ASCII Layout — Form Create/Edit Campaign (modal)

```
+----------------------------------------------------+
|  Campaign Baru / Edit Campaign              [X]    |
+----------------------------------------------------+
|  Judul *        [_______________________________]  |
|  Kategori *     [ Pembangunan              v ]      |
|  Deskripsi Singkat * (max 160)                    |
|  [_____________________________________________]   |
|  Cerita Lengkap (opsional)                         |
|  [_____________________________________________]   |
|  [ (textarea besar, multi-paragraf) ]              |
|                                                    |
|  Foto Sampul *      [ Pilih Gambar ] -> preview    |
|                      (upload via POST /api/upload)  |
|                                                    |
|  Target Nominal *   Rp [_________________]         |
|  Tanggal Berakhir   [ YYYY-MM-DD ] (opsional)      |
|  Status             [ Aktif   v ]                   |
|  Featured           [ ] Tampilkan di unggulan       |
|                                                    |
|       [ Batal ]   [ Simpan Campaign ]               |
+----------------------------------------------------+
```

Upload gambar: POST `FormData` ke `/api/upload` (sudah ada, max 2MB, JPG/PNG/WEBP/GIF), dapat `{ url }`, simpan ke field `img`. Lihat pola `app/admin/(protected)/berita/page.tsx` / `galeri`.

### 7.4 ASCII Layout — Detail Campaign Admin (`/admin/campaign/[id]`)

```
+------------------------------------------------------------------------+
|  < Kembali   |  Renovasi Tempat Wudhu                        [Edit]   |
|              |  [ PEMBANGUNAN ] Aktif • 25% (12.5jt / 50jt)            |
|              |----------------------------------------------------------|
|              |  -- UPDATE CERITA -------------------  [+ Tambah Update]|
|              |  📌 Peletakan Batu Pertama (12 Jul)  [edit][hapus]      |
|              |     Sudah dimulai pengerjaan...                          |
|              |  📌 Penggalangan Dimulai (1 Jul)    [edit][hapus]        |
|              |----------------------------------------------------------|
|              |  -- DONASI TERBARU (lihat semua -> /admin/campaign-donasi)|
|              |  Ahmad Fauzi  Rp 100.000  terverifikasi                  |
|              |  Hamba Allah  Rp 50.000   menunggu  [Verifikasi]         |
+------------------------------------------------------------------------+
```

Form "Tambah Update": `{ judul, isi, img? }` → `POST /api/campaign-update`.

### 7.5 ASCII Layout — Verifikasi Donasi (`/admin/campaign-donasi`)

```
+------------------------------------------------------------------------+
| [Sidebar] |  Verifikasi Donasi                                         |
|           |  Donasi masuk yang perlu dikonfirmasi pembayarannya.       |
|           |                                                            |
|           |  [Status: Menunggu v] [Cari nama/WA___]                    |
|           |  +--------------------------------------------------------+|
|           |  |# | Campaign         | Donatur    | Nominal |Metode |S|  |
|           |  |--|------------------|------------|---------|-------|-|  |
|           |  |8 |Renovasi Wudhu    |Ahmad Fauzi |Rp100.000|Transfer|⏳| |
|           |  |7 |Wakaf Qur'an      |Hamba Allah |Rp 50.000|QRIS   |⏳| |
|           |  +--------------------------------------------------------+|
|           |  Klik baris -> panel/modal detail:                         |
|           |                                                            |
|           |    Nama      : Ahmad Fauzi                                 |
|           |    WhatsApp  : 62812xxxxxxx   [ Buka Chat WA ]             |
|           |    Nominal   : Rp 100.000                                  |
|           |    Pesan     : "Semoga berkah"                             |
|           |    Metode    : Transfer Bank                               |
|           |    Status    : [ Menunggu v ]  (-> terverifikasi/ditolak)  |
|           |    Catatan   : [____________________]                      |
|           |    [ Simpan ]  [ Hapus ]                                   |
+------------------------------------------------------------------------+
```

**Tombol "Buka Chat WA"** → `https://wa.me/<whatsapp>?text=...` (template konfirmasi pembayaran). Ini sangat membantu admin verifikasi manual.

**Ubah status** → `PATCH /api/campaign-donasi/[id]` body `{ status, catatanAdmin }`. Refresh list setelah simpan. Donasi `terverifikasi` otomatis ikut hitungan progress campaign.

### 7.6 Tambah ke Sidebar (`app/admin/components/Sidebar.tsx`)

Di array `links`, tambahkan **2 entri** (ikon dari `lucide-react`):

```ts
{ href: "/admin/campaign", label: "Campaign", icon: Sparkles },
{ href: "/admin/campaign-donasi", label: "Verifikasi Donasi", icon: HandCoins },
```

Letakkan setelah `Donatur Tetap`.

### 7.7 Anatomi Komponen & State Detail (Admin)

Komponen admin taruh di `components/admin/campaign/`: `CampaignAdminTable.tsx`, `CampaignFormModal.tsx`, `CampaignDetailAdmin.tsx`, `VerifikasiDonasiTable.tsx`, `UpdateForm.tsx`, `InputManualModal.tsx`. Ikuti pola visual `app/admin/(protected)/donatur-tetap/page.tsx` yang sudah ada (kartu putih `rounded-lg border border-gray-200`, badge status berwarna, modal detail dengan header/footer sticky).

#### 7.7.1 Tabel Daftar Campaign (`<CampaignAdminTable>`)

```
+----+----------------------+--------------+----------+-------------+----+----+
| #  | Judul                | Kategori     | Target   | Terkumpul   | ⭐ | St |
+----+----------------------+--------------+----------+-------------+----+----+
| 1  | Renovasi Wudhu       | Pembangunan  | Rp 50 jt | Rp 12.5 jt  | ★  | A  |
|    |                      |              |          | 25% [====>.]|    |    |
| 2  | Wakaf Qur'an         | Wakaf        | Rp 10 jt | Rp 11 jt    |    | A  |  <- overfunded 110%
|    |                      |              |          | 100% [====>] |    |    |     (bar clamp 100%)
| 3  | Bantuan Banjir       | Bencana      | Rp 10 jt | Rp 0        |    | D  |  <- draft, 0 donasi
+----+----------------------+--------------+----------+-------------+----+----+
```

Kolom `Terkumpul`: tampilkan nominal riil + mini `<ProgressBar>` di bawahnya. Bar clamp 100% walau overfunded (§6.8.2). Klik baris → `router.push('/admin/campaign/[id]')`.

Filter & search (state lokal, pola `donatur-tetap`):
| Kontrol | Perilaku |
|---|---|
| Search "Cari judul" | `judul.toLowerCase().includes(q)` |
| Kategori dropdown | `kategori === value`; "Semua" = tanpa filter |
| Status dropdown | `status === value`; "Semua" = tanpa filter |

Badge status warna (konsisten dengan `donatur-tetap`):
| status | kelas Tailwind |
|---|---|
| `draft` | `bg-gray-100 text-gray-700` |
| `aktif` | `bg-emerald-100 text-emerald-700` |
| `tercapai` | `bg-amber-100 text-amber-700` (atau `gold-100/gold-700` bila palet ada) |
| `berakhir` | `bg-gray-100 text-gray-500` |
| `dibatalkan` | `bg-red-100 text-red-700` |

Empty state: "Belum ada campaign." + tombol "Buat Campaign".

#### 7.7.2 Form Create/Edit Campaign (`<CampaignFormModal>`)

Modal tiga-zone: header sticky (judul + [X]) / body scrollable / footer sticky ([Batal] + [Simpan]). Urutan field:

| Field | Kontrol | Validasi inline (live) |
|---|---|---|
| Judul * | input text | 5–120 char; hint penghitung `x/120` |
| Kategori * | select enum | wajib pilih |
| Deskripsi Singkat * | input text | max 160; hint `x/160` |
| Cerita Lengkap | textarea besar | opsional, max 5000 |
| Foto Sampul * | file picker + preview | upload via `/api/upload`; loading "Mengunggah..." |
| Target Nominal * | input angka + prefix "Rp" | integer > 0 |
| Tanggal Berakhir | date picker **+ tombol "Hapus tanggal"** | opsional; kosong → `null` |
| Status | select enum | default `draft` saat create |
| Featured | toggle/checkbox | boolean |

State form: satu objek `useState` (pola `donatur-tetap`). Saat Simpan:
- Validasi client ringan → bila error, sorot field merah + pesan.
- `submitting=true`, tombol → spinner "Menyimpan...".
- `POST /api/campaign` (create) / `PATCH /api/campaign/[id]` (edit).
- `200` → tutup modal + refresh tabel. `4xx/5xx` → tampilkan error, tetap di modal (jangan tutup).

Upload foto (flow terpisah dari submit form):
```
[pilih file] -> validasi client (tipe/size) -> POST /api/upload (FormData)
  -> 200 { url } -> setForm({ img: url }) + tampilkan thumbnail
  -> 4xx -> hint "Gagal upload, coba gambar lain"
```
Form menyimpan **URL string** di field `img`; submit kirim URL, BUKAN file.

**Tanggal Berakhir opsional:** date picker default kosong. Tombol kecil "Hapus tanggal" mengosongkan → kirim `null`. Hint: "Kosongkan untuk campaign tanpa batas waktu."

#### 7.7.3 Detail Campaign Admin (`/admin/campaign/[id]`)

Layout 3 zona vertikal:

```
+------------------------------------------------------------------------+
| HEADER: judul + [kategori] + badge status + ringkasan progres          |
|         [⭐ toggle featured]  [status v cepat]  [Edit]  [Hapus]         |
+------------------------------------------------------------------------+
| ZONA UPDATE CERITA                                                     |
|   [+ Tambah Update] -> <UpdateForm> (inline/expand)                    |
|   list update (kartu): judul • tanggal • [edit][hapus]                |
+------------------------------------------------------------------------+
| ZONA DONASI TERBARU                                                    |
|   5 donasi terbaru (campuran status) + "Lihat semua"                   |
|   -> /admin/campaign-donasi?campaignId=X                               |
+------------------------------------------------------------------------+
```

- `<UpdateForm>` inline: field `{ judul, isi, img? }` → `POST /api/campaign-update` (create) / `PATCH` (edit). Setelah simpan → refresh list update.
- Quick action header: toggle **featured** (PATCH `{ featured: !featured }`) tanpa buka modal; ubah **status** cepat via dropdown (PATCH `{ status }`).
- Hapus campaign: `confirm()` dulu (destruktif + cascade). Pola `handleDelete` `donatur-tetap`.

#### 7.7.4 Verifikasi Donasi (`<VerifikasiDonasiTable>`)

Default: filter `status = menunggu` (yang perlu ditindaklanjuti).

```
Filter: [Status: Menunggu v] [Cari nama/WA___]    total: 8 menunggu
+----+------------------+------------+-----------+---------+--------+
| #  | Campaign         | Donatur   | Nominal   | Metode  | Status |
+----+------------------+------------+-----------+---------+--------+
| 8  | Renovasi Wudhu   | Ahmad F.   | Rp100.000 | Transfer| ⏳     |
+----+------------------+------------+-----------+---------+--------+
Klik baris -> modal detail verifikasi (§7.5)
```

Modal detail — state machine aksi:
```
[lihat detail]
  ├── [Buka Chat WA] -> window.open(wa.me/<wa>?text=template)   (verifikasi manual via WA)
  ├── [✓ Verifikasi] (emerald) -> set terverifikasi -> [Simpan] PATCH
  ├── [✗ Tolak]      (red)     -> set ditolak + WAJIB isi catatanAdmin -> [Simpan] PATCH
  └── [Hapus]        -> confirm -> DELETE
```

- Saat "Tolak": fokus otomatis ke field `catatanAdmin`, **wajib** diisi sebelum Simpan (alasan penolakan).
- Setelah aksi: refetch tabel + (opsional) toast "Donasi diverifikasi, progres diperbarui".

Filter & search:
| Kontrol | Perilaku |
|---|---|
| Status dropdown | default `menunggu`; opsi Semua / terverifikasi / ditolak |
| Search | `namaDonatur` atau `whatsapp` contains |
| `?campaignId=` (dari link detail) | praset filter campaign tertentu |

#### 7.7.5 Input Manual Donasi (admin)

Tombol "+ Input Manual" di kanan filter bar verifikasi (juga ada di zona Donasi halaman detail campaign §7.7.3). Membuka `<InputManualModal>`:

```
+--------------------------------------------+
|  Input Manual Donasi                [X]    |
+--------------------------------------------+
|  Campaign *      [ Renovasi Wudhu    v ]   |
|  Nama Donatur *  [____________________]    |
|  [x] Sembunyikan nama (anonim)             |
|  WhatsApp       [ 08________ ] (opsional)  |
|  Nominal *       Rp [________________]      |
|  Metode *        [ Tunai Sekretariat  v ]  |
|  Pesan/Doa       [____________________]    |
|  Status          [ Terverifikasi     v ]   |  <- default terverifikasi
|                                            |
|         [ Batal ]   [ Simpan ]             |
+--------------------------------------------+
```

Submit → `POST /api/campaign-donasi` (cabang admin). Setelah simpan: refetch tabel + toast "Donasi manual tercatat". Karena default `terverifikasi`, nominal langsung masuk progress campaign.

> Input manual = jalan pintas untuk donasi yang **sudah diterima** admin (via WA/tunai) tapi tidak tercatat di sistem. Jangan dipakai untuk donasi yang **belum dibayar** — gunakan alur publik/`menunggu` untuk itu agar tetap diverifikasi.

#### 7.7.6 Progress pasca-verifikasi (penting)

Saat admin ubah status donasi `menunggu` → `terverifikasi`:
- **Tidak ada** kolom `terkumpul` yang di-update manual (lihat catatan §4.1).
- Progress dihitung ulang **server-side** saat `GET /api/campaign` dipanggil berikutnya.
- UI cukup **refetch** data campaign → nominal, jumlah donatur, & bar otomatis update. **Jangan** hardcode increment nominal di client (rawan drift).

---

## 8. Aturan Validasi

Validasi sisi **client** (UX) + **server** (keamanan, WAJIB). Server source of truth.

### Campaign (admin)

| Field | Aturan |
|---|---|
| `judul` | Wajib, 5–120 karakter. |
| `kategori` | Wajib, salah satu enum `campaignKategoriEnum`. |
| `deskripsiSingkat` | Wajib, max 160 karakter. |
| `cerita` | Opsional, max 5000 karakter. |
| `img` | Wajib, string URL (`/uploads/...` atau URL absolut). |
| `targetNominal` | Wajib, integer > 0. |
| `tanggalBerakhir` | **Opsional**. Bila diisi: tanggal valid (`YYYY-MM-DD`) & harus > hari ini. Bila kosong → simpan `null` (campaign open-ended / tanpa batas waktu). |
| `status` | Salah satu enum. Default `draft`. |
| `featured` | Boolean. |

### Donasi (publik)

| Field | Aturan |
|---|---|
| `campaignId` | Wajib, integer, campaign exists & status `aktif`. |
| `namaDonatur` | Wajib, 3–100 karakter. |
| `anonim` | Boolean. |
| `whatsapp` | **Publik:** wajib, setelah normalisasi 10–15 digit & diawali `62`. **Admin manual input:** opsional (boleh `null` bila donatur tidak meninggalkan WA, mis. tunai langsung). |
| `nominal` | Wajib, integer > 0. Preset `10000..1000000` atau Lainnya min `10000`. |
| `pesan` | Opsional, max 300 karakter. |
| `metodePembayaran` | Wajib, salah satu `metodePembayaranEnum`. |

### Update cerita (admin)

| Field | Aturan |
|---|---|
| `campaignId` | Wajib, exists. |
| `judul` | Wajib, 5–120 karakter. |
| `isi` | Wajib, max 5000 karakter. |
| `img` | Opsional, URL. |

**Normalisasi WhatsApp (server)** — copy dari `app/api/donatur-tetap/route.ts`:
```ts
function normalizeWa(input: string): string {
  let d = input.replace(/[^\d]/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  if (!d.startsWith("62")) d = "62" + d;
  return d;
}
```
Disarankan: extract ke `lib/whatsapp.ts` agar dipakai bersama `donatur-tetap` & `campaign-donasi` (opsional, refaktor ringan).

---

## 9. Keamanan & Privasi

- Endpoint publik `POST /api/campaign-donasi` **tanpa login**. Wajib validasi server ketat (§8).
- **Rate-limit sederhana** per IP untuk POST (mis. maks 10 donasi / 10 menit). MVP boleh skip bila tidak ada middleware rate-limit di repo — catat sebagai TODO.
- `GET /api/campaign` publik **hanya** boleh mengembalikan: field campaign + progres agregat + daftar donatur yang sudah di-mask (`namaTampilan`, `pesan`, `nominal`, `createdAt`). **TIDAK boleh** membocorkan `whatsapp`, `email`, `catatanAdmin`, atau data donasi `menunggu`/`ditolak`.
- Wall donatur publik hanya tampilkan donasi ber-status `terverifikasi`. Donasi `menunggu`/`ditolak` hanya untuk admin.
- Campaign ber-status `draft` TIDAK tampil di publik (hanya admin).
- Semua endpoint selain `GET /api/campaign` (publik), `GET /api/campaign-update` (publik), dan `POST /api/campaign-donasi` (publik) butuh sesi admin (`getActor()`/`auth.api.getSession`), else `401`.
- Data sensitif (WA donatur) hanya untuk admin yang sedang memverifikasi. Tampilkan progress agregat di publik, bukan identitas mentah.
- Lindungi spam: batasi panjang semua `text`; `nominal`/`targetNominal` pakai `integer` DB (bukan string).
- `whatsapp` disimpan ternormalisasi; tidak pernah dikirim ke pihak ketiga di MVP ini.

---

## 10. Daftar File (Create / Modify)

### CREATE (file baru)

| Path | Isi |
|---|---|
| `app/(site)/campaign/page.tsx` | Daftar campaign publik + filter kategori + featured. |
| `app/(site)/campaign/[slug]/page.tsx` | Detail campaign + form donasi + wall donatur + updates + state sukses. |
| `app/api/campaign/route.ts` | `GET` (publik list/detail + admin full) + `POST` (admin create). |
| `app/api/campaign/[id]/route.ts` | `GET`/`PATCH`/`DELETE` (admin). |
| `app/api/campaign-donasi/route.ts` | `POST` (publik submit + admin manual input) + `GET` (admin list). |
| `app/api/campaign-donasi/[id]/route.ts` | `PATCH`/`DELETE` (admin verify/reject). |
| `app/api/campaign-update/route.ts` | `GET` (publik list by `?campaignId`) + `POST` (admin create). |
| `app/api/campaign-update/[id]/route.ts` | `PATCH`/`DELETE` (admin). |
| `app/admin/(protected)/campaign/page.tsx` | Daftar + create/edit modal campaign. |
| `app/admin/(protected)/campaign/[id]/page.tsx` | Detail: edit + kelola update + ringkasan donasi. |
| `app/admin/(protected)/campaign-donasi/page.tsx` | Verifikasi donasi (list + verify/reject + WA). |

### MODIFY (file sudah ada)

| Path | Perubahan |
|---|---|
| `lib/db/schema.ts` | Tambah 3 enum + 3 tabel (`campaign`, `campaignDonasi`, `campaignUpdate`). Reuse `metodePembayaranEnum`. |
| `lib/cms/settings.ts` | Tambah helper `getCampaignProgress()` (§5.0). |
| `components/app-shell.tsx` | Tambah `{ id: "campaign", label: "Campaign" }` di `navLinks` + cabang `handleNav` (`router.push('/campaign')`). |
| `components/layout-header.tsx` | Tambah link "Campaign" di nav (desktop & mobile). |
| `components/layout-footer.tsx` | (Opsional) tambah link footer "Campaign". |
| `app/admin/components/Sidebar.tsx` | Tambah 2 link: Campaign (`Sparkles`) + Verifikasi Donasi (`HandCoins`) setelah Donatur Tetap. |

> Opsional refaktor: extract `normalizeWa` ke `lib/whatsapp.ts` & dipakai `donatur-tetap` + `campaign-donasi`.

---

## 11. Panduan Implementasi Bertahap

Kerjakan **berurutan**. Setiap step harus bisa dites sebelum lanjut.

**Step 1 — Data layer**
1. Edit `lib/db/schema.ts` (3 enum + 3 tabel).
2. Tambah `getCampaignProgress()` di `lib/cms/settings.ts`.
3. Jalankan `npm run db:push`. Cek 3 tabel + 3 enum terbentuk di DB.

**Step 2 — API campaign (admin)**
4. Buat `app/api/campaign/route.ts` (GET dual-mode + POST create). Tes dengan `curl`.
5. Buat `app/api/campaign/[id]/route.ts` (GET/PATCH/DELETE).

**Step 3 — API donasi publik + verifikasi**
6. Buat `app/api/campaign-donasi/route.ts` (POST publik + admin manual + GET admin).
7. Buat `app/api/campaign-donasi/[id]/route.ts` (PATCH/DELETE admin).
8. Tes: buat campaign via admin → submit donasi publik → cek masuk `menunggu`.

**Step 4 — API update cerita**
9. Buat `app/api/campaign-update/route.ts` + `[id]/route.ts`.

**Step 5 — UI publik**
10. Buat `app/(site)/campaign/page.tsx` (list + filter).
11. Buat `app/(site)/campaign/[slug]/page.tsx` (detail + form donasi + wall + updates + sukses).
12. Tes end-to-end: list → detail → donasi → muncul `menunggu` di admin.

**Step 6 — Navigasi publik**
13. Edit `app-shell.tsx` + `layout-header.tsx` (+ opsional `layout-footer.tsx`).

**Step 7 — Admin UI**
14. Buat `app/admin/(protected)/campaign/page.tsx` (list + create/edit modal).
15. Buat `app/admin/(protected)/campaign/[id]/page.tsx` (detail + update CRUD).
16. Buat `app/admin/(protected)/campaign-donasi/page.tsx` (verifikasi).
17. Edit `Sidebar.tsx` (2 menu baru).

**Step 8 — Verifikasi**
18. Jalankan `npm run dev`. Uji semua alur di [§12](#12-testing-checklist).
19. Jalankan `npm run build` — harus lolos tanpa error type.

---

## 12. Testing Checklist

Lakukan manual (belum ada harness test khusus fitur ini):

**Campaign (admin)**
- [ ] Admin buat campaign → tersimpan, slug unik.
- [ ] Upload foto sampul → URL tersimpan di `img`.
- [ ] Campaign `draft` tidak tampil di publik; ubah ke `aktif` → tampil.
- [ ] Edit campaign (ubah judul) → slug regenerate, tetap unik.
- [ ] Toggle featured → muncul ribbon/unggulan di publik.
- [ ] Buat campaign **tanpa** tanggal berakhir → tersimpan `null`; publik tampil "Tanpa batas waktu" (tanpa countdown).
- [ ] Buat campaign **dengan** tanggal berakhir → badge deadline tampil; countdown ≤ 7 hari berwarna merah.
- [ ] Hapus campaign → donasi & update ikut terhapus (cascade).

**Donasi (publik)**
- [ ] Submit donasi valid → muncul pesan sukses + QS Al-Baqarah 261.
- [ ] Submit donasi ke campaign `draft`/`berakhir`/melebihi-deadline → ditolak 400.
- [ ] Submit tanpa nama → error validasi (client + server 400).
- [ ] Submit WA `0812-3456-7890` → tersimpan `6281234567890`.
- [ ] Pilih nominal "Lainnya" → nominal custom tersimpan.
- [ ] Centang anonim → wall tampil "Hamba Allah".
- [ ] Donasi `menunggu` TIDAK tampil di wall publik.

**Verifikasi (admin)**
- [ ] Admin ubah status donasi `menunggu` → `terverifikasi` → nominal ikut progress.
- [ ] Progress campaign update (terkumpul, jumlah donatur, persentase).
- [ ] Donasi `ditolak` tidak ikut progress.
- [ ] **Overfunding:** donasi melebihi target → bar tetap 100%, nominal `terkumpul` tampil angka riil > target, donasi tetap diterima.
- [ ] Admin input manual donasi (via WA/tunai) → tersimpan `terverifikasi`, langsung masuk progress, `createdByName` = nama admin.
- [ ] Admin input manual **tanpa WA** → tersimpan (`whatsapp` null), tidak crash, tampil normal di wall (anonim/nama sesuai input).
- [ ] Tombol "Buka Chat WA" membuka `https://wa.me/...` dengan nomor benar.

**Update cerita**
- [ ] Admin tambah update → muncul di halaman detail (terbaru di atas).
- [ ] Edit/hapus update berfungsi.

**Privasi & keamanan**
- [ ] Publik `GET /api/campaign?slug=` tidak mengembalikan `whatsapp`/`catatanAdmin`.
- [ ] User tidak login coba `POST /api/campaign` → 401.
- [ ] User tidak login coba `GET /api/campaign-donasi` → 401.

**Umum**
- [ ] Tampilan responsif mobile (list 1 kolom, form donasi 1 kolom, kartu tidak sticky).
- [ ] `npm run build` lolos tanpa error type.

---

## 13. Acceptance Criteria

Fitur dianggap selesai bila **semua** terpenuhi:

1. Admin bisa membuat, mengedit, mengubah status, menandai featured, & menghapus campaign.
2. Campaign `aktif` tampil di `/campaign` dengan progress bar; `draft` tidak tampil.
3. Jamaah bisa filter campaign berdasarkan kategori di halaman publik.
4. Jamaah bisa membuka `/campaign/[slug]`, melihat cerita, progres, wall donatur, dan update.
5. Jamaah bisa submit donasi (nominal, nama, anonim, WA, pesan, metode) dan melihat pesan sukses.
6. Admin bisa memverifikasi donasi (`menunggu` → `terverifikasi`/`ditolak`) + tombol chat WA.
7. Hanya donasi `terverifikasi` yang masuk hitungan progress campaign.
8. Admin bisa memposting update cerita per campaign; update tampil di halaman detail.
9. Endpoint publik tidak membocorkan `whatsapp`/data donatur mentah.
10. Navigasi "Campaign" muncul di header (desktop+mobile) + footer; menu "Campaign" + "Verifikasi Donasi" di sidebar admin.
11. `npm run build` lolos.
12. Admin bisa mencatat donasi manual (via WhatsApp/tunai) langsung ber-status `terverifikasi` & ikut hitungan progress; `whatsapp` opsional untuk input manual.

---

## 14. Keputusan Desain & Pertanyaan Terbuka

**Keputusan sudah diambil (ikut, jangan diubah tanpa alasan):**
- Pembayaran **manual confirm** (admin verifikasi), BUKAN payment gateway. Konsisten dengan `donatur-tetap` & `donasi`.
- Hanya **admin** yang membuat campaign (tidak ada ajukan jamaah).
- `terkumpul` **dihitung server-side** dari `SUM(nominal)` donasi `terverifikasi`, tidak disimpan kolom (hindari drift).
- Progress hitung dari status `terverifikasi` saja (bukan `menunggu`) supaya realistis.
- Wall donatur publik hanya `terverifikasi`; donatur anonim tampil "Hamba Allah".
- Reuse `metodePembayaranEnum` (tidak bikin enum baru) + `metodePembayaranEnum` di `campaignDonasi`.
- Memakai plain `useState` controlled form (konsisten dengan kodebase), **tidak** install `react-hook-form`/`zod`.
- Slug di-generate via `slugify` + `uniqueSlug` (pola `berita`).
- Foto via `/api/upload` yang sudah ada (max 2MB).
- **Overfunding diperbolehkan:** bila `terkumpul > target`, progress bar ditampilkan **maks 100%** (di-clamp untuk visual), tetapi nominal `terkumpul` menampilkan angka riil yang melebihi target. Donasi tetap diterima (infaq tambahan). Status `tercapai` **tidak** otomatis saat lewat target — admin yang set manual.
- **Input manual admin:** donasi yang masuk via WhatsApp/tunai di luar form publik dicatat admin langsung ber-status `terverifikasi`. Kolom `whatsapp` dibuat **nullable** (publik wajib isi, admin manual opsional). `createdById !== null` + `createdByName` membedakan donasi input manual vs submit publik.

**Pertanyaan terbuka (konfirmasi ke PIC bila ragu, atau pakai default):**
- **Q1** Daftar kategori default (10 enum di atas) — cukup? Perlu tambah/kurang? (Default: ya.)
- **Q2** Preset nominal donasi `10rb/25rb/50rb/100rb/200rb/500rb/1jt` — sesuai? Minimum Lainnya `Rp 10.000`? (Default: ya.)
- **Q3** Apakah wall donatur perlu menampilkan nominal per donatur, atau disembunyikan (hanya jumlah+pesan)? Kitabisa menampilkan nominal. (Default: tampilkan nominal, transparansi.)
- **Q4** Apakah perlu auto-transisi status: `tercapai` saat `terkumpul >= target`, `berakhir` saat lewat deadline? (Default: tidak auto — admin manual. Bila `tanggalBerakhir = null` (open-ended), transisi `berakhir` otomatis tidak relevan. Endpoint tetap menghitung persentase untuk badge tampilan.)
- **Q5** Apakah nominal donasi & nama donatur perlu search/filter di admin verifikasi? (Default: ya, search nama/WA + filter status.)
- **Q6** Apakah perlu "share" button (WhatsApp/Facebook/copy link) di halaman detail? (Default: ya, copy-link minimal — bantu virality.)

---

### Lampiran — kutipan teks siap pakai

**Hero daftar campaign:**
> Bismillah. Salurkan donasi terbaik Bapak/Ibu untuk program & kebutuhan pilihan Masjid Al-Kahfi. Setiap rupiah yang disalurkan melalui campaign ini insya Allah menjadi amal jariyah yang mengalir tanpa henti.

**Pesan sukses donasi:**
> Jazakumullahu khairan. Donasi Anda telah kami catat. Silakan transfer ke rekening/QRIS yang tertera pada halaman donasi. Tim Masjid Al-Kahfi akan menghubungi Anda via WhatsApp untuk verifikasi, dan nominal donasi Bapak/Ibu akan masuk ke progress campaign setelah terverifikasi.

**Ayat (sukses):**
> "Perumpamaan orang yang menginfakkan hartanya di jalan Allah seperti sebutir biji yang menumbuhkan tujuh bulir, pada setiap bulir terdapat seratus biji." (QS. Al-Baqarah: 261)

**Template WA verifikasi (admin → donatur):**
> Assalamu'alaikum wr. wb. Terima kasih atas donasi Bapak/Ibu untuk campaign "[judul]". Kami telah menerima pencatatan donasi sebesar [nominal]. Mohon konfirmasi pembayaran (transfer ke Rek. [no] / QRIS) agar donasi Bapak/Ibu dapat diverifikasi. Jazakumullahu khairan.

---

*End of `SPEC-CDK-2026-07-27`.*
