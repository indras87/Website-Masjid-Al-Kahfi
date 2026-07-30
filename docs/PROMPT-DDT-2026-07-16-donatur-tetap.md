# Prompt Implementasi — Donatur Tetap Operasional

> **Salin seluruh blok di bawah garis ini** ke AI / berikan ke programmer. Prompt sudah lengkap, berurutan, dan memuat kode siap pakai untuk bagian sulit. Spek lengkap ada di `docs/PLAN-DDT-2026-07-16-donatur-tetap.md` (baca jika butuh konteks).

---

## TUGAS

Implementasikan fitur **Pendaftaran Donatur Tetap Operasional** untuk website Masjid Al-Kahfi. Stack: **Next.js 15 App Router, Drizzle ORM, PostgreSQL, Tailwind v4, better-auth**. Estimasi 1–2 hari.

Kerjakan **berurutan Step 1 → Step 7**. Jangan loncat. Setelah tiap step, tes dulu sebelum lanjut. Jangan ubah keputusan desain yang sudah ditetapkan di bagian "KEPUTUSAN".

### Aturan main (WAJIB)

- **Ikuti pola kode yang sudah ada.** Sebelum menulis file baru, baca file referensi yang disebut — tiru gayanya (import, error handling, `export const dynamic = 'force-dynamic'`, dsb).
- **Jangan install library baru.** Pakai plain `useState` controlled form. Tidak boleh `react-hook-form`, `zod`, atau lib form lain.
- **Jangan tulis SQL manual.** Pakai `npm run db:push` (drizzle-kit) untuk migrasi.
- **Validasi server adalah source of truth.** Client validasi hanya untuk UX.
- **Nominal rupiah disimpan sebagai `integer`** (bukan string/text).
- **`whatsapp` disimpan ternormalisasi** format `62xxx` (lihat fungsi di Step 2).
- **Endpoint admin WAJIB cek sesi login** (`getActor()` dari `@/lib/audit`), kembalikan `401` bila tidak. Endpoint publik `POST` tanpa login.
- **Jangan membocorkan data pribadi donatur ke publik.** `GET` publik hanya boleh kembalikan agregat (jumlah + total).

### KEPUTUSAN (sudah final, jangan diubah)

- Target operasional default **Rp 15.000.000/bulan**, disimpan di tabel `pengaturan` key `target_operasional_bulanan`.
- Nominal preset hardcode: `50000, 100000, 200000, 500000, 1000000`. "Lainnya" minimal `10000`.
- Progres publik hanya menghitung record ber-status `terkonfirmasi` dan `aktif`.
- Status pendaftar baru selalu `baru`.
- "Donatur Tetap" di header/footer = item nav biasa (bukan tombol).
- **Export CSV: SKIP di MVP** (catat TODO, jangan dikerjakan).
- Link "Donatur Tetap" di header ditempatkan sebagai item nav biasa.

---

## GIT WORKFLOW (WAJIB)

**Jangan pernah commit langsung ke `main`.** Repo memakai alur Pull Request (lihat git log: `feat: ... (#16)`, `fix: ... (#14)`).

1. **Pastikan `main` terbaru** sebelum mulai:
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Buat branch baru** dari `main`:
   ```bash
   git checkout -b feat/donatur-tetap
   ```
3. **Commit per step** (boleh beberapa commit per step bila step besar). Pesan pakai **Conventional Commits**, ringkas, bahasa Indonesia/Inggris bebas (ikut gaya log yang ada). Format: `<type>: <deskripsi>`.
4. **Push** dan **buka PR ke `main`** saat semua step selesai & build lolos:
   ```bash
   git push -u origin feat/donatur-tetap
   ```
   Lalu buka Pull Request via GitHub (judul PR: `feat: pendaftaran donatur tetap operasional`).
5. **Jangan merge sendiri** sebelum direview.

### Convention commit

`type` yang relevan: `feat` (fitur baru), `fix` (perbaikan bug), `chore` (migrasi/config), `refactor`, `docs`.

Contoh pesan commit per step (ubah sesuai realita):
```
Step 1  → feat(db): tambah tabel donatur_tetap, enum, & default target operasional
Step 2  → feat(api): endpoint publik donatur tetap (POST + GET agregat/admin)
Step 3  → feat(api): endpoint admin donatur tetap (detail/ubah/hapus)
Step 4  → feat(donatur-tetap): halaman form publik + widget progres
Step 5  → feat(nav): link Donatur Tetap di header, footer, & app-shell
Step 6  → feat(admin): halaman kelola donatur tetap + menu sidebar
Step 7  → feat(pengaturan): target operasional bulanan & verifikasi build
```

> Migrasi DB via `npm run db:push` tidak men-generate file migration SQL baru di repo ini — tetap commit perubahan `lib/db/schema.ts` dan folder `drizzle/` (jika berubah) dalam commit Step 1.

---

## STEP 1 — Data Layer

### 1a. Edit `lib/db/schema.ts`

`integer` dan `boolean` sudah ter-import di baris atas file. Tambahkan **3 enum + 1 tabel** ini di **akhir file** (setelah tabel `pengaturan`):

```ts
// === Donatur Tetap Operasional ===

export const jenisKelaminEnum = pgEnum("jenis_kelamin", ["laki-laki", "perempuan"]);

export const metodePembayaranEnum = pgEnum("metode_pembayaran", [
  "transfer_bank",
  "qris",
  "tunai_sekretariat",
]);

export const donaturTetapStatusEnum = pgEnum("donatur_tetap_status", [
  "baru",
  "terkonfirmasi",
  "aktif",
  "berhenti",
]);

export const donaturTetap = pgTable("donatur_tetap", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  jenisKelamin: jenisKelaminEnum("jenis_kelamin").notNull(),
  whatsapp: text("whatsapp").notNull(),
  alamat: text("alamat"),
  email: text("email"),
  nominalBulanan: integer("nominal_bulanan").notNull(),
  nominalLainnya: boolean("nominal_lainnya").default(false).notNull(),
  tanggalPembayaran: text("tanggal_pembayaran").notNull(),
  metodePembayaran: metodePembayaranEnum("metode_pembayaran").notNull(),
  persetujuanDonatur: boolean("persetujuan_donatur").default(false).notNull(),
  persetujuanPengingatWa: boolean("persetujuan_pengingat_wa").default(false).notNull(),
  persetujuanLaporan: boolean("persetujuan_laporan").default(false).notNull(),
  status: donaturTetapStatusEnum("status").default("baru").notNull(),
  catatanAdmin: text("catatan_admin"),
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 1b. Edit `lib/cms/settings.ts`

Tambahkan di akhir file (baca dulu filenya — ekspor saat ini berupa `DEFAULT_CONTACT_SETTINGS`, `DEFAULT_DONATION_SETTINGS`, `DEFAULT_RUNNING_TEXT`):

```ts
import { db } from "@/lib/db";
import { pengaturan } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const DEFAULT_TARGET_OPERASIONAL_BULANAN = 15000000;

/** Mengembalikan target operasional bulanan dari tabel pengaturan, atau default. */
export async function getTargetOperasional(): Promise<number> {
  const rows = await db
    .select()
    .from(pengaturan)
    .where(eq(pengaturan.key, "target_operasional_bulanan"))
    .limit(1);
  const n = parseInt(rows[0]?.value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TARGET_OPERASIONAL_BULANAN;
}
```

> Catatan: taruh import di atas file bersama import lain (jangan di tengah). Kalau `settings.ts` sudah import `db`/`pengaturan`, jangan duplikat.

### 1c. Jalankan migrasi

```bash
npm run db:push
```

Verifikasi tabel `donatur_tetap` + 3 enum terbentuk di DB. Lanjut Step 2.

---

## STEP 2 — API Publik + Dual GET

Buat file baru `app/api/donatur-tetap/route.ts`. Tiru pola `app/api/donasi/route.ts` dan `app/api/pengaturan/route.ts`. Isi lengkap:

```ts
import { NextResponse } from "next/server";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { donaturTetap } from "@/lib/db/schema";
import { getTargetOperasional } from "@/lib/cms/settings";
import { withActorNames } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const TANGGAL_VALID = ["1-5", "6-10", "11-15", "16-20", "21-25", "26-31"];
const METODE_VALID = ["transfer_bank", "qris", "tunai_sekretariat"];
const KELAMIN_VALID = ["laki-laki", "perempuan"];
const PRESET = [50000, 100000, 200000, 500000, 1000000];

/** Normalisasi nomor WhatsApp ke format 62xxx. */
function normalizeWa(input: string): string {
  let d = input.replace(/[^\d]/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  if (!d.startsWith("62")) d = "62" + d;
  return d;
}

/** GET dual-mode: publik → agregat; admin login → semua record. */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const isAdmin = !!session;

    if (!isAdmin) {
      const target = await getTargetOperasional();
      const rows = await db
        .select()
        .from(donaturTetap)
        .where(inArray(donaturTetap.status, ["terkonfirmasi", "aktif"]));
      const jumlahDonatur = rows.length;
      const totalKomitmen = rows.reduce((s, r) => s + r.nominalBulanan, 0);
      const persentase = target > 0 ? Math.min(100, Math.round((totalKomitmen / target) * 100)) : 0;
      return NextResponse.json({ jumlahDonatur, totalKomitmen, target, persentase });
    }

    const rows = await db.select().from(donaturTetap).orderBy(desc(donaturTetap.createdAt));
    const enriched = await withActorNames(rows);
    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("Error fetching donatur tetap:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/** POST publik: submit pendaftaran. */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nama = String(body?.nama ?? "").trim();
    const jenisKelamin = String(body?.jenisKelamin ?? "");
    const whatsappRaw = String(body?.whatsapp ?? "").trim();
    const alamat = body?.alamat ? String(body.alamat).trim() : null;
    const email = body?.email ? String(body.email).trim() : null;
    const nominalBulanan = Number(body?.nominalBulanan);
    const nominalLainnya = !!body?.nominalLainnya;
    const tanggalPembayaran = String(body?.tanggalPembayaran ?? "");
    const metodePembayaran = String(body?.metodePembayaran ?? "");
    const persetujuanDonatur = !!body?.persetujuanDonatur;
    const persetujuanPengingatWa = !!body?.persetujuanPengingatWa;
    const persetujuanLaporan = !!body?.persetujuanLaporan;

    // Validasi server
    if (nama.length < 3 || nama.length > 100) {
      return NextResponse.json({ error: "Nama lengkap wajib diisi (3–100 karakter)" }, { status: 400 });
    }
    if (!KELAMIN_VALID.includes(jenisKelamin)) {
      return NextResponse.json({ error: "Jenis kelamin tidak valid" }, { status: 400 });
    }
    const whatsapp = normalizeWa(whatsappRaw);
    if (!/^62\d{8,13}$/.test(whatsapp)) {
      return NextResponse.json({ error: "Nomor WhatsApp tidak valid" }, { status: 400 });
    }
    if (alamat && alamat.length > 500) {
      return NextResponse.json({ error: "Alamat maksimal 500 karakter" }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
    }
    if (!Number.isInteger(nominalBulanan) || nominalBulanan <= 0) {
      return NextResponse.json({ error: "Nominal donasi tidak valid" }, { status: 400 });
    }
    const isPreset = PRESET.includes(nominalBulanan);
    if (nominalLainnya && nominalBulanan < 10000) {
      return NextResponse.json({ error: "Nominal lainnya minimal Rp 10.000" }, { status: 400 });
    }
    if (!nominalLainnya && !isPreset) {
      return NextResponse.json({ error: "Nominal donasi tidak valid" }, { status: 400 });
    }
    if (!TANGGAL_VALID.includes(tanggalPembayaran)) {
      return NextResponse.json({ error: "Tanggal pembayaran tidak valid" }, { status: 400 });
    }
    if (!METODE_VALID.includes(metodePembayaran)) {
      return NextResponse.json({ error: "Metode pembayaran tidak valid" }, { status: 400 });
    }
    if (!persetujuanDonatur) {
      return NextResponse.json({ error: "Pernyataan donatur wajib disetujui" }, { status: 400 });
    }

    const [created] = await db
      .insert(donaturTetap)
      .values({
        nama,
        jenisKelamin: jenisKelamin as "laki-laki" | "perempuan",
        whatsapp,
        alamat: alamat || null,
        email: email || null,
        nominalBulanan,
        nominalLainnya,
        tanggalPembayaran,
        metodePembayaran: metodePembayaran as "transfer_bank" | "qris" | "tunai_sekretariat",
        persetujuanDonatur,
        persetujuanPengingatWa,
        persetujuanLaporan,
        status: "baru",
        createdById: null,
        updatedById: null,
      })
      .returning({ id: donaturTetap.id });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (error: any) {
    console.error("Error creating donatur tetap:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
```

**Tes cepat (terminal):**
```bash
curl -X POST http://localhost:3000/api/donatur-tetap \
  -H "Content-Type: application/json" \
  -d '{"nama":"Tes Beta","jenisKelamin":"laki-laki","whatsapp":"0812-3456-7890","nominalBulanan":100000,"nominalLainnya":false,"tanggalPembayaran":"1-5","metodePembayaran":"transfer_bank","persetujuanDonatur":true,"persetujuanPengingatWa":true,"persetujuanLaporan":false}'
```
Harus return `{"ok":true,"id":...}`. Cek DB: `whatsapp` tersimpan `6281234567890`. Tanpa login, `GET /api/donatur-tetap` harus return agregat (tidak ada nama/WA).

---

## STEP 3 — API Admin (detail/ubah/hapus)

Buat file baru `app/api/donatur-tetap/[id]/route.ts`. Semua endpoint **admin saja** (pakai `getActor()`, 401 bila null). Tiru pola proteksi `app/api/pengaturan/route.ts`.

```ts
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { donaturTetap } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

const STATUS_VALID = ["baru", "terkonfirmasi", "aktif", "berhenti"];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const rows = await db.select().from(donaturTetap).where(eq(donaturTetap.id, numId)).limit(1);
    if (!rows.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error("Error get donatur:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const body = await req.json();
    const status = String(body?.status ?? "");
    const catatanAdmin = body?.catatanAdmin != null ? String(body.catatanAdmin) : undefined;

    if (!STATUS_VALID.includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const updated = await db
      .update(donaturTetap)
      .set({
        status: status as "baru" | "terkonfirmasi" | "aktif" | "berhenti",
        ...(catatanAdmin !== undefined ? { catatanAdmin } : {}),
        updatedById: actor.id,
        updatedAt: new Date(),
      })
      .where(eq(donaturTetap.id, numId))
      .returning();

    if (!updated.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error("Error patch donatur:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const deleted = await db.delete(donaturTetap).where(eq(donaturTetap.id, numId)).returning({ id: donaturTetap.id });
    if (!deleted.length) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error delete donatur:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
```

---

## STEP 4 — Halaman Form Publik

Buat `app/(site)/donatur-tetap/page.tsx` dengan `"use client"`. Letak di grup `(site)` membuatnya otomatis dapat navbar+footer via `AppShell`.

**Wajib baca dulu** untuk meniru gaya: `app/(site)/donasi/page.tsx` (pola controlled form + palet emerald/gold + class Tailwind).

Komponen harus memuat:

1. **Hero** — `bg-emerald-900 text-white border-b-4 border-gold-500 islamic-pattern`, judul `font-serif`. Teks pembuka (siap pakai, lihat bagian "TEKS SIAP PAKAI").
2. **Widget Progres** — kartu `bg-emerald-950 text-white`. Saat mount, `fetch("/api/donatur-tetap")` (publik → agregat `{ jumlahDonatur, totalKomitmen, target, persentase }`). Tampilkan: Target (format rupiah), bar progres `persentase%`, total komitmen, jumlah donatur.
3. **Form** — kartu `bg-white rounded-2xl border border-gold-100 shadow-md`. Field sesuai layout ASCII di spek §6.3 (Data Donatur, Komitmen Donasi, Pernyataan).
4. **State sukses** — setelah POST ok, ganti seluruh form dengan kartu sukses (ikon `BadgeCheck`, teks Jazakumullahu khairan, ayat QS Al-Baqarah 261, 2 tombol).

**Shape state (pakai `useState`, contoh di spek §6.6):**

```ts
type FormState = {
  nama: string;
  jenisKelamin: "laki-laki" | "perempuan" | "";
  whatsapp: string;
  alamat: string;
  email: string;
  nominalPreset: number | null;   // 50000|100000|200000|500000|1000000|null
  nominalLainnya: string;         // input custom
  tanggalPembayaran: string;      // "1-5".."26-31"
  metodePembayaran: "transfer_bank" | "qris" | "tunai_sekretariat" | "";
  persetujuanDonatur: boolean;
  persetujuanPengingatWa: boolean;
  persetujuanLaporan: boolean;
};
```

**Hitung nominal saat submit:**
```ts
const nominalLainnya = form.nominalPreset === null && form.nominalLainnya.trim() !== "";
const nominalBulanan = form.nominalPreset ?? parseInt(form.nominalLainnya.replace(/\D/g, ""), 10);
```

**POST:** `fetch("/api/donatur-tetap", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ nama, jenisKelamin, whatsapp, alamat, email, nominalBulanan, nominalLainnya, tanggalPembayaran, metodePembayaran, persetujuanDonatur, persetujuanPengingatWa, persetujuanLaporan }) })`. Bila `!res.ok`, tampilkan `data.error`. Bila ok → state sukses.

**Ikon:** `HeartHandshake, User, Wallet, CalendarClock, BadgeCheck, MessageCircle` dari `lucide-react`.

**Format rupiah:**
```ts
const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
```

**Validasi client (UX, sebelum POST):** semua field wajib terisi, `persetujuanDonatur` harus centang, WA tidak kosong. Tombol submit disabled saat loading.

**Responsif:** mobile 1 kolom, grid nominal 2×3. Lihat ASCII mobile di spek §6.5.

Tes end-to-end: isi form → submit → pesan sukses muncul → record muncul di DB.

---

## STEP 5 — Navigasi Publik

Edit **dua file** (array `navLinks`-nya duplikat, keduanya harus diubah):

### 5a. `components/app-shell.tsx`

- Tambah ke array `navLinks`: `{ id: "donatur-tetap", label: "Donatur Tetap" }`.
- Di fungsi `handleNav`, tambah cabang sebelum `else`:
  ```ts
  } else if (tab === "donatur-tetap") {
    router.push("/donatur-tetap");
  }
  ```

### 5b. `components/layout-header.tsx`

- Tambah ke array `navLinks` (di dalam komponen): `{ id: "donatur-tetap", label: "Donatur Tetap" }`.

> Jangan ubah tombol "Donasi & Infaq" yang sudah ada. "Donatur Tetap" muncul sebagai item nav biasa di daftar.

### 5c. (Opsional) `components/layout-footer.tsx`

Baca dulu. Bila ada daftar link, tambah "Donatur Tetap" → `/donatur-tetap`.

---

## STEP 6 — Admin (Daftar + Detail + Ubah Status + Hapus)

### 6a. Buat `app/admin/(protected)/donatur-tetap/page.tsx`

`"use client"`. Otomatis terproteksi (layout `(protected)` sudah cek session, redirect ke `/admin/login`). **Baca dulu** `app/admin/(protected)/kegiatan/page.tsx` atau `berita/page.tsx` untuk meniru pola tabel/list admin + modal.

Fungsi halaman:
- `fetch("/api/donatur-tetap")` (admin → array lengkap, sudah ada `createdByName`/`updatedByName`).
- **Filter & cari:** input cari (nama/WA), dropdown filter status (Semua/baru/terkonfirmasi/aktif/berhenti) — filter di client.
- **Tabel kolom:** `#`, Nama, WhatsApp, Nominal/bln, Status. Klik baris → buka modal/panel detail.
- **Modal detail** (lihat ASCII §7.3): tampilkan semua field, tombol **"Buka Chat WA"** → `https://wa.me/${row.whatsapp}?text=...` (template singkat konfirmasi), dropdown **Status**, input **Catatan Admin**, tombol **Simpan Perubahan** dan **Hapus** (merah).
- **Simpan** → `PATCH /api/donatur-tetap/[id]` body `{ status, catatanAdmin }`. Refresh list.
- **Hapus** → `confirm()` dulu → `DELETE /api/donatur-tetap/[id]`. Refresh list.

### 6b. Edit `app/admin/components/Sidebar.tsx`

Import `HeartHandshake` dari `lucide-react` (sudah ada import `HandCoins`, tiru itu). Tambah ke array `links` **setelah** `Kontak & Donasi` dan **sebelum** `Pengaturan`:

```ts
{ href: "/admin/donatur-tetap", label: "Donatur Tetap", icon: HeartHandshake },
```

---

## STEP 7 — Pengaturan Target + Verifikasi

### 7a. Endpoint target operasional (route terpisah, AMAN — jangan generalisasi `pengaturan/route.ts` agar tidak break `running_text`)

Buat file baru `app/api/pengaturan/target-operasional/route.ts`:

```ts
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pengaturan } from "@/lib/db/schema";
import { getActor } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** PUT admin: simpan target operasional bulanan. */
export async function PUT(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const n = parseInt(String(body?.value ?? ""), 10);
    if (!Number.isFinite(n) || n <= 0) {
      return NextResponse.json({ error: "Target tidak valid" }, { status: 400 });
    }

    const value = String(n);
    const existing = await db
      .select()
      .from(pengaturan)
      .where(eq(pengaturan.key, "target_operasional_bulanan"))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(pengaturan).values({
        key: "target_operasional_bulanan",
        value,
        createdById: actor.id,
        updatedById: actor.id,
        updatedAt: new Date(),
      });
    } else {
      await db
        .update(pengaturan)
        .set({ value, updatedById: actor.id, updatedAt: new Date() })
        .where(eq(pengaturan.key, "target_operasional_bulanan"));
    }

    return NextResponse.json({ ok: true, value });
  } catch (error: any) {
    console.error("Error update target operasional:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
```

> Helper `getTargetOperasional()` (Step 1b) sudah baca key ini, jadi widget progres publik otomatis pakai nilai baru.

### 7b. Edit `app/admin/(protected)/pengaturan/page.tsx`

Baca dulu. Tambah **satu input "Target Operasional Bulanan (Rp)"** + tombol Simpan. Saat simpan → `fetch("/api/pengaturan/target-operasional", { method: "PUT", body: JSON.stringify({ value: nominalAngka }) })`. Jangan ganggu field `running_text` yang sudah ada.

### 7c. Verifikasi akhir

```bash
npm run build
```
Build harus lolos tanpa error type. Lalu `npm run dev` dan jalankan **Testing Checklist** di bawah.

---

## TEKS SIAP PAKAI

**Hero pembuka:**
> Bismillahirrahmanirrahim. Terima kasih atas niat Bapak/Ibu untuk berpartisipasi dalam mendukung operasional Masjid Al-Kahfi. Melalui program Donatur Tetap, insya Allah Bapak/Ibu turut berkontribusi dalam menjaga kegiatan ibadah, dakwah, pendidikan, kebersihan, dan kebutuhan operasional masjid secara berkelanjutan. Silakan isi formulir berikut dengan lengkap.

**Pesan sukses:**
> Jazakumullahu khairan. Pendaftaran Anda telah kami terima. Tim Masjid Al-Kahfi akan menghubungi Anda melalui WhatsApp untuk konfirmasi dan penyampaian informasi rekening/QRIS donasi.

**Ayat:**
> "Perumpamaan orang yang menginfakkan hartanya di jalan Allah seperti sebutir biji yang menumbuhkan tujuh bulir, pada setiap bulir terdapat seratus biji." (QS. Al-Baqarah: 261)

---

## TESTING CHECKLIST (cek semua sebelum bilang selesai)

- [ ] Submit form semua field valid → pesan sukses + ayat muncul.
- [ ] Submit tanpa nama → error validasi (client + server 400).
- [ ] Submit tanpa centang pernyataan wajib → ditolak 400.
- [ ] Submit WA `0812-3456-7890` → tersimpan `6281234567890` di DB.
- [ ] Pilih "Lainnya" → nominal custom tersimpan, `nominalLainnya=true`.
- [ ] Halaman publik tampilkan progres (target, persentase, jumlah donatur).
- [ ] **Tanpa login**, `GET /api/donatur-tetap` → hanya agregat, tidak ada data pribadi.
- [ ] Admin login → `GET` return daftar lengkap.
- [ ] Admin ubah status (baru → terkonfirmasi → aktif) → tersimpan, widget progres ikut update.
- [ ] Admin hapus record → hilang dari daftar.
- [ ] Tombol "Buka Chat WA" buka `https://wa.me/...` nomor benar.
- [ ] Admin ubah target → widget progres publik pakai target baru.
- [ ] Mobile responsif: form 1 kolom, tombol mudah ditekan.
- [ ] `npm run build` lolos.

---

## DEFINISI SELESAI

Fitur selesai bila **semua** terpenuhi:
1. Jamaah bisa buka `/donatur-tetap`, isi form, lihat pesan sukses.
2. Data tersimpan di `donatur_tetap`, WA ternormalisasi, status `baru`.
3. Widget progres tampilkan target + total komitmen + jumlah donatur aktif.
4. Admin bisa lihat, cari, filter status, ubah status, hapus.
5. Admin bisa ubah target operasional dari halaman Pengaturan.
6. Endpoint publik tidak membocorkan data pribadi.
7. "Donatur Tetap" muncul di header (desktop+mobile) dan footer.
8. "Donatur Tetap" muncul di sidebar admin.
9. `npm run build` lolos.

Bila ada keraguan pada teks/icon/spesifikasi kecil, pakai default di bagian KEPUTUSAN dan jangan bertanya — lanjutkan. Hanya hentikan dan tanya jika menemukan error yang menghalangi build.
