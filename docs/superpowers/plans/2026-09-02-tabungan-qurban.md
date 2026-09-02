# Tabungan Qurban Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fitur Tabungan Qurban: pendaftaran peserta (1 peserta = banyak shohibul) via form publik, kelola + verifikasi di admin, dan pencatatan setoran dengan saldo gabungan terhitung otomatis.

**Architecture:** Tiga tabel Drizzle (`qurban_peserta`, `qurban_shohibul` 1:N, `qurban_setoran`), saldo = SUM setoran per peserta on-the-fly (pola modul Akuntansi). API routes mengikuti pola `donatur-tetap` (POST publik tanpa auth, sisanya wajib sesi via `getActor()`). Halaman publik & admin adalah client components mengikuti pola halaman donatur-tetap.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM + PostgreSQL (drizzle-kit push), Tailwind CSS v4, better-auth, node:test + tsx untuk test.

**Spec:** `docs/superpowers/specs/2026-09-02-tabungan-qurban-design.md` (revisi 2026-09-02: 1 peserta = banyak shohibul, saldo gabungan)

## Global Constraints

- Branch kerja: `feat/tabungan-qurban` (sudah ada; jangan commit ke `main`).
- Semua komentar/kode/UI copy dalam Bahasa Indonesia (mengikuti repo).
- Saldo **tidak** disimpan; selalu dihitung `SUM(qurban_setoran.jumlah)` per peserta; bersifat **gabungan** seluruh shohibul.
- Setiap peserta wajib punya **minimal 1 shohibul**; POST publik menerima 1–10 nama shohibul.
- Nomor WA disimpan dinormalisasi `62xxx` (fungsi `normalizeWa`, regex validasi `^62\d{8,13}$`).
- `jumlah` setoran: integer rupiah, harus `> 0`.
- Enum status peserta: `baru` → `aktif` → (`selesai` | `berhenti`); enum metode re-use `metode_pembayaran` (`transfer_bank`, `qris`, `tunai_sekretariat`).
- Auth: `getActor()` dari `@/lib/audit` (return null → `401`). Endpoint POST `/api/qurban-peserta` adalah publik.
- Error response: JSON `{ error }`, status 400/401/404/500.
- Verifikasi tiap task yang menyentuh kode: `npm test` (test terkait) dan di akhir `npm run build` harus lolos.
- Commit messages: conventional commits + trailer `Co-Authored-By: Claude Code <noreply@anthropic.com>`.

---

### Task 1: Schema Drizzle — enum + 3 tabel

**Files:**
- Modify: `lib/db/schema.ts` (tambah blok di akhir file, setelah tabel `akuntansi_transaksi`)

**Interfaces:**
- Produces: `qurbanPesertaStatusEnum`, `qurbanPeserta`, `qurbanShohibul`, `qurbanSetoran` (diekspor dari `lib/db/schema.ts`; dipakai Task 2–8).

- [ ] **Step 1: Tambah enum + tabel di `lib/db/schema.ts`**

Tambahkan di akhir file:

```ts
// === Tabungan Qurban ===

export const qurbanPesertaStatusEnum = pgEnum("qurban_peserta_status", [
  "baru",     // daftar via publik, menunggu verifikasi admin
  "aktif",    // terverifikasi, tabungan berjalan
  "selesai",  // dana dicairkan / dipakai untuk qurban
  "berhenti", // dibatalkan / mengundurkan diri
]);

export const qurbanPeserta = pgTable("qurban_peserta", {
  id: serial("id").primaryKey(),
  namaPeserta: text("nama_peserta").notNull(),
  alamat: text("alamat").notNull(),
  whatsapp: text("whatsapp").notNull(), // dinormalisasi "62xxx"
  namaBank: text("nama_bank").notNull(),
  nomorRekening: text("nomor_rekening").notNull(),
  namaPemilikRekening: text("nama_pemilik_rekening").notNull(),
  periode: text("periode").notNull(), // tahun target qurban, mis. "2027"
  status: qurbanPesertaStatusEnum("status").default("baru").notNull(),
  catatanAdmin: text("catatan_admin"), // catatan internal DKM
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("qurban_peserta_periode_idx").on(table.periode),
  index("qurban_peserta_status_idx").on(table.status),
]);

// Shohibul qurban (muqorib) yang ditabungkan — 1 peserta bisa banyak shohibul.
export const qurbanShohibul = pgTable("qurban_shohibul", {
  id: serial("id").primaryKey(),
  pesertaId: integer("peserta_id")
    .references(() => qurbanPeserta.id, { onDelete: "cascade" })
    .notNull(),
  nama: text("nama").notNull(), // 3–100 karakter
  urutan: integer("urutan").default(0).notNull(),
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("qurban_shohibul_peserta_idx").on(table.pesertaId),
]);

// Riwayat setoran tabungan qurban (satu baris = satu setoran).
// Saldo peserta = SUM(jumlah) gabungan seluruh shohibul — dihitung on-the-fly.
export const qurbanSetoran = pgTable("qurban_setoran", {
  id: serial("id").primaryKey(),
  pesertaId: integer("peserta_id")
    .references(() => qurbanPeserta.id, { onDelete: "cascade" })
    .notNull(),
  tanggal: timestamp("tanggal", { withTimezone: true }).notNull(),
  jumlah: integer("jumlah").notNull(), // rupiah, > 0
  metodePembayaran: metodePembayaranEnum("metode_pembayaran").notNull(), // reuse enum
  keterangan: text("keterangan"),
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("qurban_setoran_peserta_idx").on(table.pesertaId),
  index("qurban_setoran_tanggal_idx").on(table.tanggal),
]);
```

Catatan: `pgEnum`, `pgTable`, `serial`, `text`, `timestamp`, `boolean`, `index`, `integer` sudah di-import di atas file — tidak perlu import baru.

- [ ] **Step 2: Push schema ke database**

Run: `npm run db:push`
Expected: drizzle-kit push sukses, tabel `qurban_peserta`, `qurban_shohibul`, `qurban_setoran` + enum `qurban_peserta_status` dibuat.

- [ ] **Step 3: Verifikasi tabel ada**

Run: `docker exec -it $(docker ps -qf "name=postgres\|db" | head -1) psql -U postgres -d alkahfi_db -c "\dt qurban*"` (atau via drizzle-kit studio bila docker tidak jalan).
Expected: tiga tabel `qurban_peserta`, `qurban_shohibul`, `qurban_setoran` tercantum.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat(db): skema tabungan qurban (peserta, shohibul, setoran)

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: API `/api/qurban-peserta` — GET list admin + POST publik (dengan shohibul)

**Files:**
- Create: `lib/qurban.ts`
- Create: `test/api/qurban-peserta.test.ts`
- Create: `app/api/qurban-peserta/route.ts`

**Interfaces:**
- Consumes: `qurbanPeserta`, `qurbanShohibul`, `qurbanSetoran` (Task 1), `getActor`/`withActorNames` (`lib/audit.ts`), `inArray`.
- Produces:
  - `lib/qurban.ts`: `normalizeWa(input: string): string`, `validatePeserta(p): string | null`, `parseShohibulList(input): { list: string[]; error: string | null }` — dipakai ulang Task 3.
  - `GET /api/qurban-peserta?admin=1` (admin) → array `{ ...peserta, saldo: number, shohibul: string[], createdByName, updatedByName }`. Filter opsional `?periode=YYYY` & `?status=`.
  - `POST /api/qurban-peserta` (publik) → body: semua field peserta + `shohibul: string[]` (1–10 nama) → `{ ok: true, id }`, status `"baru"`.

Catatan penting: helper **tidak boleh** di-export dari file `route.ts` — Next.js hanya mengizinkan export HTTP handler + config dari route file (build error bila melanggar). Karena itu helper ditaruh di `lib/qurban.ts`.

- [ ] **Step 1: Buat helper bersama — `lib/qurban.ts`**

```ts
/** Helper bersama fitur Tabungan Qurban (dipakai API routes; bukan route file). */

/** Normalisasi nomor WhatsApp ke format 62xxx. */
export function normalizeWa(input: string): string {
  let d = input.replace(/[^\d]/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  if (!d.startsWith("62")) d = "62" + d;
  return d;
}

/** Validasi field peserta; mengembalikan pesan error atau null. */
export function validatePeserta(p: {
  namaPeserta: string; alamat: string; whatsapp: string; namaBank: string;
  nomorRekening: string; namaPemilikRekening: string; periode: string;
}): string | null {
  if (p.namaPeserta.length < 3 || p.namaPeserta.length > 100)
    return "Nama peserta wajib diisi (3–100 karakter)";
  if (p.alamat.length < 5 || p.alamat.length > 500)
    return "Alamat lengkap wajib diisi (5–500 karakter)";
  if (!/^62\d{8,13}$/.test(p.whatsapp)) return "Nomor WhatsApp tidak valid";
  if (p.namaBank.length < 2 || p.namaBank.length > 50) return "Nama bank wajib diisi";
  if (!/^\d{4,30}$/.test(p.nomorRekening)) return "Nomor rekening tidak valid (4–30 digit)";
  if (p.namaPemilikRekening.length < 3 || p.namaPemilikRekening.length > 100)
    return "Nama pemilik rekening wajib diisi (3–100 karakter)";
  if (!/^\d{4}$/.test(p.periode)) return "Periode (tahun) tidak valid";
  return null;
}

/** Validasi & bersihkan daftar nama shohibul; mengembalikan { list, error }. */
export function parseShohibulList(input: unknown): { list: string[]; error: string | null } {
  if (!Array.isArray(input)) return { list: [], error: "Daftar shohibul wajib diisi" };
  const list = input.map((n) => String(n).trim()).filter(Boolean);
  if (list.length < 1) return { list: [], error: "Minimal 1 nama shohibul qurban" };
  if (list.length > 10) return { list: [], error: "Maksimal 10 nama shohibul qurban" };
  for (const nama of list) {
    if (nama.length < 3 || nama.length > 100)
      return { list: [], error: "Nama shohibul wajib diisi (3–100 karakter)" };
  }
  return { list, error: null };
}
```

- [ ] **Step 2: Tulis test yang gagal — `test/api/qurban-peserta.test.ts`**

- [ ] **Step 1: Tulis test yang gagal — `test/api/qurban-peserta.test.ts`**

```ts
import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { auth } from '../../lib/auth';
import { GET, POST } from '../../app/api/qurban-peserta/route';
import { call } from '../helpers/request';
import { reset, closeDb, db } from '../helpers/db';
import { qurbanPeserta, qurbanShohibul, qurbanSetoran } from '../../lib/db/schema';

// Mock sesi (pola test/api/pengaturan.test.ts)
let currentSession: any = null;
(auth.api as any).getSession = async () => currentSession;

beforeEach(async () => {
  currentSession = null;
  await reset(qurbanSetoran, qurbanShohibul, qurbanPeserta);
});
after(closeDb);

const valid = {
  namaPeserta: 'Ahmad Fulan',
  alamat: 'Jl. Merdeka No. 1, Bandung',
  whatsapp: '081234567890',
  namaBank: 'BSI',
  nomorRekening: '7011223344',
  namaPemilikRekening: 'AHMAD FULAN',
  periode: '2027',
  shohibul: ['Ahmad Fulan'],
};

test('POST publik valid (1 shohibul) -> 200, status baru, WA dinormalisasi', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: valid });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  const rows = await db.select().from(qurbanPeserta);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].whatsapp, '6281234567890');
  assert.equal(rows[0].status, 'baru');
  const sh = await db.select().from(qurbanShohibul);
  assert.equal(sh.length, 1);
  assert.equal(sh[0].nama, 'Ahmad Fulan');
});

test('POST publik dengan 3 shohibul -> 3 baris shohibul berurutan', async () => {
  const { body } = await call(POST, {
    method: 'POST',
    body: { ...valid, shohibul: ['Ahmad Fulan', 'Fatimah', 'Almarhum Abdullah'] },
  });
  const sh = await db.select().from(qurbanShohibul);
  assert.equal(sh.length, 3);
  assert.deepEqual(
    sh.sort((a, b) => a.urutan - b.urutan).map((s) => s.nama),
    ['Ahmad Fulan', 'Fatimah', 'Almarhum Abdullah']
  );
});

test('POST tanpa shohibul -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { ...valid, shohibul: [] } });
  assert.equal(status, 400);
});

test('POST nama shohibul terlalu pendek -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { ...valid, shohibul: ['Ab'] } });
  assert.equal(status, 400);
});

test('POST WhatsApp tidak valid -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { ...valid, whatsapp: '123' } });
  assert.equal(status, 400);
});

test('POST field wajib kosong -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { ...valid, namaBank: '' } });
  assert.equal(status, 400);
});

test('POST periode bukan 4 digit -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { ...valid, periode: '2x27' } });
  assert.equal(status, 400);
});

test('GET tanpa sesi -> 401', async () => {
  const { status } = await call(GET);
  assert.equal(status, 401);
});

test('GET dengan sesi -> list + saldo agregat + daftar shohibul', async () => {
  const { body: created } = await call(POST, {
    method: 'POST',
    body: { ...valid, shohibul: ['Ahmad Fulan', 'Fatimah'] },
  });
  await db.insert(qurbanSetoran).values({
    pesertaId: created.id,
    tanggal: new Date(),
    jumlah: 100000,
    metodePembayaran: 'tunai_sekretariat',
  });
  currentSession = { user: { id: 'u1', name: 'Admin' } };
  const { status, body } = await call(GET);
  assert.equal(status, 200);
  assert.equal(body.length, 1);
  assert.equal(body[0].saldo, 100000);
  assert.deepEqual(body[0].shohibul.sort(), ['Ahmad Fulan', 'Fatimah']);
});
```

- [ ] **Step 3: Jalankan test, pastikan gagal**

Run: `npm test 2>&1 | grep -A2 qurban-peserta`
Expected: FAIL — `Cannot find module '../../app/api/qurban-peserta/route'`.

- [ ] **Step 4: Implementasi `app/api/qurban-peserta/route.ts`**

```ts
import { NextResponse } from "next/server";
import { and, desc, eq, getTableColumns, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { qurbanPeserta, qurbanShohibul, qurbanSetoran } from "@/lib/db/schema";
import { getActor, withActorNames } from "@/lib/audit";
import { normalizeWa, parseShohibulList, validatePeserta } from "@/lib/qurban";

export const dynamic = "force-dynamic";

const STATUS_VALID = ["baru", "aktif", "selesai", "berhenti"];

/** GET admin: daftar peserta + saldo agregat + daftar nama shohibul. */
export async function GET(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const periode = searchParams.get("periode");
    const status = searchParams.get("status");

    const conds = [];
    if (periode) conds.push(eq(qurbanPeserta.periode, periode));
    if (status && STATUS_VALID.includes(status)) conds.push(eq(qurbanPeserta.status, status as any));

    const rows = await db
      .select({
        ...getTableColumns(qurbanPeserta),
        saldo: sql<string>`coalesce(sum(${qurbanSetoran.jumlah}), 0)`,
      })
      .from(qurbanPeserta)
      .leftJoin(qurbanSetoran, eq(qurbanSetoran.pesertaId, qurbanPeserta.id))
      .where(conds.length ? and(...conds) : undefined)
      .groupBy(qurbanPeserta.id)
      .orderBy(desc(qurbanPeserta.createdAt));

    // Daftar shohibul per peserta (query kedua, digroup di JS)
    const ids = rows.map((r) => r.id);
    const shohibulRows = ids.length
      ? await db
          .select({ pesertaId: qurbanShohibul.pesertaId, nama: qurbanShohibul.nama })
          .from(qurbanShohibul)
          .where(inArray(qurbanShohibul.pesertaId, ids))
          .orderBy(qurbanShohibul.urutan, qurbanShohibul.id)
      : [];
    const shohibulByPeserta = new Map<number, string[]>();
    shohibulRows.forEach((s) => {
      const arr = shohibulByPeserta.get(s.pesertaId) ?? [];
      arr.push(s.nama);
      shohibulByPeserta.set(s.pesertaId, arr);
    });

    const enriched = await withActorNames(
      rows.map((r) => ({ ...r, saldo: Number(r.saldo), shohibul: shohibulByPeserta.get(r.id) ?? [] }))
    );
    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("Error fetching peserta qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** POST publik: pendaftaran mandiri peserta + shohibul. */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const peserta = {
      namaPeserta: String(body?.namaPeserta ?? "").trim(),
      alamat: String(body?.alamat ?? "").trim(),
      whatsapp: normalizeWa(String(body?.whatsapp ?? "").trim()),
      namaBank: String(body?.namaBank ?? "").trim(),
      nomorRekening: String(body?.nomorRekening ?? "").replace(/\s+/g, ""),
      namaPemilikRekening: String(body?.namaPemilikRekening ?? "").trim(),
      periode: String(body?.periode ?? "").trim(),
    };

    const invalid = validatePeserta(peserta);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    const { list: shohibulList, error: shohibulError } = parseShohibulList(body?.shohibul);
    if (shohibulError) return NextResponse.json({ error: shohibulError }, { status: 400 });

    const [created] = await db
      .insert(qurbanPeserta)
      .values({ ...peserta, status: "baru", createdById: null, updatedById: null })
      .returning({ id: qurbanPeserta.id });

    await db.insert(qurbanShohibul).values(
      shohibulList.map((nama, i) => ({ pesertaId: created.id, nama, urutan: i }))
    );

    return NextResponse.json({ ok: true, id: created.id });
  } catch (error: any) {
    console.error("Error creating peserta qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 5: Jalankan test, pastikan lulus**

Run: `npm test 2>&1 | grep -A3 qurban-peserta`
Expected: semua test `qurban-peserta` PASS (9 test).

- [ ] **Step 6: Commit**

```bash
git add lib/qurban.ts app/api/qurban-peserta test/api/qurban-peserta.test.ts
git commit -m "feat(api): daftar & pendaftaran peserta tabungan qurban (multi shohibul)

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: API `/api/qurban-peserta/[id]` — detail (+shohibul+saldo), PATCH, DELETE

**Files:**
- Create: `test/api/qurban-peserta-detail.test.ts`
- Create: `app/api/qurban-peserta/[id]/route.ts`

**Interfaces:**
- Consumes: tabel qurban (Task 1), `normalizeWa` + `validatePeserta` dari `lib/qurban` (Task 2), `getActor` (lib/audit).
- Produces:
  - `GET /api/qurban-peserta/[id]` (admin) → `{ ...peserta, saldo: number, shohibul: {id, nama, urutan}[], setoran: [...], createdByName, updatedByName }`.
  - `PATCH /api/qurban-peserta/[id]` (admin) → subset field data peserta + `status` + `catatanAdmin` → row ter-update.
  - `DELETE /api/qurban-peserta/[id]` (admin) → `{ ok: true }` (shohibul & setoran ikut, cascade).

- [ ] **Step 1: Tulis test yang gagal — `test/api/qurban-peserta-detail.test.ts`**

```ts
import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { auth } from '../../lib/auth';
import { GET, PATCH, DELETE } from '../../app/api/qurban-peserta/[id]/route';
import { call } from '../helpers/request';
import { reset, closeDb, db } from '../helpers/db';
import { qurbanPeserta, qurbanShohibul, qurbanSetoran } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';

let currentSession: any = null;
(auth.api as any).getSession = async () => currentSession;

beforeEach(async () => {
  currentSession = { user: { id: 'u1', name: 'Admin' } };
  await reset(qurbanSetoran, qurbanShohibul, qurbanPeserta);
});
after(closeDb);

async function seedPeserta() {
  const [row] = await db.insert(qurbanPeserta).values({
    namaPeserta: 'Siti Aminah',
    alamat: 'Jl. Kenanga No. 9',
    whatsapp: '628111222333',
    namaBank: 'BRI',
    nomorRekening: '0099887766',
    namaPemilikRekening: 'SITI AMINAH',
    periode: '2027',
  }).returning();
  await db.insert(qurbanShohibul).values([
    { pesertaId: row.id, nama: 'Almarhumah Fatimah', urutan: 0 },
    { pesertaId: row.id, nama: 'Almarhum Ahmad', urutan: 1 },
  ]);
  return row;
}

test('GET tanpa sesi -> 401', async () => {
  currentSession = null;
  const row = await seedPeserta();
  const { status } = await call(GET, { params: { id: String(row.id) } });
  assert.equal(status, 401);
});

test('GET admin -> detail + saldo + shohibul + riwayat setoran', async () => {
  const row = await seedPeserta();
  await db.insert(qurbanSetoran).values([
    { pesertaId: row.id, tanggal: new Date('2026-01-10'), jumlah: 200000, metodePembayaran: 'transfer_bank' },
    { pesertaId: row.id, tanggal: new Date('2026-02-10'), jumlah: 300000, metodePembayaran: 'qris' },
  ]);
  const { status, body } = await call(GET, { params: { id: String(row.id) } });
  assert.equal(status, 200);
  assert.equal(body.saldo, 500000);
  assert.equal(body.shohibul.length, 2);
  assert.equal(body.shohibul[0].nama, 'Almarhumah Fatimah');
  assert.equal(body.setoran.length, 2);
  assert.equal(body.namaPeserta, 'Siti Aminah');
});

test('GET id tidak ada -> 404', async () => {
  const { status } = await call(GET, { params: { id: '9999' } });
  assert.equal(status, 404);
});

test('PATCH ubah status -> 200, status berubah', async () => {
  const row = await seedPeserta();
  const { status, body } = await call(PATCH, { method: 'PATCH', params: { id: String(row.id) }, body: { status: 'aktif' } });
  assert.equal(status, 200);
  assert.equal(body.status, 'aktif');
});

test('PATCH status tidak valid -> 400', async () => {
  const row = await seedPeserta();
  const { status } = await call(PATCH, { method: 'PATCH', params: { id: String(row.id) }, body: { status: 'ngawur' } });
  assert.equal(status, 400);
});

test('PATCH edit data peserta + normalisasi WA -> 200', async () => {
  const row = await seedPeserta();
  const { status, body } = await call(PATCH, {
    method: 'PATCH',
    params: { id: String(row.id) },
    body: { namaPeserta: 'Siti Aminah Binti Yusuf', whatsapp: '0819998887777' },
  });
  assert.equal(status, 200);
  assert.equal(body.namaPeserta, 'Siti Aminah Binti Yusuf');
  assert.equal(body.whatsapp, '62819998887777');
});

test('PATCH alamat terlalu pendek -> 400', async () => {
  const row = await seedPeserta();
  const { status } = await call(PATCH, { method: 'PATCH', params: { id: String(row.id) }, body: { alamat: 'x' } });
  assert.equal(status, 400);
});

test('DELETE -> 200, peserta + shohibul + setoran terhapus', async () => {
  const row = await seedPeserta();
  await db.insert(qurbanSetoran).values({ pesertaId: row.id, tanggal: new Date(), jumlah: 50000, metodePembayaran: 'qris' });
  const { status, body } = await call(DELETE, { method: 'DELETE', params: { id: String(row.id) } });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal((await db.select().from(qurbanPeserta).where(eq(qurbanPeserta.id, row.id))).length, 0);
  assert.equal((await db.select().from(qurbanShohibul)).length, 0);
  assert.equal((await db.select().from(qurbanSetoran)).length, 0);
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npm test 2>&1 | grep -A2 qurban-peserta-detail`
Expected: FAIL — module route `[id]` belum ada.

- [ ] **Step 3: Implementasi `app/api/qurban-peserta/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { asc, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { qurbanPeserta, qurbanShohibul, qurbanSetoran } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";
import { normalizeWa, validatePeserta } from "@/lib/qurban";

export const dynamic = "force-dynamic";

const STATUS_VALID = ["baru", "aktif", "selesai", "berhenti"];

/** GET admin: detail peserta + shohibul + saldo + riwayat setoran. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const rows = await db
      .select({
        ...getTableColumns(qurbanPeserta),
        saldo: sql<string>`coalesce(sum(${qurbanSetoran.jumlah}), 0)`,
      })
      .from(qurbanPeserta)
      .leftJoin(qurbanSetoran, eq(qurbanSetoran.pesertaId, qurbanPeserta.id))
      .where(eq(qurbanPeserta.id, numId))
      .groupBy(qurbanPeserta.id)
      .limit(1);

    if (!rows.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const shohibul = await db
      .select()
      .from(qurbanShohibul)
      .where(eq(qurbanShohibul.pesertaId, numId))
      .orderBy(asc(qurbanShohibul.urutan), asc(qurbanShohibul.id));

    const setoran = await db
      .select()
      .from(qurbanSetoran)
      .where(eq(qurbanSetoran.pesertaId, numId))
      .orderBy(desc(qurbanSetoran.tanggal));

    return NextResponse.json({ ...rows[0], saldo: Number(rows[0].saldo), shohibul, setoran });
  } catch (error: any) {
    console.error("Error get peserta qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** PATCH admin: ubah status/catatan/data peserta (subset field; shohibul via endpoint terpisah). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const body = await req.json();
    const patch: Record<string, unknown> = {};

    if (body?.status !== undefined) {
      const status = String(body.status);
      if (!STATUS_VALID.includes(status))
        return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
      patch.status = status;
    }
    if (body?.catatanAdmin !== undefined) patch.catatanAdmin = String(body.catatanAdmin).trim() || null;

    const partial: Record<string, string> = {};
    for (const f of ["namaPeserta", "alamat", "namaBank", "periode"] as const) {
      if (body?.[f] !== undefined) partial[f] = String(body[f]).trim();
    }
    if (body?.whatsapp !== undefined) partial.whatsapp = normalizeWa(String(body.whatsapp).trim());
    if (body?.nomorRekening !== undefined)
      partial.nomorRekening = String(body.nomorRekening).trim().replace(/\s+/g, "");
    if (body?.namaPemilikRekening !== undefined)
      partial.namaPemilikRekening = String(body.namaPemilikRekening).trim();

    // Reuse validasi lengkap pada subset yang dikirim (field kosong dianggap tidak dikirim
    // — kunci undefined dilewati oleh validatePeserta karena hanya field di partial yang diisi).
    const invalid = validatePeserta({
      namaPeserta: partial.namaPeserta ?? "Valid",
      alamat: partial.alamat ?? "Valid alamat",
      whatsapp: partial.whatsapp ?? "628123456789",
      namaBank: partial.namaBank ?? "BSI",
      nomorRekening: partial.nomorRekening ?? "1234567890",
      namaPemilikRekening: partial.namaPemilikRekening ?? "Valid Name",
      periode: partial.periode ?? "2027",
    });
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
    Object.assign(patch, partial);

    if (!Object.keys(patch).length)
      return NextResponse.json({ error: "Tidak ada perubahan yang dikirim" }, { status: 400 });

    const updated = await db
      .update(qurbanPeserta)
      .set({ ...patch, updatedById: actor.id, updatedAt: new Date() })
      .where(eq(qurbanPeserta.id, numId))
      .returning();

    if (!updated.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error("Error patch peserta qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** DELETE admin: hapus peserta (shohibul & setoran ikut, cascade). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const deleted = await db.delete(qurbanPeserta).where(eq(qurbanPeserta.id, numId)).returning({ id: qurbanPeserta.id });
    if (!deleted.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error delete peserta qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
```

Catatan: trik `validatePeserta` dengan placeholder "Valid*" pada field yang tidak dikirim memakai fakta bahwa placeholder sengaja memenuhi semua aturan — sehingga error hanya mungkin berasal dari field yang benar-benar dikirim.

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run: `npm test 2>&1 | grep -A3 qurban`
Expected: semua test PASS (9 + 8).

- [ ] **Step 5: Commit**

```bash
git add app/api/qurban-peserta/\[id\] test/api/qurban-peserta-detail.test.ts
git commit -m "feat(api): detail, update & hapus peserta tabungan qurban

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: API `/api/qurban-shohibul` + `/[id]` — kelola shohibul

**Files:**
- Create: `test/api/qurban-shohibul.test.ts`
- Create: `app/api/qurban-shohibul/route.ts`
- Create: `app/api/qurban-shohibul/[id]/route.ts`

**Interfaces:**
- Consumes: tabel qurban (Task 1), `getActor` (lib/audit).
- Produces:
  - `POST /api/qurban-shohibul` (admin) → body `{ pesertaId, nama }` → `{ ok: true, id }`.
  - `PATCH /api/qurban-shohibul/[id]` (admin) → body `{ nama }` → row ter-update.
  - `DELETE /api/qurban-shohibul/[id]` (admin) → `{ ok: true }`; **ditolak (400)** bila shohibul terakhir milik pesertanya.

- [ ] **Step 1: Tulis test yang gagal — `test/api/qurban-shohibul.test.ts`**

```ts
import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { auth } from '../../lib/auth';
import { POST } from '../../app/api/qurban-shohibul/route';
import { PATCH, DELETE } from '../../app/api/qurban-shohibul/[id]/route';
import { call } from '../helpers/request';
import { reset, closeDb, db } from '../helpers/db';
import { qurbanPeserta, qurbanShohibul } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';

let currentSession: any = null;
(auth.api as any).getSession = async () => currentSession;

let pesertaId: number;

beforeEach(async () => {
  currentSession = { user: { id: 'u1', name: 'Admin' } };
  await reset(qurbanShohibul, qurbanPeserta);
  const [row] = await db.insert(qurbanPeserta).values({
    namaPeserta: 'Budi Santoso',
    alamat: 'Jl. Mawar No. 4',
    whatsapp: '628123456789',
    namaBank: 'Mandiri',
    nomorRekening: '1122334455',
    namaPemilikRekening: 'BUDI SANTOSO',
    periode: '2027',
  }).returning();
  pesertaId = row.id;
});
after(closeDb);

test('POST tanpa sesi -> 401', async () => {
  currentSession = null;
  const { status } = await call(POST, { method: 'POST', body: { pesertaId, nama: 'Fatimah' } });
  assert.equal(status, 401);
});

test('POST valid -> 200, tersimpan', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: { pesertaId, nama: 'Fatimah' } });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  const rows = await db.select().from(qurbanShohibul).where(eq(qurbanShohibul.pesertaId, pesertaId));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].nama, 'Fatimah');
});

test('POST peserta tidak ada -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { pesertaId: 9999, nama: 'Fatimah' } });
  assert.equal(status, 400);
});

test('POST nama terlalu pendek -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { pesertaId, nama: 'Ab' } });
  assert.equal(status, 400);
});

test('PATCH ubah nama -> 200', async () => {
  const [sh] = await db.insert(qurbanShohibul).values({ pesertaId, nama: 'Fatimah', urutan: 0 }).returning();
  const { status, body } = await call(PATCH, { method: 'PATCH', params: { id: String(sh.id) }, body: { nama: 'Fatimah Binti Abdullah' } });
  assert.equal(status, 200);
  assert.equal(body.nama, 'Fatimah Binti Abdullah');
});

test('DELETE shohibul terakhir -> 400 (ditolak)', async () => {
  const [sh] = await db.insert(qurbanShohibul).values({ pesertaId, nama: 'Fatimah', urutan: 0 }).returning();
  const { status } = await call(DELETE, { method: 'DELETE', params: { id: String(sh.id) } });
  assert.equal(status, 400);
});

test('DELETE salah satu dari 2 shohibul -> 200', async () => {
  const [sh1] = await db.insert(qurbanShohibul).values({ pesertaId, nama: 'Fatimah', urutan: 0 }).returning();
  await db.insert(qurbanShohibul).values({ pesertaId, nama: 'Abdullah', urutan: 1 });
  const { status, body } = await call(DELETE, { method: 'DELETE', params: { id: String(sh1.id) } });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  const rows = await db.select().from(qurbanShohibul).where(eq(qurbanShohibul.pesertaId, pesertaId));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].nama, 'Abdullah');
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npm test 2>&1 | grep -A2 qurban-shohibul`
Expected: FAIL — module belum ada.

- [ ] **Step 3: Implementasi `app/api/qurban-shohibul/route.ts`**

```ts
import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { qurbanPeserta, qurbanShohibul } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** POST admin: tambah shohibul ke peserta. */
export async function POST(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const pesertaId = Number(body?.pesertaId);
    const nama = String(body?.nama ?? "").trim();

    if (!Number.isInteger(pesertaId)) return NextResponse.json({ error: "Peserta wajib dipilih" }, { status: 400 });
    if (nama.length < 3 || nama.length > 100)
      return NextResponse.json({ error: "Nama shohibul wajib diisi (3–100 karakter)" }, { status: 400 });

    const exists = await db.select({ id: qurbanPeserta.id }).from(qurbanPeserta).where(eq(qurbanPeserta.id, pesertaId)).limit(1);
    if (!exists.length) return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 400 });

    const [{ maxUrutan }] = await db
      .select({ maxUrutan: sql<number>`coalesce(max(${qurbanShohibul.urutan}), -1)` })
      .from(qurbanShohibul)
      .where(eq(qurbanShohibul.pesertaId, pesertaId));

    const [created] = await db
      .insert(qurbanShohibul)
      .values({ pesertaId, nama, urutan: Number(maxUrutan) + 1, createdById: actor.id, updatedById: actor.id })
      .returning({ id: qurbanShohibul.id });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (error: any) {
    console.error("Error creating shohibul qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Implementasi `app/api/qurban-shohibul/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { qurbanShohibul } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** PATCH admin: ubah nama shohibul. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const body = await req.json();
    const nama = String(body?.nama ?? "").trim();
    if (nama.length < 3 || nama.length > 100)
      return NextResponse.json({ error: "Nama shohibul wajib diisi (3–100 karakter)" }, { status: 400 });

    const updated = await db
      .update(qurbanShohibul)
      .set({ nama, updatedById: actor.id, updatedAt: new Date() })
      .where(eq(qurbanShohibul.id, numId))
      .returning();

    if (!updated.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error("Error patch shohibul qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** DELETE admin: hapus shohibul — ditolak bila merupakan shohibul terakhir pesertanya. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const rows = await db.select().from(qurbanShohibul).where(eq(qurbanShohibul.id, numId)).limit(1);
    if (!rows.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const semua = await db.select({ id: qurbanShohibul.id }).from(qurbanShohibul).where(eq(qurbanShohibul.pesertaId, rows[0].pesertaId));
    if (semua.length <= 1)
      return NextResponse.json({ error: "Peserta minimal harus memiliki 1 shohibul" }, { status: 400 });

    await db.delete(qurbanShohibul).where(eq(qurbanShohibul.id, numId));
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error delete shohibul qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 5: Jalankan seluruh test, pastikan lulus**

Run: `npm test`
Expected: SEMUA test PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api/qurban-shohibul test/api/qurban-shohibul.test.ts
git commit -m "feat(api): kelola shohibul qurban (tambah, ubah nama, hapus)

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: API `/api/qurban-setoran` + `/[id]` — catat, koreksi, hapus setoran

**Files:**
- Create: `test/api/qurban-setoran.test.ts`
- Create: `app/api/qurban-setoran/route.ts`
- Create: `app/api/qurban-setoran/[id]/route.ts`

**Interfaces:**
- Consumes: tabel qurban (Task 1), `getActor` (lib/audit).
- Produces:
  - `GET /api/qurban-setoran?pesertaId=` (admin) → array setoran (+ `namaPeserta` via join), urut tanggal desc.
  - `POST /api/qurban-setoran` (admin) → `{ ok: true, id }`.
  - `PATCH /api/qurban-setoran/[id]` (admin) → subset (`tanggal`, `jumlah`, `metodePembayaran`, `keterangan`).
  - `DELETE /api/qurban-setoran/[id]` (admin) → `{ ok: true }`.

- [ ] **Step 1: Tulis test yang gagal — `test/api/qurban-setoran.test.ts`**

```ts
import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { auth } from '../../lib/auth';
import { GET, POST } from '../../app/api/qurban-setoran/route';
import { PATCH, DELETE } from '../../app/api/qurban-setoran/[id]/route';
import { call } from '../helpers/request';
import { reset, closeDb, db } from '../helpers/db';
import { qurbanPeserta, qurbanShohibul, qurbanSetoran } from '../../lib/db/schema';

let currentSession: any = null;
(auth.api as any).getSession = async () => currentSession;

let pesertaId: number;

beforeEach(async () => {
  currentSession = { user: { id: 'u1', name: 'Admin' } };
  await reset(qurbanSetoran, qurbanShohibul, qurbanPeserta);
  const [row] = await db.insert(qurbanPeserta).values({
    namaPeserta: 'Budi Santoso',
    alamat: 'Jl. Mawar No. 4',
    whatsapp: '628123456789',
    namaBank: 'Mandiri',
    nomorRekening: '1122334455',
    namaPemilikRekening: 'BUDI SANTOSO',
    periode: '2027',
  }).returning();
  pesertaId = row.id;
});
after(closeDb);

const validBody = () => ({
  pesertaId,
  tanggal: '2026-03-15',
  jumlah: 250000,
  metodePembayaran: 'tunai_sekretariat',
  keterangan: 'Setoran Maret',
});

test('POST tanpa sesi -> 401', async () => {
  currentSession = null;
  const { status } = await call(POST, { method: 'POST', body: validBody() });
  assert.equal(status, 401);
});

test('POST valid -> 200, tersimpan', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: validBody() });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  const rows = await db.select().from(qurbanSetoran);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].jumlah, 250000);
});

test('POST jumlah <= 0 -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { ...validBody(), jumlah: 0 } });
  assert.equal(status, 400);
});

test('POST peserta tidak ada -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { ...validBody(), pesertaId: 9999 } });
  assert.equal(status, 400);
});

test('POST metode tidak valid -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { ...validBody(), metodePembayaran: 'gojek' } });
  assert.equal(status, 400);
});

test('GET ?pesertaId -> riwayat urut tanggal desc + nama peserta', async () => {
  await db.insert(qurbanSetoran).values([
    { pesertaId, tanggal: new Date('2026-01-10'), jumlah: 100000, metodePembayaran: 'qris' },
    { pesertaId, tanggal: new Date('2026-02-10'), jumlah: 200000, metodePembayaran: 'qris' },
  ]);
  const res = await GET(new Request(`http://localhost/api/qurban-setoran?pesertaId=${pesertaId}`));
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.length, 2);
  assert.equal(body[0].jumlah, 200000); // desc
  assert.equal(body[0].namaPeserta, 'Budi Santoso');
});

test('PATCH ubah jumlah -> 200', async () => {
  const [row] = await db.insert(qurbanSetoran).values({ pesertaId, tanggal: new Date(), jumlah: 100000, metodePembayaran: 'qris' }).returning();
  const { status, body } = await call(PATCH, { method: 'PATCH', params: { id: String(row.id) }, body: { jumlah: 150000 } });
  assert.equal(status, 200);
  assert.equal(body.jumlah, 150000);
});

test('DELETE -> 200', async () => {
  const [row] = await db.insert(qurbanSetoran).values({ pesertaId, tanggal: new Date(), jumlah: 100000, metodePembayaran: 'qris' }).returning();
  const { status, body } = await call(DELETE, { method: 'DELETE', params: { id: String(row.id) } });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npm test 2>&1 | grep -A2 qurban-setoran`
Expected: FAIL — module belum ada.

- [ ] **Step 3: Implementasi `app/api/qurban-setoran/route.ts`**

```ts
import { NextResponse } from "next/server";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { db } from "@/lib/db";
import { qurbanPeserta, qurbanSetoran } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

const METODE_VALID = ["transfer_bank", "qris", "tunai_sekretariat"];

/** GET admin: riwayat setoran, opsional filter ?pesertaId=. */
export async function GET(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const pesertaParam = searchParams.get("pesertaId");

    const rows = await db
      .select({
        ...getTableColumns(qurbanSetoran),
        namaPeserta: qurbanPeserta.namaPeserta,
      })
      .from(qurbanSetoran)
      .innerJoin(qurbanPeserta, eq(qurbanPeserta.id, qurbanSetoran.pesertaId))
      .where(
        pesertaParam && Number.isInteger(Number(pesertaParam))
          ? eq(qurbanSetoran.pesertaId, Number(pesertaParam))
          : undefined
      )
      .orderBy(desc(qurbanSetoran.tanggal), desc(qurbanSetoran.id));

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Error fetching setoran qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** POST admin: catat setoran baru. */
export async function POST(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const pesertaId = Number(body?.pesertaId);
    const tanggal = new Date(String(body?.tanggal ?? ""));
    const jumlah = Number(body?.jumlah);
    const metodePembayaran = String(body?.metodePembayaran ?? "");
    const keterangan = body?.keterangan ? String(body.keterangan).trim() : null;

    if (!Number.isInteger(pesertaId)) {
      return NextResponse.json({ error: "Peserta wajib dipilih" }, { status: 400 });
    }
    const exists = await db.select({ id: qurbanPeserta.id }).from(qurbanPeserta).where(eq(qurbanPeserta.id, pesertaId)).limit(1);
    if (!exists.length) return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 400 });
    if (Number.isNaN(tanggal.getTime())) return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });
    if (!Number.isInteger(jumlah) || jumlah <= 0) return NextResponse.json({ error: "Jumlah setoran tidak valid (> 0)" }, { status: 400 });
    if (!METODE_VALID.includes(metodePembayaran)) return NextResponse.json({ error: "Metode pembayaran tidak valid" }, { status: 400 });
    if (keterangan && keterangan.length > 500) return NextResponse.json({ error: "Keterangan maksimal 500 karakter" }, { status: 400 });

    const [created] = await db
      .insert(qurbanSetoran)
      .values({
        pesertaId,
        tanggal,
        jumlah,
        metodePembayaran: metodePembayaran as "transfer_bank" | "qris" | "tunai_sekretariat",
        keterangan,
        createdById: actor.id,
        updatedById: actor.id,
      })
      .returning({ id: qurbanSetoran.id });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (error: any) {
    console.error("Error creating setoran qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Implementasi `app/api/qurban-setoran/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { qurbanSetoran } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

const METODE_VALID = ["transfer_bank", "qris", "tunai_sekretariat"];

/** PATCH admin: koreksi setoran (subset field). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const body = await req.json();
    const patch: Record<string, unknown> = {};

    if (body?.tanggal !== undefined) {
      const tanggal = new Date(String(body.tanggal));
      if (Number.isNaN(tanggal.getTime())) return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });
      patch.tanggal = tanggal;
    }
    if (body?.jumlah !== undefined) {
      const jumlah = Number(body.jumlah);
      if (!Number.isInteger(jumlah) || jumlah <= 0) return NextResponse.json({ error: "Jumlah setoran tidak valid (> 0)" }, { status: 400 });
      patch.jumlah = jumlah;
    }
    if (body?.metodePembayaran !== undefined) {
      const metode = String(body.metodePembayaran);
      if (!METODE_VALID.includes(metode)) return NextResponse.json({ error: "Metode pembayaran tidak valid" }, { status: 400 });
      patch.metodePembayaran = metode;
    }
    if (body?.keterangan !== undefined) patch.keterangan = String(body.keterangan).trim() || null;

    if (!Object.keys(patch).length)
      return NextResponse.json({ error: "Tidak ada perubahan yang dikirim" }, { status: 400 });

    const updated = await db
      .update(qurbanSetoran)
      .set({ ...patch, updatedById: actor.id, updatedAt: new Date() })
      .where(eq(qurbanSetoran.id, numId))
      .returning();

    if (!updated.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error("Error patch setoran qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** DELETE admin: hapus setoran. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const deleted = await db.delete(qurbanSetoran).where(eq(qurbanSetoran.id, numId)).returning({ id: qurbanSetoran.id });
    if (!deleted.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error delete setoran qurban:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
```

- [ ] **Step 5: Jalankan seluruh test, pastikan lulus**

Run: `npm test`
Expected: SEMUA test PASS (termasuk 5 file qurban).

- [ ] **Step 6: Commit**

```bash
git add app/api/qurban-setoran test/api/qurban-setoran.test.ts
git commit -m "feat(api): pencatatan setoran tabungan qurban (admin)

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 6: Halaman publik `app/(site)/tabungan-qurban/page.tsx` (daftar shohibul dinamis)

**Files:**
- Create: `app/(site)/tabungan-qurban/page.tsx`

**Interfaces:**
- Consumes: `POST /api/qurban-peserta` (Task 2; body memuat `shohibul: string[]`).
- Produces: halaman `/tabungan-qurban` (publik).

- [ ] **Step 1: Buat halaman form pendaftaran**

```tsx
"use client";

import React, { useState } from "react";
import { PiggyBank, User, Users, MapPin, Phone, Landmark, CreditCard, CheckCircle2, Plus, Trash2 } from "lucide-react";

type FormState = {
  namaPeserta: string;
  alamat: string;
  whatsapp: string;
  namaBank: string;
  nomorRekening: string;
  namaPemilikRekening: string;
  periode: string;
  persetujuan: boolean;
};

const tahunSekarang = new Date().getFullYear();
const PERIODE_OPTIONS = [String(tahunSekarang + 1), String(tahunSekarang + 2)];

const INPUT_CLS =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";

export default function TabunganQurbanPage() {
  const [form, setForm] = useState<FormState>({
    namaPeserta: "",
    alamat: "",
    whatsapp: "",
    namaBank: "",
    nomorRekening: "",
    namaPemilikRekening: "",
    periode: PERIODE_OPTIONS[0],
    persetujuan: false,
  });
  const [shohibul, setShohibul] = useState<string[]>([""]);
  const [sukses, setSukses] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof FormState, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const setShohibulAt = (i: number, v: string) =>
    setShohibul((arr) => arr.map((s, idx) => (idx === i ? v : s)));

  const tambahShohibul = () => {
    if (shohibul.length < 10) setShohibul((arr) => [...arr, ""]);
  };

  const hapusShohibul = (i: number) => {
    if (shohibul.length > 1) setShohibul((arr) => arr.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const shohibulBersih = shohibul.map((s) => s.trim()).filter(Boolean);
    if (
      !form.namaPeserta.trim() ||
      !form.alamat.trim() ||
      !form.whatsapp.trim() ||
      !form.namaBank.trim() ||
      !form.nomorRekening.trim() ||
      !form.namaPemilikRekening.trim()
    ) {
      setError("Mohon lengkapi semua data.");
      return;
    }
    if (shohibulBersih.length === 0) {
      setError("Mohon isi minimal satu nama shohibul qurban.");
      return;
    }
    if (!form.persetujuan) {
      setError("Mohon setujui ketentuan program tabungan qurban.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/qurban-peserta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaPeserta: form.namaPeserta.trim(),
          alamat: form.alamat.trim(),
          whatsapp: form.whatsapp.trim(),
          namaBank: form.namaBank.trim(),
          nomorRekening: form.nomorRekening.trim(),
          namaPemilikRekening: form.namaPemilikRekening.trim(),
          periode: form.periode,
          shohibul: shohibulBersih,
        }),
      });
      if (res.ok) {
        setSukses(true);
      } else {
        const err = await res.json();
        setError(err.error || "Pendaftaran gagal. Silakan coba lagi.");
      }
    } catch (e) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Hero */}
      <section className="bg-emerald-900 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-400/20 mb-4">
            <PiggyBank className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Tabungan Qurban</h1>
          <p className="text-emerald-100 max-w-2xl mx-auto">
            Niatkan qurban dengan menabung bertahap. Daftarkan diri Anda beserta nama-nama
            shohibul qurban yang akan ditabungkan, lalu setoran dapat dilakukan bertahap
            melalui sekretariat DKM hingga memenuhi nilai qurban pada periode yang dipilih.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        {sukses ? (
          <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-emerald-900 mb-2">Pendaftaran Terkirim</h2>
            <p className="text-gray-600">
              Jazakumullahu khairan. Pendaftaran Anda sedang menunggu verifikasi admin DKM.
              Kami akan menghubungi Anda melalui WhatsApp untuk proses selanjutnya.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-emerald-950 mb-1">Form Pendaftaran</h2>
              <p className="text-sm text-gray-500">
                Data rekening digunakan sebagai rekening tujuan <strong>pemulangan dana</strong> bila
                dana qurban tidak tersalurkan — bukan rekening tujuan setoran.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 text-emerald-700" /> Nama Peserta Tabungan *
                </label>
                <input className={INPUT_CLS} value={form.namaPeserta} onChange={(e) => set("namaPeserta", e.target.value)} placeholder="Nama lengkap penabung" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Periode Qurban *</label>
                <select className={INPUT_CLS} value={form.periode} onChange={(e) => set("periode", e.target.value)}>
                  {PERIODE_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 text-emerald-700" /> Alamat Lengkap *
                </label>
                <textarea className={INPUT_CLS} rows={2} value={form.alamat} onChange={(e) => set("alamat", e.target.value)} placeholder="Alamat tempat tinggal" />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 text-emerald-700" /> Nomor WhatsApp *
                </label>
                <input className={INPUT_CLS} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="08xxxxxxxxxx" inputMode="tel" />
              </div>

              {/* Daftar shohibul dinamis */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Users className="w-4 h-4 text-emerald-700" /> Nama Shohibul Qurban / Muqorib * <span className="text-xs text-gray-400">(maks. 10)</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">Bila menabung untuk diri sendiri, isi nama Anda sendiri.</p>
                <div className="space-y-2">
                  {shohibul.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className={INPUT_CLS}
                        value={s}
                        onChange={(e) => setShohibulAt(i, e.target.value)}
                        placeholder={`Nama shohibul ${i + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => hapusShohibul(i)}
                        disabled={shohibul.length <= 1}
                        className="px-3 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={tambahShohibul}
                  disabled={shohibul.length >= 10}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-800 hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" /> Tambah Shohibul
                </button>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Landmark className="w-4 h-4 text-emerald-700" /> Nama Bank *
                </label>
                <input className={INPUT_CLS} value={form.namaBank} onChange={(e) => set("namaBank", e.target.value)} placeholder="cth. BSI, BRI, Mandiri" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <CreditCard className="w-4 h-4 text-emerald-700" /> Nomor Rekening *
                </label>
                <input className={INPUT_CLS} value={form.nomorRekening} onChange={(e) => set("nomorRekening", e.target.value)} placeholder="Nomor rekening" inputMode="numeric" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nama Pemilik Rekening *</label>
                <input className={INPUT_CLS} value={form.namaPemilikRekening} onChange={(e) => set("namaPemilikRekening", e.target.value)} placeholder="Sesuai buku tabungan" />
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.persetujuan}
                onChange={(e) => set("persetujuan", e.target.checked)}
                className="mt-1 w-4 h-4 accent-emerald-700"
              />
              <span>
                Saya menyetujui ketentuan program Tabungan Qurban Masjid Al-Kahfi, dan memahami bahwa
                setoran dilakukan melalui sekretariat DKM serta dicatat oleh pengurus.
              </span>
            </label>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-900 text-white hover:bg-emerald-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold px-6 py-3 rounded-lg transition"
            >
              {loading ? "Mengirim..." : "Daftar Tabungan Qurban"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verifikasi build**

Run: `npm run build`
Expected: build sukses, route `/tabungan-qurban` ter-generate.

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/tabungan-qurban"
git commit -m "feat(site): halaman publik pendaftaran tabungan qurban (multi shohibul)

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 7: Halaman admin + menu sidebar

**Files:**
- Create: `app/admin/(protected)/tabungan-qurban/page.tsx`
- Modify: `app/admin/components/Sidebar.tsx`

**Interfaces:**
- Consumes: `GET ?admin=1` (Task 2), `GET/PATCH/DELETE /api/qurban-peserta/[id]` (Task 3), `POST /api/qurban-shohibul`, `PATCH/DELETE /api/qurban-shohibul/[id]` (Task 4), `POST /api/qurban-setoran`, `DELETE /api/qurban-setoran/[id]` (Task 5).
- Produces: halaman `/admin/tabungan-qurban`.

- [ ] **Step 1: Tambah menu sidebar**

Di `app/admin/components/Sidebar.tsx`:
1. Tambah `PiggyBank` ke import `lucide-react` yang ada.
2. Pada array nav grup Donasi (sekitar baris 131–133), tambahkan setelah baris Donatur Tetap:

```ts
        { href: "/admin/tabungan-qurban", label: "Tabungan Qurban", icon: PiggyBank },
```

- [ ] **Step 2: Buat halaman admin**

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, MessageCircle, Trash2, Save, X, Plus, PiggyBank, UserPlus, Users } from "lucide-react";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

type Peserta = {
  id: number;
  namaPeserta: string;
  alamat: string;
  whatsapp: string;
  namaBank: string;
  nomorRekening: string;
  namaPemilikRekening: string;
  periode: string;
  status: "baru" | "aktif" | "selesai" | "berhenti";
  catatanAdmin: string | null;
  saldo: number;
  shohibul: string[];
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string;
};

type Shohibul = { id: number; pesertaId: number; nama: string; urutan: number };

type Setoran = {
  id: number;
  pesertaId: number;
  tanggal: string;
  jumlah: number;
  metodePembayaran: "transfer_bank" | "qris" | "tunai_sekretariat";
  keterangan: string | null;
};

type Detail = Omit<Peserta, "shohibul"> & { shohibul: Shohibul[]; setoran: Setoran[] };

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "baru", label: "Baru" },
  { value: "aktif", label: "Aktif" },
  { value: "selesai", label: "Selesai" },
  { value: "berhenti", label: "Berhenti" },
];

const STATUS_COLORS: Record<string, string> = {
  baru: "bg-gray-100 text-gray-700",
  aktif: "bg-emerald-100 text-emerald-700",
  selesai: "bg-blue-100 text-blue-700",
  berhenti: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  baru: "Baru",
  aktif: "Aktif",
  selesai: "Selesai",
  berhenti: "Berhenti",
};

const METODE_LABEL: Record<string, string> = {
  transfer_bank: "Transfer Bank",
  qris: "QRIS",
  tunai_sekretariat: "Tunai Sekretariat",
};

const INPUT_CLS =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm";

export default function TabunganQurbanAdminPage() {
  const [data, setData] = useState<Peserta[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [periodeFilter, setPeriodeFilter] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form setoran baru
  const [formSetoran, setFormSetoran] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    jumlah: "",
    metodePembayaran: "tunai_sekretariat",
    keterangan: "",
  });
  // form tambah shohibul + edit nama shohibul inline
  const [namaShohibulBaru, setNamaShohibulBaru] = useState("");
  const [editShohibul, setEditShohibul] = useState<{ id: number; nama: string } | null>(null);

  const filtered = data.filter((d) => {
    if (statusFilter && d.status !== statusFilter) return false;
    if (periodeFilter && d.periode !== periodeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.namaPeserta.toLowerCase().includes(q) ||
        d.shohibul.some((s) => s.toLowerCase().includes(q)) ||
        d.whatsapp.includes(q)
      );
    }
    return true;
  });

  const periodes = Array.from(new Set(data.map((d) => d.periode))).sort().reverse();

  const fetchData = async () => {
    try {
      const res = await fetch("/api/qurban-peserta?admin=1");
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error("Gagal memuat data:", e);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (p: Peserta) => {
    setDetail({ ...p, shohibul: [], setoran: [] });
    try {
      const res = await fetch(`/api/qurban-peserta/${p.id}`);
      if (res.ok) setDetail(await res.json());
    } catch (e) {
      console.error("Gagal memuat detail:", e);
    }
  };

  const refreshDetail = async (id: number) => {
    const res = await fetch(`/api/qurban-peserta/${id}`);
    if (res.ok) setDetail(await res.json());
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCatatSetoran = async () => {
    if (!detail) return;
    const jumlah = parseInt(formSetoran.jumlah.replace(/\D/g, ""), 10);
    if (!jumlah || jumlah <= 0) {
      alert("Nominal setoran tidak valid.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/qurban-setoran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pesertaId: detail.id,
          tanggal: formSetoran.tanggal,
          jumlah,
          metodePembayaran: formSetoran.metodePembayaran,
          keterangan: formSetoran.keterangan || undefined,
        }),
      });
      if (res.ok) {
        setFormSetoran({ tanggal: new Date().toISOString().slice(0, 10), jumlah: "", metodePembayaran: "tunai_sekretariat", keterangan: "" });
        refreshDetail(detail.id);
      } else {
        const err = await res.json();
        alert(err.error || "Gagal mencatat setoran.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleHapusSetoran = async (sid: number) => {
    if (!detail || !confirm("Hapus setoran ini?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/qurban-setoran/${sid}`, { method: "DELETE" });
      if (res.ok) refreshDetail(detail.id);
      else alert("Gagal menghapus setoran.");
    } finally {
      setSaving(false);
    }
  };

  const handleTambahShohibul = async () => {
    if (!detail) return;
    const nama = namaShohibulBaru.trim();
    if (nama.length < 3) {
      alert("Nama shohibul minimal 3 karakter.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/qurban-shohibul", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pesertaId: detail.id, nama }),
      });
      if (res.ok) {
        setNamaShohibulBaru("");
        refreshDetail(detail.id);
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menambah shohibul.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSimpanNamaShohibul = async () => {
    if (!detail || !editShohibul) return;
    const nama = editShohibul.nama.trim();
    if (nama.length < 3) {
      alert("Nama shohibul minimal 3 karakter.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/qurban-shohibul/${editShohibul.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama }),
      });
      if (res.ok) {
        setEditShohibul(null);
        refreshDetail(detail.id);
      } else {
        const err = await res.json();
        alert(err.error || "Gagal mengubah nama shohibul.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleHapusShohibul = async (sid: number) => {
    if (!detail || !confirm("Hapus shohibul ini dari daftar?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/qurban-shohibul/${sid}`, { method: "DELETE" });
      if (res.ok) refreshDetail(detail.id);
      else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus shohibul.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUbahStatus = async (status: Peserta["status"]) => {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/qurban-peserta/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, catatanAdmin: detail.catatanAdmin || undefined }),
      });
      if (res.ok) refreshDetail(detail.id);
      else {
        const err = await res.json();
        alert(err.error || "Gagal mengubah status.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSimpanCatatan = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/qurban-peserta/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catatanAdmin: detail.catatanAdmin ?? "" }),
      });
      if (res.ok) refreshDetail(detail.id);
      else alert("Gagal menyimpan catatan.");
    } finally {
      setSaving(false);
    }
  };

  const handleHapusPeserta = async () => {
    if (!detail || !confirm("Yakin ingin menghapus peserta ini beserta seluruh shohibul & riwayat setorannya?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/qurban-peserta/${detail.id}`, { method: "DELETE" });
      if (res.ok) {
        setDetail(null);
        fetchData();
      } else alert("Gagal menghapus peserta.");
    } finally {
      setSaving(false);
    }
  };

  const bukaWa = (wa: string) => {
    const msg = `Assalamu'alaikum wr. wb. Terima kasih telah mendaftar Tabungan Qurban Masjid Al-Kahfi. Pendaftaran Bapak/Ibu telah kami terima dan akan diverifikasi. Barakallahu fiikum.`;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950">Tabungan Qurban</h1>
          <p className="text-gray-600 text-sm">Kelola peserta, shohibul & setoran tabungan qurban</p>
        </div>
      </div>

      {/* Filter & search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama peserta, shohibul, atau WhatsApp..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 w-4 h-4" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={periodeFilter} onChange={(e) => setPeriodeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            <option value="">Semua Periode</option>
            {periodes.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Tabel peserta */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada peserta.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Peserta</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Shohibul Qurban</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">WhatsApp</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Periode</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Saldo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((d, idx) => (
                  <tr key={d.id} onClick={() => openDetail(d)} className="hover:bg-gray-50 cursor-pointer transition">
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{d.namaPeserta}</td>
                    <td className="px-4 py-3 text-gray-600">{d.shohibul.join(", ")}</td>
                    <td className="px-4 py-3 text-gray-600">{d.whatsapp}</td>
                    <td className="px-4 py-3 text-gray-600">{d.periode}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-900">{rupiah(d.saldo)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[d.status]}`}>{STATUS_LABEL[d.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal detail */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-emerald-950 flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-emerald-700" /> Detail Peserta — Saldo {rupiah(detail.saldo)}
              </h2>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Data peserta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-semibold text-gray-500 uppercase">Nama Peserta</label><p className="font-medium text-gray-900">{detail.namaPeserta}</p></div>
                <div><label className="text-xs font-semibold text-gray-500 uppercase">Periode</label><p className="text-gray-700">{detail.periode}</p></div>
                <div className="md:col-span-2"><label className="text-xs font-semibold text-gray-500 uppercase">Alamat</label><p className="text-gray-700">{detail.alamat}</p></div>
                <div><label className="text-xs font-semibold text-gray-500 uppercase">WhatsApp</label><p className="text-gray-700">{detail.whatsapp}</p></div>
                <div><label className="text-xs font-semibold text-gray-500 uppercase">Bank</label><p className="text-gray-700">{detail.namaBank}</p></div>
                <div className="md:col-span-2"><label className="text-xs font-semibold text-gray-500 uppercase">No. Rekening</label><p className="text-gray-700">{detail.nomorRekening} — a.n. {detail.namaPemilikRekening}</p></div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Catatan Admin</label>
                  <textarea value={detail.catatanAdmin || ""} onChange={(e) => setDetail({ ...detail, catatanAdmin: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
                </div>
              </div>

              {/* Kelola shohibul */}
              <div>
                <h3 className="font-semibold text-emerald-950 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Shohibul Qurban ({detail.shohibul.length})
                </h3>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 mb-3">
                  {detail.shohibul.map((s) => (
                    <div key={s.id} className="flex justify-between items-center px-4 py-2 text-sm">
                      {editShohibul?.id === s.id ? (
                        <div className="flex gap-2 flex-1">
                          <input value={editShohibul.nama} onChange={(e) => setEditShohibul({ ...editShohibul, nama: e.target.value })} className={INPUT_CLS} />
                          <button onClick={handleSimpanNamaShohibul} disabled={saving} className="text-emerald-700 hover:text-emerald-900 px-2" title="Simpan nama"><Save size={16} /></button>
                          <button onClick={() => setEditShohibul(null)} className="text-gray-400 hover:text-gray-600 px-2" title="Batal"><X size={16} /></button>
                        </div>
                      ) : (
                        <>
                          <span className="text-gray-800">{s.nama}</span>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setEditShohibul({ id: s.id, nama: s.nama })} className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold">Ubah</button>
                            <button onClick={() => handleHapusShohibul(s.id)} className="text-red-500 hover:text-red-700" title="Hapus shohibul"><Trash2 size={16} /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={namaShohibulBaru} onChange={(e) => setNamaShohibulBaru(e.target.value)} placeholder="Nama shohibul baru" className={INPUT_CLS} />
                  <button onClick={handleTambahShohibul} disabled={saving} className="flex items-center gap-1 bg-emerald-900 text-white hover:bg-emerald-800 disabled:bg-gray-400 font-semibold px-4 py-2 rounded-lg transition text-sm whitespace-nowrap">
                    <UserPlus size={16} /> Tambah
                  </button>
                </div>
              </div>

              {/* Form catat setoran */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2"><Plus className="w-4 h-4" /> Catat Setoran</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input type="date" value={formSetoran.tanggal} onChange={(e) => setFormSetoran({ ...formSetoran, tanggal: e.target.value })} className={INPUT_CLS} />
                  <input type="text" inputMode="numeric" value={formSetoran.jumlah} onChange={(e) => setFormSetoran({ ...formSetoran, jumlah: e.target.value })} placeholder="Nominal (Rp)" className={INPUT_CLS} />
                  <select value={formSetoran.metodePembayaran} onChange={(e) => setFormSetoran({ ...formSetoran, metodePembayaran: e.target.value })} className={INPUT_CLS}>
                    <option value="transfer_bank">Transfer Bank</option>
                    <option value="qris">QRIS</option>
                    <option value="tunai_sekretariat">Tunai Sekretariat</option>
                  </select>
                  <button onClick={handleCatatSetoran} disabled={saving} className="bg-emerald-900 text-white hover:bg-emerald-800 disabled:bg-gray-400 font-semibold px-4 py-2 rounded-lg transition text-sm">
                    {saving ? "Menyimpan..." : "Simpan Setoran"}
                  </button>
                </div>
                <input type="text" value={formSetoran.keterangan} onChange={(e) => setFormSetoran({ ...formSetoran, keterangan: e.target.value })} placeholder="Keterangan (opsional)" className={`${INPUT_CLS} mt-3`} />
              </div>

              {/* Riwayat setoran */}
              <div>
                <h3 className="font-semibold text-emerald-950 mb-3">Riwayat Setoran ({detail.setoran.length})</h3>
                {detail.setoran.length === 0 ? (
                  <p className="text-sm text-gray-500">Belum ada setoran.</p>
                ) : (
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {detail.setoran.map((s) => (
                      <div key={s.id} className="flex justify-between items-center px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{rupiah(s.jumlah)} <span className="text-gray-500 font-normal">· {METODE_LABEL[s.metodePembayaran]}</span></p>
                          <p className="text-xs text-gray-500">{new Date(s.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}{s.keterangan ? ` — ${s.keterangan}` : ""}</p>
                        </div>
                        <button onClick={() => handleHapusSetoran(s.id)} className="text-red-500 hover:text-red-700" title="Hapus setoran"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer aksi */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-500 uppercase mr-2">Status:</label>
                <select value={detail.status} onChange={(e) => handleUbahStatus(e.target.value as Peserta["status"])}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm">
                  <option value="baru">Baru</option>
                  <option value="aktif">Aktif</option>
                  <option value="selesai">Selesai</option>
                  <option value="berhenti">Berhenti</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSimpanCatatan} disabled={saving} className="flex items-center gap-2 bg-emerald-900 text-white hover:bg-emerald-800 disabled:bg-gray-400 font-semibold px-4 py-2 rounded-lg transition">
                  <Save size={16} /> Simpan Catatan
                </button>
                <button onClick={() => bukaWa(detail.whatsapp)} className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 font-semibold px-4 py-2 rounded-lg transition">
                  <MessageCircle size={16} /> Chat WA
                </button>
                <button onClick={handleHapusPeserta} disabled={saving} className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 font-semibold px-4 py-2 rounded-lg transition">
                  <Trash2 size={16} /> Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

Catatan: `handleSimpanCatatan` mengirim `catatanAdmin` (string kosong → server simpan `null`); `handleUbahStatus` mengirim status + catatan sekaligus sesuai state detail. Tipe `Detail` memakai `Omit<Peserta, "shohibul">` karena bentuk `shohibul` berbeda antara list (`string[]`) dan detail (objek `Shohibul[]`).

- [ ] **Step 3: Verifikasi build**

Run: `npm run build`
Expected: build sukses.

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(protected)/tabungan-qurban" app/admin/components/Sidebar.tsx
git commit -m "feat(admin): kelola tabungan qurban — shohibul, setoran & saldo

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 8: Seed data + verifikasi penuh

**Files:**
- Modify: `lib/db/seed.ts`

**Interfaces:**
- Consumes: `qurbanPeserta`, `qurbanShohibul`, `qurbanSetoran` (Task 1).

- [ ] **Step 1: Tambah import di `lib/db/seed.ts`**

Tambahkan `qurbanPeserta`, `qurbanShohibul`, dan `qurbanSetoran` ke import dari `./schema` yang sudah ada.

- [ ] **Step 2: Tambah truncate + data di `main()`**

Di dalam `async function main()`, setelah baris `await db.delete(user);` tambahkan:

```ts
  await db.delete(qurbanSetoran);
  await db.delete(qurbanShohibul);
  await db.delete(qurbanPeserta);
```

Lalu (masih dalam `main()`, sebelum `process.exit(0)`) tambahkan blok seed:

```ts
  // === Tabungan Qurban ===
  const qurbanPesertaSeed = await db
    .insert(qurbanPeserta)
    .values([
      {
        namaPeserta: "Ahmad Hidayat",
        alamat: "Jl. Melati No. 12, RT 03/RW 05, Bandung",
        whatsapp: "6281234567890",
        namaBank: "BSI",
        nomorRekening: "7155443322",
        namaPemilikRekening: "AHMAD HIDAYAT",
        periode: "2027",
        status: "aktif",
      },
      {
        namaPeserta: "Siti Rahmawati",
        alamat: "Jl. Kenanga No. 8, RT 01/RW 03, Bandung",
        whatsapp: "6282345678901",
        namaBank: "BRI",
        nomorRekening: "0099887766",
        namaPemilikRekening: "SITI RAHMAWATI",
        periode: "2027",
        status: "baru",
      },
      {
        namaPeserta: "Budi Santoso",
        alamat: "Jl. Mawar No. 4, RT 05/RW 02, Bandung",
        whatsapp: "6283456789012",
        namaBank: "Mandiri",
        nomorRekening: "1122334455",
        namaPemilikRekening: "BUDI SANTOSO",
        periode: "2026",
        status: "selesai",
      },
    ])
    .returning();

  await db.insert(qurbanShohibul).values([
    { pesertaId: qurbanPesertaSeed[0].id, nama: "Ahmad Hidayat", urutan: 0 },
    { pesertaId: qurbanPesertaSeed[0].id, nama: "Almarhumah Aminah", urutan: 1 },
    { pesertaId: qurbanPesertaSeed[1].id, nama: "Almarhum H. Abdullah", urutan: 0 },
    { pesertaId: qurbanPesertaSeed[1].id, nama: "Almarhumah Hj. Fatimah", urutan: 1 },
    { pesertaId: qurbanPesertaSeed[1].id, nama: "Muhammad Yusuf", urutan: 2 },
    { pesertaId: qurbanPesertaSeed[2].id, nama: "Budi Santoso", urutan: 0 },
  ]);

  await db.insert(qurbanSetoran).values([
    { pesertaId: qurbanPesertaSeed[0].id, tanggal: new Date("2026-01-10"), jumlah: 500000, metodePembayaran: "tunai_sekretariat", keterangan: "Setoran Januari" },
    { pesertaId: qurbanPesertaSeed[0].id, tanggal: new Date("2026-02-10"), jumlah: 500000, metodePembayaran: "transfer_bank", keterangan: "Setoran Februari" },
    { pesertaId: qurbanPesertaSeed[0].id, tanggal: new Date("2026-03-10"), jumlah: 750000, metodePembayaran: "qris", keterangan: null },
    { pesertaId: qurbanPesertaSeed[1].id, tanggal: new Date("2026-08-01"), jumlah: 250000, metodePembayaran: "tunai_sekretariat", keterangan: "Setoran perdana" },
    { pesertaId: qurbanPesertaSeed[2].id, tanggal: new Date("2025-06-15"), jumlah: 2400000, metodePembayaran: "transfer_bank", keterangan: "Pelunasan qurban 2026" },
  ]);
  console.log("✓ Tabungan Qurban seeded");
```

- [ ] **Step 3: Jalankan seed**

Run: `npm run db:seed`
Expected: sukses tanpa error, muncul `✓ Tabungan Qurban seeded`.

- [ ] **Step 4: Verifikasi penuh**

Run: `npm test`
Expected: SEMUA test PASS.

Run: `npm run build`
Expected: build sukses.

Run: `npm run dev` lalu uji manual:
1. `/tabungan-qurban` → isi form dengan 2 shohibul → submit → pesan sukses.
2. `/admin/tabungan-qurban` → peserta baru muncul status "Baru", kolom shohibul berisi 2 nama.
3. Klik peserta → detail terbuka → catat setoran Rp 100.000 → saldo bertambah.
4. Tambah shohibul baru → daftar menyesuaikan; hapus hingga tersisa 1 → ditolak dengan pesan.
5. Ubah status menjadi "Aktif" → tersimpan.
6. Hapus setoran → saldo berkurang.

- [ ] **Step 5: Commit**

```bash
git add lib/db/seed.ts
git commit -m "feat(db): seed contoh data tabungan qurban

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```
