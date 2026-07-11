# Foto Pengurus via Upload — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ganti input URL text pada field `foto` di form admin pengurus dengan komponen `ImageUpload` yang sudah ada (upload file langsung).

**Architecture:** Reuse komponen `ImageUpload` (`app/admin/components/ImageUpload.tsx`) + endpoint `/api/upload` yang sudah dipakai berita/galeri. Tidak ada infrastruktur baru. Schema/API/halaman publik tidak berubah — `foto` tetap kolom `text` berisi path string.

**Tech Stack:** Next.js 15 (App Router), React, Tailwind, next/image.

## Global Constraints

- Hanya `app/admin/(protected)/tentang/page.tsx` yang boleh berubah, dan hanya bagian form pengurus (modal Tambah/Edit). Visi-misi, fasilitas, dan logic pengurus lain tidak boleh tersentuh.
- Komponen `ImageUpload` (`@/app/admin/components/ImageUpload`) dan endpoint `/api/upload` dipakai apa adanya — JANGAN modifikasi.
- Validasi `!pFoto` di `handleSubmitPengurus` tetap ada (foto wajib).
- Bahasa UI: Indonesia.
- Verifikasi: `npm run build` + cek manual form upload (project tidak punya framework test).

**Spec referensi:** `docs/superpowers/specs/2026-07-12-pengurus-foto-upload-design.md`

---

## File Structure

- **Modify** `app/admin/(protected)/tentang/page.tsx` — import `ImageUpload` + ganti input URL foto menjadi `<ImageUpload />`

---

## Task 1: Ganti input URL foto dengan komponen ImageUpload

**Files:**
- Modify: `app/admin/(protected)/tentang/page.tsx`

**Interfaces:**
- Consumes: komponen `ImageUpload` dari `@/app/admin/components/ImageUpload` (props: `value: string`, `onChange: (url: string) => void`, `label?: string`); state `pFoto`/`setPFoto` yang sudah ada.
- Produces: form pengurus dengan field foto berupa upload widget (bukan input text).

- [ ] **Step 1: Tambah import ImageUpload**

Buka `app/admin/(protected)/tentang/page.tsx`. Di blok import atas file, tambahkan (bersama import komponen lain, sesuai urutan yang sudah ada):

```typescript
import ImageUpload from "@/app/admin/components/ImageUpload";
```

Jika import ini sudah ada (mis. dipakai fasilitas), jangan duplikat — lewati step ini.

- [ ] **Step 2: Ganti input URL foto dengan ImageUpload**

Temukan field foto di form pengurus (modal Tambah/Edit Pengurus). Bentuknya kira-kira:

```typescript
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
```

(Sebelumnya, di Task 6 pengurus-hierarki, blok ini mungkin berbentuk `<ImageUpload>` lalu diubah ke input text — kembalikan ke `<ImageUpload>`.)

Ganti seluruh blok div tersebut dengan:

```typescript
              <ImageUpload value={pFoto} onChange={setPFoto} label="Foto" />
```

Catatan: `ImageUpload` punya label & validasi tampilannya sendiri. Pertahankan posisinya di form (biasanya setelah field urutan, sebelum tombol Simpan/Batal). JANGAN ubah field lain (nama, tingkat, jabatan, sub-bidang, urutan).

- [ ] **Step 3: Pastikan tidak ada referensi input URL foto yang tersisa**

Cek tidak ada `<input ... value={pFoto}` lagi di form pengurus:

```bash
grep -n "pFoto" "app/admin/(protected)/tentang/page.tsx"
```

Expected: `pFoto` muncul hanya di (a) deklarasi state `useState`, (b) `handleOpenAddPengurus`/`handleOpenEditPengurus` (reset/isi), (c) payload `handleSubmitPengurus`, dan (d) props `<ImageUpload value={pFoto} onChange={setPFoto} ...>`. Tidak boleh ada input text terpisah untuk foto.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: sukses, zero error. Halaman `/admin/tentang` & `/admin` ter-compile.

- [ ] **Step 5: Verifikasi manual (browser)**

Jalankan dev server: `npm run dev`. Login admin (`superadmin@masjidalkahfi.test` / `Superadmin123!`), buka `/admin/tentang` → tab Pengurus:
- Klik "Tambah" → field "Foto" berupa dropzone upload (ikon upload, "Pilih berkas atau seret foto kesini"), BUKAN input text.
- Upload gambar (jpg/png < 2MB) → preview muncul, badge path `/uploads/...` tampil.
- Isi field lain (nama, tingkat, dll) → Submit → entri tersimpan.
- Buka halaman publik `/tentang` → foto yang di-upload tampil pada card pengurus bersangkutan.
- Cek file fisik ada: `ls public/uploads/` (ada file baru `<timestamp>_<nama>.webp`).

- [ ] **Step 6: Commit**

```bash
git add "app/admin/(protected)/tentang/page.tsx"
git commit -m "feat: replace pengurus photo URL input with upload widget"
```

---

## Summary Checklist

- [ ] Import `ImageUpload` ada (tidak duplikat)
- [ ] Field foto di form pengurus = `<ImageUpload>` (bukan input text)
- [ ] Field form lain (nama/tingkat/jabatan/sub-bidang/urutan) tidak berubah
- [ ] Visi-misi & fasilitas tidak tersentuh
- [ ] `npm run build` sukses
- [ ] Upload foto berfungsi end-to-end (form → `/api/upload` → `/public/uploads/` → tampil di publik)

---

**Plan complete and saved to `docs/superpowers/plans/2026-07-12-pengurus-foto-upload-implementation.md`.**
