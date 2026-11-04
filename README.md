# Website Profil Masjid Al-Kahfi

Aplikasi ini adalah **Website Profil Resmi Masjid Al-Kahfi Cikoneng**, Kabupaten Bandung. Website ini dibangun untuk menyediakan informasi terpusat mengenai masjid kepada masyarakat luas, meliputi profil kepengurusan DKM, visi-misi, sejarah, fasilitas, jadwal sholat, dokumentasi kegiatan (kajian, TPA, dll), berita terbaru, galeri foto, hingga informasi donasi/ziswaf.

Aplikasi ini terdiri dari dua sisi:

- **Sisi publik** — halaman yang dapat diakses masyarakat umum (Beranda, Tentang, Jadwal Sholat, Kegiatan, Berita, Galeri, Kontak, Donasi).
- **Sisi admin (CMS)** — dashboard terproteksi untuk mengelola seluruh konten situs (berita, kegiatan, galeri, pengurus, fasilitas, profil masjid, kontak, donasi, pengaturan situs, hingga manajemen pengguna).

Antarmuka dirancang modern, responsif, dan interaktif untuk memberikan pengalaman pengguna yang nyaman baik di desktop maupun mobile.

---

## Daftar Isi

- [Teknologi Stack](#teknologi-stack)
- [Library yang Digunakan](#library-yang-digunakan)
- [Arsitektur & Struktur Folder](#arsitektur--struktur-folder)
- [Konvensi Penamaan File](#konvensi-penamaan-file)
- [Fitur](#fitur)
- [Schema Database](#schema-database)
- [Setup Project](#setup-project)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Testing](#testing)
- [Diagram Alur](#diagram-alur)

---

## Teknologi Stack

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router, output `standalone`)
- **Library UI:** [React 19](https://react.dev/)
- **Bahasa Pemrograman:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + `@tailwindcss/typography` + `tw-animate-css`
- **Database:** [PostgreSQL 15](https://www.postgresql.org/) (dijalankan via Docker, port host `5433`)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) + [Drizzle Kit](https://orm.drizzle.team/docs/kit-overview) untuk migrasi (`drizzle-kit push`)
- **Autentikasi:** [Better Auth](https://www.better-auth.com/) (email & password, hashing bcrypt) dengan adapter Drizzle
- **Editor Konten:** [Tiptap](https://tiptap.dev/) (rich text editor untuk konten berita)
- **Animasi:** [Motion](https://motion.dev/) (Framer Motion)
- **Ikon:** [Lucide React](https://lucide.dev/)
- **Runtime/Kontainerisasi:** [Docker](https://www.docker.com/) + `docker-compose`

---

## Library yang Digunakan

### Dependencies

| Library | Kegunaan |
|---|---|
| `next`, `react`, `react-dom` | Framework & UI utama |
| `drizzle-orm`, `postgres` | Akses database PostgreSQL |
| `drizzle-kit` | Migrasi skema (`db:push`) |
| `better-auth` | Autentikasi (sesi, email/password, role) |
| `bcryptjs` | Hashing & verifikasi password |
| `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-*` | Rich text editor (gambar, link, text-align, resize) |
| `@hookform/resolvers`, (`react-hook-form`) | Validasi & manajemen form |
| `motion` | Animasi UI |
| `lucide-react` | Ikon |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Utilitas styling/className |
| `uuid` | Generator ID unik |
| `dotenv` | Memuat variabel lingkungan |
| `@google/genai` | Integrasi Google Gemini (AI) |

### Dev Dependencies

| Library | Kegunaan |
|---|---|
| `tailwindcss`, `@tailwindcss/postcss`, `autoprefixer`, `postcss` | Tooling CSS |
| `eslint`, `eslint-config-next` | Linting |
| `typescript` | Type checking |
| `tsx` | Menjalankan skrip TypeScript (seed & test runner) |
| `firebase-tools` | Deployment ke Firebase Hosting |

---

## Arsitektur & Struktur Folder

Aplikasi memakai **App Router** Next.js dengan pendekatan **multi-route group**:

- Halaman publik ditempatkan di route group `(site)` yang dibungkus layout bersama (header, footer, tema).
- Halaman admin berada di luar kelompok `(site)` dan menggunakan layout terproteksi sendiri (sidebar + header admin, tanpa navbar situs).
- Seluruh data mengalir melalui **Route Handler** di `app/api/*` yang berkomunikasi dengan **Drizzle ORM** ke PostgreSQL. Komponen klien memanggil endpoint ini via `fetch`.

```
website_masjid_alkahfi/
├── app/                         # App Router Next.js
│   ├── (site)/                  # Route group halaman publik (tanpa layout admin)
│   │   ├── beranda/             # /beranda — halaman utama
│   │   ├── tentang/             # /tentang — profil, visi-misi, sejarah, pengurus
│   │   ├── jadwal-sholat/       # /jadwal-sholat — jadwal sholat (Aladhan/Kemenag)
│   │   ├── kegiatan/            # /kegiatan — agenda kajian & kegiatan
│   │   ├── berita/              # /berita + /berita/[slug] — daftar & detail berita
│   │   ├── galeri/              # /galeri — galeri foto (lightbox)
│   │   ├── kontak/              # /kontak — info kontak & peta
│   │   ├── donasi/              # /donasi — info rekening & QRIS
│   │   └── layout.tsx           # Layout publik (header, footer, theme)
│   ├── admin/                   # Area CMS
│   │   ├── login/               # /admin/login — halaman login
│   │   ├── components/          # Komponen admin (Sidebar, ImageUpload)
│   │   └── (protected)/         # Route group terproteksi (butuh sesi)
│   │       ├── berita/          # Kelola berita
│   │       ├── kegiatan/        # Kelola kegiatan
│   │       ├── galeri/          # Kelola galeri
│   │       ├── tentang/         # Kelola profil & pengurus
│   │       ├── kontak-donasi/   # Kelola kontak & donasi
│   │       ├── pengaturan/      # Kelola pengaturan situs
│   │       ├── users/           # Manajemen pengguna + _components/
│   │       ├── layout.tsx       # Verifikasi sesi server-side + shell admin
│   │       └── page.tsx         # Dashboard (statistik & aktivitas terbaru)
│   ├── api/                     # Route Handler REST
│   │   ├── auth/[...all]/       # Handler Better Auth
│   │   ├── berita/, kegiatan/, galeri/, pengurus/, fasilitas/
│   │   ├── profil/, kontak/, donasi/, pengaturan/
│   │   ├── users/, upload/
│   │   └── .../[id]/            # Endpoint item (GET/PUT/DELETE per entitas)
│   ├── globals.css              # Styling global & CSS variables tema
│   ├── layout.tsx               # Root layout (HTML skeleton, font, metadata)
│   └── page.tsx                 # Root redirect → /beranda
├── components/                  # Komponen UI reusable lintas halaman
│   ├── app-shell.tsx
│   ├── layout-header.tsx        # Navbar publik
│   ├── layout-footer.tsx        # Footer publik
│   ├── layout-theme.tsx         # Provider/pengaturan tema
│   └── rich-text-editor.tsx     # Wrapper Tiptap untuk konten berita
├── hooks/                       # React custom hooks
│   ├── use-mobile.ts            # Deteksi viewport mobile
│   └── use-prayer-times.ts      # Fetch & cache jadwal sholat
├── lib/                         # Logika aplikasi (non-UI)
│   ├── db/
│   │   ├── schema.ts            # Definisi seluruh tabel Drizzle
│   │   ├── index.ts             # Koneksi DB (postgres-js + Drizzle)
│   │   └── seed.ts              # Skrip seeding data awal
│   ├── cms/settings.ts          # Default pengaturan (mis. running text)
│   ├── auth.ts                  # Konfigurasi Better Auth
│   ├── auth-client.tsx          # Client Better Auth
│   ├── audit.ts                 # Resolver pelaku (createdBy/updatedBy)
│   ├── dashboard.ts             # Query statistik & aktivitas dashboard
│   ├── prayer-times.ts          # Helper jadwal sholat (Aladhan API)
│   ├── quran-surahs.ts          # Daftar surah Al-Qur'an
│   ├── image-compress.ts        # Kompresi gambar sisi klien
│   ├── slug.ts                  # Generator slug unik
│   ├── relative-time.ts         # Format waktu relatif
│   └── utils.ts                 # Utilitas umum (cn, dll)
├── drizzle/                     # Output migrasi Drizzle Kit
├── public/                      # Aset statis & folder uploads/
├── assets/                      # Aset mentah (gambar, dll)
├── test/                        # Unit test (tsx --test)
│   └── lib/                     # prayer-times, cms/settings
├── docs/                        # Dokumentasi tambahan
├── docker-compose.yml           # PostgreSQL + app (dev)
├── Dockerfile                   # Build produksi (multi-stage, standalone)
├── Dockerfile.dev               # Image development
├── drizzle.config.ts            # Konfigurasi Drizzle Kit
├── next.config.ts               # Konfigurasi Next.js
├── .env.example                 # Contoh variabel lingkungan
└── package.json
```

---

## Konvensi Penamaan File

- **Halaman/route:** menggunakan `page.tsx` (App Router). Root halaman publik berada di `(site)/<nama>/page.tsx`.
- **Layout:** `layout.tsx` per segmen. Route group dengan tanda kurung `(site)`, `(protected)` **tidak memengaruhi URL**, hanya pengelompokan layout.
- **Route Handler API:** `app/api/<entitas>/route.ts` (koleksi) dan `app/api/<entitas>/[id]/route.ts` (item). Setiap `route.ts` mengekspor fungsi HTTP: `GET`, `POST`, `PUT`, `DELETE`.
- **Slug dinamis:** berita memakai `[slug]` untuk URL ramah SEO (`/berita/[slug]`).
- **Komponen:** `kebab-case` dengan prefiks domain bila perlu (`layout-*`, `app-shell`).
- **Komponen privat admin:** diletakkan dalam folder `_components/` (contoh `users/_components/`); prefix `_` mengecualikan folder dari routing.
- **Utilitas/library:** `lib/` memakai `kebab-case` (mis. `prayer-times.ts`, `image-compress.ts`).
- **Skema & seeding:** terpusat di `lib/db/schema.ts` dan `lib/db/seed.ts`.
- **Hooks:** prefiks `use-` (mis. `use-prayer-times.ts`).

---

## Fitur

### Sisi Publik

- **Beranda** — ringkasan konten utama, running text pengumuman, highlight kegiatan & berita.
- **Tentang** — profil masjid, visi & misi, sejarah, struktur kepengurusan DKM (berjenjang: Pembina → Penasehat → Pimpinan → Idarah/Imarah/Riayah).
- **Jadwal Sholat** — jadwal harian berbasis koordinat masjid (API Aladhan, metode Kemenag RI) dengan fallback statis bila offline.
- **Kegiatan** — agenda kajian/kegiatan berkategorisasi (Harian, Jum'at, Hari Besar) beserta ustadz, waktu, dan status.
- **Berita** — daftar berita terurut terbaru + halaman detail via slug.
- **Galeri** — grid foto dengan lightbox.
- **Kontak** — alamat, hotline, email, jam operasional, dan peta Google Maps.
- **Donasi** — informasi rekening bank dan QRIS.

### Sisi Admin (CMS) — `/admin`

- **Login** autentikasi email & password (Better Auth, sesi 7 hari).
- **Dashboard** — statistik (jumlah kegiatan, berita, pengurus, galeri) dan aktivitas terbaru lintas entitas.
- **CRUD Berita** dengan editor rich text (Tiptap), gambar, tag, dan auto-slug unik.
- **CRUD Kegiatan, Galeri, Pengurus, Fasilitas.**
- **Manajemen profil masjid, kontak, donasi.**
- **Pengaturan situs** (key-value, mis. running text pengumuman).
- **Manajemen pengguna** dengan role `superadmin` / `admin`.
- **Upload gambar** ke `public/uploads/` (validasi tipe & ukuran maks. 2 MB, kompresi sisi klien).
- **Audit trail** — setiap entitas mencatat `createdById` / `updatedById` dan menampilkan nama pelaku.

### Keamanan

- Seluruh area `(protected)` diverifikasi sesi **server-side** (`auth.api.getSession`) sebelum dirender; tanpa sesi → redirect ke `/admin/login`.
- Hashing password memakai **bcrypt** (10 rounds).
- Role pengguna tidak dapat diatur sendiri oleh pengguna (`input: false`).

---

## Schema Database

Skema didefinisikan di `lib/db/schema.ts` dengan Drizzle ORM (PostgreSQL). Terdapat dua kelompok tabel:

### Tabel Autentikasi (Better Auth)

| Tabel | Keterangan |
|---|---|
| `user` | `id`, `email` (unique), `password`, `name`, `image`, `role` (`superadmin`/`admin`, default `admin`), `emailVerified`, `createdAt`, `updatedAt` |
| `session` | `id`, `expiresAt`, `token` (unique), `userId` → `user.id` (cascade), `ipAddress`, `userAgent`, timestamp |
| `account` | `id`, `accountId`, `providerId`, `userId` → `user.id`, token-token OAuth, `password`, timestamp |
| `verification` | `id`, `identifier`, `value`, `expiresAt`, timestamp |

### Tabel Konten (CMS)

| Tabel | Kolom Utama | Catatan |
|---|---|---|
| `berita` | `id`, `title`, `tag`, `author`, `date`, `img`, `desc`, `content`, `slug` | `slug` unik untuk URL; `createdById`/`updatedById` audit |
| `kegiatan` | `id`, `title`, `type` (Harian/Jum'at/Hari Besar), `time`, `ust`, `status` (Aktif/Nonaktif), `desc`, `note`, `icon`, `color`, `img`, `featured` | |
| `galeri` | `id`, `title`, `img` | |
| `pengurus` | `id`, `nama`, `foto`, `tingkat` (enum: `pembina`, `penasehat`, `pimpinan`, `idarah`, `imarah`, `riayah`), `subBidang`, `jabatan`, `urutan`, `periode` | Nullable `jabatan`/`subBidang` untuk anggota |
| `profil_masjid` | `id`, `visi`, `misi` (newline-separated), `history` | Tunggal |
| `fasilitas` | `id`, `title`, `desc`, `icon` (nama ikon Lucide) | |
| `kontak` | `id`, `alamat`, `hotline`, `email`, `jamOperasional`, `googleMapsUrl` | Tunggal |
| `donasi` | `id`, `namaRekening`, `nomorRekening`, `atasNamaRekening`, `qrisImage` | Tunggal |
| `pengaturan` | `key` (PK), `value` | Key-value settings lintas situs |

**Konvensi:** tabel konten mencatat `createdById`, `updatedById` (FK → `user.id`, `onDelete: SET NULL`) dan `updatedAt`/`createdAt`. Dua enum didefinisikan: `user_role` dan `pengurus_tingkat`.

---

## Setup Project

### Prasyarat

- **Node.js 20+**
- **npm**
- **Docker** & **Docker Compose** (untuk PostgreSQL)

### Langkah-langkah

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd website_masjid_alkahfi
   ```

2. **Salin konfigurasi environment**
   ```bash
   cp .env.example .env.local
   ```
   Lalu sesuaikan `.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/alkahfi_db"
   GEMINI_API_KEY="..."     # opsional, untuk fitur Gemini
   APP_URL="http://localhost:3000"
   ```

3. **Install dependency**
   ```bash
   npm install
   ```

4. **Jalankan database PostgreSQL** (via Docker Compose)
   ```bash
   docker-compose up -d db
   ```
   Container memetakan port host **5433 → 5432** (sesuai catatan di `CLAUDE.md`).

5. **Migrasi skema & seeding data awal**
   ```bash
   npm run db:setup        # = drizzle-kit push && tsx lib/db/seed.ts
   ```
   Atau per langkah:
   ```bash
   npm run db:push         # terapkan skema ke DB
   npm run db:seed         # isi data awal (pengurus, berita contoh, user admin, dll)
   ```

---

## Menjalankan Aplikasi

### Development (local)

```bash
npm run dev
```
Buka `http://localhost:3000` (root otomatis redirect ke `/beranda`). Panel admin di `http://localhost:3000/admin`.

### Development (Docker — app + db)

```bash
docker-compose up -d --build
```
Menjalankan PostgreSQL (`alkahfi_db`) dan aplikasi Next.js (`alkahfi_app`) di port `3000`. Volume kode dipasang (hot-reload).

### Produksi (Docker standalone)

```bash
docker build -t masjid-alkahfi .
docker run -p 3000:3000 -e DATABASE_URL=... masjid-alkahfi
```
`Dockerfile` memakai multi-stage build dan output `standalone` Next.js.

### Script npm lainnya

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Server development |
| `npm run build` | Build produksi |
| `npm start` | Jalankan hasil build |
| `npm run lint` | Jalankan ESLint |
| `npm run db:push` | Migrasi skema (Drizzle Kit) |
| `npm run db:seed` | Seeding data awal |
| `npm run db:setup` | Push skema + seeding |
| `npm test` | Menjalankan unit test |
| `npm run clean` | Hapus cache build Next.js |

---

## Testing

Pengujian menggunakan runner bawaan **Node.js** via `tsx`:

```bash
npm test          # = tsx --test
```

File test berada di folder `test/` dan mengikuti pola `*.test.ts`:

```
test/
└── lib/
    ├── prayer-times.test.ts   # logika parsing & format jadwal sholat
    └── cms/settings.test.ts   # default pengaturan situs
```

Pendekatan: modul yang dites (mis. `lib/prayer-times.ts`) sengaja dibuat **pure function** tanpa dependensi React/browser/DB agar mudah diuji secara terisolasi. Linting tambahan bisa dijalankan dengan `npm run lint`.

---

## Diagram Alur

Seluruh diagram alur aplikasi (arsitektur sistem, routing, autentikasi, CRUD admin, upload gambar, audit trail, jadwal sholat, dashboard, dan ERD database) tersedia dalam format **Mermaid** di dokumen terpisah:

👉 **[docs/diagrams.md](docs/diagrams.md)**

Diagram ter-render otomatis di GitHub/GitLab/VS Code, atau dapat di-paste ke [mermaid.live](https://mermaid.live) untuk melihat visualnya.

---

© Masjid Al-Kahfi Cikoneng — Kabupaten Bandung.
