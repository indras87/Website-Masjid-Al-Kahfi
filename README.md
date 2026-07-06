# Website Profil Masjid Al-Kahfi

Aplikasi ini adalah **Website Profil Resmi Masjid Al-Kahfi Cikoneng**, Kabupaten Bandung. Website ini dibangun untuk menyediakan informasi terpusat mengenai masjid kepada masyarakat luas, meliputi profil kepengurusan, visi-misi, fasilitas, jadwal sholat, dokumentasi kegiatan (kajian, TPA, dll), berita terbaru, galeri foto, hingga informasi donasi/ziswaf.

Aplikasi ini dirancang dengan antarmuka yang modern, responsif, dan interaktif untuk memberikan pengalaman pengguna yang nyaman.

## Arsitektur dan Struktur Folder

Aplikasi ini menggunakan framework **Next.js** dengan paradigma **App Router**. Berikut adalah struktur folder utama dari proyek ini:

```
website_masjid_alkahfi/
├── app/                  # Folder utama App Router Next.js
│   ├── admin/            # Halaman dan komponen untuk dashboard admin (jika ada)
│   ├── api/              # Route handler API untuk data CMS
│   ├── globals.css       # Styling global termasuk variabel tema (CSS variables)
│   ├── layout.tsx        # Layout utama aplikasi (HTML skeleton, fonts, meta tags)
│   └── page.tsx          # Halaman utama aplikasi (Single Page Application view)
├── assets/               # Direktori untuk menyimpan aset statis lokal
├── hooks/                # Tempat menyimpan custom React hooks 
├── lib/                  # Fungsi-fungsi utility dan helper
│   └── db/               # Skema, seed, dan koneksi database Drizzle
├── public/               # (Opsional) aset statis publik seperti favicon
├── .env.example          # Contoh variabel lingkungan (environment variables)
├── package.json          # Konfigurasi dependensi dan script npm
├── next.config.ts        # File konfigurasi Next.js
├── tailwind.config.ts    # (Terintegrasi di postcss/tailwind) Konfigurasi Tailwind CSS
└── tsconfig.json         # Konfigurasi TypeScript
```

Pada versi saat ini, aplikasi menggunakan pendekatan *Single Page* yang dikelola melalui state di `app/page.tsx`, di mana semua tab (Beranda, Tentang, Jadwal Sholat, dll) dirender secara dinamis tanpa perpindahan rute aktual.

## Teknologi Stack

Proyek ini dibangun menggunakan teknologi modern untuk memastikan performa yang cepat dan pengembangan yang efisien:

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Library UI:** [React](https://react.dev/) (v19)
- **Bahasa Pemrograman:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4)
- **Package Manager:** npm

## Library Utama yang Digunakan

- **`motion` (Framer Motion):** Digunakan untuk membuat animasi transisi antar halaman, elemen interaktif, dan efek visual yang halus.
- **`lucide-react`:** Kumpulan ikon SVG modern dan ringan yang digunakan di seluruh antarmuka aplikasi.
- **`clsx` & `tailwind-merge`:** Utility untuk memanipulasi dan menggabungkan class Tailwind secara dinamis tanpa konflik.
- **`drizzle-orm` & `drizzle-kit`:** ORM untuk PostgreSQL yang cepat, ringan, dan fully type-safe.
- **`postgres`:** Driver database PostgreSQL client untuk Drizzle.

## Fitur Utama

- Halaman utama dengan konten masjid, berita, kegiatan, galeri, dan info donasi/ziswaf.
- Dashboard admin untuk mengelola berita, kegiatan, galeri, dan halaman "Tentang".
- Manajemen data "Tentang" untuk pengurus, visi-misi, dan fasilitas masjid.
- API route berbasis Next.js untuk CRUD data CMS.

## Cara Setup Project

Ikuti langkah-langkah berikut untuk mengatur proyek di komputer lokal Anda:

1. **Pastikan Prasyarat Terpenuhi:**
   - Node.js (versi 20 atau lebih baru disarankan)
   - Docker & Docker Compose (opsional jika ingin menjalankan via Docker)

2. **Install Dependensi:**
   Buka terminal di dalam folder proyek, lalu jalankan:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   - Salin file `.env.example` dan ubah namanya menjadi `.env.local`
   - Isi variabel `DATABASE_URL` dengan alamat database PostgreSQL Anda. Untuk setup lokal dan Docker host, gunakan port `5433`.
   - Perintah `npm run db:setup` sekarang membaca `.env.local` secara otomatis.
   ```bash
   cp .env.example .env.local
   ```

## Cara Run Aplikasi

Aplikasi ini dapat dijalankan menggunakan dua cara:

### Cara 1: Menggunakan Docker Compose (Direkomendasikan)
Cara ini akan menjalankan database PostgreSQL dan aplikasi Next.js (dalam **mode Development dengan Hot Reload** aktif) secara otomatis di dalam kontainer Docker.

1. **Jalankan Docker Compose:**
   ```bash
   docker-compose up -d --build
   ```
   *Menggunakan flag `-d` (detached) agar kontainer berjalan di latar belakang (daemonize). Proses build akan sangat cepat karena melewati proses npm run build.*
   Database Docker dapat diakses dari host lewat port `5433`.

   > **Tips Docker Berguna:**
   > * **Melihat log real-time:** `docker-compose logs -f app`
   > * **Melihat status kontainer:** `docker-compose ps`
   > * **Mematikan kontainer:** `docker-compose down`

2. **Migrasi dan Seed Database:**
   Setelah kontainer database dan aplikasi menyala, Anda dapat mengisi data awal (berita, kegiatan, galeri, pengurus, profil, dan fasilitas) dengan menjalankan perintah ini:
   ```bash
   docker exec -it alkahfi_app npm run db:setup
   ```
   Atau jika menggunakan Docker Compose CLI baru:
   ```bash
   docker compose exec app npm run db:setup
   ```
   *Perintah ini akan membuat tabel-tabel database via Drizzle (`drizzle-kit push`) dan memasukkan data default (`tsx lib/db/seed.ts`). Tabel yang dibuat mencakup `berita`, `kegiatan`, `galeri`, `pengurus`, `profil_masjid`, dan `fasilitas`.*

3. **Akses Aplikasi:**
   Buka browser Anda dan kunjungi:
   - Halaman Utama: [http://localhost:3000](http://localhost:3000)
   - Halaman Admin (Kelola Berita/Kegiatan/Galeri/Tentang): [http://localhost:3000/admin](http://localhost:3000/admin)

### Cara 2: Menjalankan Secara Manual (Development Lokal)

1. **Jalankan Database PostgreSQL:**
   Pastikan PostgreSQL berjalan lokal di komputer Anda di port `5433` dengan database `alkahfi_db` (atau sesuai konfigurasi di `.env.local`).
   Jika memakai Docker Compose, database juga diekspos ke host pada port `5433`.

2. **Jalankan Migrasi & Seed:**
   ```bash
   npm run db:setup
   ```

3. **Mulai Development Server:**
   ```bash
   npm run dev
   ```

4. **Akses Aplikasi:**
   Kunjungi [http://localhost:3000](http://localhost:3000)

---
*Dibuat untuk kemaslahatan umat. Semoga menjadi amal jariyah.*
