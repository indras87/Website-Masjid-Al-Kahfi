# Pengurus DKM Hierarki Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tampilkan 70+ pengurus DKM sesuai struktur hierarki 3-level (Tingkat → Bidang → Sub-bidang → Anggota) dengan layout tab per bidang dan foto untuk semua orang.

**Architecture:** Satu tabel `pengurus` dengan kolom hierarki (`tingkat` enum, `subBidang`, `jabatan`, `urutan`). Client-side grouping di halaman publik. Admin CRUD pakai form tunggal. Seed seluruh struktur asli DKM Al-Kahfi.

**Tech Stack:** Next.js 15 (App Router), Drizzle ORM, PostgreSQL, Tailwind CSS v4, next/image.

## Global Constraints

- Database PostgreSQL via Docker (port 5432 host, atau 5433 per docker-compose — cek `.env.local`).
- Skrip DB: `npm run db:push` (migrate), `npm run db:seed` (seed), `npm run db:setup` (push + seed).
- Tidak ada framework test di project ini — verifikasi via `curl` API, `npm run build`, dan cek browser manual (ikuti pola plan auth sebelumnya).
- Commit tiap akhir task. Pesan commit pakai conventional commits (`feat:`/`fix:`/`refactor:`).
- Field DB snake_case (`sub_bidang`, `created_at`), schema Drizzle camelCase (`subBidang`) dengan mapping.
- Foto: gunakan placeholder `https://placehold.co/...` di seed; admin ganti via form nanti.
- Bahasa UI: Indonesia. Istilah agama/organisasi jangan diterjemahkan.

**Spec referensi:** `docs/superpowers/specs/2026-07-11-pengurus-hierarki-design.md`

---

## File Structure

- **Modify** `lib/db/schema.ts` — ganti tabel `pengurus` + tambah enum `pengurusTingkatEnum`
- **Modify** `lib/db/seed.ts` — seed ~70 entri struktur asli, ganti `DEFAULT_PENGURUS`
- **Modify** `app/api/pengurus/route.ts` — GET ordering, POST field baru
- **Modify** `app/api/pengurus/[id]/route.ts` — PUT/DELETE field baru
- **Modify** `app/(site)/tentang/page.tsx` — layout tab, grouping helper, update `FALLBACK_PENGURUS`
- **Modify** `app/admin/(protected)/tentang/page.tsx` — form + list field baru

---

## Task 1: Update Schema

**Files:**
- Modify: `lib/db/schema.ts` (sekitar baris 121-128, blok `export const pengurus = pgTable(...)`)

**Interfaces:**
- Consumes: `pgTable, serial, text, timestamp, integer` (sudah diimpor), perlu tambah `pgEnum` (sudah diimpor di file)
- Produces: tabel `pengurus` baru + `pengurusTingkatEnum`. Field: `id, nama, foto, tingkat, subBidang, jabatan, urutan, periode, createdAt`. Task berikutnya andalkan nama field & enum ini.

- [ ] **Step 1: Ganti blok `pengurus` di schema**

Buka `lib/db/schema.ts`, temukan blok (sekitar baris 121):

```typescript
export const pengurus = pgTable("pengurus", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(), // e.g. "Ketua Umum DKM"
  period: text("period").notNull(), // e.g. "Periode 2024-2028"
  img: text("img").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Ganti seluruh blok dengan:

```typescript
// Enum tingkat hierarki pengurus DKM
export const pengurusTingkatEnum = pgEnum("pengurus_tingkat", [
  "pembina",
  "penasehat",
  "pimpinan",
  "idarah",
  "imarah",
  "riayah",
]);

export const pengurus = pgTable("pengurus", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  foto: text("foto").notNull(),
  tingkat: pengurusTingkatEnum("tingkat").notNull(),
  subBidang: text("sub_bidang"), // nullable: null = anggota langsung tingkat/bidang
  jabatan: text("jabatan"), // nullable: "Ketua","Sekretaris","Koordinator Bidang", null = anggota
  urutan: integer("urutan").default(0).notNull(),
  periode: text("periode").default("2024-2028").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Pastikan `integer` sudah diimpor dari `drizzle-orm/pg-core` di baris import atas file. Jika belum, tambahkan `integer` ke import yang sudah ada (baris 1):

```typescript
import { pgTable, serial, text, timestamp, boolean, index, integer } from "drizzle-orm/pg-core";
```

- [ ] **Step 2: Push schema ke DB**

Run: `npm run db:push`

Drizzle akan mendeteksi banyak perubahan kolom (rename + tambah). Saat prompt interaktif, pilih opsi yang **mengganti** tabel/kolom (drop old columns, bukan rename preserve) — data lama adalah dummy dan akan di-reseed di Task 4.

Expected: tabel `pengurus` ter-update dengan kolom baru, enum `pengurus_tingkat` terbuat.

Jika `db:push` bingung/gagal karena perubahan besar, drop manual lalu push ulang:

```bash
# Jalankan via psql ke DB (sesuaikan DSN dari .env.local)
psql "$DATABASE_URL" -c 'DROP TABLE IF EXISTS pengurus CASCADE; DROP TYPE IF EXISTS pengurus_tingkat CASCADE;'
npm run db:push
```

- [ ] **Step 3: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat: update pengurus schema with hierarchy fields"
```

---

## Task 2: Update API `route.ts` (GET/POST)

**Files:**
- Modify: `app/api/pengurus/route.ts` (full rewrite, file pendek ~50 baris)

**Interfaces:**
- Consumes: `pengurus` tabel baru dari Task 1
- Produces: `GET /api/pengurus` (array, urut `tingkat` lalu `urutan`), `POST /api/pengurus` (terima `nama, foto, tingkat, jabatan?, subBidang?, urutan?`)

- [ ] **Step 1: Rewrite `app/api/pengurus/route.ts`**

Ganti seluruh isi file dengan:

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pengurus } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const VALID_TINGKAT = ['pembina', 'penasehat', 'pimpinan', 'idarah', 'imarah', 'riayah'] as const;

export async function GET() {
  try {
    const data = await db.select().from(pengurus).orderBy(asc(pengurus.tingkat), asc(pengurus.urutan));
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching pengurus:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, foto, tingkat, jabatan, subBidang, urutan } = body;

    if (!nama || !foto || !tingkat) {
      return NextResponse.json({ error: 'Nama, foto, dan tingkat wajib diisi' }, { status: 400 });
    }

    if (!VALID_TINGKAT.includes(tingkat)) {
      return NextResponse.json({ error: 'Tingkat tidak valid' }, { status: 400 });
    }

    const result = await db.insert(pengurus).values({
      nama,
      foto,
      tingkat,
      jabatan: jabatan || null,
      subBidang: subBidang || null,
      urutan: typeof urutan === 'number' ? urutan : 0,
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating pengurus:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verifikasi GET kosong (DB belum di-seed)**

Jalankan dev server jika belum: `npm run dev`

Run: `curl -s http://localhost:3000/api/pengurus`
Expected: `[]` (array kosong, karena DB belum di-seed ulang).

- [ ] **Step 3: Commit**

```bash
git add app/api/pengurus/route.ts
git commit -m "feat: update pengurus GET/POST API for hierarchy fields"
```

---

## Task 3: Update API `[id]/route.ts` (PUT/DELETE)

**Files:**
- Modify: `app/api/pengurus/[id]/route.ts` (full rewrite)

**Interfaces:**
- Consumes: `pengurus` tabel baru
- Produces: `PUT /api/pengurus/[id]` (update field baru), `DELETE /api/pengurus/[id]` (hapus)

- [ ] **Step 1: Rewrite `app/api/pengurus/[id]/route.ts`**

Ganti seluruh isi file dengan:

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pengurus } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const VALID_TINGKAT = ['pembina', 'penasehat', 'pimpinan', 'idarah', 'imarah', 'riayah'] as const;

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nama, foto, tingkat, jabatan, subBidang, urutan } = body;

    if (!nama || !foto || !tingkat) {
      return NextResponse.json({ error: 'Nama, foto, dan tingkat wajib diisi' }, { status: 400 });
    }

    if (!VALID_TINGKAT.includes(tingkat)) {
      return NextResponse.json({ error: 'Tingkat tidak valid' }, { status: 400 });
    }

    const result = await db.update(pengurus)
      .set({
        nama,
        foto,
        tingkat,
        jabatan: jabatan || null,
        subBidang: subBidang || null,
        urutan: typeof urutan === 'number' ? urutan : 0,
      })
      .where(eq(pengurus.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Data pengurus tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating pengurus:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await db.delete(pengurus)
      .where(eq(pengurus.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Data pengurus tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Data pengurus berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting pengurus:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/pengurus/[id]/route.ts
git commit -m "feat: update pengurus PUT/DELETE API for hierarchy fields"
```

---

## Task 4: Seed Data Lengkap

**Files:**
- Modify: `lib/db/seed.ts` — ganti `DEFAULT_PENGURUS` dengan struktur baru + helper avatar

**Interfaces:**
- Consumes: `pengurus` tabel baru dari Task 1
- Produces: ~70 baris pengurus terstruktur di DB

- [ ] **Step 1: Ganti blok `DEFAULT_PENGURUS` di `lib/db/seed.ts`**

Temukan blok `const DEFAULT_PENGURUS = [ ... ]` (sekitar baris 16-41, berisi 4 objek dengan field `name/role/period/img`). Ganti seluruh blok dengan:

```typescript
// Helper: generate placeholder avatar URL dari inisial nama
const avatar = (nama: string): string => {
  const initials = nama
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return `https://placehold.co/200x200/064e3b/fbbf24?text=${encodeURIComponent(initials)}`;
};

// Struktur pengurus DKM Al-Kahfi periode 2024-2028
// Field: nama, tingkat, jabatan?, subBidang?, urutan
const DEFAULT_PENGURUS: Array<{
  nama: string;
  tingkat: "pembina" | "penasehat" | "pimpinan" | "idarah" | "imarah" | "riayah";
  jabatan?: string;
  subBidang?: string;
  urutan: number;
}> = [
  // I. PEMBINA
  { nama: "Brio Pradiko Pero", tingkat: "pembina", urutan: 1 },
  { nama: "Kurnia Aji", tingkat: "pembina", urutan: 2 },
  // II. PENASEHAT
  { nama: "Cecep Hidayat", tingkat: "penasehat", urutan: 1 },
  { nama: "Tresna Acip", tingkat: "penasehat", urutan: 2 },
  { nama: "Ujang Saepudin", tingkat: "penasehat", urutan: 3 },
  // III. PIMPINAN INTI
  { nama: "Budi Ramdani", tingkat: "pimpinan", jabatan: "Ketua", urutan: 1 },
  { nama: "Idham Faisal", tingkat: "pimpinan", jabatan: "Wakil Ketua", urutan: 2 },
  // IV. BIDANG IDARAH
  { nama: "Theo Ras Komara", tingkat: "idarah", jabatan: "Sekretaris", urutan: 1 },
  { nama: "Ruhiyat", tingkat: "idarah", jabatan: "Bendahara", urutan: 2 },
  { nama: "Khairul T S", tingkat: "idarah", jabatan: "Humas Eksternal", urutan: 3 },
  { nama: "Fauzy Al Adam", tingkat: "idarah", jabatan: "Humas Internal", urutan: 4 },
  { nama: "Ian Agung Prakoso", tingkat: "idarah", jabatan: "Humas Internal", urutan: 5 },
  { nama: "Angga Dwi Kusumah", tingkat: "idarah", jabatan: "AMC (Al-Kahfi Media Center)", urutan: 6 },
  { nama: "Rifan Sopian", tingkat: "idarah", jabatan: "AMC (Al-Kahfi Media Center)", urutan: 7 },
  { nama: "Indra Gunawan W", tingkat: "idarah", jabatan: "SIMA (Sistem Informasi Masjid Al-Kahfi)", urutan: 8 },
  { nama: "Agung Yuliaji", tingkat: "idarah", jabatan: "SIMA (Sistem Informasi Masjid Al-Kahfi)", urutan: 9 },
  // V. BIDANG IMARAH
  { nama: "Irfanudin Ma'sum", tingkat: "imarah", jabatan: "Koordinator Bidang", urutan: 1 },
  { nama: "Dawam", tingkat: "imarah", subBidang: "Syiar Islam", urutan: 2 },
  { nama: "Irfanudin Ma'sum", tingkat: "imarah", subBidang: "Syiar Islam", urutan: 3 },
  { nama: "Abdul Malik Khusaeri", tingkat: "imarah", subBidang: "Syiar Islam", urutan: 4 },
  { nama: "Fauzy Al Adam", tingkat: "imarah", subBidang: "PHBI", urutan: 5 },
  { nama: "Abdul Malik Khusaeri", tingkat: "imarah", subBidang: "PHBI", urutan: 6 },
  { nama: "Jagad Sidhayoda", tingkat: "imarah", subBidang: "PHBI", urutan: 7 },
  { nama: "Sahdam Amir", tingkat: "imarah", subBidang: "PHBI", urutan: 8 },
  { nama: "Caca Sukma", tingkat: "imarah", subBidang: "Pendidikan & TPQ", urutan: 9 },
  { nama: "Raditiana Fatmasari", tingkat: "imarah", subBidang: "Pendidikan & TPQ", urutan: 10 },
  { nama: "Irfanudin Ma'sum", tingkat: "imarah", subBidang: "Pendidikan & TPQ", urutan: 11 },
  { nama: "Sri Nuryani Erwinsyah", tingkat: "imarah", subBidang: "Pendidikan & TPQ", urutan: 12 },
  { nama: "Yunnie Cindo Raina Shari", tingkat: "imarah", subBidang: "Pendidikan & TPQ", urutan: 13 },
  { nama: "Abdul Aziz", tingkat: "imarah", subBidang: "ZISWAF", urutan: 14 },
  { nama: "Denny Jatnika", tingkat: "imarah", subBidang: "ZISWAF", urutan: 15 },
  { nama: "Syahroni Noorman P", tingkat: "imarah", subBidang: "ZISWAF", urutan: 16 },
  { nama: "Agus Sobirin", tingkat: "imarah", subBidang: "Cinta Qurban", urutan: 17 },
  { nama: "Moch Rosin", tingkat: "imarah", subBidang: "Cinta Qurban", urutan: 18 },
  { nama: "Sigit Jaelani", tingkat: "imarah", subBidang: "Cinta Qurban", urutan: 19 },
  { nama: "Alief Muhammad", tingkat: "imarah", subBidang: "Cinta Qurban", urutan: 20 },
  { nama: "Akhmad Syarif", tingkat: "imarah", subBidang: "Al-Kahfi Care", urutan: 21 },
  { nama: "Dian Zaini Arief", tingkat: "imarah", subBidang: "Al-Kahfi Care", urutan: 22 },
  { nama: "Tresna", tingkat: "imarah", subBidang: "Al-Kahfi Care", urutan: 23 },
  { nama: "Sigit Jaelani", tingkat: "imarah", subBidang: "Al-Kahfi Care", urutan: 24 },
  { nama: "Ruhiyat", tingkat: "imarah", subBidang: "Al-Kahfi Care", urutan: 25 },
  { nama: "Muhammad Iqbal", tingkat: "imarah", subBidang: "Remaja Masjid", urutan: 26 },
  { nama: "Rahma Sari Ridwan", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 27 },
  { nama: "Putri Oviolanda Irianto", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 28 },
  { nama: "Sri Nuryani Erwinsyah", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 29 },
  { nama: "Maryana Saumi Ulfah", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 30 },
  { nama: "Yunnie Cindo Raina Shari", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 31 },
  { nama: "Astrylia Rosiana Wulansary", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 32 },
  { nama: "Raditiana Fatmasari", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 33 },
  { nama: "Rina Kartini", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 34 },
  { nama: "Vita Indriani", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 35 },
  { nama: "Fitriani", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 36 },
  { nama: "Santi Nopita", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 37 },
  { nama: "Neng Siti Nurmala", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 38 },
  { nama: "Eva Nur'avyani", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 39 },
  { nama: "Siska Rachman", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 40 },
  { nama: "Lia Martiyanti", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 41 },
  { nama: "Vena Monica", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 42 },
  { nama: "Fahmi Gerald", tingkat: "imarah", subBidang: "BUMM (Bidang Usaha Milik Masjid)", urutan: 43 },
  { nama: "Sigit Jaelani", tingkat: "imarah", subBidang: "BUMM (Bidang Usaha Milik Masjid)", urutan: 44 },
  // VI. BIDANG RI'AYAH
  { nama: "Dian Zaini Arief", tingkat: "riayah", jabatan: "Koordinator Bidang", urutan: 1 },
  { nama: "Fahmi Gerald", tingkat: "riayah", subBidang: "Sarana & Prasarana (SARPAS)", urutan: 2 },
  { nama: "Muhammad Zamzam", tingkat: "riayah", subBidang: "Sarana & Prasarana (SARPAS)", urutan: 3 },
  { nama: "Irfan Januar", tingkat: "riayah", subBidang: "Kebersihan & Keindahan", urutan: 4 },
  { nama: "Tedi Surahman", tingkat: "riayah", subBidang: "Kebersihan & Keindahan", urutan: 5 },
  { nama: "Akhmad Syarif", tingkat: "riayah", subBidang: "Kebersihan & Keindahan", urutan: 6 },
  { nama: "Aep S", tingkat: "riayah", subBidang: "Keamanan", urutan: 7 },
  { nama: "Rian Sidik Permana", tingkat: "riayah", subBidang: "Keamanan", urutan: 8 },
  { nama: "Rijal", tingkat: "riayah", subBidang: "Keamanan", urutan: 9 },
  { nama: "Sinung Wahyono", tingkat: "riayah", subBidang: "Pengembangan Aset", urutan: 10 },
  { nama: "Yogi Yogaswara", tingkat: "riayah", subBidang: "Pengembangan Aset", urutan: 11 },
];
```

- [ ] **Step 2: Update blok insert pengurus di `main()`**

Temukan blok insert pengurus di fungsi `main()` (sekitar baris 260):

```typescript
  // Insert Pengurus
  console.log("Seeding pengurus...");
  await db.insert(pengurus).values(DEFAULT_PENGURUS);
```

Ganti dengan (map field lama ke struktur baru + generate foto):

```typescript
  // Insert Pengurus (struktur hierarki baru)
  console.log("Seeding pengurus...");
  await db.insert(pengurus).values(
    DEFAULT_PENGURUS.map((p) => ({
      nama: p.nama,
      foto: avatar(p.nama),
      tingkat: p.tingkat,
      jabatan: p.jabatan ?? null,
      subBidang: p.subBidang ?? null,
      urutan: p.urutan,
    }))
  );
```

- [ ] **Step 3: Run seed**

Run: `npm run db:seed`

Expected output berisi `Seeding pengurus...` dan `Database seeded successfully!`. Tidak ada error.

- [ ] **Step 4: Verifikasi via API**

Run: `curl -s http://localhost:3000/api/pengurus | head -c 500`
Expected: JSON array dengan entri field `nama`, `tingkat`, `jabatan`, `subBidang`, `urutan`. Bukan field lama `name/role/img`.

Cek jumlah: `curl -s http://localhost:3000/api/pengurus | grep -o '"id"' | wc -l`
Expected: ~70 (sesuai jumlah entri seed).

- [ ] **Step 5: Commit**

```bash
git add lib/db/seed.ts
git commit -m "feat: seed full DKM pengurus hierarchy structure"
```

---

## Task 5: Update Halaman Publik Tentang

**Files:**
- Modify: `app/(site)/tentang/page.tsx` — ganti `FALLBACK_PENGURUS`, tambah grouping helper, rewrite section "Struktur Kepengurusan" jadi layout tab

**Interfaces:**
- Consumes: `GET /api/pengurus` (array field baru dari Task 2/4)
- Produces: tampilan hierarki: top section (pembina/penasehat/pimpinan) + tab (idarah/imarah/riayah) dengan sub-bidang

- [ ] **Step 1: Update `FALLBACK_PENGURUS` dan type**

Temukan `const FALLBACK_PENGURUS = [ ... ]` (sekitar baris 17-41, objek field `name/role/period/img`). Ganti seluruh array dengan struktur baru (sample kecil sebagai fallback):

```typescript
type Pengurus = {
  id: number;
  nama: string;
  foto: string;
  tingkat: "pembina" | "penasehat" | "pimpinan" | "idarah" | "imarah" | "riayah";
  subBidang: string | null;
  jabatan: string | null;
  urutan: number;
  periode: string;
};

const FALLBACK_PENGURUS: Pengurus[] = [
  { id: 1, nama: "Budi Ramdani", foto: "https://placehold.co/200x200/064e3b/fbbf24?text=BR", tingkat: "pimpinan", subBidang: null, jabatan: "Ketua", urutan: 1, periode: "2024-2028" },
  { id: 2, nama: "Idham Faisal", foto: "https://placehold.co/200x200/064e3b/fbbf24?text=IF", tingkat: "pimpinan", subBidang: null, jabatan: "Wakil Ketua", urutan: 2, periode: "2024-2028" },
];
```

- [ ] **Step 2: Update fetch handler untuk map field baru**

Temukan blok fetch pengurus (sekitar baris 99-110):

```typescript
        const pengurusRes = await fetch("/api/pengurus");
        if (pengurusRes.ok) {
          const pengurusJson = await pengurusRes.json();
          setPengurusData(
            pengurusJson.length > 0 ? pengurusJson : FALLBACK_PENGURUS,
          );
        } else {
          setPengurusData(FALLBACK_PENGURUS);
        }
```

Bagian ini tidak perlu diubah (field sudah cocok karena API kembalikan struktur baru). Pastikan state type sesuai. Temukan deklarasi state (sekitar baris 92): `const [pengurusData, setPengurusData] = useState<any[]>([]);` — ganti `any[]` dengan `Pengurus[]`:

```typescript
  const [pengurusData, setPengurusData] = useState<Pengurus[]>([]);
```

- [ ] **Step 3: Tambah state tab aktif + grouping helper**

Temukan deklarasi state pengurusData (baris yang baru diubah di Step 2). Tambahkan state tab tepat di bawahnya:

```typescript
  const [pengurusData, setPengurusData] = useState<Pengurus[]>([]);
  const [activeBidang, setActiveBidang] = useState<"idarah" | "imarah" | "riayah">("imarah");
```

Lalu tambahkan helper grouping di luar komponen (sebelum `export default function ...`, setelah `FALLBACK_PENGURUS`):

```typescript
function groupPengurus(list: Pengurus[]) {
  const byTingkat = (t: Pengurus["tingkat"]) =>
    list.filter((p) => p.tingkat === t).sort((a, b) => a.urutan - b.urutan);

  const topSection = {
    pembina: byTingkat("pembina"),
    penasehat: byTingkat("penasehat"),
    pimpinan: byTingkat("pimpinan"),
  };

  const buildBidang = (t: "idarah" | "imarah" | "riayah") => {
    const items = byTingkat(t);
    const koordinator = items.find((p) => p.jabatan === "Koordinator Bidang") || null;
    const rest = items.filter((p) => p.jabatan !== "Koordinator Bidang");
    const subMap = new Map<string, Pengurus[]>();
    for (const p of rest) {
      const key = p.subBidang || "";
      if (!subMap.has(key)) subMap.set(key, []);
      subMap.get(key)!.push(p);
    }
    const subGroups = Array.from(subMap.entries()).map(([subBidang, members]) => ({
      subBidang,
      members,
    }));
    return { koordinator, subGroups, members: rest };
  };

  return {
    topSection,
    idarah: buildBidang("idarah"),
    imarah: buildBidang("imarah"),
    riayah: buildBidang("riayah"),
  };
}
```

- [ ] **Step 4: Tambah komponen `PengurusCard`**

Tambahkan di luar komponen utama (setelah `groupPengurus`):

```typescript
function PengurusCard({ p, priority = false }: { p: Pengurus; priority?: boolean }) {
  const [imgError, setImgError] = useState(false);
  const initials = p.nama
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const label = p.jabatan || p.subBidang || "Anggota";

  return (
    <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gold-100 hover:shadow-md transition">
      <div className="w-20 h-20 relative mx-auto mb-3 rounded-full overflow-hidden border-2 border-gold-500 bg-gray-50">
        {imgError ? (
          <div className="w-full h-full flex items-center justify-center bg-emerald-900 text-gold-300 font-bold text-xl">
            {initials}
          </div>
        ) : (
          <Image
            src={p.foto}
            alt={p.nama}
            fill
            sizes="80px"
            priority={priority}
            className="object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <h4 className="font-bold text-emerald-950 text-sm leading-tight">{p.nama}</h4>
      <p className="text-[10px] text-gold-600 font-semibold uppercase mt-1">{label}</p>
    </div>
  );
}
```

- [ ] **Step 5: Rewrite section "Struktur Kepengurusan"**

Temukan blok `{/* Struktur Kepengurusan */}` sampai penutup `</div>` section-nya (sekitar baris 162-198). Ganti seluruh blok dengan:

```typescript
        {/* Struktur Kepengurusan */}
        <div className="space-y-8">
          <h3 className="font-serif text-2xl md:text-3xl font-bold text-emerald-950 text-center">
            Pengurus DKM Al-Kahfi
          </h3>
          <p className="text-center text-sm text-gray-500 -mt-6 mb-4">
            Masa Khidmat: 2024 - 2028
          </p>

          {(() => {
            const g = groupPengurus(pengurusData);
            return (
              <div className="space-y-10">
                {/* TOP SECTION: selalu tampil */}
                {g.topSection.pembina.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-serif text-lg font-bold text-emerald-900 border-b border-gold-200 pb-2">
                      Pembina
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {g.topSection.pembina.map((p) => (
                        <PengurusCard key={`pembina-${p.id}`} p={p} priority />
                      ))}
                    </div>
                  </div>
                )}

                {g.topSection.penasehat.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-serif text-lg font-bold text-emerald-900 border-b border-gold-200 pb-2">
                      Penasehat
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {g.topSection.penasehat.map((p) => (
                        <PengurusCard key={`penasehat-${p.id}`} p={p} priority />
                      ))}
                    </div>
                  </div>
                )}

                {g.topSection.pimpinan.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-serif text-lg font-bold text-emerald-900 border-b border-gold-200 pb-2">
                      Pimpinan Inti
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {g.topSection.pimpinan.map((p) => (
                        <PengurusCard key={`pimpinan-${p.id}`} p={p} priority />
                      ))}
                    </div>
                  </div>
                )}

                {/* TABS: Idarah / Imarah / Ri'ayah */}
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(["idarah", "imarah", "riayah"] as const).map((t) => {
                      const label =
                        t === "idarah" ? "Bidang Idarah" : t === "imarah" ? "Bidang Imarah" : "Bidang Ri'ayah";
                      return (
                        <button
                          key={t}
                          onClick={() => setActiveBidang(t)}
                          className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                            activeBidang === t
                              ? "bg-emerald-900 text-gold-300 shadow-md"
                              : "bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-50"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="bg-emerald-50/50 rounded-2xl p-6 space-y-6">
                    {(() => {
                      const bidang = g[activeBidang];
                      return (
                        <>
                          {bidang.koordinator && (
                            <div className="flex justify-center">
                              <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-gold-400 w-full max-w-xs">
                                <div className="w-16 h-16 relative mx-auto mb-3 rounded-full overflow-hidden border-2 border-gold-500 bg-gray-50">
                                  <Image
                                    src={bidang.koordinator.foto}
                                    alt={bidang.koordinator.nama}
                                    fill
                                    sizes="64px"
                                    className="object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <p className="text-[10px] text-gold-600 font-bold uppercase">Koordinator Bidang</p>
                                <h4 className="font-bold text-emerald-950 text-sm">
                                  {bidang.koordinator.nama}
                                </h4>
                              </div>
                            </div>
                          )}

                          {activeBidang === "idarah" ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                              {bidang.members.map((p) => (
                                <PengurusCard key={`idarah-${p.id}`} p={p} />
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {bidang.subGroups.map((sg) => (
                                <div key={`${activeBidang}-${sg.subBidang}`} className="space-y-3">
                                  <h5 className="font-semibold text-emerald-800 text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500"></span>
                                    {sg.subBidang}
                                  </h5>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {sg.members.map((p) => (
                                      <PengurusCard key={`${activeBidang}-${p.id}`} p={p} />
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
```

- [ ] **Step 6: Cek build & runtime**

Run: `npm run build`
Expected: build sukses tanpa type error.

Lalu cek browser: buka `http://localhost:3000/tentang`, scroll ke section pengurus. Verifikasi:
- Pembina/Penasehat/Pimpinan tampil di atas
- 3 tab (Idarah/Imarah/Ri'ayah) muncul, klik ganti konten
- Tab Imarah default aktif, tampilkan Koordinator + sub-bidang (Syiar Islam, PHBI, dll)
- Foto load (atau fallback inisial bila placehold.co gagal)

- [ ] **Step 7: Commit**

```bash
git add "app/(site)/tentang/page.tsx"
git commit -m "feat: redesign pengurus section with hierarchy tabs"
```

---

## Task 6: Update Admin Pengurus Form & List

**Files:**
- Modify: `app/admin/(protected)/tentang/page.tsx` — state, form fields, list table, submit handler untuk field baru

**Interfaces:**
- Consumes: `GET/POST/PUT/DELETE /api/pengurus` (field baru dari Task 2/3)
- Produces: admin bisa CRUD pengurus dengan field hierarki (nama, tingkat, jabatan, subBidang, urutan, foto)

- [ ] **Step 1: Update state variables pengurus**

Temukan blok state pengurus (sekitar baris 29-38):

```typescript
  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [isPengurusModalOpen, setIsPengurusModalOpen] = useState(false);
  const [editPengurus, setEditPengurus] = useState<any>(null);
  const [pName, setPName] = useState('');
  const [pRole, setPRole] = useState('');
  const [pPeriod, setPPeriod] = useState('Periode 2024-2028');
  const [pImg, setPImg] = useState('');
```

Ganti dengan (field baru):

```typescript
  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [isPengurusModalOpen, setIsPengurusModalOpen] = useState(false);
  const [editPengurus, setEditPengurus] = useState<any>(null);
  const [pNama, setPNama] = useState('');
  const [pTingkat, setPTingkat] = useState<'pembina' | 'penasehat' | 'pimpinan' | 'idarah' | 'imarah' | 'riayah'>('pembina');
  const [pJabatan, setPJabatan] = useState('');
  const [pSubBidang, setPSubBidang] = useState('');
  const [pUrutan, setPUrutan] = useState(0);
  const [pFoto, setPFoto] = useState('');
```

- [ ] **Step 2: Update handler `handleOpenAddPengurus`**

Temukan (sekitar baris 97-104):

```typescript
  const handleOpenAddPengurus = () => {
    setEditPengurus(null);
    setPName('');
    setPRole('');
    setPPeriod('Periode 2024-2028');
    setPImg('');
    setIsPengurusModalOpen(true);
  };
```

Ganti dengan:

```typescript
  const handleOpenAddPengurus = () => {
    setEditPengurus(null);
    setPNama('');
    setPTingkat('pembina');
    setPJabatan('');
    setPSubBidang('');
    setPUrutan(0);
    setPFoto('');
    setIsPengurusModalOpen(true);
  };
```

- [ ] **Step 3: Update handler `handleOpenEditPengurus`**

Temukan (sekitar baris 106-113):

```typescript
  const handleOpenEditPengurus = (item: any) => {
    setEditPengurus(item);
    setPName(item.name);
    setPRole(item.role);
    setPPeriod(item.period);
    setPImg(item.img);
    setIsPengurusModalOpen(true);
  };
```

Ganti dengan:

```typescript
  const handleOpenEditPengurus = (item: any) => {
    setEditPengurus(item);
    setPNama(item.nama);
    setPTingkat(item.tingkat);
    setPJabatan(item.jabatan || '');
    setPSubBidang(item.subBidang || '');
    setPUrutan(item.urutan ?? 0);
    setPFoto(item.foto);
    setIsPengurusModalOpen(true);
  };
```

- [ ] **Step 4: Update `handleSubmitPengurus`**

Temukan fungsi `handleSubmitPengurus` (sekitar baris 135-170, berisi POST/PUT dengan `name/role/period/img`). Ganti seluruh fungsi dengan:

```typescript
  const handleSubmitPengurus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pNama || !pFoto || !pTingkat) {
      alert('Nama, foto, dan tingkat wajib diisi');
      return;
    }
    setSubmittingPengurus(true);

    const payload = {
      nama: pNama,
      tingkat: pTingkat,
      jabatan: pJabatan || null,
      subBidang: pSubBidang || null,
      urutan: pUrutan,
      foto: pFoto,
    };

    try {
      if (editPengurus) {
        const res = await fetch(`/api/pengurus/${editPengurus.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Gagal mengupdate pengurus');
        const updated = await res.json();
        setPengurusList(pengurusList.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const res = await fetch('/api/pengurus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Gagal menambah pengurus');
        const created = await res.json();
        setPengurusList([...pengurusList, created]);
      }
      setIsPengurusModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmittingPengurus(false);
    }
  };
```

- [ ] **Step 5: Update form modal pengurus (field input)**

Temukan form modal pengurus (di dalam render, cari input yang pakai `value={pName}`, `pRole`, `pPeriod`, `pImg`). Ganti seluruh blok form-fields pengurus dengan field baru. Struktur umumnya (sesuaikan dengan markup yang ada — cari `onSubmit={handleSubmitPengurus}`):

```typescript
            <form onSubmit={handleSubmitPengurus} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Nama</label>
                <input
                  type="text"
                  value={pNama}
                  onChange={(e) => setPNama(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Tingkat</label>
                <select
                  value={pTingkat}
                  onChange={(e) => setPTingkat(e.target.value as any)}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="pembina">Pembina</option>
                  <option value="penasehat">Penasehat</option>
                  <option value="pimpinan">Pimpinan Inti</option>
                  <option value="idarah">Bidang Idarah</option>
                  <option value="imarah">Bidang Imarah</option>
                  <option value="riayah">Bidang Ri'ayah</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Jabatan <span className="text-gray-400 font-normal">(opsional, mis. Ketua / Sekretaris / Koordinator Bidang)</span>
                </label>
                <input
                  type="text"
                  value={pJabatan}
                  onChange={(e) => setPJabatan(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  placeholder="Kosongkan jika anggota biasa"
                />
              </div>

              {(pTingkat === 'imarah' || pTingkat === 'riayah') && (
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Sub-Bidang <span className="text-gray-400 font-normal">(opsional, mis. Syiar Islam / PHBI)</span>
                  </label>
                  <input
                    type="text"
                    value={pSubBidang}
                    onChange={(e) => setPSubBidang(e.target.value)}
                    className="w-full border rounded-lg p-2"
                    placeholder="Kosongkan jika koordinator/anggota langsung"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1">Urutan</label>
                <input
                  type="number"
                  value={pUrutan}
                  onChange={(e) => setPUrutan(parseInt(e.target.value) || 0)}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">URL Foto</label>
                <input
                  type="text"
                  value={pFoto}
                  onChange={(e) => setPFoto(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  required
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPengurusModalOpen(false)}
                  className="flex-1 border rounded-lg p-2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingPengurus}
                  className="flex-1 bg-emerald-900 text-white rounded-lg p-2 disabled:opacity-50"
                >
                  {submittingPengurus ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
```

Catatan: markup modal (wrapper, header, tombol close) bervariasi di file asli — pertahankan wrapper/modal yang ada, ganti hanya blok `<form>` di dalamnya.

- [ ] **Step 6: Update list/tabel pengurus (grouped by tingkat)**

Temukan blok render list pengurus (yang me-map `pengurusList` dan menampilkan `item.name`, `item.role`, dll). Ganti dengan list dikelompokkan per tingkat:

```typescript
            {(() => {
              const TINGKAT_LABEL: Record<string, string> = {
                pembina: 'Pembina',
                penasehat: 'Penasehat',
                pimpinan: 'Pimpinan Inti',
                idarah: 'Bidang Idarah',
                imarah: 'Bidang Imarah',
                riayah: "Bidang Ri'ayah",
              };
              const order = ['pembina', 'penasehat', 'pimpinan', 'idarah', 'imarah', 'riayah'];
              return (
                <div className="space-y-6">
                  {order.map((t) => {
                    const items = pengurusList
                      .filter((p) => p.tingkat === t)
                      .sort((a, b) => a.urutan - b.urutan);
                    if (items.length === 0) return null;
                    return (
                      <div key={t} className="space-y-2">
                        <h4 className="font-bold text-emerald-900 text-sm">
                          {TINGKAT_LABEL[t]} <span className="text-gray-400">({items.length})</span>
                        </h4>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left">
                              <tr>
                                <th className="p-2">Nama</th>
                                <th className="p-2">Jabatan</th>
                                <th className="p-2">Sub-Bidang</th>
                                <th className="p-2">Urutan</th>
                                <th className="p-2 text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item) => (
                                <tr key={item.id} className="border-t">
                                  <td className="p-2">{item.nama}</td>
                                  <td className="p-2 text-gray-600">{item.jabatan || '-'}</td>
                                  <td className="p-2 text-gray-600">{item.subBidang || '-'}</td>
                                  <td className="p-2 text-gray-600">{item.urutan}</td>
                                  <td className="p-2 text-right space-x-2">
                                    <button
                                      onClick={() => handleOpenEditPengurus(item)}
                                      className="text-emerald-700 hover:underline"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeletePengurus(item.id)}
                                      disabled={deletingPengurusId === item.id}
                                      className="text-red-600 hover:underline disabled:opacity-50"
                                    >
                                      Hapus
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
```

- [ ] **Step 7: Cek build**

Run: `npm run build`
Expected: sukses, tidak ada referensi `pName/pRole/pPeriod/pImg` atau `item.name/role/period/img` yang tersisa.

Jika ada error sisa referensi field lama, cari & ganti: `pName`→`pNama`, `pRole`→`pJabatan`, `pPeriod` (hapus atau map ke urutan), `pImg`→`pFoto`. Gunakan `grep`:

```bash
grep -n "pName\|pRole\|pPeriod\|pImg\|\.name\|\.role\|\.period\|\.img" "app/admin/(protected)/tentang/page.tsx"
```

Hati-hati: `.name`/`.role` mungkin juga dipakai untuk entitas lain (fasilitas). Hanya perbaiki yang terkait pengurus.

- [ ] **Step 8: Verifikasi via browser**

Login admin (`http://localhost:3000/admin/login`, kredensial superadmin), buka `/admin/tentang`, tab Pengurus. Verifikasi:
- List dikelompokkan per tingkat, tampil nama/jabatan/sub-bidang/urutan
- Klik "Tambah" → form muncul dengan field baru (Tingkat, Jabatan, Sub-Bidang muncul saat imarah/riayah)
- Tambah 1 entri test → muncul di list
- Edit entri → perubahan tersimpan
- Hapus entri test → hilang dari list

- [ ] **Step 9: Commit**

```bash
git add "app/admin/(protected)/tentang/page.tsx"
git commit -m "feat: update admin pengurus form & list for hierarchy fields"
```

---

## Task 7: Final Verification

**Files:** (no code changes — verification only)

- [ ] **Step 1: Build production**

Run: `npm run build`
Expected: sukses tanpa error.

- [ ] **Step 2: End-to-end publik**

Dev server jalan (`npm run dev`). Buka `http://localhost:3000/tentang`. Verifikasi:
- Section pengurus tampil: Pembina (2), Penasehat (3), Pimpinan Inti (2) di atas
- 3 tab di bawah. Klik tiap tab:
  - Idarah: ~9 anggota dengan jabatan (Sekretaris, Bendahara, dll), tanpa sub-bidang
  - Imarah: Koordinator (Irfanudin) di atas + sub-bidang (Syiar Islam, PHBI, Pendidikan & TPQ, ZISWAF, Cinta Qurban, Al-Kahfi Care, Remaja Masjid, Majelis Taklim, BUMM)
  - Ri'ayah: Koordinator (Dian Zaini Arief) + sub-bidang (SARPAS, Kebersihan & Keindahan, Keamanan, Pengembangan Aset)
- Foto load (placeholder inisial atau placehold.co)
- Tidak ada foto pecah (fallback inisial jalan bila URL gagal)

- [ ] **Step 3: End-to-end admin**

Login admin, `/admin/tentang` → tab Pengurus. Verifikasi CRUD lengkap (tambah/edit/hapus) dengan field hierarki. Total entri ~70.

- [ ] **Step 4: Commit final bila ada perbaikan**

```bash
git add -A
git commit -m "fix: verification adjustments"  # hanya jika ada perbaikan
```

Jika tidak ada perubahan, skip. Plan selesai.

---

## Summary Checklist

- [ ] Schema `pengurus` + enum `pengurus_tingkat` ter-update, DB di-push
- [ ] API GET/POST/PUT/DELETE terima field hierarki
- [ ] Seed ~70 entri struktur DKM Al-Kahfi lengkap
- [ ] Halaman publik: top section + tab per bidang + sub-bidang + fallback foto
- [ ] Admin: form + list field hierarki, CRUD berfungsi
- [ ] `npm run build` sukses
- [ ] Verifikasi publik + admin via browser lulus

---

**Plan complete and saved to `docs/superpowers/plans/2026-07-11-pengurus-hierarki-implementation.md`.**
