# SEO Optimization (Search Engine + AI Search) — Design Spec

**Date:** 2026-07-13
**Status:** Approved (pending spec review)
**Related:** `app/layout.tsx`, `app/(site)/**`, `app/api/**`, `components/layout-header.tsx`, `components/layout-footer.tsx`, `lib/db/schema.ts`, `lib/db/seed.ts`, `lib/slug.ts`, `next.config.ts`, `public/`

## Problem

Situs publik Masjid Al-Kahfi saat ini **tidak memiliki infrastruktur SEO sama sekali**, dan struktur rendernya aktif menghalangi rayapan/indeks mesin pencari. Masalah konkret:

1. **Tidak ada metadata per-halaman.** Hanya root `app/layout.tsx` (baris 16-19) yang men-set `metadata` (title + description saja). Semua halaman `(site)` mewarisi title/description yang sama. Tidak ada `metadataBase`, `openGraph`, `twitter`, `robots`, `alternates.canonical`, `icons`, atau `verification` di mana pun.
2. **Semua halaman publik Client-rendered.** Setiap `app/(site)/*/page.tsx` adalah `"use client"` yang fetch data dari `/api/*` lewat `useEffect`. HTML yang dikirim ke crawler kosong (hanya shell header/footer); konten muncul setelah hydrasi. `/berita/[slug]` — halaman artikel yang paling bernilai untuk SEO organik — juga `"use client"`, tanpa `generateStaticParams`, tanpa `generateMetadata`.
3. **Navigasi tidak bisa dirayap.** Header (`components/layout-header.tsx` baris 131-145) dan footer (`layout-footer.tsx` baris 48-56) memakai `<button onClick={router.push()}>` alih-alih `<Link href>`/`<a>`. Crawler tidak mengikuti link internal dari chrome. Elemen `<nav>` tidak dipakai.
4. **Hierarki heading rusak.** Header merender `<h1>Masjid Al-Kahfi</h1>` (`layout-header.tsx` baris 120-122) di **setiap** halaman — H1 brand generik, bukan topik halaman. Topik halaman sebenarnya ditandai `<h2>`. `/berita/[slug]` punya **dua H1** (brand header + judul artikel). Label waktu sholat `<h4>` langsung di bawah `<h2>` (lompat hierarki).
5. **Tidak ada aset SEO sama sekali.** Tidak ada `sitemap.ts`/`sitemap.xml`, `robots.ts`/`robots.txt`, `manifest.ts`, `opengraph-image`, `icon`/`apple-icon`, JSON-LD (`application/ld+json` — grep 0 hasil), canonical link (grep 0 hasil). `public/` hanya berisi `.gitkeep` + `uploads/*.webp`. Logo situs cuma emoji 🕌.
6. **Slug lemah.** Hanya `berita` punya kolom `slug` (nullable, format `${judul}-${id}`, tidak di-enforce unik, lookup saat ini parse id client-side). `kegiatan` dan `galeri` tanpa slug/rute detail.
7. **Domain placeholder.** `APP_URL` (di `.env.example`/`.env.local`) bernilai `"MY_APP_URL"`. Tidak ada `NEXT_PUBLIC_SITE_URL`. URL absolut (sitemap, canonical, OG image, JSON-LD) mustahil dibangun benar.
8. **Aksesibilitas minim.** grep `aria-label`/`aria-hidden`/`role=` di `(site)` + `components/` = 0 hasil. Tombol icon-only (menu mobile, social footer) tanpa label. iframe Google Maps (`kontak/page.tsx` baris 115) tanpa `title`. Tidak ada skip-link, tidak ada `prefers-reduced-motion`.
9. **Gambar.** Semua sudah pakai `next/image` `<Image>` (bagus), tapi alt generik: hero `alt="Hero"`, galeri `alt="Galeri ${idx}"` & `"Preview Galeri ${idx}"` (mengabaikan kolom `title`). `sharp` tidak ada di dependencies (optimasi gambar produksi). `next.config.ts` `images.remotePatterns` belum termasuk domain upload produksi.
10. **Tidak adaAnalytics/verification.** Tidak ada GA4, Google Search Console, atau Bing Webmaster.

## Context

- **Stack**: Next.js `15.5.20` (App Router), React `19.2.1`, Drizzle ORM + postgres-js, better-auth, Tailwind v4, `next/font/google` (Playfair Display + Sora). Build config: `eslint.ignoreDuringBuilds: true`, output `standalone`.
- **Root layout** (`app/layout.tsx`): `<html lang="id">` sudah benar (baris 28). `metadata` title+description saja (16-19). `app/page.tsx` hanya `redirect("/beranda")`.
- **Rute publik `(site)`**: `/beranda`, `/berita`, `/berita/[slug]`, `/donasi`, `/galeri`, `/jadwal-sholat`, `/kegiatan`, `/kontak`, `/tentang`. Semua `"use client"`. Layout `app/(site)/layout.tsx` membungkus `<AppShell>` (header/footer).
- **API routes** (`app/api/*`): `berita`, `donasi`, `fasilitas`, `galeri`, `kegiatan`, `kontak`, `pengaturan`, `pengurs`, `profil`, `upload` — semua `export const dynamic = 'force-dynamic'`. Dipakai client components.
- **Schema** (`lib/db/schema.ts`):
  - `berita`: id, `title`, `tag`, `author`, `date`, `img`, `desc`, `content` (HTML Tiptap), `slug` (nullable).
  - `kegiatan`: id, `title`, `type` ("Harian"/"Jum'at"/"Hari Besar"), `time`, `ust`, `status`, `desc`, `note`, `icon`, `color`, `img`, `featured`. Tidak ada slug.
  - `galeri`: id, `title`, `img`. Tidak ada slug.
  - `profilMasjid` (visi/misi/history), `fasilitas` (title/desc/icon), `pengurus` (nama/foto/jabatan/tingkat), `kontak` (alamat/hotline/email/jamOperasional/googleMapsUrl), `donasi` (rekening + qrisImage), `pengaturan` (key/value, mis. `running_text`).
- **Slug** (`lib/slug.ts`): `generateSlug(title, id)` → `${slugified-title}-${id}`. Dipanggil server-side di `app/api/berita/route.ts` (POST baris 48-50) & `app/api/berita/[id]/route.ts` (PUT baris 52). Detail page parse suffix id client-side (`berita/[slug]/page.tsx` baris 16).
- **Data lokal (NAP)** dari seed `lib/db/seed.ts` baris 160-165: alamat "Jl. Cikoneng No.15, Bojongsoang, Kab. Bandung 40288", hotline "+62 812-3456-7890" (placeholder), email "alkahfi.cikoneng@gmail.com", jamOperasional "Setiap Hari: 08:00 - 20:00 WIB", googleMapsUrl embed berisi koordinat **lat -6.9856, lng 107.6589**.
- **next.config.ts** (baris 12-34): `images.remotePatterns` = picsum.photos, images.unsplash.com, placehold.co; `dangerouslyAllowSVG: true`. Tidak ada `sharp`.
- **Env**: `APP_URL` (placeholder "MY_APP_URL"), `BETTER_AUTH_URL`. Tidak ada `NEXT_PUBLIC_*`.
- **i18n**: tidak ada. Satu bahasa (Indonesia), `<html lang="id">` hardcoded.
- **Footer social** (`layout-footer.tsx` baris 64-75): 4 tombol icon-only non-fungsional (Youtube/Instagram/MessageCircle/Mail), tanpa href. User memutuskan **tetap sebagai dekorasi** sampai URL nyata tersedia.
- **Domain produksi** (dari user): `masjid-alkahfi.id` (HTTPS).
- **Test**: `npm test` = `tsx --test` (node:test) di `test/`.

## Goal

Membangun lapisan SEO komprehensif yang melayani **mesin pencari klasik (Google/Bing)** dan **mesin pencari AI (GPTBot, ClaudeBot, Perplexity, Google AI Overviews)**:

1. Setiap halaman publik punya `title`, `meta description`, canonical, Open Graph, Twitter Card yang relevan & unik.
2. HTML halaman publik berisi konten nyata saat dirender server (crawlers dapat membaca tanpa JS).
3. Schema.org `PlaceOfWorship` global + `NewsArticle`/`Event`/`BreadcrumbList`/`FAQPage` per-konteks.
4. `sitemap.xml` + `robots.txt` + `llms.txt` + RSS feed; URL ramah-SEO & canonical.
5. Hierarki heading H1–H3 benar per-halaman.
6. Aksesibilitas WCAG (nav semantik, aria-label, skip-link, iframe title, reduced-motion).
7. Core Web Vitals: gambar lazy + alt deskriptif + `sizes`, font optimal, minim CLS.
8. Mobile-first responsive (sudah Tailwind; verifikasi + fix heading).
9. AI search: konten terstruktur SSR, `llms.txt`, allow crawler AI di robots, schema yang dapat dikutip/diatribusikan.
10. Analytics + verification env-driven (opt-in).

## Decisions (locked)

1. **Domain & metadataBase**: `APP_URL` jadi sumber kebenaran, **default `https://masjid-alkahfi.id`** bila env unset/placeholder. `metadataBase = new URL(siteUrl)` di root layout. Semua URL absolut (sitemap, canonical, OG, JSON-LD) dibangun dari `siteUrl`.
2. **Config terpusat** `lib/seo/site.ts` (siteUrl, name, description, locale `id-ID`, og image default, warna brand, pohon navigasi untuk breadcrumb).
3. **Helper metadata** `lib/seo/metadata.ts` → `buildMetadata({ title, description, path, image, type, publishedTime, modifiedTime, author, noIndex })` mengembalikan `Metadata` (Next) lengkap (template title, canonical via `alternates`, OG, Twitter, robots). Semua halaman pakai helper ini → konsisten & tanpa duplikasi.
4. **Hybrid SSR**: setiap halaman publik dipecah jadi **Server Component** (fetch data awal + `generateMetadata` + SSR HTML konten) yang membungkus **Client island** (hanya bagian interaktif). Pola: `page.tsx` (server) merender shell + `<XClient ...initialData={...} />` (client). Interaktivitas yang ada (GPS jadwal sholat, copy button, lightbox, QRIS, running text) dipertahankan sebagai island.
5. **Data-access layer bersama** `lib/queries/*.ts`: ekstrak logika SELECT dari `app/api/*/route.ts` agar dapat dipakai ulang oleh server component **tanpa** roundtrip `/api`. API route tetap (untuk admin/mutasi), tapi membaca lewat helper bersama → tidak ada duplikasi query.
6. **`/berita/[slug]` prioritas tertinggi**: `generateStaticParams` (slug non-null dari DB) + `generateMetadata` (dari row berita) + SSR HTML artikel (content Tiptap) + JSON-LD `NewsArticle` + `BreadcrumbList`. Lookup by kolom `slug` langsung (bukan parse id client-side). Slug satu-kata kunci dibersihkan (`lib/slug.ts` sudah ada).
7. **Heading**: hapus `<h1>` brand dari header (→ `<p>`/`<span>` brand mark). Setiap halaman render topiknya sendiri sebagai **satu `<h1>`**; section `<h2>`; sub `<h3>`. Label waktu sholat dinaikkan ke `<h3>` (bukan `<h4>`). `/berita/[slug]` jadi satu H1 (judul artikel).
8. **Navigasi semantik**: `<button onClick={router.push}>` → `<Link href>` di header & footer; bungkus `<nav aria-label="...">`. `aria-label` pada tombol icon-only (toggle menu mobile). Emoji dekoratif 🕌 → `aria-hidden`. iframe Google Maps → `title`. Tambah skip-link "Lewati ke konten" + `prefers-reduced-motion` untuk animasi Motion.
9. **Footer social**: tetap sebagai **dekorasi** (per user) — ubah `<button>` menjadi `<span aria-hidden="true">` (bukan elemen interaktif, screen reader lewati). Layout footer tidak berubah.
10. **JSON-LD**:
    - **Global** (root layout): `PlaceOfWorship` dengan `@type` ganda `["PlaceOfWorship","Mosque"]` — name, `url`, `image`, `address` (`PostalAddress`: Cikoneng, Bojongsoang, Kab. Bandung, Jawa Barat 40288, ID), `geo` (`GeoCoordinates` lat -6.9856, lng 107.6589, diekstrak dari embed maps), `openingHoursSpecification` (dari `kontak.jamOperasional`), `email`. **`sameAs` diomit** (tidak ada URL sosial nyata). `telephone` dari `kontak.hotline` bila bukan placeholder (flag: nilai seed "+62 812-3456-7890" terlihat placeholder → admin wajib update; tampilkan catatan di spec ini).
    - `/berita/[slug]`: `NewsArticle` (headline, image, datePublished=`date`, dateModified, author=`author`, publisher=masjid).
    - `/kegiatan`: `Event` per item (name, description, `location` = masjid, `eventStatus`, startDate best-effort dari `time`; catatan: `time` string non-ISO → mapping best-effort, `schedule` berulang dirangkum deskriptif bila perlu).
    - Breadcrumb `BreadcrumbList` di `/berita/[slug]` (Home > Berita > {judul}).
    - `FAQPage` bila konten Q&A ditambahkan (lihat Decision 14).
11. **Brand assets**: `app/icon.svg` + `app/apple-icon.png` (siluet masjid warna emerald/gold, di-generate), `app/opengraph-image.tsx` (ImageResponse — kartu share default bermerek), `app/manifest.ts` (PWA: name, short_name, theme emerald, icons, `start_url: /`, `display: standalone`). OG per-artikel di `/berita/[slug]` pakai `berita.img`.
12. **Sitemap & robots**: `app/sitemap.ts` (rute statis + slug `berita` non-null dari DB, `changePriority`/`lastModified`); `app/robots.ts` (`Allow: /`, `Disallow: /admin`, `Disallow: /api`, `Sitemap:` pointer, **Allow eksplisit** untuk `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`).
13. **AI search**: `public/llms.txt` (ringkasan situs + struktur + info kontak untuk LLM crawler); SSR konten nyata (Decision 4); schema yang dapat diatribusikan (Decision 10); allow crawler AI (Decision 12); `app/feed.xml.ts` (RSS 2.0 untuk `berita` — bantu discovery mesin pencari + RSS reader).
14. **FAQ**: tambah section FAQ kecil di halaman yang relevan (mis. `/donasi` "Bagaimana cara berinfaq?", `/jadwal-sholat` "Apakah jadwal mengikuti lokasi saya?") dengan `FAQPage` JSON-LD — bagus untuk featured snippets & jawaban AI. Konten singkat, bahasa Indonesia.
15. **Gambar**: alt deskriptif dari kolom DB `title` (ganti `"Hero"`→judul hero, `"Galeri ${idx}"`→`galeri.title`); `priority` hanya pada LCP hero; `sizes` pada semua `<Image fill>` (kurang CLS); tambah dependency `sharp`; pastikan output `avif`+`webp`.
16. **Locale**: `og:locale = "id_ID"`, `<html lang="id">` (sudah). Tidak ada i18n baru.
17. **Analytics & verification (env-driven, opt-in)**: GA4 via `NEXT_PUBLIC_GA_ID` (`<Script>` kondisional, no-op bila unset); verifikasi Google Search Console & Bing via meta tag dari env (`NEXT_PUBLIC_GSC_VERIFICATION`, `NEXT_PUBLIC_BING_VERIFICATION`). Tidak ada hardcoded ID.
18. **Verifikasi kerja**: `npm run build` lulus (Next memvalidasi metadata/sitemap/robots/manifest saat build); uji manual Google Rich Results Test, PageSpeed Insights/Lighthouse, Mobile-Friendly Test, preview OG (opengraph.xyz).

## Scope of Change

### 1. Config & helper — `lib/seo/site.ts`, `lib/seo/metadata.ts`

**`lib/seo/site.ts`** (sumber kebenaran):

```ts
export const siteConfig = {
  name: "Masjid Al-Kahfi",
  shortName: "Masjid Al-Kahfi",
  url: process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL"
    ? process.env.APP_URL : "https://masjid-alkahfi.id",
  description: "Situs resmi Masjid Al-Kahfi Cikoneng, Kabupaten Bandung — jadwal sholat, kajian, berita, galeri, dan informasi infaq & zakat.",
  locale: "id_ID",
  themeColor: "#064e3b", // emerald-950 (sesuaikan token brand)
  accentColor: "#d4af37", // gold
  ogImage: "/opengraph-image", // file-based dinamis
  nav: [ /* pohon navigasi: {label, href, children?} untuk breadcrumb */ ],
  contact: { email: "alkahfi.cikoneng@gmail.com", addressLine: "Jl. Cikoneng No.15, Bojongsoang, Kab. Bandung 40288", geo: { lat: -6.9856, lng: 107.6589 } },
};
```

**`lib/seo/metadata.ts`**:

```ts
export function buildMetadata(opts: {
  title?: string; description?: string; path: string;
  image?: string; type?: "website" | "article";
  publishedTime?: string; modifiedTime?: string; author?: string; noIndex?: boolean;
}): Metadata {
  const url = `${siteConfig.url}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: { type: opts.type ?? "website", url, siteName: siteConfig.name, title: opts.title, description: opts.description, locale: siteConfig.locale, images: [{ url: opts.image ?? siteConfig.ogImage }] },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, images: [opts.image ?? siteConfig.ogImage] },
    robots: opts.noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
```

### 2. Root layout — `app/layout.tsx`

- Set `metadata.metadataBase = new URL(siteConfig.url)`, `title: { default: siteConfig.name, template: "%s | Masjid Al-Kahfi" }`, `description`, `keywords`, `authors`, `metadataBase`, `manifest`, `icons`, `openGraph` (default), `twitter`, `robots`, `category: "religion"`.
- Inject JSON-LD global `PlaceOfWorship` (dari `lib/seo/jsonld.ts` → `placeOfWorshipJsonLd()`) sebagai `<script type="application/ld+json" dangerouslySetInnerHTML>`.
- Meta verification (GSC/Bing) via `metadata.verification` dari env (kondisional).

### 3. Brand assets — `app/icon.svg`, `app/apple-icon.png`, `app/opengraph-image.tsx`, `app/manifest.ts`

- `app/icon.svg`: siluet masjid (kubah + menara) warna emerald + gold, dibuat sebagai SVG statis (file-based metadata, Next auto-wire `<link rel="icon">`).
- `app/apple-icon.png`: versi PNG 180×180 (bisa render dari SVG yang sama).
- `app/opengraph-image.tsx`: `ImageResponse` 1200×630 — background emerald gradient, nama masjid (Playfair), tagline, URL. Default share card.
- `app/manifest.ts`: `{ name, short_name, description, start_url: "/", display: "standalone", background_color, theme_color, icons: [...] }`.

### 4. Sitemap, robots, llms.txt, RSS — `app/sitemap.ts`, `app/robots.ts`, `public/llms.txt`, `app/feed.xml.ts`

**`app/sitemap.ts`** (server):
```ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const staticRoutes = ["", "/berita", "/kegiatan", "/galeri", "/jadwal-sholat", "/donasi", "/kontak", "/tentang"]
    .map(p => ({ url: `${base}${p || ""}`, lastModified: new Date(), changeFrequency: "weekly", priority: p === "" ? 1 : 0.8 }));
  const berita = (await getAllBeritaSlugs()).map(b => ({ url: `${base}/berita/${b.slug}`, lastModified: b.date, changeFrequency: "monthly", priority: 0.6 }));
  return [...staticRoutes, ...berita];
}
```

**`app/robots.ts`**:
```ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"], allow: "/" },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
```

**`public/llms.txt`**: ringkasan markdown — nama, lokasi, misi, struktur halaman utama + URL, info kontak, penjelasan konten (berita/kajian/galeri/jadwal sholat/donasi).

**`app/feed.xml.ts`** (RSS 2.0): `GET` handler `RouteHandler` yang select `berita` terbaru, bangun XML `<rss>`/`<item>` per artikel, `Content-Type: application/xml`. Dipublikasikan di `<link rel="alternate" type="application/rss+xml">` root layout.

### 5. Data-access layer — `lib/queries/*.ts`

Ekstrak SELECT dari `app/api/*/route.ts`:
- `lib/queries/berita.ts`: `getAllBerita()`, `getBeritaBySlug(slug)`, `getAllBeritaSlugs()`, `getRecentBerita(limit)`.
- `lib/queries/kegiatan.ts`: `getAllKegiatan()`, `getFeaturedKegiatan(limit)`.
- `lib/queries/galeri.ts`: `getAllGaleri()`, `getRecentGaleri(limit)`.
- `lib/queries/profil.ts`: `getProfilMasjid()`, `getAllFasilitas()`, `getAllPengurus()`.
- `lib/queries/kontak.ts`: `getKontak()`, `getDonasi()`.
API route refactor untuk memanggil helper ini (menghilangkan duplikasi); server component juga memanggilnya.

### 6. Hybrid SSR per-halaman

Pola seragam: `app/(site)/<route>/page.tsx` (server) → fetch via `lib/queries/*`, `generateMetadata`, render konten + `<XClient initialData={...} />`. File client lama di-rename (mis. `beranda-content.tsx` sebagai island).

| Route | Server-render (SSR) | Client island |
|---|---|---|
| `/berita/[slug]` ⭐ | `generateStaticParams` (slug non-null), `generateMetadata` dari row, HTML artikel, `NewsArticle`+`Breadcrumb` JSON-LD, OG image = `berita.img` | copy-link button |
| `/berita` | list `getAllBerita()` + `Breadcrumb`-ringan | search/filter/pagination |
| `/beranda` | `getFeaturedKegiatan(3)`, `getRecentBerita(...)`, `getRecentGaleri(...)`, `getProfilMasjid()` | widget jadwal GPS (`usePrayerTimes`), running text, countdown |
| `/kegiatan` | `getAllKegiatan()` + `Event` JSON-LD per item | (minimal) |
| `/galeri` | `getAllGaleri()` (alt deskriptif) | lightbox |
| `/jadwal-sholat` | fallback schedule (HTML awal terindeks) | GPS auto-locate (`usePrayerTimes`) + FAQ + `FAQPage` JSON-LD |
| `/kontak` | `getKontak()` (NAP, iframe title) + `PlaceOfWorship` reinforce | (minimal) |
| `/tentang` | `getProfilMasjid()` + `getAllFasilitas()` + `getAllPengurus()` | (minimal) |
| `/donasi` | `getDonasi()` (QRIS, rekening) + FAQ + `FAQPage` JSON-LD | copy nomor rekening |

### 7. Per-halaman metadata + heading

Setiap `page.tsx` (server) mengeksport:
```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  return buildMetadata({ title: "...", description: "...", path: "/...", type: "website" });
}
```
- Heading H1 = topik halaman (mis. "Kabar Al-Kahfi", "Galeri Dokumentasi", "Jadwal Sholat & Ibadah"). H2 = section. H3 = sub/card title & label waktu sholat. `/berita/[slug]` H1 = judul artikel.

### 8. JSON-LD — `lib/seo/jsonld.ts`

Pure functions returning object literal:
- `placeOfWorshipJsonLd()` (global, dari `siteConfig` + `kontak`).
- `newsArticleJsonLd(berita)`.
- `eventJsonLd(kegiatan)`.
- `breadcrumbJsonLd(items: {name, path}[])`.
- `faqPageJsonLd(qa: {q, a}[])`.
Dirender via `<script type="application/ld+json">` (helper `<JsonLd data={...} />` di `components/json-ld.tsx`).

### 9. Navigasi & a11y — `components/layout-header.tsx`, `components/layout-footer.tsx`, `app/(site)/layout.tsx`

- Header/footer: ganti `<button onClick={router.push()}>` → `<Link href>`. Bungkus `<nav aria-label="Utama">` (header) & `<nav aria-label="Footer">`.
- Toggle menu mobile: `aria-label="Buka menu"`/`"Tutup menu"`, `aria-expanded`.
- Brand: ganti `<h1>` → `<Link href="/beranda"><span>Masjid Al-Kahfi</span></Link>` (dengan emoji 🕌 `aria-hidden`).
- Footer social: `<button>` → `<span aria-hidden="true">` (dekorasi murni).
- iframe Google Maps (`kontak/page.tsx`): `title="Lokasi Masjid Al-Kahfi di peta"`.
- Marquee running text: `aria-label="Pengumuman"`.
- `app/(site)/layout.tsx`: tambah skip-link `<a href="#main" className="sr-only focus:not-sr-only ...">Lewati ke konten</a>` sebelum `<AppShell>`, dan pastikan konten dibungkus `<main id="main">`. (Di-scope ke `(site)` — admin tidak butuh.)
- `prefers-reduced-motion`: bungkus animasi Motion dengan cek `useReducedMotion()` (motion menyediakannya) — turunkan/disable animasi marquee & hero.

### 10. Gambar & CWV

- Audit semua `<Image>`:
  - Hero beranda: `alt` deskriptif (mis. "Masjid Al-Kahfi Cikoneng"), tetap `priority` (LCP).
  - Galeri: `alt={item.title}`.
  - Berita/kegiatan/tentang: sudah pakai title — verifikasi.
- Tambah `sizes` pada semua `<Image fill>` (mis. hero `(max-width: 768px) 100vw, 100vw`, grid `(max-width:768px) 50vw, 33vw`).
- Tambah `sharp` ke `dependencies` (`npm i sharp`).
- `next.config.ts`: `images: { formats: ["image/avif","image/webp"], remotePatterns: [...] }` (pertahankan pola lama; tambah domain upload produksi hanya bila CDN eksternal dipakai — same-origin `/uploads` tidak perlu).

### 11. Env & config

- `.env.example`: set `APP_URL="https://masjid-alkahfi.id"`, tambah `NEXT_PUBLIC_GA_ID=""`, `NEXT_PUBLIC_GSC_VERIFICATION=""`, `NEXT_PUBLIC_BING_VERIFICATION=""` (dokumentasikan opsional).
- `.env.local`: update `APP_URL` ke domain nyata (atau localhost untuk dev — helper `buildMetadata` akan pakai itu; dev tetap valid).

### 12. Analytics & verification (opt-in)

- `components/analytics.tsx` (client, lazy): render `<Script src="https://www.googletagmanager.com/gtag/js?id=..." />` + inline config hanya bila `NEXT_PUBLIC_GA_ID` set.
- Verifikasi GSC/Bing: di root layout, `<meta name="google-site-verification">` & `<meta name="msvalidate.01">` dari env (kondisional). Bisa via `metadata.verification` Next.

## Constraints & Notes

- **`APP_URL` wajib**: set di produksi. Helper punya default `https://masjid-alkahfi.id` agar build tidak mogok bila env lupa diset, tapi URL kanonik produksi harus via env.
- **`telephone` placeholder**: hotline seed "+62 812-3456-7890" terlihat tidak nyata. JSON-LD `telephone` hanya diisi bila admin update via CMS; bila tetap placeholder, **omit `telephone`** dari schema (lebih baik kosong daripada salah). Catat di tiket follow-up: admin wajib update kontak nyata.
- **`sameAs` diomit** sampai URL sosial nyata tersedia (user skip).
- **`berita.slug` nullable**: `generateStaticParams` & sitemap filter slug non-null. Admin route sudah generate slug saat create/update; row lama tanpa slug di-backfill (seed ulang atau query backfill sekali).
- **`kegiatan.time` non-ISO**: `Event.startDate` best-effort (mis. "Ba'da Subuh" → deskriptif, bukan ISO). Bila tidak dapat dipetakan andal, tetap pakai `Event` dengan `description` lengkap (cukup untuk SEO), tanpa `startDate` palsu.
- **SSR + client island**: konten kritis (teks artikel, list, NAP) wajib server-rendered. Interaktivitas (GPS, copy, lightbox) boleh client — tapi **bukan** konten inti yang dirayap.
- **API route tetap `force-dynamic`** (untuk admin/mutasi). Server component membaca lewat `lib/queries/*` langsung (bukan fetch `/api`), jadi rayapan tidak bergantung pada API route.
- **`sharp` di Docker**: `docker-compose up -d --build` perlu rebuild agar `sharp` ter-install; pastikan `Dockerfile`/image linux-musl compatible (sharp punya prebuilt; bila gagal, lock versi).
- **Build harus lulus tanpa env** agar CI/preview tidak mogok; default domain menangani ini.
- **`force-static` untuk berita detail**: `generateStaticParams` + `revalidate` (ISR) bila diinginkan; minimal `dynamic = "force-static"` per slug. Default: static generation per slug saat build, revalidate on-demand (DB berubah via admin → trigger revalidate via `revalidatePath("/berita", ...)`, opsional di scope ini — catat sebagai follow-up bila artikel sering berubah).
- **Locale**: tidak ada hreflang (satu bahasa). `<html lang="id">` + `og:locale=id_ID` cukup.
- **a11y contrast**: palet emerald-950 + gold harus lulus WCAG AA pada teks; verifikasi token warna teks utama vs background.

## Out of Scope (YAGNI)

- i18n / multi-bahasa / hreflang.
- Rute detail baru untuk `kegiatan` & `galeri` (cukup `Event` schema pada item di listing; tidak dibangun halaman per-item).
- Service worker / PWA offline penuh (manifest + icon cukup).
- `sameAs` / `telephone` schema sampai data nyata tersedia.
- Backlink/off-page SEO, kampanye konten.
- A/B testing SEO, rank tracking tools.
- Migrasi slug lama ke format baru (pertahankan format `${judul}-${id}`; backward-compatible).
- Refactor semua API route menjadi auth-gated (hanya admin butuh; bukan scope SEO).
- Verifikasi otomatis schema via test runner (andalkan Rich Results Test manual — `tsx --test` untuk pure helper `mapAladhan`-style saja bila ada).

## Verification

1. **`npm run build` lulus** — Next memvalidasi `metadata`, `sitemap.ts`, `robots.ts`, `manifest.ts`, `icon`/`opengraph-image` saat build. Tidak ada warning `metadataBase` missing.
2. **Metadata per-halaman**: buka view-source tiap rute publik → ada `<title>`, `<meta name="description">`, `<link rel="canonical">`, OG tags unik. `/berita/{slug}` OG image = gambar artikel.
3. **SSR konten**: view-source `/berita/{slug}` & `/berita` → HTML berisi teks artikel/list (bukan shell kosong). Curl tanpa JS melihat konten.
4. **Sitemap & robots**: `/sitemap.xml` ter-list rute statis + slug berita; `/robots.txt` berisi disallow `/admin` `/api` + allow AI bot + sitemap pointer; `/llms.txt` & `/feed.xml` accessible.
5. **JSON-LD**: Google Rich Results Test pada `/`, `/berita/{slug}`, `/kegiatan` → valid `PlaceOfWorship`, `NewsArticle`, `Event`, `BreadcrumbList`, `FAQPage` (0 error).
6. **Heading**: tiap halaman tepat **satu** `<h1>` (= topik); tidak ada H1 brand header; hierarki H1→H2→H3 berurutan.
7. **Navigasi**: view-source header/footer → `<a href>` (bukan `<button>`); `<nav aria-label>` ada; toggle menu ada `aria-label`/`aria-expanded`; iframe maps ada `title`; footer social = `<span aria-hidden>`.
8. **A11y**: Lighthouse Accessibility ≥ 95; skip-link fungsional (Tab pertama fokus ke skip-link); `prefers-reduced-motion` mematikan animasi.
9. **Gambar**: semua `<Image>` punya `alt` deskriptif + `sizes`; LCP hero `priority`; output AVIF/WebP di header respons gambar.
10. **CWV**: PageSpeed Insights mobile — LCP/CLS/INP di ambang "Good"; tidak ada CLS dari gambar (dimensi/sizes eksplisit).
11. **Mobile-friendly**: Google Mobile-Friendly Test lulus.
12. **AI search**: `/llms.txt` human-readable; SSR konten; robots allow `GPTBot`/`ClaudeBot`/`PerplexityBot`.
13. **Analytics**: bila `NEXT_PUBLIC_GA_ID` set → tag gtag muncul; bila unset → tidak ada. Meta verification muncul bila env set.
14. **`npm test`** lulus (unit test pure helper JSON-LD/breadcrumb/slug bila ditambahkan).
