# Image Header Kartu Kegiatan — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambahkan satu foto header (opsional) per kegiatan, upload via form admin memakai `ImageUpload`, dan tampilkan sebagai image header full-width di puncak kartu pada halaman publik `/kegiatan`, dengan fallback berupa bidang berwarna + ikon kategori bila tidak ada foto.

**Architecture:** Tambah kolom nullable `img` pada tabel `kegiatan` (Drizzle, sync via `drizzle-kit push`). Field `img` mengalir lewat API POST/PUT, form admin (widget `ImageUpload` + state), dan akhirnya dirender sebagai header `next/image` di kartu publik — dengan cabang fallback memakai `color` + `Icon` yang sudah ada di setiap kegiatan. Tidak ada infrastruktur upload baru; semua memakai pipeline yang sudah dipakai berita/galeri/pengurus.

**Tech Stack:** Next.js 15.5 (App Router, client & server components), Drizzle ORM 0.45 + PostgreSQL, Tailwind v4, `next/image`, komponen `ImageUpload` + endpoint `/api/upload` yang sudah ada.

**Related spec:** `docs/superpowers/specs/2026-07-12-kegiatan-image-header-design.md`

## Global Constraints

- **Tidak ada kerangka tes otomatis yang dipakai di repo ini** (script `test` ada tapi tidak ada suite untuk UI/DB). Verifikasi per task = `npm run build` lulus + verifikasi manual. Jangan mengarang file tes palsu.
- **Sync schema via `npm run db:push`** — bukan `drizzle-kit generate`/`migrate`. Project memakai `drizzle-kit push` (schema-direct). Tidak ada file migrasi SQL baru yang dibuat. (Sama seperti fitur pengurus-hierarki.)
- **Kolom `img` nullable** (`text("img")`). Boleh `null`/string kosong. Fallback menangani render ketika kosong.
- **Upload**: maks 2MB, MIME jpeg/png/webp/gif, kompresi WebP otomatis — semua ditangani widget `ImageUpload` + `/api/upload` yang sudah ada. JANGAN modifikasi widget/endpoint.
- **`next/image`**: path lokal `/uploads/...` same-origin → tidak perlu whitelist `next.config.ts`.
- **Naming field**: `img` (konsisten dengan `berita.img`, `galeri.img`).
- **Bahasa label UI**: Indonesia (ikuti label form admin yang ada).
- **Jangan sentuh** field `desc/note/icon/color` di form admin (di luar scope).

## File Structure

| File | Aksi | Tanggung jawab |
|---|---|---|
| `lib/db/schema.ts` | Modify | Definisi kolom `kegiatan.img` (sumber kebenaran schema) |
| `app/api/kegiatan/route.ts` | Modify | POST menerima & menyimpan `img` |
| `app/api/kegiatan/[id]/route.ts` | Modify | PUT menerima & menyimpan `img` |
| `app/admin/(protected)/kegiatan/page.tsx` | Modify | State `img` + widget `ImageUpload` + payload |
| `app/(site)/kegiatan/page.tsx` | Modify | Teruskan `img` lewat mapper + render header/fallback di kartu |

Tidak ada file baru (selain plan/spec). Tidak ada komponen baru — header dirender inline di kartu yang sudah inline, mengikuti konvensi halaman ini.

---

## Task 1: Tambah kolom `img` pada schema `kegiatan`

**Files:**
- Modify: `lib/db/schema.ts` (tabel `kegiatan`, ~baris 100-112)

**Interfaces:**
- Produces: kolom `img: text("img")` (nullable) pada tabel `kegiatan`. Task 2 & 3 bergantung pada kolom ini ada di schema (agar query Drizzle mengenali field `img`).

- [ ] **Step 1: Tambah properti `img` pada pgTable `kegiatan`**

Pada `lib/db/schema.ts`, di dalam objek `pgTable("kegiatan", { ... })`, tambahkan baris `img: text("img"),` setelah properti `color` dan sebelum `createdAt`. Hasil tabel menjadi:

```ts
export const kegiatan = pgTable("kegiatan", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  time: text("time").notNull(),
  ust: text("ust").notNull(),
  status: text("status").default("Aktif").notNull(),
  desc: text("desc"),
  note: text("note"),
  icon: text("icon"),
  color: text("color"),
  img: text("img"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

- [ ] **Step 2: Sync schema ke database**

Run: `npm run db:push`

Expected: Drizzle mendeteksi penambahan kolom `img` pada tabel `kegiatan` dan menampilkannya sebagai tambahan non-destruktif. Untuk penambahan kolom nullable, drizzle-kit push akan menerapkannya (mungkin perlu konfirmasi `y` di prompt interaktif — pilih `y`). Tidak ada kolom/ tabel lain yang di-drop.

Catatan: butuh database berjalan di `localhost:5433` (sesuai `docker-compose.yml`) dengan `DATABASE_URL` yang sesuai di `.env.local`. Jika DB tidak berjalan, jalankan `docker-compose up -d --build` dulu, lalu ulangi `npm run db:push`.

- [ ] **Step 3: Verifikasi kolom ada**

Run (via psql di container DB, atau query apa pun yang terhubung ke `alkahfi_db`):

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kegiatan' AND column_name = 'img';
```

Expected: satu baris dengan `column_name = img`, `data_type = text`, `is_nullable = YES`.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat(kegiatan): add nullable img column to schema"
```

---

## Task 2: API routes menerima field `img` (POST & PUT)

**Files:**
- Modify: `app/api/kegiatan/route.ts` (POST, baris 18-58)
- Modify: `app/api/kegiatan/[id]/route.ts` (PUT, baris 6-44)

**Interfaces:**
- Consumes: kolom `kegiatan.img` dari Task 1.
- Produces: endpoint POST `/api/kegiatan` dan PUT `/api/kegiatan/[id]` menerima `img` di body JSON dan mempersistensinya. Task 3 (admin form) akan mengirim field ini.

- [ ] **Step 1: POST — destructure `img` dari body**

Pada `app/api/kegiatan/route.ts` baris 21, tambahkan `img` ke destructure:

```ts
const { title, type, time, ust, status, desc, note, icon, color, img } = body;
```

- [ ] **Step 2: POST — sertakan `img` pada insert values**

Masih di `app/api/kegiatan/route.ts`, pada blok `db.insert(kegiatan).values({...})` (baris 41-51), tambahkan properti `img: img || null,`. Hasil:

```ts
const result = await db.insert(kegiatan).values({
  title,
  type,
  time,
  ust,
  status: status || 'Aktif',
  desc: desc || '',
  note: note || '',
  icon: finalIcon,
  color: finalColor,
  img: img || null,
}).returning();
```

(`finalIcon`/`finalColor` baris di atasnya tidak diubah.)

- [ ] **Step 3: PUT — destructure `img` dari body**

Pada `app/api/kegiatan/[id]/route.ts` baris 13, tambahkan `img`:

```ts
const { title, type, time, ust, status, desc, note, icon, color, img } = body;
```

- [ ] **Step 4: PUT — sertakan `img` pada update set**

Masih di file yang sama, pada blok `db.update(kegiatan).set({...})` (baris 20-31), tambahkan properti `img: img || null,`:

```ts
const result = await db.update(kegiatan)
  .set({
    title,
    type,
    time,
    ust,
    status,
    desc,
    note,
    icon,
    color,
    img: img || null,
  })
  .where(eq(kegiatan.id, numericId))
  .returning();
```

Catatan: `img: img || null` berarti jika admin mengosongkan foto (string kosong), kolom di-set `null` → fallback tampil di halaman publik. Perilaku ini diinginkan.

- [ ] **Step 5: Build check**

Run: `npm run build`

Expected: build lulus tanpa error TypeScript. (Akan ada warning normal terkait penggunaan `any` di file lain yang sudah ada sebelumnya — itu bukan kegagalan.)

- [ ] **Step 6: Commit**

```bash
git add app/api/kegiatan/route.ts app/api/kegiatan/[id]/route.ts
git commit -m "feat(kegiatan): persist img field in POST/PUT API"
```

---

## Task 3: Form admin — widget upload foto header

**Files:**
- Modify: `app/admin/(protected)/kegiatan/page.tsx`

**Interfaces:**
- Consumes: endpoint POST/PUT dari Task 2 yang kini menerima `img`.
- Produces: form admin mengirim `img` (string path `/uploads/...` atau `null`) lewat payload create/update.

- [ ] **Step 1: Import komponen `ImageUpload`**

Pada `app/admin/(protected)/kegiatan/page.tsx`, tambahkan import setelah baris 4 (import lucide):

```ts
import ImageUpload from "@/app/admin/components/ImageUpload";
```

- [ ] **Step 2: Tambah state `img`**

Setelah deklarasi state `status` (baris 28), tambahkan:

```ts
const [img, setImg] = useState('');
```

- [ ] **Step 3: Reset `img` saat tambah baru**

Pada `handleOpenAdd` (baris 55-63), tambahkan `setImg('');` setelah `setStatus('Aktif');`:

```ts
const handleOpenAdd = () => {
  setEditItem(null);
  setTitle('');
  setType('Harian');
  setTime('');
  setUst('');
  setStatus('Aktif');
  setImg('');
  setIsModalOpen(true);
};
```

- [ ] **Step 4: Isi `img` saat edit**

Pada `handleOpenEdit` (baris 65-73), tambahkan `setImg(item.img || '');` setelah `setStatus(item.status);`:

```ts
const handleOpenEdit = (item: any) => {
  setEditItem(item);
  setTitle(item.title);
  setType(item.type);
  setTime(item.time);
  setUst(item.ust);
  setStatus(item.status);
  setImg(item.img || '');
  setIsModalOpen(true);
};
```

- [ ] **Step 5: Sertakan `img` pada payload submit**

Pada `handleSubmit` (baris 105), ubah definisi payload:

```ts
const payload = { title, type, time, ust, status, img: img || null };
```

(Tidak menambah validasi required — `img` opsional. Validasi `!title || !time || !ust` yang sudah ada tidak diubah.)

- [ ] **Step 6: Render widget `ImageUpload` di dalam modal form**

Di dalam `<form onSubmit={handleSubmit} className="p-6 space-y-4">` (mulai baris 289), sisipkan widget sebagai field **pertama** — yaitu segera setelah tag pembuka `<form ...>` dan sebelum div "Nama Kegiatan" (baris 290). Karena form memakai `space-y-4`, jarak otomatis.

```tsx
<ImageUpload value={img} onChange={setImg} label="Foto Header Kegiatan (Maksimal 2MB)" />
```

Struktur akhir awal form:

```tsx
<form onSubmit={handleSubmit} className="p-6 space-y-4">
  <ImageUpload value={img} onChange={setImg} label="Foto Header Kegiatan (Maksimal 2MB)" />

  <div>
    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Kegiatan</label>
    <input
      type="text"
      required
      placeholder="Contoh: Kajian Fiqih Bulanan"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
    />
  </div>
  {/* ...field lainnya tidak diubah... */}
```

- [ ] **Step 7: Build check**

Run: `npm run build`

Expected: build lulus.

- [ ] **Step 8: Verifikasi manual (dev server)**

Run: `npm run dev` → buka `http://localhost:3000/admin/kegiatan` (login bila perlu) → klik "Tambah Kegiatan".

Expected: field pertama di modal adalah dropzone upload (bukan input text). Coba upload gambar < 2MB → preview muncul. Isi field wajib lain → "Tambah Kegiatan" → entri tersimpan. Cek di DB bahwa kolom `img` terisi path `/uploads/...`. Ulangi untuk edit: buka entri → foto lama muncul di preview → ganti/hapus → simpan.

- [ ] **Step 9: Commit**

```bash
git add app/admin/(protected)/kegiatan/page.tsx
git commit -m "feat(kegiatan): add header photo upload to admin form"
```

---

## Task 4: Halaman publik — render image header + fallback

**Files:**
- Modify: `app/(site)/kegiatan/page.tsx`

**Interfaces:**
- Consumes: field `img` dari API (Task 2) + `color` & `Icon` yang sudah dipetakan di page ini.
- Produces: kartu kegiatan publik menampilkan foto header saat `img` ada, atau fallback (bidang `color` + ikon `opacity-25`) bila kosong.

- [ ] **Step 1: Import `next/image`**

Pada `app/(site)/kegiatan/page.tsx`, tambahkan import (setelah baris 6, import lucide):

```ts
import Image from "next/image";
```

- [ ] **Step 2: Teruskan `img` lewat mapper fetch**

Pada mapper di dalam `.map((k: any) => { ... })` (baris 87-97), tambahkan properti `img: k.img || "",` ke objek return:

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
};
```

- [ ] **Step 3: Tambah `img: ""` ke setiap entri `FALLBACK_KEGIATAN`**

Pada `FALLBACK_KEGIATAN` (baris 15-60), tambahkan properti `img: "",` ke **masing-masing** dari 4 objek (di dalam objek, sebelum atau sesudah `color`). Contoh entri pertama:

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
},
```

Ulangi penambahan `img: ""` untuk 3 entri lainnya.

- [ ] **Step 4: Sisipkan blok header di puncak kartu**

Di dalam `motion.div` kartu (baris 147-152), **sebelum** `<div className="p-6 sm:p-8 space-y-4">` (baris 153), sisipkan blok kondisional header. Kartu sudah punya `overflow-hidden rounded-2xl` (baris 151) sehingga sudut gambar ter-clip otomatis.

```tsx
<motion.div
  key={idx}
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  className="bg-white rounded-2xl overflow-hidden border border-gold-100 shadow-sm flex flex-col justify-between"
>
  {act.img ? (
    <div className="relative w-full h-48">
      <Image
        src={act.img}
        alt={act.title}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
      />
    </div>
  ) : (
    <div className={`relative w-full h-48 flex items-center justify-center ${act.color}`}>
      <act.Icon size={56} className="opacity-25" />
    </div>
  )}
  <div className="p-6 sm:p-8 space-y-4">
    {/* ...konten kartu yang sudah ada tidak diubah... */}
  </div>
```

Catatan: `act.color` adalah string kelas Tailwind dua-bagian (mis. `"bg-emerald-50 text-emerald-800"`); dipasang ke div fallback → memberi background + warna teks, dan `act.Icon` mewarisi warna teks tersebut. `opacity-25` membuat ikon terlihat halus.

- [ ] **Step 5: Build check**

Run: `npm run build`

Expected: build lulus.

- [ ] **Step 6: Verifikasi manual (dev server)**

Run: `npm run dev` → buka `http://localhost:3000/kegiatan`.

Expected:
- Kegiatan yang baru di-upload fotonya (Task 3) → gambar tampil full-width di puncak kartu, sudut membulat mengikuti kartu.
- Kegiatan lama tanpa foto → fallback: bidang berwarna sesuai kategori (`bg-emerald-50`/`bg-gold-100`/`bg-emerald-900`) dengan ikon kategori besar semi-transparan di tengah.
- Filter kategori tetap berfungsi; layout grid 2 kolom tetap rapi.
- Untuk menguji jalur `FALLBACK_KEGIATAN`: hentikan sementara API (mis. ubah endpoint fetch ke `/api/kegiatan-tidak-ada` lalu kembalikan) — semua kartu fallback harus tampil dengan fallback (tidak ada gambar). Setelah uji, kembalikan endpoint.

- [ ] **Step 7: Commit**

```bash
git add app/(site)/kegiatan/page.tsx
git commit -m "feat(kegiatan): render header image with icon fallback on public cards"
```

---

## Verification (integrated, end-to-end)

Setelah keempat task:

1. `npm run build` lulus.
2. Flow penuh: admin tambah kegiatan dengan foto → tersimpan → tampil di `/kegiatan` dengan image header.
3. Admin tambah kegiatan tanpa foto → tampil di `/kegiatan` dengan fallback (bidang `color` + ikon).
4. Edit kegiatan: ganti foto → header berubah; hapus foto → kembali ke fallback.
5. Tidak ada regresi pada filter kategori, layout grid, atau kartu berita/galeri lain (perubahan hanya pada halaman kegiatan).
