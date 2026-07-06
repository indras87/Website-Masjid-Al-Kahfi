# Kontak & Donasi CMS Design

## Tujuan

Menambahkan CMS untuk mengelola konten halaman `Kontak` dan `Donasi / Infaq` dari admin panel, tanpa mengubah pola data publik yang sudah ada di aplikasi.

## Ruang Lingkup

### Kontak

Field yang dikelola:

- `alamat`
- `hotline`
- `email`
- `jam_operasional`
- `google_maps_url`

### Donasi / Infaq

Field yang dikelola:

- `nama_rekening`
- `nomor_rekening`
- `atas_nama_rekening`
- `qris_image`

## Pendekatan

Saya pilih pendekatan dua data singleton:

- satu tabel untuk `kontak`
- satu tabel untuk `donasi`

Alasannya:

- masing-masing halaman hanya butuh satu set data aktif
- CRUD menjadi sederhana dan tidak memerlukan daftar item
- data publik bisa dibaca langsung dari satu record yang sama
- lebih mudah dipakai oleh admin dibanding tabel list biasa

## Desain Data

### `kontak`

Satu row aktif berisi:

- `id`
- `alamat`
- `hotline`
- `email`
- `jam_operasional`
- `google_maps_url`
- `updated_at`

### `donasi`

Satu row aktif berisi:

- `id`
- `nama_rekening`
- `nomor_rekening`
- `atas_nama_rekening`
- `qris_image`
- `updated_at`

## API

### Kontak

- `GET /api/kontak`
  - mengembalikan record aktif atau fallback kosong/default
- `PUT /api/kontak`
  - membuat record pertama jika belum ada
  - memperbarui record yang ada jika sudah ada

### Donasi

- `GET /api/donasi`
  - mengembalikan record aktif atau fallback kosong/default
- `PUT /api/donasi`
  - membuat record pertama jika belum ada
  - memperbarui record yang ada jika sudah ada

## Admin UI

### Halaman baru

Tambahkan halaman admin baru:

- `/admin/kontak-donasi`

Halaman ini berisi dua kartu/form:

- form `Kontak`
- form `Donasi / Infaq`

### Perilaku UI

- data dimuat saat halaman dibuka
- tombol simpan melakukan `PUT`
- jika data belum ada, halaman tetap bisa menyimpan sebagai record pertama
- upload QRIS memakai pola upload yang sama dengan gambar lain di admin

## Integrasi Halaman Publik

### Halaman `Kontak`

Halaman publik `Kontak` membaca data dari `GET /api/kontak`:

- alamat ditampilkan sebagai teks
- hotline ditampilkan sebagai nomor kontak
- email ditampilkan sebagai alamat email
- jam operasional ditampilkan sebagai teks
- koordinat/maps dibuka dari `google_maps_url`

### Halaman `Donasi`

Halaman publik `Donasi / Infaq` membaca data dari `GET /api/donasi`:

- nama rekening
- nomor rekening
- atas nama rekening
- gambar QRIS

Jika data belum ada, gunakan fallback yang aman agar halaman tetap tampil.

## Seed dan Fallback

- tambahkan seed awal untuk `kontak` dan `donasi`
- jika database kosong, aplikasi tetap menampilkan konten default dari kode
- fallback harus selaras dengan isi halaman saat ini

## Validasi

### Kontak

- `alamat`, `hotline`, `email`, `jam_operasional`, dan `google_maps_url` wajib ada saat disimpan

### Donasi

- `nama_rekening`, `nomor_rekening`, `atas_nama_rekening`, dan `qris_image` wajib ada saat disimpan

## Risiko dan Catatan

- `google_maps_url` lebih fleksibel daripada latitude/longitude untuk kebutuhan halaman saat ini
- QRIS sebaiknya disimpan sebagai URL gambar, bukan binary file, agar tetap mengikuti pola upload yang sudah ada
- karena ini singleton settings, jangan dibuat daftar CRUD seperti berita atau galeri

## Definisi Selesai

Pekerjaan dianggap selesai jika:

- admin bisa mengubah data kontak
- admin bisa mengubah data donasi/infaq
- halaman publik kontak memakai data CMS
- halaman publik donasi/infaq memakai data CMS
- data tetap tampil dengan fallback saat tabel kosong
