# Diagram Alur — Website Masjid Al-Kahfi

Dokumen ini berisi seluruh diagram alur (flow) aplikasi Website Profil Masjid Al-Kahfi menggunakan **Mermaid**. Diagram dapat dirender langsung di GitHub/GitLab, VS Code (extension Mermaid), atau layanan seperti [mermaid.live](https://mermaid.live).

## Daftar Isi

1. [Arsitektur Sistem (High-Level)](#1-arsitektur-sistem-high-level)
2. [Lifecycle Request & Routing](#2-lifecycle-request--routing)
3. [Peta Situs (Sitemap Flow)](#3-peta-situs-sitemap-flow)
4. [Alur Autentikasi & Otorisasi](#4-alur-autentikasi--otorisasi)
5. [Alur Guard Route Terproteksi](#5-alur-guard-route-terproteksi)
6. [Alur CRUD Admin (Generic)](#6-alur-crud-admin-generic)
7. [Alur Pembuatan Berita (lengkap)](#7-alur-pembuatan-berita-lengkap)
8. [Alur Upload Gambar](#8-alur-upload-gambar)
9. [Alur Audit Trail (createdBy/updatedBy)](#9-alur-audit-trail-createdbyupdatedby)
10. [Alur Jadwal Sholat](#10-alur-jadwal-sholat)
11. [Alur Dashboard (Statistik & Aktivitas)](#11-alur-dashboard-statistik--aktivitas)
12. [ERD — Schema Database](#12-erd--schema-database)

---

## 1. Arsitektur Sistem (High-Level)

Gambaran komponen utama dan arah data.

```mermaid
flowchart LR
    User([Pengguna<br/>Admin / Publik])
    Browser[Browser Client<br/>React 19 + Tailwind]

    subgraph Next["Next.js 15 App Router (Server)"]
        Site["app/(site)/*<br/>Halaman Publik"]
        Admin["app/admin/(protected)/*<br/>Dashboard CMS"]
        API["app/api/*<br/>Route Handler REST"]
        Auth["lib/auth.ts<br/>Better Auth"]
    end

    ORM[("Drizzle ORM<br/>lib/db")]
    DB[("PostgreSQL<br/>alkahfi_db:5433")]
    FS[(public/uploads/<br/>file gambar)]
    ExtAPI["API Eksternal<br/>Aladhan (Jadwal Sholat)"]

    User --> Browser
    Browser -->|HTTP| Site
    Browser -->|HTTP| Admin
    Browser -->|fetch JSON| API
    Site --> API
    Admin --> API
    API --> ORM
    API --> FS
    Admin --> Auth
    Auth --> ORM
    ORM --> DB
    Site -.->|client hook| ExtAPI
```

---

## 2. Lifecycle Request & Routing

Bagaimana Next.js App Router mengarahkan request berdasarkan route group `(site)` vs `admin/(protected)`.

```mermaid
flowchart TD
    Req([Incoming Request]) --> Root{URL?}

    Root -->|"/"| Redirect["page.tsx<br/>redirect → /beranda"]
    Root -->|"/beranda, /berita, dll"| SiteGroup["app/(site)/layout.tsx<br/>Header + Footer + Theme"]
    Root -->|"/admin/login"| Login["app/admin/login/page.tsx<br/>(client)"]
    Root -->|"/admin/*"| Prot["app/admin/(protected)/layout.tsx"]
    Root -->|"/api/*"| ApiRoute["app/api/*/route.ts<br/>GET/POST/PUT/DELETE"]
    Root -->|"/uploads/*"| Static["public/uploads/<br/>static file"]

    Prot --> SessCheck{Sesi valid?}
    SessCheck -->|Tidak| RedirectLogin["redirect /admin/login"]
    SessCheck -->|Ya| AdminShell["Sidebar + Header Admin<br/>+ children page"]

    SiteGroup --> SitePage["Halaman publik dirender"]
    ApiRoute --> DbLayer["Drizzle ORM → PostgreSQL"]
```

---

## 3. Peta Situs (Sitemap Flow)

Navigasi antar halaman publik dan pintu masuk ke area admin.

```mermaid
flowchart TD
    Home(["/ → /beranda"])

    Home --> Nav["Navbar (layout-header)"]
    Nav --> Beranda["/beranda"]
    Nav --> Tentang["/tentang"]
    Nav --> Jadwal["/jadwal-sholat"]
    Nav --> Kegiatan["/kegiatan"]
    Nav --> Berita["/berita"]
    Nav --> Galeri["/galeri"]
    Nav --> Kontak["/kontak"]
    Nav --> Donasi["/donasi"]

    Berita --> Detail["/berita/:slug<br/>(detail berita)"]

    Nav -.->|link tersembunyi| AdminLogin["/admin/login"]
    AdminLogin -->|login sukses| AdminDash["/admin (Dashboard)"]

    AdminDash --> A_Berita["/admin/berita"]
    AdminDash --> A_Kegiatan["/admin/kegiatan"]
    AdminDash --> A_Galeri["/admin/galeri"]
    AdminDash --> A_Tentang["/admin/tentang"]
    AdminDash --> A_KontakDonasi["/admin/kontak-donasi"]
    AdminDash --> A_Pengaturan["/admin/pengaturan"]
    AdminDash --> A_Users["/admin/users"]
```

---

## 4. Alur Autentikasi & Otorisasi

Login admin memakai Better Auth (email + password, bcrypt).

```mermaid
sequenceDiagram
    autonumber
    participant U as Admin (Browser)
    participant L as /admin/login (Client)
    participant AC as authClient (Better Auth React)
    participant AH as /api/auth/[...all]
    participant A as lib/auth.ts
    participant DB as PostgreSQL

    U->>L: Isi email + password, klik Login
    L->>AC: signIn.email({ email, password })
    AC->>AH: POST /api/auth/sign-in/email
    AH->>A: better-auth handler
    A->>A: verify password (bcrypt.compare)
    A->>DB: SELECT user BY email
    A->>DB: INSERT session (token, expiresAt +7d)
    A-->>AH: set cookie sesi
    AH-->>AC: 200 OK + session
    AC-->>L: result (no error)
    L->>L: router.push("/admin")
    Note over L: useSession() juga redirect bila sudah login
```

---

## 5. Alur Guard Route Terproteksi

Verifikasi sesi **server-side** di `app/admin/(protected)/layout.tsx` sebelum halaman dirender.

```mermaid
flowchart TD
    Req([Request /admin/*]) --> Layout["ProtectedLayout<br/>(server component)"]
    Layout --> GetSess["auth.api.getSession(headers)"]
    GetSess --> Cek{Sesi ada & valid?}
    Cek -->|Tidak| Redir["redirect('/admin/login')"]
    Cek -->|Ya| Render["Render Sidebar + Header + page"]
    Render --> ShowUser["Tampilkan nama & role admin"]
```

---

## 6. Alur CRUD Admin (Generic)

Pola yang sama berlaku untuk berita, kegiatan, galeri, pengurus, fasilitas, users.

```mermaid
flowchart TD
    subgraph Client["Admin Page (Client Component)"]
        Form["Form / Tabel UI"]
        Fetch["fetch() ke /api/:entitas"]
    end

    subgraph Server["Route Handler"]
        Get["GET → select()"]
        Post["POST → insert()"]
        Put["PUT → update()"]
        Del["DELETE → delete()"]
        Actor["getActor()<br/>ambil user dari sesi"]
    end

    DB[("PostgreSQL")]

    Form -->|baca| Fetch
    Fetch --> Get
    Fetch --> Post
    Fetch --> Put
    Fetch --> Del

    Post --> Actor
    Put --> Actor
    Actor -->|createdById/updatedById| Post
    Actor -->|updatedById| Put

    Get --> DB
    Post --> DB
    Put --> DB
    Del --> DB

    Get -->|withActorNames| Names["Join nama pelaku"]
    Names -->|JSON| Fetch
    Fetch -->|re-render| Form
```

---

## 7. Alur Pembuatan Berita (lengkap)

Flow paling kompleks: rich text editor, upload gambar, auto-slug unik.

```mermaid
sequenceDiagram
    autonumber
    participant A as Admin
    participant FE as Form Berita (Client)
    participant UE as RichTextEditor (Tiptap)
    participant UP as /api/upload
    participant FS as public/uploads/
    participant API as /api/berita (POST)
    participant Slug as lib/slug.ts
    participant DB as PostgreSQL

    A->>FE: Isi judul, tag, author, deskripsi
    A->>UE: Ketik konten (format, gambar, link)
    FE->>FE: Kompres gambar (image-compress.ts)
    FE->>UP: POST FormData (file gambar)
    UP->>UP: Validasi tipe & ukuran (max 2MB)
    UP->>FS: writeFile buffer
    UP-->>FE: { url: "/uploads/...jpg" }
    FE->>FE: Sisipkan URL gambar ke konten
    A->>FE: Klik Simpan
    FE->>API: POST { title, tag, author, img, desc, date, content }

    API->>API: getActor() → createdById
    API->>Slug: slugify(title) → base
    API->>DB: SELECT slug WHERE like 'base%'
    API->>Slug: uniqueSlug(base, conflicts)
    Slug-->>API: slug unik (mis. "judul-2")
    API->>DB: INSERT berita (slug, content, ...)
    DB-->>API: row inserted
    API-->>FE: 201 { ...row, slug }
    FE->>FE: Refresh daftar berita
```

---

## 8. Alur Upload Gambar

```mermaid
flowchart TD
    Sel([Pilih file di ImageUpload]) --> Comp["Kompres sisi klien<br/>lib/image-compress.ts"]
    Comp --> Post["POST /api/upload<br/>FormData"]
    Post --> Size{Ukuran ≤ 2MB?}
    Size -->|Tidak| ErrSize["400: melebihi 2MB"]
    Size -->|Ya| Type{Tipe valid?<br/>JPEG/PNG/WEBP/GIF}
    Type -->|Tidak| ErrType["400: tipe tidak valid"]
    Type -->|Ya| Buf["arrayBuffer → Buffer"]
    Buf --> Name["Bersihkan nama + prefix timestamp"]
    Name --> MkDir["mkdir public/uploads bila perlu"]
    MkDir --> Write["writeFile ke disk"]
    Write --> Resp["200 { url: '/uploads/...' }"]
    Resp --> Use["Dipakai di field img/Content/Qris"]
```

---

## 9. Alur Audit Trail (createdBy/updatedBy)

Bagaimana setiap entitas konten melaporkan siapa pembuat/pengubah.

```mermaid
flowchart LR
    Sess["Sesi login"] --> Actor["getActor() (lib/audit.ts)<br/>→ { id, name }"]
    Actor -->|saat INSERT| Cb["createdById"]
    Actor -->|saat INSERT/UPDATE| Ub["updatedById"]
    Cb --> Row[("Row tabel konten")]
    Ub --> Row

    Row -->|saat GET| With["withActorNames()<br/>batch lookup user.name"]
    With --> Join["JOIN inArray(ids)"]
    Join --> Out["JSON + createdByName / updatedByName"]
    Out --> UI["Tabel admin menampilkan pelaku"]
```

---

## 10. Alur Jadwal Sholat

Jadwal harian berbasis koordinat masjid via API Aladhan (metode Kemenag RI), dengan cache & fallback.

```mermaid
flowchart TD
    Page(["/jadwal-sholat"]) --> Hook["use-prayer-times.ts"]
    Hook --> Cache{Ada cache lokal?}
    Cache -->|Ya| ShowCache["Tampilkan dari cache"]
    Cache -->|Tidak / kedaluwarsa| GPS{GPS/lokasi?}
    GPS -->|Tidak| Coords["Koordinat default masjid<br/>lat -6.9856, lng 107.6589"]
    GPS -->|Ya| Coords
    Coords --> Req["GET api.aladhan.com<br/>method=20 (Kemenag RI)"]
    Req --> Ok{Berhasil?}
    Ok -->|Ya| Parse["extractHHMM → PrayerTimes"]
    Parse --> Save["Simpan cache"]
    Save --> Show["Tampilkan jadwal"]
    Ok -->|Tidak / timeout| Fallback["FALLBACK_PRAYERS<br/>(statis)"]
    Fallback --> Show
```

---

## 11. Alur Dashboard (Statistik & Aktivitas)

Dashboard admin memuat ringkasan jumlah entitas dan aktivitas terbaru.

```mermaid
flowchart TD
    Dash(["/admin (Dashboard)"])
    Dash --> Lib["lib/dashboard.ts"]

    Lib --> Stats["getDashboardStats()<br/>count() paralel"]
    Stats --> S1[("COUNT kegiatan")]
    Stats --> S2[("COUNT berita")]
    Stats --> S3[("COUNT pengurus")]
    Stats --> S4[("COUNT galeri")]

    Lib --> Act["getRecentActivity(limit=8)"]
    Act --> Q1["SELECT ... ORDER BY updatedAt<br/>limit 8 per entitas"]
    Q1 --> Merge["Gabung + sort global<br/>by updatedAt"]
    Merge --> Resolve["withActorNames()<br/>nama pelaku"]
    Resolve --> Cards["Kartu aktivitas terbaru<br/>(entity, action, title, href)"]

    Stats --> UI["Stat cards"]
    Cards --> UI2["List aktivitas"]
```

---

## 12. ERD — Schema Database

Relasi seluruh tabel di `lib/db/schema.ts`.

```mermaid
erDiagram
    USER ||--o{ SESSION : has
    USER ||--o{ ACCOUNT : has
    USER ||--o{ BERITA : "createdBy/updatedBy"
    USER ||--o{ KEGIATAN : "createdBy/updatedBy"
    USER ||--o{ GALERI : "createdBy/updatedBy"
    USER ||--o{ PENGURUS : "createdBy/updatedBy"
    USER ||--o{ PROFIL_MASJID : "createdBy/updatedBy"
    USER ||--o{ FASILITAS : "createdBy/updatedBy"
    USER ||--o{ KONTAK : "createdBy/updatedBy"
    USER ||--o{ DONASI : "createdBy/updatedBy"
    USER ||--o{ PENGATURAN : "createdBy/updatedBy"

    USER {
        text id PK
        text email UK
        text password
        text name
        text image
        enum role "superadmin|admin"
        bool email_verified
        timestamp created_at
        timestamp updated_at
    }
    SESSION {
        text id PK
        text token UK
        timestamp expires_at
        text user_id FK
        text ip_address
        text user_agent
    }
    ACCOUNT {
        text id PK
        text account_id
        text provider_id
        text user_id FK
        text access_token
        text refresh_token
        text password
    }
    VERIFICATION {
        text id PK
        text identifier
        text value
        timestamp expires_at
    }

    BERITA {
        serial id PK
        text title
        text tag
        text author
        text date
        text img
        text desc
        text content
        text slug
        text created_by_id FK
        text updated_by_id FK
    }
    KEGIATAN {
        serial id PK
        text title
        text type "Harian|Jumat|HariBesar"
        text time
        text ust
        text status "Aktif|Nonaktif"
        boolean featured
        text created_by_id FK
    }
    GALERI {
        serial id PK
        text title
        text img
        text created_by_id FK
    }
    PENGURUS {
        serial id PK
        text nama
        text foto
        enum tingkat "pembina|penasehat|pimpinan|idarah|imarah|riayah"
        text sub_bidang
        text jabatan
        integer urutan
        text periode
    }
    PROFIL_MASJID {
        serial id PK
        text visi
        text misi
        text history
    }
    FASILITAS {
        serial id PK
        text title
        text desc
        text icon
    }
    KONTAK {
        serial id PK
        text alamat
        text hotline
        text email
        text jam_operasional
        text google_maps_url
    }
    DONASI {
        serial id PK
        text nama_rekening
        text nomor_rekening
        text atas_nama_rekening
        text qris_image
    }
    PENGATURAN {
        text key PK
        text value
    }
```

---

## Catatan

- Semua diagram dibuat mengacu pada kode aktual di repository (`lib/auth.ts`, `lib/audit.ts`, `lib/dashboard.ts`, `lib/prayer-times.ts`, `lib/db/schema.ts`, dan `app/api/*/route.ts`).
- Untuk merender: GitHub merender blok ```` ```mermaid ```` secara otomatis; atau salin ke [mermaid.live](https://mermaid.live).
- Bila ada perubahan arsitektur, perbarui diagram ini bersamaan dengan perubahan kode agar tetap akurat.
