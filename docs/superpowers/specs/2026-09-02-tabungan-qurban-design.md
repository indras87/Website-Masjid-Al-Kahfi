# Desain Fitur: Tabungan Qurban

- **Tanggal:** 2026-09-02
- **Status:** Disetujui (desain di-chat)
- **Branch kerja:** `feat/tabungan-qurban`

## 1. Latar Belakang & Tujuan

DKM Masjid Al-Kahfi ingin program **Tabungan Qurban**: jamaah menabung bertahap untuk
qurban tahun target (periode). Fitur memungkinkan:

1. Jamaah mendaftar sendiri via **form publik** (status awal `baru`, diverifikasi admin).
2. Admin DKM mengelola peserta dari dashboard: verifikasi, ubah status, edit, hapus.
3. Admin mencatat **setoran** tiap transaksi; **saldo** peserta terhitung otomatis dari riwayat.

## 2. Keputusan Desain (hasil diskusi)

| Aspek | Keputusan |
|---|---|
| Cakupan | Data peserta **+** pencatatan setoran (saldo terhitung) |
| Pendaftaran | Form publik → status `baru` → verifikasi admin |
| Relasi shohibul | **1 peserta = 1 shohibul qurban** (muqorib); field langsung di tabel peserta |
| Pencatatan setoran | **Admin saja** dari dashboard (peserta tidak melapor sendiri) |
| Periode | Ya — field tahun periode pada peserta (mis. `"2027"`) |
| Arsitektur | **2 tabel + riwayat setoran**, saldo dihitung on-the-fly (pola modul Akuntansi) |

Alternatif yang ditolak: kolom saldo denormalisasi (tanpa riwayat, rentan inkonsisten);
menyatukan ke modul akuntansi (domain tercampur, field rekening tidak muat).

## 3. Database (`lib/db/schema.ts`)

### 3.1 Enum baru

```ts
export const qurbanPesertaStatusEnum = pgEnum("qurban_peserta_status", [
  "baru",     // daftar via publik, menunggu verifikasi admin
  "aktif",    // terverifikasi, tabungan berjalan
  "selesai",  // dana dicairkan / dipakai untuk qurban
  "berhenti", // dibatalkan / mengundurkan diri
]);
```

Enum `metodePembayaranEnum` (`transfer_bank`, `qris`, `tunai_sekretariat`) **di-reuse** untuk setoran.

### 3.2 Tabel `qurban_peserta`

| Kolom | Tipe | Aturan |
|---|---|---|
| `id` | `serial` PK | |
| `namaPeserta` | `text` | notNull — nama peserta tabungan |
| `shohibulQurban` | `text` | notNull — nama muqorib yang ditabungkan |
| `alamat` | `text` | notNull — alamat lengkap |
| `whatsapp` | `text` | notNull — dinormalisasi format `62xxx` (pola `campaign_donasi.whatsapp`) |
| `namaBank` | `text` | notNull |
| `nomorRekening` | `text` | notNull |
| `namaPemilikRekening` | `text` | notNull — atas nama rekening |
| `periode` | `text` | notNull — tahun target qurban, mis. `"2027"` |
| `status` | `qurban_peserta_status` | notNull, default `"baru"` |
| `catatanAdmin` | `text` | nullable — catatan internal DKM |
| `createdById` | `text` FK → `user.id` | `onDelete: "set null"` |
| `updatedById` | `text` FK → `user.id` | `onDelete: "set null"` |
| `createdAt` / `updatedAt` | `timestamp` | defaultNow |

Index: `periode` (filter per tahun qurban), `status`.

### 3.3 Tabel `qurban_setoran`

| Kolom | Tipe | Aturan |
|---|---|---|
| `id` | `serial` PK | |
| `pesertaId` | `integer` FK → `qurban_peserta.id` | notNull, `onDelete: "cascade"` |
| `tanggal` | `timestamp` (withTimezone) | notNull |
| `jumlah` | `integer` | notNull — rupiah, harus > 0 (validasi di API) |
| `metodePembayaran` | `metode_pembayaran` (reuse) | notNull |
| `keterangan` | `text` | nullable |
| `createdById` / `updatedById` | FK → `user.id` | `onDelete: "set null"` |
| `createdAt` / `updatedAt` | `timestamp` | defaultNow |

Index: `pesertaId`, `tanggal`.

### 3.4 Saldo

Saldo peserta = `SUM(qurban_setoran.jumlah)` per `pesertaId` — **tidak disimpan**,
dihitung saat query (agregasi `sql<number>` + `sum`, pola modul akuntansi).
Tidak ada transaksi penarikan pada fase ini; pengeluaran akhir dicatat via status `selesai`.

### 3.5 Migration & seed

- Migration drizzle (push/generate mengikuti alur repo), lalu `npm run db:setup`.
- Seed contoh di `lib/db/seed.ts`: 3 peserta (beda status & periode) + beberapa setoran.

## 4. API Routes

Pola auth mengikuti kode yang ada: `auth.api.getSession({ headers: await headers() })`
dari `@/lib/auth`; endpoint admin wajib sesi → `401` bila tidak ada.

| Route | Method | Akses | Perilaku |
|---|---|---|---|
| `app/api/qurban-peserta/route.ts` | GET | admin | Daftar peserta + saldo agregat per peserta; dukung filter `?periode=` & `?status=`; pencarian nama/WA di client |
| | POST | publik | Pendaftaran mandiri → status `baru`; validasi semua field wajib + normalisasi WA |
| `app/api/qurban-peserta/[id]/route.ts` | GET | admin | Detail peserta + riwayat setoran + saldo |
| | PATCH | admin | Verifikasi/ubah status, edit data peserta, catatan admin |
| | DELETE | admin | Hapus peserta (setoran ikut terhapus, cascade) |
| `app/api/qurban-setoran/route.ts` | GET | admin | Riwayat setoran (opsional `?pesertaId=`) |
| | POST | admin | Catat setoran baru (validasi `jumlah > 0`) |
| `app/api/qurban-setoran/[id]/route.ts` | PATCH | admin | Koreksi setoran |
| | DELETE | admin | Hapus setoran |

Validasi input: field wajib tidak kosong, `jumlah > 0`, WA dinormalisasi `62xxx`
(padanan `campaign-donasi`). Error → JSON `{ error }` dengan status code tepat
(400 validasi, 401 unauth, 404 tidak ditemukan).

## 5. Halaman Publik — `app/(site)/tabungan-qurban/page.tsx`

- Section hero singkat menjelaskan program + manfaat (gaya halaman `donatur-tetap`).
- **Form pendaftaran**: nama peserta, shohibul qurban (wajib diisi eksplisit — bila peserta menabung untuk dirinya sendiri, isi nama sendiri), alamat, nomor WA, nama bank, nomor rekening, nama pemilik rekening, checkbox persetujuan program.
- Submit → POST `/api/qurban-peserta` → state sukses: peserta dibuat status `baru`,
  tampil pesan "pendaftaran menunggu verifikasi admin; DKM akan menghubungi via WhatsApp".
- Nomor rekening yang diisi peserta adalah **rekening tujuan pencairan** pemulangan dana
  saat qurban — ditampilkan di form dengan keterangan tersebut agar tidak tertukar dgn rekening masjid.

## 6. Halaman Admin — `app/admin/(protected)/tabungan-qurban/page.tsx`

- **Tabel peserta**: nama peserta, shohibul, WA, periode, **saldo** (format Rupiah),
  badge status (warna mengikuti pola badge donatur-tetap), aksi (detail/edit/hapus).
- Pencarian (nama/WA/shohibul) + filter periode & status di sisi client.
- **Panel detail** (modal/drawer): data lengkap peserta, saldo, riwayat setoran,
  form **Catat Setoran** (tanggal, jumlah, metode, keterangan), aksi ubah status
  (`baru→aktif`, `aktif→selesai/berhenti`), edit data, hapus peserta.
- Menu baru di `app/admin/components/Sidebar.tsx`: `{ href: "/admin/tabungan-qurban", label: "Tabungan Qurban", icon: <ikon lucide yang sesuai, mis. PiggyBank> }`.

## 7. Error Handling

- Publik POST gagal validasi → pesan inline per field di form.
- Admin API gagal → toast/pesan error generik + detail dari server bila ada.
- Hapus peserta → konfirmasi dialog (destructive).
- Skema tabel tidak ada (belum migrasi) → build tetap aman karena semua query berjalan saat runtime.

## 8. Testing & Verifikasi

1. `npm run build` harus lolos (kaidah CLAUDE.md: harus work di production build).
2. `npm run db:setup` menjalankan migrasi + seed tanpa error.
3. Uji manual alur end-to-end di dev server:
   - Daftar via halaman publik → muncul di admin dgn status `baru`.
   - Verifikasi admin → `aktif`; catat 2 setoran → saldo = jumlah keduanya.
   - Koreksi & hapus setoran → saldo menyesuaikan.
   - Ubah status `selesai` / `berhenti`; hapus peserta beserta riwayatnya.

## 9. Di Luar Cakupan (fase berikutnya)

- Pelaporan setoran mandiri oleh peserta (dengan bukti transfer + verifikasi).
- Notifikasi WA otomatis.
- Laporan/ekspor pembukuan per periode.
- Alokasi setoran ke lebih dari satu shohibul.
