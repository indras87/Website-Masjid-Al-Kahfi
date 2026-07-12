# Beranda Featured Kegiatan — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hubungkan section "Program Masjid / Kegiatan Utama & Kemaslahatan" di Beranda ke data kegiatan nyata — tampilkan 3 kartu (image-header) pilihan admin via toggle `featured`, backfill bila <3.

**Architecture:** Tambah kolom boolean `featured` pada `kegiatan` (sync via `npm run db:push`). Field mengalir lewat API POST/PUT, form admin (toggle + badge), dan akhirnya dirender di section Beranda yang sudah fetch `activitiesData` tapi belum dipakai. Selection: featured diutamakan lalu backfill, ambil 3.

**Tech Stack:** Next.js 15.5 (App Router), Drizzle ORM + PostgreSQL, Tailwind v4, `next/image`.

**Related spec:** `docs/superpowers/specs/2026-07-12-beranda-featured-kegiatan-design.md`

## Global Constraints

- **Tidak ada kerangka tes otomatis** — verifikasi = `npm run build` + manual. User meminta SKIP `npm run build` dan SKIP db push/seed saat eksekusi; jadikan keduanya USER-RUN (lihat "User Runs" tiap task & di akhir).
- **Sync schema via `npm run db:push`** (bukan generate migrasi). Tidak ada file migrasi baru.
- **`featured` notNull default false** — aman untuk data lama (dapat false saat push).
- **Tidak ada hard-cap 3 di admin** — tampilan ambil 3 pertama berprioritas featured.
- **`next/image`** sudah di-import di Beranda (line 4). Path lokal same-origin, tidak perlu whitelist.
- **Jangan sentuh** field `desc/note/icon/color` di admin (out of scope).

## User Runs (dilakukan USER, bukan saat eksekusi otomatis)

Per instruksi user, langkah berikut TIDAK dijalankan saat eksekusi — user jalankan setelah kode selesai:
1. `npm run db:push` — terapkan kolom `featured` ke DB.
2. `npm run build` — verifikasi build.
3. `npm run dev` — uji manual (toggle featured di `/admin/kegiatan`, lihat di `/`).

## File Structure

| File | Aksi | Tanggung jawab |
|---|---|---|
| `lib/db/schema.ts` | Modify | Kolom `kegiatan.featured` |
| `app/api/kegiatan/route.ts` | Modify | POST simpan `featured` |
| `app/api/kegiatan/[id]/route.ts` | Modify | PUT simpan `featured` |
| `app/admin/(protected)/kegiatan/page.tsx` | Modify | State `featured` + toggle modal + badge tabel + payload |
| `app/(site)/beranda/page.tsx` | Modify | Mapper `img`+`featured`, FALLBACK, seleksi 3 + render section |

---

## Task 1: Kolom `featured` pada schema

**Files:** Modify `lib/db/schema.ts` (tabel `kegiatan`, baris 100-113)

**Interfaces:** Produces kolom `featured: boolean notNull default false`. Task 2 & 3 bergantung kolom ini di schema.

- [ ] **Step 1: Tambah properti `featured`**

Pada `lib/db/schema.ts`, di `pgTable("kegiatan", {...})`, tambahkan setelah `img` dan sebelum `createdAt`:

```ts
  img: text("img"),
  featured: boolean("featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
```

Pastikan import `boolean` ada di atas file (cek: `import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm";`). Jika `boolean` belum di-import, tambahkan.

- [ ] **Step 2: USER RUN — sync DB**

User jalankan: `npm run db:push`

Expected: kolom `featured` (boolean, default false, not null) ditambahkan ke tabel `kegiatan`.

- [ ] **Step 3: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat(kegiatan): add featured column to schema"
```

---

## Task 2: API routes menerima `featured` (POST & PUT)

**Files:**
- Modify `app/api/kegiatan/route.ts` (POST)
- Modify `app/api/kegiatan/[id]/route.ts` (PUT)

**Interfaces:**
- Consumes: kolom `kegiatan.featured` (Task 1).
- Produces: POST/PUT menerima `featured`; Task 3 (admin) mengirim field ini.

- [ ] **Step 1: POST — destructure `featured`**

`app/api/kegiatan/route.ts`, baris destructure (saat ini `...color, img } = body;`):

```ts
const { title, type, time, ust, status, desc, note, icon, color, img, featured } = body;
```

- [ ] **Step 2: POST — sertakan `featured` pada insert**

Pada `db.insert(kegiatan).values({...})`, tambahkan `featured: featured ?? false,` (setelah `img: img || null,`):

```ts
      icon: finalIcon,
      color: finalColor,
      img: img || null,
      featured: featured ?? false,
    }).returning();
```

- [ ] **Step 3: PUT — destructure `featured`**

`app/api/kegiatan/[id]/route.ts`:

```ts
const { title, type, time, ust, status, desc, note, icon, color, img, featured } = body;
```

- [ ] **Step 4: PUT — sertakan `featured` pada set**

Pada `db.update(kegiatan).set({...})`, tambahkan `featured: featured ?? false,`:

```ts
        icon,
        color,
        img: img || null,
        featured: featured ?? false,
      })
```

- [ ] **Step 5: Commit**

```bash
git add app/api/kegiatan/route.ts app/api/kegiatan/[id]/route.ts
git commit -m "feat(kegiatan): persist featured field in POST/PUT API"
```

---

## Task 3: Form admin — toggle featured + badge tabel

**Files:** Modify `app/admin/(protected)/kegiatan/page.tsx`

**Interfaces:**
- Consumes: endpoint POST/PUT dari Task 2.
- Produces: form admin mengirim `featured` di payload.

- [ ] **Step 1: Tambah state `featured`**

Setelah `const [img, setImg] = useState('');` (baris 30):

```ts
  const [img, setImg] = useState('');
  const [featured, setFeatured] = useState(false);
```

- [ ] **Step 2: Reset `featured` saat tambah**

`handleOpenAdd`, setelah `setImg('');`:

```ts
    setStatus('Aktif');
    setImg('');
    setFeatured(false);
    setIsModalOpen(true);
```

- [ ] **Step 3: Isi `featured` saat edit**

`handleOpenEdit`, setelah `setImg(item.img || '');`:

```ts
    setStatus(item.status);
    setImg(item.img || '');
    setFeatured(!!item.featured);
    setIsModalOpen(true);
```

- [ ] **Step 4: Sertakan `featured` pada payload**

Pada `handleSubmit`, ubah definisi payload:

```ts
    const payload = { title, type, time, ust, status, img: img || null, featured };
```

- [ ] **Step 5: Render toggle di modal**

Ganti grid 2-kolom "Kategori + Status" (baris 308-332) agar baris kedua berisi select Status + checkbox featured. Struktur:

```tsx
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Kategori</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="Harian">Harian</option>
                    <option value="Jum'at">Jum&apos;at</option>
                    <option value="Hari Besar">Hari Besar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status Keaktifan</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                Tampilkan di Beranda
              </label>
```

(Checkbox dipasang sebagai baris terpisah setelah grid, bukan di dalam grid — agar label panjang tidak terpotong.)

- [ ] **Step 6: Badge "Beranda" di tabel**

Pada cell Status di tabel list (saat ini satu `<span>` pill status), bungkus dalam flex dan tambahkan chip "Beranda" bila `item.featured`:

```tsx
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                          {item.status}
                        </span>
                        {item.featured && (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-100 text-gold-800">
                            Beranda
                          </span>
                        )}
                      </div>
                    </td>
```

- [ ] **Step 7: Commit**

```bash
git add app/admin/(protected)/kegiatan/page.tsx
git commit -m "feat(kegiatan): add featured toggle + beranda badge to admin form"
```

---

## Task 4: Beranda — wire section ke kegiatan featured

**Files:** Modify `app/(site)/beranda/page.tsx`

**Interfaces:**
- Consumes: `img` & `featured` dari API (Task 2) + `color`/`Icon` hasil mapper.
- Produces: section Program Masjid merender 3 kartu kegiatan (image-header + fallback).

- [ ] **Step 1: Mapper — teruskan `img` & `featured`**

Pada `mappedKegiatan` (baris 314-324), tambahkan dua field ke objek return:

```ts
            return {
              cat: catMap[k.type] || "harian",
              tag: tagMap[k.type] || "Harian / Rutin",
              time: k.time,
              title: k.title,
              desc: k.desc || "",
              ust: k.ust,
              note: k.note || "",
              Icon: iconMap[k.icon] || CircleUser,
              color: k.color || "bg-emerald-50 text-emerald-800",
              img: k.img || "",
              featured: !!k.featured,
            };
```

- [ ] **Step 2: FALLBACK — tambah `img` & `featured`**

Pada setiap 4 entri `FALLBACK_KEGIATAN` (baris 58-103), tambahkan `img: "",` dan `featured: false,` setelah `color`. Contoh entri pertama:

```ts
  {
    cat: "harian",
    tag: "Harian / Rutin",
    time: "Setiap Hari (Bada Subuh)",
    title: "Tahsin & Bimbingan Mengaji Quran Dewasa",
    desc: "Program pengentasan buta aksara Quran ...",
    ust: "Ust. Sulaeman Al-Hafidz",
    note: "Gratis & Terbuka",
    Icon: CircleUser,
    color: "bg-emerald-50 text-emerald-800",
    img: "",
    featured: false,
  },
```

Ulangi untuk 3 entri lainnya.

- [ ] **Step 3: Seleksi 3 kartu**

Tambahkan perhitungan `programKegiatan` di dalam komponen (sebelum `return`), setelah state declarations / dekat derivasi lain. Karena `activitiesData` sudah Aktif-only:

```ts
  const programKegiatan = [
    ...activitiesData.filter((a) => a.featured),
    ...activitiesData.filter((a) => !a.featured),
  ].slice(0, 3);
```

- [ ] **Step 4: Render section — ganti 3 kartu hardcoded**

Ganti seluruh isi grid (baris 507-565, tiga `<div>` hardcoded) dengan map `programKegiatan`. Pertahankan heading (baris 499-506) dan wrapper `max-w-7xl`. Grid baru:

```tsx
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {programKegiatan.map((act, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gold-100 shadow-md hover:shadow-lg transition overflow-hidden flex flex-col"
            >
              {act.img ? (
                <div className="relative w-full h-40">
                  <Image
                    src={act.img}
                    alt={act.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className={`relative w-full h-40 flex items-center justify-center ${act.color}`}>
                  <act.Icon size={48} className="opacity-25" />
                </div>
              )}
              <div className="p-6 space-y-4 flex-1 flex flex-col">
                <h4 className="font-serif text-lg font-bold text-emerald-950">
                  {act.title}
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                  {act.desc}
                </p>
                <a
                  href="/kegiatan"
                  className="text-xs text-emerald-900 font-bold hover:text-gold-600 transition flex items-center gap-1 mt-auto"
                >
                  Lihat Detail <ChevronRight size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
```

Catatan: `overflow-hidden` di kartu agar sudut foto ter-clip rounded. `flex-col` + `mt-auto` agar link selalu di dasar (tinggi kartu seragam). `line-clamp-3` batasi deskripsi 3 baris (plugin typography @tailwindcss/typography sudah di devDeps; `line-clamp` built-in Tailwind v4).

- [ ] **Step 5: Commit**

```bash
git add app/(site)/beranda/page.tsx
git commit -m "feat(beranda): show 3 featured kegiatan cards in program section"
```

---

## User Runs (setelah semua task selesai)

1. `npm run db:push` — kolom `featured` ke DB.
2. `npm run build` — verifikasi compile.
3. `npm run dev` — uji manual:
   - `/admin/kegiatan` → edit kegiatan → centang "Tampilkan di Beranda" → simpan. Badge "Beranda" muncul di tabel.
   - `/` (Beranda) → section "Kegiatan Utama & Kemaslahatan" tampilkan 3 kartu: featured diutamakan, sisanya backfill. Foto tampil bila ada, fallback ikon+warna bila tidak.
   - Tandai 5 featured → Beranda tampilkan 3 pertama. Tandai 0 → 3 kegiatan Aktif teratas.

## Verification (integrated)

- Build lulus.
- Flow: toggle featured → Beranda prioritaskan kartu tsb.
- Backfill: <3 featured → slot diisi kegiatan Aktif lain.
- Fallback foto: kegiatan featured tanpa foto → header ikon+warna.
- Tidak ada regresi: `/kegiatan` page, kartu berita/galeri lain tidak berubah.
