# Website Profil Masjid Al-Kahfi

Aplikasi ini adalah **Website Profil Resmi Masjid Al-Kahfi Cikoneng**, Kabupaten Bandung. Website ini dibangun untuk menyediakan informasi terpusat mengenai masjid kepada masyarakat luas, meliputi profil kepengurusan, jadwal sholat, dokumentasi kegiatan (kajian, TPA, dll), berita terbaru, galeri foto, hingga informasi donasi/ziswaf.

Aplikasi ini dirancang dengan antarmuka yang modern, responsif, dan interaktif untuk memberikan pengalaman pengguna yang nyaman.

## Arsitektur dan Struktur Folder

Aplikasi ini menggunakan framework **Next.js** dengan paradigma **App Router**. Berikut adalah struktur folder utama dari proyek ini:

```
website_masjid_alkahfi/
├── app/                  # Folder utama App Router Next.js
│   ├── admin/            # Halaman dan komponen untuk dashboard admin (jika ada)
│   ├── globals.css       # Styling global termasuk variabel tema (CSS variables)
│   ├── layout.tsx        # Layout utama aplikasi (HTML skeleton, fonts, meta tags)
│   └── page.tsx          # Halaman utama aplikasi (Single Page Application view)
├── assets/               # Direktori untuk menyimpan aset statis lokal
├── hooks/                # Tempat menyimpan custom React hooks 
├── lib/                  # Fungsi-fungsi utility dan helper
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
- **`@hookform/resolvers`:** Digunakan jika ada implementasi form validasi kompleks (misalnya untuk halaman kontak atau donasi).

## Cara Setup Project

Ikuti langkah-langkah berikut untuk mengatur proyek di komputer lokal Anda:

1. **Pastikan Prasyarat Terpenuhi:**
   - Node.js (versi 20 atau lebih baru disarankan)
   - Git

2. **Kloning Repositori (Jika belum ada):**
   ```bash
   git clone <url-repo-anda>
   cd website_masjid_alkahfi
   ```

3. **Install Dependensi:**
   Buka terminal di dalam folder proyek, lalu jalankan:
   ```bash
   npm install
   ```

4. **Konfigurasi Environment Variables:**
   - Salin file `.env.example` dan ubah namanya menjadi `.env.local`
   - Isi variabel yang dibutuhkan, misalnya `GEMINI_API_KEY` (jika menggunakan fitur AI).
   ```bash
   cp .env.example .env.local
   ```

## Cara Run Aplikasi

Setelah setup selesai, Anda dapat menjalankan aplikasi di environment lokal (development):

1. **Mulai Development Server:**
   ```bash
   npm run dev
   ```

2. **Akses Aplikasi:**
   Buka browser web Anda dan kunjungi:
   [http://localhost:3000](http://localhost:3000)

---
*Dibuat untuk kemaslahatan umat. Semoga menjadi amal jariyah.*
