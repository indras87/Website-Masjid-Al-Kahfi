# Manual Test Flow — Campaign Donasi (SPEC-CDK-2026-07-27)

Flow test manual berurutan untuk fitur Campaign Donasi. Eksekusi atas-ke-bawah. Centang `[ ]` → `[x]` bila lolos.

| Field | Value |
|---|---|
| **Doc ID** | `TEST-CDK-2026-07-27` |
| **Fitur** | Campaign Donasi |
| **Branch** | `feature/campaign-donasi` |
| **App URL** | http://localhost:3000 |

---

## Prasyarat

- `npm run dev` berjalan (app di :3000).
- `npm run db:push` sudah (DB sinkron — confirmed).
- Punya akun admin (login di `/admin/login`).
- Siapkan 2 jendela browser: **A** = login admin (`/admin`), **B** = incognito/publik (no login).

## Data test siap pakai

| Field | Nilai | Expected setelah proses |
|---|---|---|
| Judul campaign | `Campaign Test Renovasi` | slug `campaign-test-renovasi` |
| Target nominal | `1.000.000` | — |
| Deadline (Flow A) | tanggal besok | tampil countdown |
| Deadline (Flow G) | tanggal kemarin | tampil "Berakhir", donasi disabled |
| Deadline (Flow H) | kosong | tampil "Tanpa batas waktu" |
| WA donatur | `0812-3456-7890` | tersimpan `6281234567890` |
| Nominal donasi | preset `50.000` | — |
| Nominal overfunding | input manual `2.000.000` | terkumpul > target, bar 100% |

---

## Flow A — Admin buat campaign (happy path)

1. **Browser A** → sidebar **Campaign** → tombol **Buat Campaign**.
2. Isi form: judul `Campaign Test Renovasi`, kategori `Pembangunan`, deskripsi singkat, cerita, **upload foto sampul**, target `1.000.000`, deadline = tanggal **besok**, status `Aktif`, featured `on`.
3. **Simpan**.
- [ ] Modal tutup, campaign muncul di tabel dgn badge "Aktif" + ⭐ featured.
- [ ] Kolom Terkumpul = `Rp 0` / `0%`, slug ter-generate.

## Flow B — Publik lihat & filter

4. **Browser B** (no login) → buka `/campaign`.
- [ ] Campaign "Campaign Test Renovasi" tampil (badge PEMBANGUNAN, progress 0%, ⭐ featured).
5. Klik chip filter kategori lain → list berubah; klik `Pembangunan` → campaign muncul lagi.
6. Klik kartu → `/campaign/campaign-test-renovasi`.
- [ ] Detail tampil: foto sampul, judul, cerita, progress 0%, **wall donatur kosong** dgn empty state "Jadilah donatur pertama…", countdown deadline.

## Flow C — Donasi publik

7. Di kartu donasi, pilih preset `50.000`, isi Nama `Test Donatur`, WA `0812-3456-7890`, pesan `Semoga berkah`, metode `Transfer Bank`.
8. Klik **Donasi**.
- [ ] State berubah → pesan sukses "Jazakumullahu khairan…".
9. Refresh `/campaign/campaign-test-renovasi`.
- [ ] Wall **masih kosong** (donasi `menunggu` belum tampil di publik).

## Flow D — Verifikasi admin

10. **Browser A** → sidebar **Verifikasi Donasi**.
- [ ] Donasi `Test Donatur` muncul, status `menunggu`, WA = `6281234567890` (ternormalisasi).
11. Klik baris → tombol **Verifikasi** → **Simpan**.
- [ ] Status berubah `terverifikasi`.
12. **Browser B** refresh detail campaign.
- [ ] Progress update: `Rp 50.000` / 5%, `1 donatur`.
- [ ] Wall tampil `Test Donatur` + pesan "Semoga berkah" + nominal + waktu relatif.

## Flow E — Input manual admin (tanpa WA)

13. **Browser A** Verifikasi Donasi → tombol **Input Manual**.
14. Isi: campaign = `Campaign Test Renovasi`, Nama `Hamba Allah`, **anonim on**, **WA dikosongkan**, nominal `100.000`, metode `Tunai`, status `Terverifikasi`.
15. **Simpan**.
- [ ] Donasi langsung `terverifikasi`, `createdByName` = nama admin.
16. **Browser B** refresh detail.
- [ ] Progress update: `Rp 150.000` / 15%, `2 donatur`.
- [ ] Wall: item anonim tampil "Hamba Allah".

## Flow F — Overfunding

17. **Browser A** Input Manual lagi: nominal `2.000.000`, status `Terverifikasi`.
18. **Browser B** refresh detail.
- [ ] `terkumpul` = `Rp 2.150.000` (> target 1jt) — **angka riil** tampil.
- [ ] Progress bar penuh / **100%** (di-clamp, tidak > 100).
- [ ] Tombol donasi **tetap aktif** (infaq tambahan diperbolehkan).

## Flow G — Deadline lewat (campaign efektif tutup)

19. **Browser A** → buat campaign baru: judul `Campaign Berakhir`, deadline = tanggal **kemarin**, status `Aktif`. Simpan.
20. **Browser B** buka `/campaign/campaign-berakhir`.
- [ ] Badge "Berakhir", tombol **Donasi disabled**.
21. (opsional, via DevTools console Browser B):
```js
fetch('/api/campaign-donasi', {method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify({campaignId: <id-berakhir>, namaDonatur:'X', whatsapp:'081234567890', nominal:10000, metodePembayaran:'transfer_bank'})})
.then(r=>r.json()).then(console.log)
```
- [ ] Response 400 `{ error: "Campaign telah berakhir" }`.

## Flow H — Deadline null (open-ended)

22. **Browser A** buat campaign: judul `Campaign Terbuka`, **deadline dikosongkan**, status `Aktif`. Simpan.
23. **Browser B** buka detailnya.
- [ ] Tampil "Tanpa batas waktu" (tanpa ikon countdown).

## Flow I — Update cerita

24. **Browser A** → klik campaign (detail `/admin/campaign/[id]`) → zona Update → **Tambah Update**.
25. Isi judul `Peletakan batu pertama`, isi cerita, (opsional foto). Simpan.
- [ ] Update muncul di list (terbaru atas).
26. **Browser B** refresh detail campaign.
- [ ] Update "Peletakan batu pertama" tampil di bagian Update Terbaru.

## Flow J — Edit & hapus campaign

27. **Browser A** → edit campaign `Campaign Test Renovasi`, ubah judul → `Campaign Test Renovasi 2`. Simpan.
- [ ] Slug ter-regenerate (unik), publik redirect/akses pakai slug baru.
28. Hapus salah satu campaign test → `confirm()` → terhapus.
- [ ] Campaign hilang; (donasi & update ikut cascade).

## Flow K — Validasi & privasi

29. **Browser B** submit donasi dgn **nama dikosongkan** → tombol Donasi disabled / error.
30. **Browser B** GET `/api/campaign?slug=campaign-test-renovasi-2` (via fetch/URL):
- [ ] Response `donatur[]` berisi **hanya** `{ namaTampilan, pesan, nominal, createdAt }`.
- [ ] **TIDAK ada** field `whatsapp`, `createdById`, `catatanAdmin`, `namaDonatur` mentah.
31. **Browser B** (no login) coba:
- [ ] `GET /api/campaign-donasi` → **401**.
- [ ] `POST /api/campaign` (create) → **401**.
- [ ] `GET /api/campaign` (list) → **hanya** campaign `aktif` (campaign `draft` tidak muncul).

## Flow L — Build (final gate)

32. `npm run build`.
- [ ] Lolos tanpa error type.

---

## Ringkasan acceptance (dari spec §13)

Setelah semua flow lolos, fitur siap merge bila:
1. Admin bisa CRUD campaign + status + featured.
2. Campaign `aktif` tampil publik dgn progress; `draft` tidak.
3. Filter kategori jalan.
4. Detail campaign lengkap (cerita, progres, wall, update).
5. Donasi publik + pesan sukses.
6. Verifikasi donasi + input manual + tombol WA.
7. Hanya `terverifikasi` masuk progress.
8. Update cerita CRUD.
9. Privasi: endpoint publik tidak bocor data sensitif.
10. Nav header + sidebar.
11. `npm run build` lolos.
12. Input manual (`whatsapp` opsional).

---

*End of `TEST-CDK-2026-07-27`.*
