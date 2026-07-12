# Jadwal Sholat GPS + Running Text Editable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jadwal sholat dinamis berbasis GPS (Beranda + halaman Jadwal Sholat), running text diperlambat, dan konten running text dapat diubah dari admin.

**Architecture:** Tabel settings key-value baru `pengaturan` menyimpan teks berjalan; route `app/api/pengaturan/route.ts` (GET publik, PUT auth-gated) melayani header publik + halaman admin. Helper pure `lib/prayer-times.ts` + hook `hooks/use-prayer-times.ts` menggabungkan GPS browser, cache localStorage harian, dan API Aladhan (method Kemenag) dengan fallback koordinat masjid; Beranda & Jadwal Sholat jadi konsumennya.

**Tech Stack:** Next.js 15 App Router, React 19, Drizzle ORM + postgres-js, PostgreSQL, better-auth, Motion (Framer Motion), Tailwind v4, node:test.

## Global Constraints

- **Aladhan endpoint (verbatim):** `https://api.aladhan.com/v1/timings/{DD-MM-YYYY}?latitude={lat}&longitude={lng}&method=20&school=0`. `method=20` = Kementerian Agama RI (Fajr 20°, Isya 18°); `school=0` = mazhab Syafi'i. Response waktu ada di `json.data.timings` dengan field `Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha` format `"HH:MM"`.
- **Fallback koordinat masjid:** `lat -6.9856, lng 107.6589` (Cikoneng).
- **Cache key format:** `jadwal:{lat.toFixed(2)},{lng.toFixed(2)}:{YYYY-MM-DD}`. TTL implisit akhir hari (tanggal berubah → key berubah).
- **Kecepatan marquee:** `duration: 30` (sebelumnya 15).
- **Tabel settings:** nama `pengaturan`, kolom `key` (text PK), `value` (text notNull), `updated_at` (timestamp defaultNow). Key teks berjalan: `running_text`.
- **Sync schema:** `npm run db:push` (tidak generate file migrasi).
- **Test runner:** `npm test` = `tsx --test` (node:test + `node:assert/strict`). File test di `test/...`.
- **Auth check (verbatim):** `const session = await auth.api.getSession({ headers: await headers() });` dengan `import { headers } from "next/headers"` dan `import { auth } from "@/lib/auth"`.
- **Route handler:** selalu `export const dynamic = 'force-dynamic';`.
- **Map response prayer:** `Fajr→subuh, Sunrise→terbit, Dhuhr→dzuhur, Asr→ashar, Maghrib→maghrib, Isha→isya`.
- **`lib/cms/settings.ts` harus tetap pure constants** (di-import oleh komponen client header) — jangan tambah import server-only / `db` di file ini.
- Semua edit mengikuti konvensi yang ada (client component `"use client"`, REST route handler, Drizzle query).

---

### Task 1: Tabel `pengaturan` + konstanta `DEFAULT_RUNNING_TEXT` + seed

**Files:**
- Modify: `lib/db/schema.ts` (append tabel setelah definisi tabel terakhir)
- Modify: `lib/cms/settings.ts` (tambah konstanta)
- Modify: `lib/db/seed.ts` (import + delete + insert)
- Test: `test/lib/cms/settings.test.ts` (tambah test)

**Interfaces:**
- Produces: tabel DB `pengaturan`; `DEFAULT_RUNNING_TEXT` (export string konstan di `@/lib/cms/settings`) — dipakai Task 2 (route), Task 3 (header), Task 1 (seed).

- [ ] **Step 1: Tulis test gagal untuk `DEFAULT_RUNNING_TEXT`**

Tambah di akhir `test/lib/cms/settings.test.ts`:

```ts
import { DEFAULT_RUNNING_TEXT } from '../../../lib/cms/settings';

test('DEFAULT_RUNNING_TEXT is a non-empty running text', () => {
  assert.ok(typeof DEFAULT_RUNNING_TEXT === 'string');
  assert.ok(DEFAULT_RUNNING_TEXT.length > 20);
  assert.ok(DEFAULT_RUNNING_TEXT.includes('masjid'));
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npm test`
Expected: FAIL — `DEFAULT_RUNNING_TEXT` is undefined / tidak ter-export.

- [ ] **Step 3: Tambah konstanta ke `lib/cms/settings.ts`**

Append di akhir file:

```ts
export const DEFAULT_RUNNING_TEXT =
  '"Siapa yang membangun masjid karena Allah, maka Allah akan membangunkan baginya rumah di surga." (HR. Bukhari dan Muslim) — Selamat datang di Layanan Digital Masjid Al-Kahfi Cikoneng, Kabupaten Bandung.';
```

- [ ] **Step 4: Tambah tabel ke `lib/db/schema.ts`**

Append di akhir file (imports `text`, `timestamp` sudah ada di baris 1):

```ts
// Site-wide key-value settings (e.g. running text)
export const pengaturan = pgTable("pengaturan", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

- [ ] **Step 5: Sync schema ke DB**

Run: `npm run db:push`
Expected: sukses, tabel `pengaturan` tercipta.

- [ ] **Step 6: Tambah seed untuk `running_text`**

Di `lib/db/seed.ts`:
- Tambah import `pengaturan` ke daftar import dari `./schema`, dan `import { DEFAULT_RUNNING_TEXT } from "../cms/settings";` (sesuaikan path relatif: seed ada di `lib/db/`, settings di `lib/cms/settings` → `../cms/settings`).
- Pada blok `await db.delete(...)` (tempat `db.delete(kontak)` dipanggil), tambahkan:
  ```ts
  await db.delete(pengaturan);
  ```
- Pada blok insert (dekat tempat `kontak`/DEFAULT_KONTAK di-insert), tambahkan:
  ```ts
  await db.insert(pengaturan).values({
    key: "running_text",
    value: DEFAULT_RUNNING_TEXT,
  });
  ```

- [ ] **Step 7: Jalankan seed**

Run: `npm run db:seed`
Expected: sukses tanpa error.

- [ ] **Step 8: Verifikasi tabel + baris seed**

Run (butuh DB di port 5433 sesuai CLAUDE.md):
```bash
docker compose exec -T db psql -U postgres -d alkahfi_db -c "\d pengaturan" -c "select key, left(value,40) from pengaturan;"
```
Expected: tabel `pengaturan` ada (kolom key/value/updated_at); satu baris `key = running_text`.

- [ ] **Step 9: Jalankan test, pastikan lulus**

Run: `npm test`
Expected: PASS (semua test settings termasuk `DEFAULT_RUNNING_TEXT`).

- [ ] **Step 10: Commit**

```bash
git add lib/db/schema.ts lib/db/seed.ts lib/cms/settings.ts test/lib/cms/settings.test.ts
git commit -m "feat(db): add pengaturan settings table + seed running_text"
```

---

### Task 2: Route API `app/api/pengaturan/route.ts`

**Files:**
- Create: `app/api/pengaturan/route.ts`

**Interfaces:**
- Consumes: tabel `pengaturan` (Task 1), `DEFAULT_RUNNING_TEXT` (Task 1), `auth.api.getSession` (`@/lib/auth`).
- Produces: `GET /api/pengaturan` → `{ running_text: string }` (publik); `PUT /api/pengaturan` body `{ running_text: string }` → row (auth-gated). Dipakai Task 3 (header) & Task 4 (admin).

- [ ] **Step 1: Buat route handler**

Buat `app/api/pengaturan/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pengaturan } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { DEFAULT_RUNNING_TEXT } from '@/lib/cms/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await db.select().from(pengaturan).where(eq(pengaturan.key, 'running_text')).limit(1);
    return NextResponse.json({ running_text: rows[0]?.value ?? DEFAULT_RUNNING_TEXT });
  } catch (error: any) {
    console.error('Error fetching pengaturan:', error);
    return NextResponse.json({ running_text: DEFAULT_RUNNING_TEXT });
  }
}

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session ?? null;
}

export async function PUT(request: Request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const running_text = typeof body?.running_text === 'string' ? body.running_text : '';

    if (running_text.trim().length === 0) {
      return NextResponse.json({ error: 'Teks berjalan tidak boleh kosong' }, { status: 400 });
    }

    const existing = await db.select().from(pengaturan).where(eq(pengaturan.key, 'running_text')).limit(1);
    const result =
      existing.length === 0
        ? await db.insert(pengaturan).values({ key: 'running_text', value: running_text }).returning()
        : await db
            .update(pengaturan)
            .set({ value: running_text, updatedAt: new Date() })
            .where(eq(pengaturan.key, 'running_text'))
            .returning();

    return NextResponse.json({ running_text: result[0].value });
  } catch (error: any) {
    console.error('Error updating pengaturan:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verifikasi build**

Run: `npm run build`
Expected: sukses, tidak ada type error.

- [ ] **Step 3: Verifikasi GET publik (dev server)**

Jalankan `npm run dev` di background, lalu:
```bash
curl -s http://localhost:3000/api/pengaturan
```
Expected: `{"running_text":"...membangun masjid..."}` (isi dari seed).

- [ ] **Step 4: Verifikasi PUT menolak tanpa session**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PUT http://localhost:3000/api/pengaturan -H "Content-Type: application/json" -d '{"running_text":"test"}'
```
Expected: `401`.

- [ ] **Step 5: Matikan dev server, commit**

```bash
git add app/api/pengaturan/route.ts
git commit -m "feat(api): add pengaturan route (GET public, PUT auth-gated)"
```

---

### Task 3: Running text header (fetch + perlambat + hapus dead code)

**Files:**
- Modify: `components/layout-header.tsx`

**Interfaces:**
- Consumes: `GET /api/pengaturan` (Task 2), `DEFAULT_RUNNING_TEXT` (Task 1).
- Produces: header menampilkan teks berjalan dari DB; blok prayer dead-code dihapus (header tidak lagi memuat `localPrayers`/`countdownText`/`iqomahTime`).

- [ ] **Step 1: Ganti import + state**

Di `components/layout-header.tsx`:
- Hapus import yang jadi tak terpakai setelah pembersihan (`Clock` tetap dipakai bila masih dirender; cek pemakaian — bila tak terpakai, hapus dari import `lucide-react` agar lint bersih). Pertahankan `useState, useEffect` (masih dipakai jam + running text).
- Tambah state `runningText`:

```ts
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const [currentTime, setCurrentTime] = useState("Memuat Waktu...");
const [runningText, setRunningText] = useState(DEFAULT_RUNNING_TEXT);
```

Impor konstanta di atas file:
```ts
import { DEFAULT_RUNNING_TEXT } from "@/lib/cms/settings";
```

Hapus state `countdownText` dan `iqomahTime` (baris 51-52 lama).

- [ ] **Step 2: Sederhanakan `useEffect` timer + tambah fetch running text**

Ganti seluruh `useEffect` lama (baris 54-112, yang berisi `setInterval` + `prayerMins` + perhitungan countdown/iqomah) menjadi dua effect berikut:

```ts
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const days = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      setCurrentTime(`${days[now.getDay()]}, ${hours}:${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/pengaturan")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && typeof data.running_text === "string" && data.running_text.trim()) {
          setRunningText(data.running_text);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
```

- [ ] **Step 3: Perbarui marquee (kecepatan + konten dari state)**

Ganti blok `motion.div` marquee (baris 133-144 lama) menjadi:

```tsx
            <div className="overflow-hidden w-full relative">
              <motion.div
                animate={{ x: ["100%", "-100%"] }}
                transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                className="whitespace-nowrap text-xs"
              >
                {runningText}
              </motion.div>
            </div>
```

(Perubahan: `duration: 15` → `30`; isi diganti `{runningText}`.)

- [ ] **Step 4: Hapus konstanta `localPrayers`**

Hapus seluruh blok (baris 31-38 lama):
```ts
const localPrayers = { ... };
```

- [ ] **Step 5: Verifikasi build + lint**

Run: `npm run build`
Expected: sukses; tidak ada referensi `localPrayers`/`countdownText`/`iqomahTime` tersisa; tidak ada import tak terpakai.

- [ ] **Step 6: Verifikasi manual (dev server)**

Run: `npm run dev`, buka `http://localhost:3000`.
Expected:
- Teks berjalan di banner atas melintas **lebih lambat** (~2x lambat vs sebelumnya).
- Konten = teks default (DB). Ubah nilai via psql (`update pengaturan set value='TEST RUNNING' where key='running_text'`) lalu refresh → teks berubah.
- Jam dinding kanan atas masih jalan.
- Header tidak error; tidak ada `localPrayers` lagi.

- [ ] **Step 7: Commit**

```bash
git add components/layout-header.tsx
git commit -m "feat(header): running text from DB, slow to 30s, remove dead prayer code"
```

---

### Task 4: Halaman admin Pengaturan + menu Sidebar

**Files:**
- Create: `app/admin/(protected)/pengaturan/page.tsx`
- Modify: `app/admin/components/Sidebar.tsx`

**Interfaces:**
- Consumes: `GET/PUT /api/pengaturan` (Task 2).
- Produces: route `/admin/pengaturan` (terproteksi session via route group `(protected)`); menu "Pengaturan" di sidebar.

- [ ] **Step 1: Tambah menu Sidebar**

Di `app/admin/components/Sidebar.tsx`:
- Tambah `Settings` ke import dari `lucide-react` (baris 7-19).
- Tambah entri ke array `links` (mis. setelah "Kontak & Donasi", sebelum spread superadmin):

```ts
    { href: "/admin/kontak-donasi", label: "Kontak & Donasi", icon: HandCoins },
    { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
```

- [ ] **Step 2: Buat halaman admin**

Buat `app/admin/(protected)/pengaturan/page.tsx` (ikuti gaya form client seperti `kontak-donasi`):

```tsx
"use client";

import React, { useEffect, useState } from "react";
import { DEFAULT_RUNNING_TEXT } from "@/lib/cms/settings";

export default function PengaturanPage() {
  const [text, setText] = useState(DEFAULT_RUNNING_TEXT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/pengaturan")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.running_text === "string" && data.running_text.trim()) {
          setText(data.running_text);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length === 0) {
      setMsg({ ok: false, text: "Teks tidak boleh kosong." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ running_text: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal menyimpan");
      setMsg({ ok: true, text: "Teks berjalan berhasil disimpan." });
    } catch (err: any) {
      setMsg({ ok: false, text: err?.message || "Gagal menyimpan." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Pengaturan Situs</h1>
      <p className="text-sm text-gray-500 mb-6">
        Kelola teks berjalan yang tampil di banner atas situs publik.
      </p>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <label htmlFor="running_text" className="block text-xs font-bold text-gray-700 uppercase mb-2">
            Teks Berjalan (Running Text)
          </label>
          <textarea
            id="running_text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading || saving}
            rows={4}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:bg-gray-100"
            placeholder="Tulis teks berjalan..."
          />
          <p className="text-xs text-gray-400 mt-1">
            Tip: teks panjang akan melintas lebih lama. Kecepatan tetap (durasi 30 detik).
          </p>
        </div>

        {msg && (
          <p className={`text-sm font-medium ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>
            {msg.text}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Verifikasi build**

Run: `npm run build`
Expected: sukses.

- [ ] **Step 4: Verifikasi manual (dev server)**

Run: `npm run dev`. Login admin (`/admin/login`, kredensial dari seed: `superadmin@masjidalkahfi.test` / `Superadmin123!`), buka `/admin/pengaturan`.
Expected:
- Menu "Pengaturan" tampil di sidebar (untuk admin & superadmin).
- Textarea memuat teks berjalan saat ini.
- Edit → Simpan → pesan sukses; refresh halaman publik `/` → teks berubah.

- [ ] **Step 5: Commit**

```bash
git add app/admin/(protected)/pengaturan/page.tsx app/admin/components/Sidebar.tsx
git commit -m "feat(admin): add Pengaturan page to edit running text"
```

---

### Task 5: Pure helper `lib/prayer-times.ts` (TDD)

**Files:**
- Create: `lib/prayer-times.ts`
- Test: `test/lib/prayer-times.test.ts`

**Interfaces:**
- Consumes: none (pure, no React/browser/DB).
- Produces: `MASJID_COORDS`, `PrayerTimes` (type), `FALLBACK_PRAYERS`, `ALADHAN_METHOD`, `ALADHAN_SCHOOL`, `mapAladhanToPrayers(timings)`, `buildCacheKey(lat,lng,isoDate)`, `prayerTimesToMinutes(t)`, `computeNextPrayer(times, now)`. Dipakai Task 6 (hook) & Task 7 (pages).

- [ ] **Step 1: Tulis test gagal**

Buat `test/lib/prayer-times.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MASJID_COORDS,
  FALLBACK_PRAYERS,
  mapAladhanToPrayers,
  buildCacheKey,
  prayerTimesToMinutes,
  computeNextPrayer,
} from '../../lib/prayer-times';

test('MASJID_COORDS is Cikoneng', () => {
  assert.equal(MASJID_COORDS.lat, -6.9856);
  assert.equal(MASJID_COORDS.lng, 107.6589);
});

test('FALLBACK_PRAYERS has 6 HH:MM entries', () => {
  assert.match(FALLBACK_PRAYERS.subuh, /^\d{2}:\d{2}$/);
  assert.match(FALLBACK_PRAYERS.isya, /^\d{2}:\d{2}$/);
});

test('mapAladhanToPrayers maps fields and strips suffix', () => {
  const timings = {
    Fajr: '04:40',
    Sunrise: '06:03',
    Dhuhr: '11:55',
    Asr: '15:17',
    Maghrib: '17:48',
    Isha: '19:02',
  };
  assert.deepEqual(mapAladhanToPrayers(timings), {
    subuh: '04:40',
    terbit: '06:03',
    dzuhur: '11:55',
    ashar: '15:17',
    maghrib: '17:48',
    isya: '19:02',
  });
});

test('mapAladhanToPrayers extracts HH:MM even if zone suffix present', () => {
  const out = mapAladhanToPrayers({ Fajr: '04:40 (WIB)', Dhuhr: '11:55', Asr: '15:17', Maghrib: '17:48', Isha: '19:02', Sunrise: '06:03' });
  assert.equal(out.subuh, '04:40');
});

test('buildCacheKey rounds to 2 decimals and uses ISO date', () => {
  assert.equal(
    buildCacheKey(-6.98564, 107.65891, '2026-07-13'),
    'jadwal:-6.99,107.66:2026-07-13',
  );
});

test('prayerTimesToMinutes parses HH:MM to total minutes', () => {
  const m = prayerTimesToMinutes({ subuh: '04:40', terbit: '06:03', dzuhur: '11:55', ashar: '15:17', maghrib: '17:48', isya: '19:02' });
  assert.equal(m.subuh, 4 * 60 + 40);
  assert.equal(m.isya, 19 * 60 + 2);
});

test('computeNextPrayer returns next upcoming prayer', () => {
  const times = { subuh: '04:40', terbit: '06:03', dzuhur: '11:55', ashar: '15:17', maghrib: '17:48', isya: '19:02' };
  // 12:00 → next is Ashar 15:17
  const r = computeNextPrayer(times, new Date(2026, 6, 13, 12, 0));
  assert.equal(r.name, 'Ashar');
  assert.equal(r.key, 'ashar');
  assert.equal(r.minutes, 15 * 60 + 17);
});

test('computeNextPrayer after Isya wraps to next-day Subuh', () => {
  const times = { subuh: '04:40', terbit: '06:03', dzuhur: '11:55', ashar: '15:17', maghrib: '17:48', isya: '19:02' };
  const r = computeNextPrayer(times, new Date(2026, 6, 13, 21, 0));
  assert.equal(r.name, 'Subuh');
  assert.equal(r.minutes, 4 * 60 + 40 + 24 * 60);
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npm test`
Expected: FAIL — modul `../../lib/prayer-times` tidak ditemukan.

- [ ] **Step 3: Implementasikan `lib/prayer-times.ts`**

```ts
// Pure helpers for GPS-based prayer schedule (Aladhan API, Kemenag RI).
// No React / browser / DB here — keep it unit-testable.

export const MASJID_COORDS = { lat: -6.9856, lng: 107.6589 };

export const ALADHAN_METHOD = 20; // 20 = Kementerian Agama Republik Indonesia (Fajr 20°, Isya 18°)
export const ALADHAN_SCHOOL = 0; // 0 = Syafi'i

export type PrayerTimes = {
  subuh: string;
  terbit: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
};

// Last-resort static schedule shown before first load or when GPS + network fail
// and no cache exists. (Old hardcoded values, kept as graceful fallback only.)
export const FALLBACK_PRAYERS: PrayerTimes = {
  subuh: "04:36",
  terbit: "05:54",
  dzuhur: "11:58",
  ashar: "15:18",
  maghrib: "17:58",
  isya: "19:12",
};

function extractHHMM(v?: string): string {
  if (!v) return "--:--";
  const m = v.match(/\d{2}:\d{2}/);
  return m ? m[0] : "--:--";
}

export function mapAladhanToPrayers(timings: Record<string, string>): PrayerTimes {
  return {
    subuh: extractHHMM(timings.Fajr),
    terbit: extractHHMM(timings.Sunrise),
    dzuhur: extractHHMM(timings.Dhuhr),
    ashar: extractHHMM(timings.Asr),
    maghrib: extractHHMM(timings.Maghrib),
    isya: extractHHMM(timings.Isha),
  };
}

export function buildCacheKey(lat: number, lng: number, isoDate: string): string {
  return `jadwal:${lat.toFixed(2)},${lng.toFixed(2)}:${isoDate}`;
}

export function prayerTimesToMinutes(t: PrayerTimes): Record<keyof PrayerTimes, number> {
  const parse = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  return {
    subuh: parse(t.subuh),
    terbit: parse(t.terbit),
    dzuhur: parse(t.dzuhur),
    ashar: parse(t.ashar),
    maghrib: parse(t.maghrib),
    isya: parse(t.isya),
  };
}

export type NextPrayer = { name: string; key: keyof PrayerTimes; minutes: number };

const PRAYER_ORDER: Array<{ name: string; key: keyof PrayerTimes }> = [
  { name: "Subuh", key: "subuh" },
  { name: "Terbit", key: "terbit" },
  { name: "Dzuhur", key: "dzuhur" },
  { name: "Ashar", key: "ashar" },
  { name: "Maghrib", key: "maghrib" },
  { name: "Isya", key: "isya" },
];

export function computeNextPrayer(times: PrayerTimes, now: Date): NextPrayer {
  const mins = prayerTimesToMinutes(times);
  const current = now.getHours() * 60 + now.getMinutes();
  for (const p of PRAYER_ORDER) {
    if (mins[p.key] > current) {
      return { name: p.name, key: p.key, minutes: mins[p.key] };
    }
  }
  return { name: "Subuh", key: "subuh", minutes: mins.subuh + 24 * 60 };
}
```

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run: `npm test`
Expected: PASS — semua test `prayer-times` hijau.

- [ ] **Step 5: Commit**

```bash
git add lib/prayer-times.ts test/lib/prayer-times.test.ts
git commit -m "feat(prayer): add pure prayer-times helpers + tests"
```

---

### Task 6: Hook `hooks/use-prayer-times.ts`

**Files:**
- Create: `hooks/use-prayer-times.ts`

**Interfaces:**
- Consumes: `lib/prayer-times.ts` (Task 5) — `MASJID_COORDS`, `FALLBACK_PRAYERS`, `ALADHAN_METHOD`, `ALADHAN_SCHOOL`, `mapAladhanToPrayers`, `buildCacheKey`, `PrayerTimes`.
- Produces: `usePrayerTimes()` → `{ times: PrayerTimes; loading: boolean; source: "gps" | "default" }`. Dipakai Task 7.

- [ ] **Step 1: Buat hook**

Buat `hooks/use-prayer-times.ts`:

```ts
"use client";

import { useEffect, useState } from "react";
import {
  MASJID_COORDS,
  FALLBACK_PRAYERS,
  ALADHAN_METHOD,
  ALADHAN_SCHOOL,
  mapAladhanToPrayers,
  buildCacheKey,
  type PrayerTimes,
} from "@/lib/prayer-times";

export type PrayerSource = "gps" | "default";

function isoToday(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function aladhanPathToday(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

export function usePrayerTimes(): {
  times: PrayerTimes;
  loading: boolean;
  source: PrayerSource;
} {
  const [times, setTimes] = useState<PrayerTimes>(FALLBACK_PRAYERS);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<PrayerSource>("default");

  useEffect(() => {
    let cancelled = false;
    const iso = isoToday();

    const load = async (lat: number, lng: number, src: PrayerSource) => {
      if (cancelled) return;
      setSource(src);
      const cacheKey = buildCacheKey(lat, lng, iso);

      // 1. cache
      try {
        const raw = window.localStorage.getItem(cacheKey);
        if (raw) {
          setTimes(JSON.parse(raw) as PrayerTimes);
          setLoading(false);
          return;
        }
      } catch {
        /* ignore storage errors */
      }

      // 2. fetch Aladhan
      try {
        const url = `https://api.aladhan.com/v1/timings/${aladhanPathToday()}?latitude=${lat}&longitude=${lng}&method=${ALADHAN_METHOD}&school=${ALADHAN_SCHOOL}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Aladhan HTTP ${res.status}`);
        const json = await res.json();
        const mapped = mapAladhanToPrayers(json?.data?.timings ?? {});
        if (cancelled) return;
        setTimes(mapped);
        try {
          window.localStorage.setItem(cacheKey, JSON.stringify(mapped));
        } catch {
          /* ignore */
        }
      } catch {
        // keep FALLBACK_PRAYERS (already set as initial state)
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      load(MASJID_COORDS.lat, MASJID_COORDS.lng, "default");
      return () => {
        cancelled = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => load(pos.coords.latitude, pos.coords.longitude, "gps"),
      () => load(MASJID_COORDS.lat, MASJID_COORDS.lng, "default"),
      { timeout: 10000, maximumAge: 600000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return { times, loading, source };
}
```

- [ ] **Step 2: Verifikasi build**

Run: `npm run build`
Expected: sukses (hook belum dipakai, tapi harus ter-compile).

- [ ] **Step 3: Commit**

```bash
git add hooks/use-prayer-times.ts
git commit -m "feat(prayer): add usePrayerTimes hook (GPS + cache + fallback)"
```

---

### Task 7: Wiring Beranda + Jadwal Sholat ke hook

**Files:**
- Modify: `app/(site)/jadwal-sholat/page.tsx`
- Modify: `app/(site)/beranda/page.tsx`

**Interfaces:**
- Consumes: `usePrayerTimes()` (Task 6), `computeNextPrayer` (Task 5).
- Produces: hapus `localPrayers` di kedua file; jadwal sholat & countdown memakai data GPS dinamis.

- [ ] **Step 1: Wiring `jadwal-sholat/page.tsx`**

Di `app/(site)/jadwal-sholat/page.tsx`:
- Hapus konstanta `localPrayers` (baris 5-12).
- Tambah import + panggil hook di dalam komponen:
  ```ts
  import { usePrayerTimes } from "@/hooks/use-prayer-times";
  import { computeNextPrayer } from "@/lib/prayer-times";
  ...
  export default function JadwalSholatPage() {
    const { times, loading, source } = usePrayerTimes();
    const [iqomahTime, setIqomahTime] = useState("00:00");
  ```
- Ganti isi `useEffect` timer (baris 17-57) agar memakai `times` dinamis:
  ```ts
    useEffect(() => {
      const timer = setInterval(() => {
        const now = new Date();
        const next = computeNextPrayer(times, now);
        const currentMinTotal = now.getHours() * 60 + now.getMinutes();
        const diff = next.minutes - currentMinTotal;
        const mLeft = diff < 0 ? 0 : diff;

        let minsRem = 9 - (mLeft % 10);
        let secsRem = 59 - now.getSeconds();
        if (minsRem < 0) minsRem = 0;
        setIqomahTime(
          `${String(minsRem).padStart(2, "0")}:${String(secsRem).padStart(2, "0")}`,
        );
      }, 1000);
      return () => clearInterval(timer);
    }, [times]);
  ```
- Ganti sumber grid (baris 74): `Object.entries(localPrayers)` → `Object.entries(times)`. Waktu tampil: `{loading ? "--:--" : time}`. Tambahkan chip kecil indikator lokasi (opsional, di bawah judul): `Sumber: {source === "gps" ? "Lokasi Anda (GPS)" : "Lokasi Masjid (Cikoneng)"}`.

  Contoh render waktu pada kartu grid:
  ```tsx
  <h4 className="...">{loading ? "--:--" : time}</h4>
  ```

- [ ] **Step 2: Wiring `beranda/page.tsx`**

Di `app/(site)/beranda/page.tsx`:
- Hapus konstanta `localPrayers` (baris 264-271).
- Tambah import + hook:
  ```ts
  import { usePrayerTimes } from "@/hooks/use-prayer-times";
  import { computeNextPrayer } from "@/lib/prayer-times";
  ...
  const { times, loading, source } = usePrayerTimes();
  ```
- Ganti isi `useEffect` timer countdown (baris 361-417) agar memakai `times`:
  ```ts
    useEffect(() => {
      const timer = setInterval(() => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const days = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

        const next = computeNextPrayer(times, now);
        const currentMinTotal = now.getHours() * 60 + now.getMinutes();
        const diff = next.minutes - currentMinTotal;
        const hLeft = Math.floor(diff / 60);
        const mLeft = diff % 60;
        const tStr = hLeft > 0 ? `${hLeft} jam ${mLeft} menit lagi` : `${mLeft} menit lagi`;
        const exact = times[next.key];

        setCountdownText(loading
          ? "Memuat jadwal sholat..."
          : `Sholat Berikutnya: ${next.name} (${exact}) — ${tStr}`);

        let minsRem = 9 - (mLeft % 10);
        let secsRem = 59 - now.getSeconds();
        if (minsRem < 0) minsRem = 0;
        setIqomahTime(
          `${String(minsRem).padStart(2, "0")}:${String(secsRem).padStart(2, "0")}`,
        );
      }, 1000);
      return () => clearInterval(timer);
    }, [times, loading]);
  ```
  (Catatan: variabel `hours/minutes/seconds/days` di atas dipakai bila komponen merender jam; bila tak terpakai, implementer hapus agar lint bersih.)
- **Section jadwal sholat Beranda**: cari bagian yang merender 6 waktu sholat / countdown `countdownText` (sekitar baris 480-an) dan pastikan sumbernya memakai `times`/`countdownText` dari state di atas (bukan konstanta lama). Pada kartu waktu: tampilkan `loading ? "--:--" : times.<key>`. Implementer baca posisi render pastinya dan sesuaikan kelas agar konsisten dengan gaya sebelumnya.

- [ ] **Step 3: Verifikasi tidak ada `localPrayers` tersisa**

Run: `grep -rn "localPrayers" app/ components/ || echo "CLEAN"`
Expected: `CLEAN`.

- [ ] **Step 4: Verifikasi build + test**

Run: `npm run build && npm test`
Expected: build sukses; semua test lulus.

- [ ] **Step 5: Verifikasi manual (dev server, HTTPS/localhost)**

Run: `npm run dev`, buka `http://localhost:3000/jadwal-sholat` dan `/`.
Expected:
- Saat browser minta izin lokasi → izinkan → waktu sholat sesuai lokasi user (bukan 04:36/11:58 dll).
- Tolak lokasi → waktu sesuai Cikoneng (Subuh ~04:40, dst).
- Countdown "sholat berikutnya" memakai waktu dinamis.
- Reload (cache) → data tampil tanpa fetch baru (cek tab Network).
- Tidak ada error konsol terkait `localPrayers`.

- [ ] **Step 6: Commit**

```bash
git add "app/(site)/jadwal-sholat/page.tsx" "app/(site)/beranda/page.tsx"
git commit -m "feat(prayer): wire Beranda & Jadwal Sholat to GPS-driven hook"
```

---

## Self-Review (controller)

**Spec coverage:**
- Schema `pengaturan` → Task 1 ✓
- DEFAULT_RUNNING_TEXT + helper → Task 1 (constant) ✓; route inline query (sesuai spec "boleh inline") → Task 2 ✓
- API GET publik + PUT auth → Task 2 ✓
- Header: fetch dari DB, durasi 30, hapus dead code → Task 3 ✓
- Admin page + Sidebar → Task 4 ✓
- Prayer helpers (mapAladhanToPrayers, buildCacheKey, prayerTimesToMinutes) → Task 5 ✓ (+ computeNextPrayer untuk DRY countdown)
- Hook usePrayerTimes (GPS + cache + fallback) → Task 6 ✓
- Wiring beranda + jadwal-sholat, hapus localPrayers → Task 7 ✓
- Method Kemenag (method=20) + school=0 → Global Constraints + Task 5/6 ✓
- Fallback masjid coords → Task 5/6 ✓
- Cache key format → Task 5 + Task 6 ✓

**Placeholder scan:** tidak ada "TBD/TODO". Method Aladhan sudah dikunci 20 (terverifikasi via `/v1/methods`). Satu catatan "implementer baca posisi render pastinya" di Task 7 Step 2 — itu petunjuk pembacaan file, bukan placeholder kode (kode inti diberikan).

**Type consistency:** `PrayerTimes` keys (`subuh/terbit/dzuhur/ashar/maghrib/isya`) konsisten di Task 5, 6, 7. `NextPrayer.key` bertipe `keyof PrayerTimes`; `times[next.key]` valid. `usePrayerTimes` return `{ times, loading, source }` konsisten dipakai Task 7.

**Catatan eksekusi:**
- Task 1 → 2 → 3/4 berurutan (bergantung schema+API). Task 5 mandiri; 6 setelah 5; 7 setelah 6. Urutan eksekusi SDD yang disarankan: 1, 2, 5, 3, 4, 6, 7 (Task 5 boleh ditarik lebih awal karena mandiri).
- Verifikasi route & UI bersifat manual (proyek tidak punya infrastruktur test HTTP/UI); pure logic di unit-test (Task 1 konstanta, Task 5 helpers).
