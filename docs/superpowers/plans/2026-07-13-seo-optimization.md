# SEO Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun lapisan SEO komprehensif (mesin pencari + AI search) untuk situs publik Masjid Al-Kahfi: hybrid SSR, metadata per-halaman, JSON-LD, sitemap/robots/llms.txt/RSS, heading & navigasi semantik, a11y, Core Web Vitals, brand assets, dan analytics opt-in.

**Architecture:** Konfigurasi terpusat (`lib/seo/site.ts`) + helper metadata (`lib/seo/metadata.ts`) + builder JSON-LD pure (`lib/seo/jsonld.ts`) dipakai semua halaman. Data-access layer `lib/queries/content.ts` melayani Server Component (tanpa roundtrip `/api`). Setiap halaman publik dipecah jadi Server Component (fetch + `generateMetadata` + SSR HTML + JSON-LD) yang membungkus Client island interaktif. Aset brand via file-based metadata dinamis (`ImageResponse`).

**Tech Stack:** Next.js 15.5 App Router, React 19, Drizzle ORM + postgres-js, PostgreSQL, better-auth, Motion, Tailwind v4, `next/og` (`ImageResponse`), `node:test`.

## Global Constraints

- **Domain (verbatim default):** `https://masjid-alkahfi.id`. `siteConfig.url` memakai `process.env.APP_URL` bila set & bukan `"MY_APP_URL"`, else default ini.
- **Locale:** `id-ID` (OG) / `id` (`<html lang>`). Tidak ada i18n/hreflang.
- **Helper metadata:** semua halaman pakai `buildMetadata({ title, description, path, image?, type?, publishedTime?, modifiedTime?, author?, noIndex? })` dari `@/lib/seo/metadata`. `path` dimulai dengan `/` (mis. `/berita`).
- **JSON-LD:** dibangun oleh pure function di `@/lib/seo/jsonld.ts`, dirender via `<JsonLd data={obj} />` (`@/components/json-ld`). `telephone` & `sameAs` **dihapus** dari `PlaceOfWorship` (belum ada data nyata).
- **Lookup berita by slug:** query `where(eq(berita.slug, slug))` langsung (bukan parse id). Slug null di-skip di `generateStaticParams` & sitemap.
- **Test runner:** `npm test` = `tsx --test` (`node:test` + `node:assert/strict`). File test di `test/...` meniru path `lib/...` (mis. `lib/seo/metadata.ts` → `test/lib/seo/metadata.test.ts`).
- **DB:** `db` dari `@/lib/db`. Singleton (`kontak`, `donasi`, `profilMasjid`) dibaca `.limit(1)` → `[0] ?? null`.
- **API route:** tetap `export const dynamic = 'force-dynamic'`. Server Component membaca via `lib/queries/content.ts` langsung.
- **`sharp`:** wajib ditambah ke `dependencies` (optimasi gambar produksi).
- **Build wajib lulus tanpa env** — default domain menangani `APP_URL` kosong/placeholder.
- Semua edit ikut konvensi ada (`"use client"`, Drizzle query, Tailwind v4 token brand emerald/gold).

---

### Task 1: Konfigurasi situs + helper metadata

**Files:**
- Create: `lib/seo/site.ts`
- Create: `lib/seo/metadata.ts`
- Test: `test/lib/seo/metadata.test.ts`

**Interfaces:**
- Produces: `siteConfig` (`@/lib/seo/site`) — `{ name, shortName, url, description, locale, themeColor, ogImage, contact:{email,addressLine,geo:{lat,lng}} }`. `buildMetadata(opts)` (`@/lib/seo/metadata`) → `Metadata` (Next). Dipakai Task 3 (root layout) & Task 8–12 (semua halaman).

- [ ] **Step 1: Tulis test gagal untuk `buildMetadata`**

Buat `test/lib/seo/metadata.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildMetadata } from '../../../lib/seo/metadata';
import { siteConfig } from '../../../lib/seo/site';

test('siteConfig.url defaults to production domain when APP_URL unset', () => {
  assert.equal(siteConfig.url, 'https://masjid-alkahfi.id');
});

test('buildMetadata sets canonical, openGraph, twitter from path', () => {
  const m = buildMetadata({ title: 'Berita', description: 'desc', path: '/berita' });
  assert.equal(m.title, 'Berita');
  assert.equal(m.alternates?.canonical, 'https://masjid-alkahfi.id/berita');
  assert.equal(m.openGraph?.url, 'https://masjid-alkahfi.id/berita');
  assert.equal(m.openGraph?.type, 'website');
  assert.equal(m.openGraph?.locale, 'id_ID');
  assert.equal(m.twitter?.card, 'summary_large_image');
});

test('buildMetadata article type passes published/modified time', () => {
  const m: any = buildMetadata({ title: 'A', description: 'd', path: '/berita/x', type: 'article', publishedTime: '2026-01-01', modifiedTime: '2026-01-02', author: 'Tim' });
  assert.equal(m.openGraph?.type, 'article');
  assert.equal(m.openGraph?.publishedTime, '2026-01-01');
  assert.equal(m.openGraph?.modifiedTime, '2026-01-02');
  assert.equal(m.openGraph?.authors?.[0], 'Tim');
});

test('buildMetadata noIndex sets robots', () => {
  const m: any = buildMetadata({ title: 'A', description: 'd', path: '/x', noIndex: true });
  assert.deepEqual(m.robots, { index: false, follow: false });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npm test`
Expected: FAIL — modul `../../../lib/seo/metadata` tidak ditemukan.

- [ ] **Step 3: Buat `lib/seo/site.ts`**

```ts
// Single source of truth for site-wide SEO values.
export const siteConfig = {
  name: "Masjid Al-Kahfi",
  shortName: "Masjid Al-Kahfi",
  url:
    process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL"
      ? process.env.APP_URL
      : "https://masjid-alkahfi.id",
  description:
    "Situs resmi Masjid Al-Kahfi Cikoneng, Kab. Bandung — jadwal sholat, kajian rutin, berita, galeri, dan informasi infaq & zakat.",
  locale: "id_ID",
  themeColor: "#064e3b",
  ogImage: "/opengraph-image",
  contact: {
    email: "alkahfi.cikoneng@gmail.com",
    addressLine: "Jl. Cikoneng No.15, Bojongsoang, Kab. Bandung 40288",
    geo: { lat: -6.9856, lng: 107.6589 },
  },
};

// Navigation tree (label + path) — drives breadcrumbs & footer.
export const navTree = [
  { label: "Beranda", path: "/beranda" },
  { label: "Tentang", path: "/tentang" },
  { label: "Jadwal Sholat", path: "/jadwal-sholat" },
  { label: "Kegiatan", path: "/kegiatan" },
  { label: "Berita", path: "/berita" },
  { label: "Galeri", path: "/galeri" },
  { label: "Kontak", path: "/kontak" },
  { label: "Donasi & Infaq", path: "/donasi" },
];
```

- [ ] **Step 4: Buat `lib/seo/metadata.ts`**

```ts
import type { Metadata } from "next";
import { siteConfig } from "./site";

type BuildOpts = {
  title?: string;
  description?: string;
  path: string; // must start with "/"
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noIndex?: boolean;
};

export function buildMetadata(opts: BuildOpts): Metadata {
  const url = `${siteConfig.url}${opts.path}`;
  const image = opts.image ?? siteConfig.ogImage;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      type: opts.type ?? "website",
      url,
      siteName: siteConfig.name,
      title: opts.title ?? siteConfig.name,
      description: opts.description ?? siteConfig.description,
      locale: siteConfig.locale,
      images: [{ url: image }],
      ...(opts.type === "article"
        ? {
            publishedTime: opts.publishedTime,
            modifiedTime: opts.modifiedTime,
            authors: opts.author ? [opts.author] : undefined,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title ?? siteConfig.name,
      description: opts.description ?? siteConfig.description,
      images: [image],
    },
    robots: opts.noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
```

- [ ] **Step 5: Jalankan test, pastikan lulus**

Run: `npm test`
Expected: PASS (4 test).

- [ ] **Step 6: Commit**

```bash
git add lib/seo/site.ts lib/seo/metadata.ts test/lib/seo/metadata.test.ts
git commit -m "feat(seo): add site config + metadata helper"
```

---

### Task 2: Builder JSON-LD + komponen `<JsonLd>`

**Files:**
- Create: `lib/seo/jsonld.ts`
- Create: `components/json-ld.tsx`
- Test: `test/lib/seo/jsonld.test.ts`

**Interfaces:**
- Produces: `placeOfWorshipJsonLd()`, `newsArticleJsonLd(b)`, `eventJsonLd(k)`, `breadcrumbJsonLd(items)`, `faqPageJsonLd(qa)` di `@/lib/seo/jsonld`. `<JsonLd data={obj} />` (`@/components/json-ld`). Dipakai Task 3 & Task 8–12.

- [ ] **Step 1: Tulis test gagal untuk builder JSON-LD**

Buat `test/lib/seo/jsonld.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { placeOfWorshipJsonLd, newsArticleJsonLd, breadcrumbJsonLd, faqPageJsonLd } from '../../../lib/seo/jsonld';

test('placeOfWorshipJsonLd has correct @type and address, no telephone/sameAs', () => {
  const g = placeOfWorshipJsonLd();
  assert.deepEqual(g['@type'], ['PlaceOfWorship', 'Mosque']);
  assert.equal(g.telephone, undefined);
  assert.equal(g.sameAs, undefined);
  assert.equal(g.address['@type'], 'PostalAddress');
  assert.equal(g.address.addressCountry, 'ID');
  assert.equal(g.geo.latitude, -6.9856);
});

test('newsArticleJsonLd maps berita fields', () => {
  const g = newsArticleJsonLd({ title: 'Judul', slug: 'x', img: 'https://img', date: '01 Januari 2026', desc: 'd', author: 'Tim' });
  assert.equal(g['@type'], 'NewsArticle');
  assert.equal(g.headline, 'Judul');
  assert.equal(g.image, 'https://img');
  assert.equal(g.author.name, 'Tim');
});

test('breadcrumbJsonLd builds itemList', () => {
  const g = breadcrumbJsonLd([{ name: 'Beranda', path: '/beranda' }, { name: 'Berita', path: '/berita' }]);
  assert.equal(g['@type'], 'BreadcrumbList');
  assert.equal(g.itemListElement.length, 2);
  assert.equal(g.itemListElement[1].position, 2);
});

test('faqPageJsonLd maps Q&A', () => {
  const g = faqPageJsonLd([{ q: 'Apa?', a: 'Begini.' }]);
  assert.equal(g['@type'], 'FAQPage');
  assert.equal(g.mainEntity[0].name, 'Apa?');
  assert.equal(g.mainEntity[0].acceptedAnswer.text, 'Begini.');
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npm test`
Expected: FAIL — modul tidak ditemukan.

- [ ] **Step 3: Buat `lib/seo/jsonld.ts`**

```ts
import { siteConfig } from "./site";

const BASE = siteConfig.url;
const GRAPH = "https://schema.org";

export function placeOfWorshipJsonLd() {
  return {
    "@context": GRAPH,
    "@type": ["PlaceOfWorship", "Mosque"],
    name: siteConfig.name,
    url: BASE,
    image: `${BASE}${siteConfig.ogImage}`,
    email: siteConfig.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jl. Cikoneng No.15",
      addressLocality: "Bojongsoang, Kab. Bandung",
      addressRegion: "Jawa Barat",
      postalCode: "40288",
      addressCountry: "ID",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.contact.geo.lat,
      longitude: siteConfig.contact.geo.lng,
    },
    areaServed: "Cikoneng, Bojongsoang, Kab. Bandung",
    // telephone & sameAs omitted until real data exists
  };
}

type BeritaLike = { title: string; slug: string; img?: string | null; date?: string | null; desc?: string | null; author?: string | null };

export function newsArticleJsonLd(b: BeritaLike) {
  return {
    "@context": GRAPH,
    "@type": "NewsArticle",
    headline: b.title,
    image: b.img ? (b.img.startsWith("http") ? b.img : `${BASE}${b.img}`) : `${BASE}${siteConfig.ogImage}`,
    datePublished: b.date,
    dateModified: b.date,
    author: { "@type": "Organization", name: b.author || siteConfig.name },
    publisher: { "@type": "Organization", name: siteConfig.name },
    description: b.desc || undefined,
    mainEntityOfPage: `${BASE}/berita/${b.slug}`,
  };
}

type KegiatanLike = { title: string; desc?: string | null; time?: string | null };

export function eventJsonLd(k: KegiatanLike) {
  return {
    "@context": GRAPH,
    "@type": "Event",
    name: k.title,
    description: k.desc || undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: siteConfig.name, address: `${BASE}/kontak` },
    // startDate omitted: kegiatan.time is non-ISO descriptive string
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": GRAPH,
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${BASE}${it.path}`,
    })),
  };
}

export function faqPageJsonLd(qa: { q: string; a: string }[]) {
  return {
    "@context": GRAPH,
    "@type": "FAQPage",
    mainEntity: qa.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
```

- [ ] **Step 4: Buat `components/json-ld.tsx`**

```tsx
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 5: Jalankan test, pastikan lulus**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/seo/jsonld.ts components/json-ld.tsx test/lib/seo/jsonld.test.ts
git commit -m "feat(seo): add JSON-LD builders + JsonLd component"
```

---

### Task 3: Root layout metadata + global PlaceOfWorship JSON-LD

**Files:**
- Modify: `app/layout.tsx` (ganti blok `metadata` baris 16-19, tambah JSON-LD di `<body>`)

**Interfaces:**
- Consumes: `siteConfig`, `placeOfWorshipJsonLd()`, `<JsonLd>`.
- Produces: root `metadata` (metadataBase, title template, OG/Twitter default, manifest, icons, robots, verification) dipakai sebagai fallback semua halaman.

- [ ] **Step 1: Ganti blok `metadata` di `app/layout.tsx`**

Edit `app/layout.tsx`. Ganti seluruh blok `export const metadata: Metadata = { ... }` (baris 16-19) dengan:

```ts
import type { Metadata, Viewport } from "next";
import { Playfair_Display, Sora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-client";
import { siteConfig } from "@/lib/seo/site";
import { placeOfWorshipJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/json-ld";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} Cikoneng — Kab. Bandung`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  keywords: ["masjid alkahfi", "masjid cikoneng", "jadwal sholat kab bandung", "kajian", "infaq", "zakat", "bojongsoang"],
  authors: [{ name: siteConfig.name }],
  applicationName: siteConfig.name,
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon", apple: "/apple-icon" },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    url: siteConfig.url,
    title: `${siteConfig.name} Cikoneng — Kab. Bandung`,
    description: siteConfig.description,
    locale: siteConfig.locale,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: siteConfig.name, description: siteConfig.description, images: [siteConfig.ogImage] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  category: "religion",
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || undefined,
    other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION || undefined },
  },
};

export const viewport: Viewport = { themeColor: siteConfig.themeColor };
```

- [ ] **Step 2: Inject JSON-LD global di `<body>`**

Di `app/layout.tsx`, bungkus `{children}` dengan fragment + `<JsonLd>`:

```tsx
  return (
    <html lang="id" className={`${playfair.variable} ${sora.variable} scroll-smooth`} data-scroll-behavior="smooth">
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          <JsonLd data={placeOfWorshipJsonLd()} />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
```

- [ ] **Step 3: Build, pastikan tidak ada warning metadataBase**

Run: `npm run build`
Expected: lulus, tidak ada warning "metadataBase" atau `manifest`/`icons`.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(seo): root metadata + global PlaceOfWorship JSON-LD"
```

---

### Task 4: Brand assets dinamis (icon, apple-icon, opengraph-image, manifest)

**Files:**
- Create: `app/icon.tsx`
- Create: `app/apple-icon.tsx`
- Create: `app/opengraph-image.tsx`
- Create: `app/manifest.ts`

**Interfaces:**
- Produces: `/icon`, `/apple-icon` (favicon raster bermerek via ImageResponse), `/opengraph-image` (OG default 1200×630), `/manifest.webmanifest`. Auto-wired Next file-based metadata.

- [ ] **Step 1: Buat `app/icon.tsx`**

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ background: "#064e3b", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, borderRadius: 8 }}>
        <span style={{ color: "#d4af37" }}>🕌</span>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 2: Buat `app/apple-icon.tsx`**

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ background: "#064e3b", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 110, borderRadius: 38 }}>
        <span style={{ color: "#d4af37" }}>🕌</span>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 3: Buat `app/opengraph-image.tsx`**

```tsx
import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo/site";

export const alt = "Masjid Al-Kahfi Cikoneng";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ background: "linear-gradient(135deg,#064e3b,#065f46)", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", padding: 60 }}>
        <div style={{ fontSize: 90, marginBottom: 20 }}>🕌</div>
        <div style={{ fontSize: 64, fontWeight: 700, display: "flex" }}>Masjid Al-Kahfi</div>
        <div style={{ fontSize: 32, color: "#d4af37", marginTop: 12 }}>Cikoneng • Kab. Bandung</div>
        <div style={{ fontSize: 24, marginTop: 32, opacity: 0.85 }}>Jadwal Sholat • Kajian • Infaq & Zakat</div>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 4: Buat `app/manifest.ts`**

```ts
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — ${siteConfig.description}`,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#064e3b",
    theme_color: siteConfig.themeColor,
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
```

- [ ] **Step 5: Build + verifikasi aset ter-generate**

Run: `npm run build`
Expected: lulus. Buka `http://localhost:3000/icon`, `/apple-icon`, `/opengraph-image`, `/manifest.webmanifest` saat dev (`npm run dev`) → masing-masing mengembalikan PNG/JSON.

- [ ] **Step 6: Commit**

```bash
git add app/icon.tsx app/apple-icon.tsx app/opengraph-image.tsx app/manifest.ts
git commit -m "feat(seo): dynamic brand assets (icon, apple-icon, OG image, manifest)"
```

---

### Task 5: Data-access layer `lib/queries/content.ts`

**Files:**
- Create: `lib/queries/content.ts`
- Modify: `app/api/berita/route.ts` (GET pakai shared helper)

**Interfaces:**
- Produces (named exports dari `@/lib/queries/content`):
  - `getAllBerita(): Promise<Berita[]>`
  - `getRecentBerita(limit?: number): Promise<Berita[]>`
  - `getBeritaBySlug(slug: string): Promise<Berita | null>`
  - `getAllBeritaSlugs(): Promise<{ slug: string }[]>` (slug non-null)
  - `getAllKegiatan(): Promise<Kegiatan[]>`
  - `getFeaturedKegiatan(limit?: number): Promise<Kegiatan[]>`
  - `getAllGaleri(): Promise<Galeri[]>`
  - `getRecentGaleri(limit?: number): Promise<Galeri[]>`
  - `getProfilMasjid(): Promise<ProfilMasjid | null>`
  - `getAllFasilitas(): Promise<Fasilitas[]>`
  - `getAllPengurus(): Promise<Pengurus[]>`
  - `getKontak(): Promise<Kontak | null>`
  - `getDonasi(): Promise<Donasi | null>`
  - Tipe row mengikuti inferensi Drizzle (`typeof berita.$inferSelect` dll.).
  Dipakai Task 6 (sitemap/feed) & Task 8–12 (SSR).

- [ ] **Step 1: Buat `lib/queries/content.ts`**

```ts
import { db } from "@/lib/db";
import { berita, kegiatan, galeri, profilMasjid, fasilitas, pengurus, kontak, donasi } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export type Berita = typeof berita.$inferSelect;
export type Kegiatan = typeof kegiatan.$inferSelect;
export type Galeri = typeof galeri.$inferSelect;
export type ProfilMasjid = typeof profilMasjid.$inferSelect;
export type Fasilitas = typeof fasilitas.$inferSelect;
export type Pengurus = typeof pengurus.$inferSelect;
export type Kontak = typeof kontak.$inferSelect;
export type Donasi = typeof donasi.$inferSelect;

export async function getAllBerita(): Promise<Berita[]> {
  return db.select().from(berita).orderBy(desc(berita.createdAt));
}
export async function getRecentBerita(limit = 6): Promise<Berita[]> {
  return db.select().from(berita).orderBy(desc(berita.createdAt)).limit(limit);
}
export async function getBeritaBySlug(slug: string): Promise<Berita | null> {
  const rows = await db.select().from(berita).where(eq(berita.slug, slug)).limit(1);
  return rows[0] ?? null;
}
export async function getAllBeritaSlugs(): Promise<{ slug: string }[]> {
  const rows = await db.select({ slug: berita.slug }).from(berita);
  return rows.filter((r): r is { slug: string } => Boolean(r.slug));
}
export async function getAllKegiatan(): Promise<Kegiatan[]> {
  return db.select().from(kegiatan);
}
export async function getFeaturedKegiatan(limit = 3): Promise<Kegiatan[]> {
  return db.select().from(kegiatan).where(eq(kegiatan.featured, true)).limit(limit);
}
export async function getAllGaleri(): Promise<Galeri[]> {
  return db.select().from(galeri);
}
export async function getRecentGaleri(limit = 6): Promise<Galeri[]> {
  return db.select().from(galeri).limit(limit);
}
export async function getProfilMasjid(): Promise<ProfilMasjid | null> {
  const rows = await db.select().from(profilMasjid).limit(1);
  return rows[0] ?? null;
}
export async function getAllFasilitas(): Promise<Fasilitas[]> {
  return db.select().from(fasilitas);
}
export async function getAllPengurus(): Promise<Pengurus[]> {
  return db.select().from(pengurus);
}
export async function getKontak(): Promise<Kontak | null> {
  const rows = await db.select().from(kontak).limit(1);
  return rows[0] ?? null;
}
export async function getDonasi(): Promise<Donasi | null> {
  const rows = await db.select().from(donasi).limit(1);
  return rows[0] ?? null;
}
```

> Catatan implementer: bila `kegiatan.featured` bertipe non-boolean di schema (mis. `integer`/`boolean`), sesuaikan literal `true`/`1`. Verifikasi di `lib/db/schema.ts` saat implementasi.

- [ ] **Step 2: Refactor GET `app/api/berita/route.ts` pakai shared helper**

Di `app/api/berita/route.ts`, ganti isi fungsi `GET`:

```ts
import { getAllBerita } from "@/lib/queries/content";
import { withActorNames } from "@/lib/audit";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getAllBerita();
    return NextResponse.json(await withActorNames(data));
  } catch (error: any) {
    console.error('Error fetching berita:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
```

(Hapus import `berita`/`desc` yang kini tak terpakai dari `app/api/berita/route.ts`. Pertahankan `POST` & import lain yang masih dipakai.)

- [ ] **Step 3: Build, pastikan lulus**

Run: `npm run build`
Expected: lulus tanpa error tipe.

- [ ] **Step 4: Commit**

```bash
git add lib/queries/content.ts app/api/berita/route.ts
git commit -m "feat(seo): shared data-access layer for server components"
```

---

### Task 6: Sitemap, robots, llms.txt, RSS feed

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`
- Create: `public/llms.txt`
- Create: `app/feed.xml.ts`
- Modify: `app/layout.tsx` (tambah `<link rel="alternate">` RSS di metadata)

**Interfaces:**
- Consumes: `siteConfig`, `getAllBeritaSlugs()`, `getAllBerita()`.

- [ ] **Step 1: Buat `app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/site";
import { getAllBeritaSlugs } from "@/lib/queries/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/beranda`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/berita`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/kegiatan`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/jadwal-sholat`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/galeri`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/tentang`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/kontak`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/donasi`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
  const articles: MetadataRoute.Sitemap = (await getAllBeritaSlugs()).map((b) => ({
    url: `${base}/berita/${b.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...staticRoutes, ...articles];
}
```

- [ ] **Step 2: Buat `app/robots.ts`**

```ts
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"], allow: "/" },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
```

- [ ] **Step 3: Buat `public/llms.txt`**

```txt
# Masjid Al-Kahfi Cikoneng

Masjid Al-Kahfi adalah masjid di Cikoneng, Bojongsoang, Kabupaten Bandung, Jawa Barat, Indonesia. Situs ini menyediakan jadwal sholat berbasis GPS, jadwal kajian & kegiatan rutin, berita DKM, galeri dokumentasi, dan informasi infaq & zakat.

## Lokasi & Kontak
- Alamat: Jl. Cikoneng No.15, Bojongsoang, Kab. Bandung 40288, Jawa Barat, Indonesia
- Email: alkahfi.cikoneng@gmail.com
- Koordinat: -6.9856, 107.6589

## Halaman utama
- Beranda: https://masjid-alkahfi.id/beranda
- Jadwal Sholat: https://masjid-alkahfi.id/jadwal-sholat
- Kegiatan & Kajian: https://masjid-alkahfi.id/kegiatan
- Berita: https://masjid-alkahfi.id/berita
- Galeri: https://masjid-alkahfi.id/galeri
- Tentang: https://masjid-alkahfi.id/tentang
- Kontak: https://masjid-alkahfi.id/kontak
- Donasi & Infaq: https://masjid-alkahfi.id/donasi

## Konten
Berita DKM dipublikasikan dalam Bahasa Indonesia. Feed RSS tersedia di https://masjid-alkahfi.id/feed.xml.
```

- [ ] **Step 4: Buat `app/feed.xml.ts` (RSS 2.0)**

```ts
import { siteConfig } from "@/lib/seo/site";
import { getAllBerita } from "@/lib/queries/content";

export const dynamic = "force-static";

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string));
}

export async function GET(): Promise<Response> {
  const base = siteConfig.url;
  const items = await getAllBerita();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${base}/berita</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>id</language>
${items
  .map(
    (b) => `    <item>
      <title>${escapeXml(b.title)}</title>
      <link>${base}/berita/${b.slug}</link>
      <guid>${base}/berita/${b.slug}</guid>
      <description>${escapeXml(b.desc ?? "")}</description>
      ${b.author ? `<author>${escapeXml(b.author)}</author>` : ""}
    </item>`
  )
  .join("\n")}
  </channel>
</rss>`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
```

- [ ] **Step 5: Tambah `<link rel="alternate">` RSS di metadata root**

Di `app/layout.tsx` objek `metadata` (Task 3), tambahkan properti `alternates`:

```ts
  alternates: {
    canonical: siteConfig.url,
    types: { "application/rss+xml": `${siteConfig.url}/feed.xml` },
  },
```

- [ ] **Step 6: Build + verifikasi route**

Run: `npm run build` lalu `npm run dev` (atau `npm start`).
Cek: `/sitemap.xml` (XML berisi rute + slug), `/robots.txt` (Disallow /admin /api, Allow AI bot, Sitemap:), `/llms.txt`, `/feed.xml` (RSS valid).

- [ ] **Step 7: Commit**

```bash
git add app/sitemap.ts app/robots.ts public/llms.txt app/feed.xml.ts app/layout.tsx
git commit -m "feat(seo): sitemap, robots, llms.txt, RSS feed"
```

---

### Task 7: Navigasi semantik + a11y (header, footer, AppShell, iframe)

**Files:**
- Modify: `components/layout-header.tsx` (brand `<h1>`→`<span>`, nav `<button>`→`<Link>`, aria-label toggle, nav aria-label)
- Modify: `components/layout-footer.tsx` (social `<button>`→`<span aria-hidden>`, nav `<button>`→`<Link>`)
- Modify: `components/app-shell.tsx` (`<main id="main">` + skip-link)
- Modify: `app/(site)/kontak/page.tsx` (iframe `title`)
- Modify: `app/(site)/layout.tsx` (tidak wajib; AppShell adalah pemegang `<main>`)

**Interfaces:**
- Produces: header/footer link rayap-able (`<a href>`), satu H1 per halaman (brand bukan H1), skip-link + `<main id="main">`.

- [ ] **Step 1: AppShell — `<main id="main">` + skip-link**

Edit `components/app-shell.tsx`. Ganti blok `return (...)`:

```tsx
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-white focus:text-emerald-900 focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg">
        Lewati ke konten
      </a>
      <LayoutHeader activeTab={getActiveTab()} onNav={handleNav}>
        <main id="main">{children}</main>
      </LayoutHeader>
      <Footer onNav={handleNav} />
      <ThemeSettings />
    </>
  );
```

> Catatan: `<main>` dipindahkan ke AppShell (sebelumnya `<div className="flex-grow islamic-pattern-light relative">` di header line 191 membungkus children). Hapus `<div className="flex-grow islamic-pattern-light relative">{children}</div>` di akhir `layout-header.tsx` (lihat Step 2) — ganti dengan `<div className="flex-grow islamic-pattern-light relative">{children}</div>` tetap OK karena `{children}` sekarang `<main>`. Pertahankan wrapper div untuk styling.

- [ ] **Step 2: Header — hapus brand `<h1>`, nav `<Link>`, aria toggle**

Di `components/layout-header.tsx`:

a) Tambah import atas file:
```ts
import Link from "next/link";
```

b) Ganti brand `<button onClick={() => onNav("beranda")} ...>` (baris 112-127) — ubah jadi `<Link href="/beranda">` dan `<h1>` → `<span>`:

```tsx
            <Link href="/beranda" className="flex items-center gap-4 group text-left">
              <div className="w-14 h-14 bg-emerald-900 border-2 border-gold-500 rounded-full flex items-center justify-center text-gold-300 font-serif text-2xl shadow-lg transition-transform duration-300 group-hover:scale-105" aria-hidden="true">
                🕌
              </div>
              <div>
                <span className="block font-serif font-bold text-xl md:text-2xl text-emerald-900 tracking-wide leading-tight">
                  Masjid Al-Kahfi
                </span>
                <span className="block text-xs text-gold-600 font-semibold uppercase tracking-widest">
                  Cikoneng • Kab. Bandung
                </span>
              </div>
            </Link>
```

c) Desktop nav `<button onClick={() => onNav(link.id)}>` (baris 132-139) → `<Link href={hrefFor(link.id)}>`:

```tsx
            <nav className="hidden lg:flex items-center space-x-1" aria-label="Navigasi utama">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  href={hrefFor(link.id)}
                  className={`px-3 py-2 rounded-md text-sm font-semibold transition duration-150 ${activeTab === link.id ? "text-gold-500 border-b-2 border-gold-500" : "text-gray-600 hover:text-gold-600"}`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/donasi"
                className="ml-4 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-bold text-sm px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:from-gold-600 hover:to-gold-700 transition transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <HeartPulse size={16} /> Donasi & Infaq
              </Link>
            </nav>
```

d) Mobile toggle (baris 150-155) — tambah `aria-label` & `aria-expanded`:

```tsx
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
                aria-expanded={isMobileMenuOpen}
                className="text-emerald-900 focus:outline-none p-2 rounded-md hover:bg-gold-50"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
```

e) Mobile menu items (baris 170-184) → `<Link>`:

```tsx
              <div className="py-3 flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.id}
                    href={hrefFor(link.id)}
                    className={`block text-left px-4 py-2.5 rounded-md text-base font-semibold ${activeTab === link.id ? "bg-gold-50 text-gold-600" : "text-emerald-950 hover:bg-gold-50"}`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/donasi"
                  className="block w-full text-center bg-gold-500 text-white font-bold py-3 rounded-md shadow-md mt-2 flex justify-center items-center gap-2"
                >
                  <HeartPulse size={16} /> Donasi & Infaq
                </Link>
              </div>
```

f) Tambah helper `hrefFor` di dalam komponen (sebelum `return`):

```ts
  const hrefFor = (id: string) => (id === "beranda" ? "/beranda" : `/${id}`);
```

g) Wrapper children (baris 191) tetap `<div className="flex-grow islamic-pattern-light relative">{children}</div>` (children sekarang `<main>`).

- [ ] **Step 3: Footer — social jadi dekorasi `<span aria-hidden>`, nav `<Link>`**

Di `components/layout-footer.tsx`:
- Tambah `import Link from "next/link";`.
- Ganti 4 `<button>` social (baris 64-75) → `<span aria-hidden="true" ...>` (kelas sama, tanpa `onClick`):
```tsx
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm"><Youtube size={14} /></span>
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm"><Instagram size={14} /></span>
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm"><MessageCircle size={14} /></span>
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm"><Mail size={14} /></span>
```
- Ganti nav `<button onClick={...}>` (baris 48-56) → `<Link href={...}>` (bungkus `<nav aria-label="Navigasi footer">`). Pakai pemetaan path sama dengan header (`/beranda` atau `/${id}`).
- Footer punya heading `<h5>` — naikkan konsistensi: pastikan ada tepat satu `<h2>` "site footer" atau andalkan H1 halaman; footer `<h5>` saat ini skip hierarki — ganti `<h5>` di footer menjadi `<h2>` untuk judul kolom footer (mis. "Tautan", "Media Interaksi") agar hierarki utuh (H1 halaman → H2 section termasuk footer).

> Catatan: di header, elemen "Media Interaksi" / kolom footer sebelumnya `<h5>`. Ganti semua `<h5>` di `layout-footer.tsx` → `<h2 className="font-serif text-sm ...">` (pertahankan kelas).

- [ ] **Step 4: iframe Google Maps `title`**

Di `app/(site)/kontak/page.tsx`, temukan `<iframe ... src={kontak.googleMapsUrl} ...>` (~baris 115) dan tambahkan `title="Lokasi Masjid Al-Kahfi di peta"`.

- [ ] **Step 5: `prefers-reduced-motion` untuk marquee**

Di `components/layout-header.tsx`, ganti prop `transition` marquee (baris 95) agar menghormati reduced motion. Tambahkan di atas komponen:
```ts
import { useReducedMotion } from "motion/react";
```
Di dalam komponen:
```ts
  const reduceMotion = useReducedMotion();
```
Ganti `transition={{ repeat: Infinity, duration: 30, ease: "linear" }}` →
```ts
                transition={reduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 30, ease: "linear" }}
```
dan `animate={reduceMotion ? {} : { x: ["100%", "-100%"] }}`.

- [ ] **Step 6: Build + cek manual**

Run: `npm run build` lalu `npm run dev`.
Verifikasi view-source header/footer: ada `<a href="/beranda">`, `<nav aria-label>`, tidak ada `<h1>Masjid Al-Kahfi</h1>` di header, tombol menu punya `aria-label`/`aria-expanded`, footer social = `<span aria-hidden>`, iframe ada `title`.

- [ ] **Step 7: Commit**

```bash
git add components/layout-header.tsx components/layout-footer.tsx components/app-shell.tsx app/\(site\)/kontak/page.tsx
git commit -m "feat(seo): semantic nav, single H1, skip-link, a11y attrs"
```

---

### Task 8: SSR `/berita/[slug]` (prioritas tertinggi)

**Files:**
- Modify: `app/(site)/berita/[slug]/page.tsx` → jadi Server Component
- Create: `app/(site)/berita/[slug]/berita-detail-client.tsx` (Client island: copy-link)

**Interfaces:**
- Consumes: `getBeritaBySlug`, `getAllBeritaSlugs` (Task 5), `buildMetadata` (Task 1), `newsArticleJsonLd`, `breadcrumbJsonLd`, `<JsonLd>` (Task 2).

- [ ] **Step 1: Pindahkan interaktivitas ke Client island `berita-detail-client.tsx`**

Buat `app/(site)/berita/[slug]/berita-detail-client.tsx`. Ambil logika "copy link" dari page lama (yang `"use client"`). Bentuk akhir minimal:

```tsx
"use client";
import { useState } from "react";
import { Link as LinkIcon, Check } from "lucide-react";

export function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/berita/${slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <button onClick={onCopy} className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-900">
      {copied ? <Check size={16} /> : <LinkIcon size={16} />}
      {copied ? "Tersalin" : "Salin tautan"}
    </button>
  );
}
```

> Implementer: bila page lama punya interaktivitas lain (mis. tombol share), pindahkan ke file ini juga. Konten artikel (judul, gambar, body HTML Tiptap, meta) TIDAK boleh ada di island — itu server-rendered.

- [ ] **Step 2: Tulis ulang `page.tsx` sebagai Server Component**

Ganti seluruh isi `app/(site)/berita/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBeritaBySlug, getAllBeritaSlugs } from "@/lib/queries/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { newsArticleJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/json-ld";
import { CopyLinkButton } from "./berita-detail-client";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllBeritaSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const b = await getBeritaBySlug(slug);
  if (!b) return buildMetadata({ title: "Berita tidak ditemukan", description: "", path: `/berita/${slug}`, noIndex: true });
  return buildMetadata({
    title: b.title,
    description: b.desc ?? "",
    path: `/berita/${slug}`,
    image: b.img ?? undefined,
    type: "article",
    publishedTime: b.date ?? undefined,
    modifiedTime: b.updatedAt ? new Date(b.updatedAt).toISOString() : undefined,
    author: b.author ?? undefined,
  });
}

export default async function BeritaDetail({ params }: Params) {
  const { slug } = await params;
  const b = await getBeritaBySlug(slug);
  if (!b) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <JsonLd data={breadcrumbJsonLd([{ name: "Beranda", path: "/beranda" }, { name: "Berita", path: "/berita" }, { name: b.title, path: `/berita/${slug}` }])} />
      <JsonLd data={newsArticleJsonLd({ title: b.title, slug, img: b.img, date: b.date, desc: b.desc, author: b.author })} />

      <nav className="text-sm text-emerald-700 mb-4" aria-label="Breadcrumb">
        <Link href="/beranda">Beranda</Link> / <Link href="/berita">Berita</Link> / <span className="text-gray-500">{b.title}</span>
      </nav>

      <h1 className="font-serif text-3xl md:text-4xl font-bold text-emerald-950 leading-tight">{b.title}</h1>
      <p className="mt-3 text-sm text-gray-500">
        {b.author ? `oleh ${b.author} • ` : ""}{b.date}{b.tag ? ` • ${b.tag}` : ""}
      </p>

      {b.img && (
        <Image src={b.img} alt={b.title} width={1200} height={675} priority sizes="(max-width: 768px) 100vw, 768px" className="rounded-xl mt-6 w-full h-auto object-cover" />
      )}

      <div className="prose prose-emerald max-w-none mt-6" dangerouslySetInnerHTML={{ __html: b.content ?? b.desc ?? "" }} />

      <div className="mt-8 border-t pt-4">
        <CopyLinkButton slug={slug} />
      </div>
    </article>
  );
}
```

> Catatan implementer: `b.updatedAt` & `b.createdAt` ada di schema (lihat `app/api/berita/route.ts` memakai `berita.createdAt`). Verifikasi nama field `updatedAt` di schema; bila berbeda (mis. `updated_at` ter-map ke `updatedAt`), sesuaikan. Klas Tailwind `prose` butuh `@tailwindcss/typography` — bila belum terpasang, ganti div konten dengan kelas manual (`text-gray-700 leading-relaxed`) atau hapus kelas `prose`.

- [ ] **Step 3: Cek dependency `@tailwindcss/typography` (opsional)**

Run: `grep '"@tailwindcss/typography"' package.json || echo "MISSING"`
Bila MISSING: jangan pasang otomatis; ganti `className="prose prose-emerald max-w-none mt-6"` di Step 2 → `className="text-gray-700 leading-relaxed mt-6 [&_img]:rounded-xl [&_a]:text-emerald-700"`.

- [ ] **Step 4: Build + verifikasi SSR**

Run: `npm run build`
Expected: lulus; `/berita/[slug]` ter-list sebagai static atau dynamic route.

Verifikasi: `npm run dev`, buka `/berita/<slug-nyata>`, lihat view-source → judul artikel & body HTML ada di source (bukan shell kosong). Cek `<title>`, `<meta name="description">`, `<link rel="canonical">`, dua `<script type="application/ld+json">` (Breadcrumb + NewsArticle), OG image = `berita.img`.

- [ ] **Step 5: Commit**

```bash
git add "app/(site)/berita/[slug]/page.tsx" "app/(site)/berita/[slug]/berita-detail-client.tsx"
git commit -m "feat(seo): SSR berita detail + NewsArticle/Breadcrumb JSON-LD"
```

---

### Task 9: SSR `/berita` (list)

**Files:**
- Modify: `app/(site)/berita/page.tsx` → Server Component (list awal)
- Create: `app/(site)/berita/berita-list-client.tsx` (Client island: search/filter)

**Interfaces:**
- Consumes: `getAllBerita` (Task 5), `buildMetadata`, `breadcrumbJsonLd`, `<JsonLd>`.

- [ ] **Step 1: Ekstrak UI interaktif ke `berita-list-client.tsx`**

Buat `app/(site)/berita/berita-list-client.tsx` (`"use client"`) yang menerima `initial: Berita[]` sebagai prop dan berisi: input search + grid kartu yang mem-filter dari `initial` di state (filtering client-side, tanpa fetch). Pertahankan tampilan kartu lama (gambar, judul, tag, desc). Tipe `Berita` dari `@/lib/queries/content`.

```tsx
"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Berita } from "@/lib/queries/content";

export function BeritaListClient({ initial }: { initial: Berita[] }) {
  const [q, setQ] = useState("");
  const filtered = initial.filter((b) =>
    [b.title, b.tag ?? "", b.desc ?? ""].join(" ").toLowerCase().includes(q.toLowerCase())
  );
  return (
    <>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari berita..."
        className="w-full md:max-w-md px-4 py-2 rounded-lg border border-gold-200 focus:outline-none focus:ring-2 focus:ring-gold-400 mb-6"
        aria-label="Cari berita"
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((b) => (
          <article key={b.id} className="bg-white rounded-xl shadow overflow-hidden border border-gold-100">
            {b.img && (
              <Link href={`/berita/${b.slug}`}>
                <Image src={b.img} alt={b.title} width={400} height={225} sizes="(max-width:768px) 100vw, 33vw" className="w-full h-48 object-cover" />
              </Link>
            )}
            <div className="p-5">
              {b.tag && <span className="text-xs font-bold uppercase text-gold-600">{b.tag}</span>}
              <h3 className="font-serif font-bold text-lg text-emerald-950 mt-1">
                <Link href={`/berita/${b.slug}`} className="hover:text-gold-600">{b.title}</Link>
              </h3>
              <p className="text-sm text-gray-600 mt-2 line-clamp-3">{b.desc}</p>
              <p className="text-xs text-gray-400 mt-3">{b.date}</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Tulis ulang `page.tsx` sebagai Server Component**

Ganti `app/(site)/berita/page.tsx`:

```tsx
import type { Metadata } from "next";
import { getAllBerita } from "@/lib/queries/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/json-ld";
import { BeritaListClient } from "./berita-list-client";

export const metadata: Metadata = buildMetadata({
  title: "Berita & Kabar Masjid Al-Kahfi",
  description: "Kabar terbaru DKM Masjid Al-Kahfi Cikoneng — kegiatan sosial, kajian, dan pengumuman jamaah.",
  path: "/berita",
});

export default async function BeritaPage() {
  const berita = await getAllBerita();
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd data={breadcrumbJsonLd([{ name: "Beranda", path: "/beranda" }, { name: "Berita", path: "/berita" }])} />
      <header className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-emerald-950">Kabar Al-Kahfi</h1>
        <p className="text-gray-600 mt-2">Berita & pengumuman resmi DKM Masjid Al-Kahfi Cikoneng.</p>
      </header>
      <BeritaListClient initial={berita} />
    </div>
  );
}
```

- [ ] **Step 3: Build + verifikasi SSR**

Run: `npm run build` lalu `npm run dev`.
Verifikasi view-source `/berita`: kartu berita (judul, gambar) ada di HTML. Search tetap jalan (client filter). `<h1>Kabar Al-Kahfi</h1>`, canonical, JSON-LD Breadcrumb.

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/berita/page.tsx" "app/(site)/berita/berita-list-client.tsx"
git commit -m "feat(seo): SSR berita list with client search island"
```

---

### Task 10: SSR `/beranda`

**Files:**
- Modify: `app/(site)/beranda/page.tsx` → Server Component (fetch konten awal, render HTML)
- Create: `app/(site)/beranda/beranda-client.tsx` (Client island: widget jadwal GPS, running text countdown jika ada)

**Interfaces:**
- Consumes: `getFeaturedKegiatan`, `getRecentBerita`, `getRecentGaleri`, `getProfilMasjid` (Task 5), `buildMetadata`.

- [ ] **Step 1: Identifikasi bagian interaktif page lama**

Buka `app/(site)/beranda/page.tsx` yang ada (`"use client"`). Identifikasi: (a) widget jadwal sholat GPS (`usePrayerTimes`), (b) countdown sholat berikutnya, (c) fetch landing data. Konten statis (hero text, section judul, kartu kegiatan/berita/galeri preview, profil) → server-render. Interaktif (prayer widget + countdown) → island.

> Implementer: baca file lama secara penuh sebelum mengedit. Ini task terbesar; jangan duga struktur JSX — salin blok yang relevan.

- [ ] **Step 2: Buat Client island `beranda-client.tsx`**

Pindahkan widget jadwal + countdown ke `app/(site)/beranda/beranda-client.tsx` (`"use client"`). Island ini merender bagian "Jadwal Sholat" (kartu + countdown) dengan `usePrayerTimes()`. Pertahankan implementasi hook/countdown yang ada (`hooks/use-prayer-times.ts`, `lib/prayer-times.ts` dari PR sebelumnya) — hanya pindah lokasi render.

```tsx
"use client";
// Import usePrayerTimes, countdown logic dari page lama (jangan ubah algoritma).
export function PrayerWidget() {
  // ... salin blok JSX jadwal sholat + countdown dari page.tsx lama ...
}
```

- [ ] **Step 3: Tulis ulang `page.tsx` sebagai Server Component**

Bentuk dasar `app/(site)/beranda/page.tsx`:

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getFeaturedKegiatan, getRecentBerita, getRecentGaleri, getProfilMasjid } from "@/lib/queries/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { PrayerWidget } from "./beranda-client";

export const metadata: Metadata = buildMetadata({
  title: undefined, // pakai default title root (tidak override)
  description: "Masjid Al-Kahfi Cikoneng, Kab. Bandung — pusat ibadah, kajian rutin, dan pemberdayaan umat. Jadwal sholat, kegiatan, berita, dan donasi.",
  path: "/beranda",
});

export default async function BerandaPage() {
  const [kegiatan, berita, galeri, profil] = await Promise.all([
    getFeaturedKegiatan(3),
    getRecentBerita(3),
    getRecentGaleri(6),
    getProfilMasjid(),
  ]);

  return (
    <>
      {/* HERO */}
      <section className="relative">
        <Image src="/uploads/hero-fallback.jpg" alt="Masjid Al-Kahfi Cikoneng" fill priority sizes="100vw" className="object-cover" />
        <div className="relative bg-emerald-950/70">
          <div className="max-w-7xl mx-auto px-4 py-20 text-center text-white">
            <h1 className="font-serif text-4xl md:text-5xl font-bold">Selamat Datang di Masjid Al-Kahfi</h1>
            <p className="mt-4 text-gold-100 max-w-2xl mx-auto">{profil?.visi ?? "Pusat pembinaan keimanan dan pemberdayaan sosial ekonomi umat."}</p>
          </div>
        </div>
      </section>

      {/* JADWAL SHOLAT (island) */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold text-emerald-950 mb-6">Jadwal Sholat</h2>
        <PrayerWidget />
      </section>

      {/* KEGIATAN */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold text-emerald-950 mb-6">Kegiatan & Kajian</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {kegiatan.map((k) => (
            <article key={k.id} className="bg-white rounded-xl shadow p-6 border border-gold-100">
              <h3 className="font-serif font-bold text-lg text-emerald-950">{k.title}</h3>
              <p className="text-sm text-gray-600 mt-2">{k.desc}</p>
              <p className="text-xs text-gold-600 mt-3">{k.time}</p>
            </article>
          ))}
        </div>
      </section>

      {/* BERITA */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold text-emerald-950 mb-6">Kabar Terbaru</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {berita.map((b) => (
            <article key={b.id} className="bg-white rounded-xl shadow overflow-hidden border border-gold-100">
              {b.img && <Image src={b.img} alt={b.title} width={400} height={225} sizes="(max-width:768px) 100vw, 33vw" className="w-full h-48 object-cover" />}
              <div className="p-5">
                <h3 className="font-serif font-bold text-lg text-emerald-950"><Link href={`/berita/${b.slug}`} className="hover:text-gold-600">{b.title}</Link></h3>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{b.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* GALERI */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold text-emerald-950 mb-6">Galeri</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {galeri.map((g) => (
            <Image key={g.id} src={g.img} alt={g.title} width={200} height={200} sizes="(max-width:768px) 50vw, 16vw" className="rounded-lg w-full h-32 object-cover" />
          ))}
        </div>
      </section>
    </>
  );
}
```

> Catatan implementer: `Image src="/uploads/hero-fallback.jpg"` — bila tak ada asset itu, ganti ke URL Unsplash hero lama yang dipakai page.tsx sebelumnya (sudah di-whitelist `images.unsplash.com`). Pertahankan struktur & kelas Tailwind dari page LAMA sebanyak mungkin (di atas adalah kerangka — salin detail kelas dari page lama agar tampilan tidak berubah). Field `g.title` dipakai sebagai alt (bukan "Preview Galeri N").

- [ ] **Step 4: Build + verifikasi SSR + heading**

Run: `npm run build` lalu `npm run dev`.
Verifikasi view-source `/beranda`: hero text, kartu kegiatan/berita/galeri ada di HTML. Tepat satu `<h1>` ("Selamat Datang..."). Section `<h2>`. Widget jadwal masih fetch GPS client-side (interaktivitas utuh).

- [ ] **Step 5: Commit**

```bash
git add "app/(site)/beranda/page.tsx" "app/(site)/beranda/beranda-client.tsx"
git commit -m "feat(seo): SSR beranda with prayer widget island"
```

---

### Task 11: SSR `/kegiatan` + `/galeri`

**Files:**
- Modify: `app/(site)/kegiatan/page.tsx` → Server Component + Event JSON-LD
- Modify: `app/(site)/galeri/page.tsx` → Server Component (alt deskriptif); jika ada lightbox, pindah ke island
- Create (jika perlu): `app/(site)/galeri/galeri-client.tsx` (lightbox island)

**Interfaces:**
- Consumes: `getAllKegiatan`, `getAllGaleri`, `buildMetadata`, `eventJsonLd`, `breadcrumbJsonLd`, `<JsonLd>`.

- [ ] **Step 1: SSR `/kegiatan`**

Ganti `app/(site)/kegiatan/page.tsx` kerangka:

```tsx
import type { Metadata } from "next";
import { getAllKegiatan } from "@/lib/queries/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { eventJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = buildMetadata({
  title: "Kegiatan & Kajian Rutin Masjid Al-Kahfi",
  description: "Jadwal kajian, TPA, sholat Jum'at, dan kegiatan rutin lainnya di Masjid Al-Kahfi Cikoneng.",
  path: "/kegiatan",
});

export default async function KegiatanPage() {
  const items = await getAllKegiatan();
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd data={breadcrumbJsonLd([{ name: "Beranda", path: "/beranda" }, { name: "Kegiatan", path: "/kegiatan" }])} />
      {items.map((k) => <JsonLd key={k.id} data={eventJsonLd(k)} />)}
      <header className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-emerald-950">Kegiatan &amp; Kajian Rutin</h1>
        <p className="text-gray-600 mt-2">Agenda ibadah, pendidikan, dan sosial DKM Masjid Al-Kahfi.</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((k) => (
          <article key={k.id} className="bg-white rounded-xl shadow p-6 border border-gold-100">
            <span className="text-xs font-bold uppercase text-gold-600">{k.type}</span>
            <h2 className="font-serif font-bold text-xl text-emerald-950 mt-1">{k.title}</h2>
            <p className="text-sm text-gray-600 mt-2">{k.desc}</p>
            <p className="text-sm text-emerald-700 mt-3">{k.time}{k.ust ? ` • ${k.ust}` : ""}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
```

> Implementer: pertahankan kelas/kartu lama (gambar header `k.img` jika ada). Judul kartu pakai `<h2>` (bukan `<h4>`).

- [ ] **Step 2: SSR `/galeri`**

Ganti `app/(site)/galeri/page.tsx` kerangka:

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import { getAllGaleri } from "@/lib/queries/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = buildMetadata({
  title: "Galeri Dokumentasi Masjid Al-Kahfi",
  description: "Dokumentasi kegiatan dan momen ibadah di Masjid Al-Kahfi Cikoneng.",
  path: "/galeri",
});

export default async function GaleriPage() {
  const items = await getAllGaleri();
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd data={breadcrumbJsonLd([{ name: "Beranda", path: "/beranda" }, { name: "Galeri", path: "/galeri" }])} />
      <header className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-emerald-950">Galeri Dokumentasi</h1>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((g) => (
          <figure key={g.id}>
            <Image src={g.img} alt={g.title} width={400} height={400} sizes="(max-width:768px) 50vw, 25vw" className="rounded-xl w-full h-48 object-cover" />
            <figcaption className="text-xs text-gray-500 mt-1 sr-only">{g.title}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
```

> Jika page lama punya lightbox (klik gambar → modal), pindahkan ke `galeri-client.tsx` island yang menerima `initial` daftar galeri; bungkus grid di island. Alt tetap `g.title`.

- [ ] **Step 3: Build + verifikasi**

Run: `npm run build` lalu `npm run dev`.
Verifikasi: `/kegiatan` view-source punya satu `<h1>`, judul kartu `<h2>`, JSON-LD Event per item. `/galeri` alt gambar = `g.title` (bukan "Galeri N").

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/kegiatan/page.tsx" "app/(site)/galeri/page.tsx"
git commit -m "feat(seo): SSR kegiatan + galeri with Event JSON-LD, descriptive alts"
```

---

### Task 12: SSR `/kontak`, `/tentang`, `/jadwal-sholat`, `/donasi` (+ FAQ JSON-LD)

**Files:**
- Modify: `app/(site)/kontak/page.tsx`, `app/(site)/tentang/page.tsx`, `app/(site)/jadwal-sholat/page.tsx`, `app/(site)/donasi/page.tsx`
- Create: `app/(site)/jadwal-sholat/jadwal-client.tsx` (GPS island), `app/(site)/donasi/donasi-client.tsx` (copy rekening island) — bila interaktivitas ada

**Interfaces:**
- Consumes: `getKontak`, `getDonasi`, `getProfilMasjid`, `getAllFasilitas`, `getAllPengurus`, `buildMetadata`, `faqPageJsonLd`, `breadcrumbJsonLd`, `<JsonLd>`.

- [ ] **Step 1: SSR `/kontak`**

Kerangka `app/(site)/kontak/page.tsx` (server): fetch `getKontak()`, render NAP + iframe (dengan `title` dari Task 7) + satu `<h1>Hubungi Kami</h1>` + `<h2>` section. `generateMetadata`/`metadata` pakai `buildMetadata({ title:"Kontak & Lokasi Masjid Al-Kahfi", description: alamat+email, path:"/kontak" })`.

```tsx
import type { Metadata } from "next";
import { getKontak } from "@/lib/queries/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = buildMetadata({
  title: "Kontak & Lokasi",
  description: "Alamat, peta, dan informasi kontak Masjid Al-Kahfi Cikoneng, Kab. Bandung.",
  path: "/kontak",
});

export default async function KontakPage() {
  const k = await getKontak();
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <JsonLd data={breadcrumbJsonLd([{ name: "Beranda", path: "/beranda" }, { name: "Kontak", path: "/kontak" }])} />
      <h1 className="font-serif text-3xl md:text-4xl font-bold text-emerald-950">Hubungi Kami</h1>
      <section className="mt-6 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-serif text-xl font-bold text-emerald-800">Alamat</h2>
          <p className="text-gray-700 mt-2">{k?.alamat}</p>
          <h2 className="font-serif text-xl font-bold text-emerald-800 mt-4">Jam Operasional</h2>
          <p className="text-gray-700 mt-2">{k?.jamOperasional}</p>
          <h2 className="font-serif text-xl font-bold text-emerald-800 mt-4">Email</h2>
          <p className="text-gray-700 mt-2"><a href={`mailto:${k?.email}`} className="text-emerald-700 hover:underline">{k?.email}</a></p>
        </div>
        {k?.googleMapsUrl && (
          <iframe src={k.googleMapsUrl} title="Lokasi Masjid Al-Kahfi di peta" className="w-full h-80 rounded-xl border-0" loading="lazy" />
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: SSR `/tentang`**

Kerangka `app/(site)/tentang/page.tsx` (server): fetch `getProfilMasjid()`, `getAllFasilitas()`, `getAllPengurus()`. Satu `<h1>Tentang Masjid Al-Kahfi</h1>`, `<h2>` section (Visi & Misi, Sejarah, Fasilitas, Pengurus), `<h3>` sub. `buildMetadata({ title:"Tentang Kami", description: visi/sekilas, path:"/tentang" })`. Pertahankan render pengurus/fasilitas lama.

- [ ] **Step 3: SSR `/jadwal-sholat` + FAQ**

Kerangka server: fetch fallback statis (HTML awal terindeks) + render `<PrayerScheduleClient />` (GPS island: pindahkan `usePrayerTimes` + grid dari page lama ke `jadwal-client.tsx`). Tambah section FAQ kecil + `FAQPage` JSON-LD:

```tsx
const faq = [
  { q: "Apakah jadwal sholat mengikuti lokasi saya?", a: "Ya. Bila Anda mengizinkan akses lokasi (GPS), jadwal dihitung sesuai koordinat Anda. Bila ditolak, digunakan koordinat Masjid Al-Kahfi Cikoneng." },
  { q: "Metode perhitungan apa yang dipakai?", a: "Metode Kementerian Agama RI (Fajr 20°, Isya 18°) dengan mazhab Syafi'i, melalui API Aladhan." },
];
```
Render `<JsonLd data={faqPageJsonLd(faq)} />` + section `<h2>Pertanyaan Umum</h2>` berisi Q&A. `buildMetadata({ title:"Jadwal Sholat", description:"Jadwal sholat harian ... Cikoneng", path:"/jadwal-sholat" })`.

- [ ] **Step 4: SSR `/donasi` + FAQ**

Kerangka server: fetch `getDonasi()`. Render QRIS + rekening (copy nomor rekening → island `donasi-client.tsx`). Tambah FAQ + `FAQPage` JSON-LD:

```tsx
const faq = [
  { q: "Bagaimana cara berinfaq atau zakat?", a: "Anda dapat transfer ke rekening resmi DKM atau scan QRIS di halaman donasi. Konfirmasi via email/WhatsApp admin bila memerlukan tanda terima." },
  { q: "Apakah dana dikelola transparan?", a: "Ya. DKM Masjid Al-Kahfi mencatat dan melaporkan dana ZISWAF secara periodik kepada jamaah." },
];
```
`buildMetadata({ title:"Donasi, Infaq & Zakat", description:"Saluran donasi resmi DKM Masjid Al-Kahfi ...", path:"/donasi" })`.

- [ ] **Step 5: Build + verifikasi**

Run: `npm run build` lalu `npm run dev`.
Verifikasi: tiap halaman satu `<h1>`, hierarki H1→H2→H3, JSON-LD Breadcrumb + FAQ (jadwal/donasi), iframe `title`, copy rekening & GPS tetap jalan. NAP tampil di HTML `/kontak`.

- [ ] **Step 6: Commit**

```bash
git add "app/(site)/kontak/page.tsx" "app/(site)/tentang/page.tsx" "app/(site)/jadwal-sholat/page.tsx" "app/(site)/jadwal-sholat/jadwal-client.tsx" "app/(site)/donasi/page.tsx" "app/(site)/donasi/donasi-client.tsx"
git commit -m "feat(seo): SSR kontak/tentang/jadwal-sholat/donasi + FAQ JSON-LD"
```

---

### Task 13: Gambar (alt, sizes) + `sharp` + format AVIF/WebP

**Files:**
- Modify: `package.json` (tambah `sharp`)
- Modify: `next.config.ts` (`images.formats`)
- Audit: semua `<Image>` di `app/(site)/**` & `components/**`

- [ ] **Step 1: Tambah `sharp`**

Run: `npm install sharp`
Expected: `sharp` muncul di `dependencies` `package.json`.

- [ ] **Step 2: Tambah format gambar di `next.config.ts`**

Di `next.config.ts`, dalam `images:` tambahkan:

```ts
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [ /* pertahankan yang ada */ ],
    dangerouslyAllowSVG: true,
  },
```

- [ ] **Step 3: Audit alt + sizes**

Cari semua `<Image` di `app/(site)` & `components`:
Run: `grep -rn "<Image" app/\\(site\\) components`

Perbaikan:
- Hero: `alt` deskriptif (mis. `"Masjid Al-Kahfi Cikoneng"`), sudah `priority` (Task 10).
- Galeri: `alt={g.title}` (Task 11).
- Pastikan setiap `<Image fill>` punya `sizes`.
- Tidak ada `alt=""` pada gambar konten (kecuali benar-benar dekoratif → `alt=""` + `aria-hidden`).

- [ ] **Step 4: Build + cek header respons gambar**

Run: `npm run build` lalu `npm run dev`.
Buka gambar di dev tools Network → header `Content-Type` menyertakan `avif`/`webp` untuk request `_next/image`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json next.config.ts
git commit -m "perf(seo): sharp + AVIF/WebP output, image alt/sizes audit"
```

---

### Task 14: Analytics + verification env wiring

**Files:**
- Create: `components/analytics.tsx`
- Modify: `app/layout.tsx` (render `<Analytics />`)
- Modify: `.env.example` (dokumentasi env baru)

**Interfaces:**
- Consumes: `process.env.NEXT_PUBLIC_GA_ID` (opt-in).

- [ ] **Step 1: Buat `components/analytics.tsx`**

```tsx
"use client";
import Script from "next/script";

export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `}</Script>
    </>
  );
}
```

- [ ] **Step 2: Render `<Analytics />` di root layout**

Di `app/layout.tsx`, di dalam `<body>` (setelah `<JsonLd>` / `{children}`):

```tsx
          {children}
          <Analytics />
```

Tambah `import { Analytics } from "@/components/analytics";`.

- [ ] **Step 3: Dokumentasi env di `.env.example`**

Tambah di `.env.example`:

```
# SEO / Analytics (optional — leave empty to disable)
APP_URL="https://masjid-alkahfi.id"
NEXT_PUBLIC_GA_ID=""
NEXT_PUBLIC_GSC_VERIFICATION=""
NEXT_PUBLIC_BING_VERIFICATION=""
```

- [ ] **Step 4: Build + verifikasi opt-in**

Run: `npm run build` lalu `npm run dev` (tanpa `NEXT_PUBLIC_GA_ID`).
Verifikasi view-source: TIDAK ada tag gtag. Set `NEXT_PUBLIC_GA_ID=G-TEST` → muncul tag gtag.

- [ ] **Step 5: Commit**

```bash
git add components/analytics.tsx app/layout.tsx .env.example
git commit -m "feat(seo): opt-in GA4 analytics + verification env docs"
```

---

### Task 15: Build akhir + checklist verifikasi SEO

**Files:** — (verifikasi saja)

- [ ] **Step 1: Build produksi**

Run: `npm run build`
Expected: lulus tanpa error/warning metadataBase.

- [ ] **Step 2: Jalankan & verifikasi end-to-end**

Run: `npm start` (atau `npm run dev`). Untuk tiap rute (`/beranda`, `/berita`, `/berita/<slug>`, `/kegiatan`, `/galeri`, `/jadwal-sholat`, `/kontak`, `/tentang`, `/donasi`):
- view-source → konten nyata ada (bukan shell kosong).
- Tepat satu `<h1>` per halaman.
- `<title>`, `<meta name="description">`, `<link rel="canonical">` unik.
- OG + Twitter tags ada.

- [ ] **Step 3: Cek rute infrastruktur**

- `/sitemap.xml` → rute statis + slug berita.
- `/robots.txt` → Disallow `/admin` `/api`, Allow AI bot, `Sitemap:`.
- `/llms.txt` → human-readable.
- `/feed.xml` → RSS valid (parse di https://validator.w3.org/feed/).
- `/manifest.webmanifest` → JSON valid.
- `/icon`, `/apple-icon`, `/opengraph-image` → PNG.

- [ ] **Step 4: Uji eksternal (online)**

- Google Rich Results Test (https://search.google.com/test/rich-results) pada `/`, `/berita/<slug>`, `/kegiatan` → PlaceOfWorship/NewsArticle/Event/FAQ/Breadcrumb valid.
- PageSpeed Insights (https://pagespeed.web.dev/) → LCP/CLS/INP hijau (mobile).
- Mobile-Friendly Test → lulus.
- OG preview (https://www.opengraph.xyz/) → kartu benar.

- [ ] **Step 5: Catat follow-up**

Tulis 2 follow-up (bukan blocker):
1. `telephone` di schema di-enable setelah admin memperbarui hotline nyata via CMS (`/admin/pengaturan-kontak`).
2. `sameAs` di-enable setelah URL sosial (YouTube/Instagram/WA) tersedia → sambungkan tombol footer.

- [ ] **Step 6: Commit final (jika ada perubahan kecil dari verifikasi)**

```bash
git add -A
git commit -m "chore(seo): post-verification fixes"
```

---

## Self-Review (penulis plan)

**Spec coverage:**
- Foundation (site.ts, metadata.ts) → Task 1. ✓
- JSON-LD builders → Task 2. ✓
- Root metadata + PlaceOfWorship → Task 3. ✓
- Brand assets (icon/apple/OG/manifest) → Task 4. ✓
- Data-access layer → Task 5. ✓
- Sitemap/robots/llms.txt/RSS → Task 6. ✓
- Per-page metadata + heading fix → Task 7 (headings/nav) + Task 8–12 (metadata per page). ✓
- Hybrid SSR + data-access → Task 5 + Task 8–12. ✓
- JSON-LD per tipe → Task 2 (builders) + Task 8 (NewsArticle/Breadcrumb) + Task 11 (Event) + Task 12 (FAQ). ✓
- Nav semantics + a11y → Task 7. ✓
- Images + CWV + sharp → Task 13. ✓
- Analytics + verification → Task 14 (+ Task 3 verification meta). ✓
- Build + verification → Task 15. ✓

**Catatan tipe/konsistensi:** `buildMetadata`, `siteConfig`, `placeOfWorshipJsonLd/newsArticleJsonLd/eventJsonLd/breadcrumbJsonLd/faqPageJsonLd`, `<JsonLd>`, dan helper `lib/queries/content` dipakai konsisten lintas task. Tipe row diekspor dari `lib/queries/content` (`Berita`, `Kegiatan`, dll.) sehingga island client dapat import tipe tanpa import server-only.

**Risiko implementasi yang dicatat:** (1) field `kegiatan.featured` tipe — verifikasi saat Task 5; (2) `berita.updatedAt` nama field — verifikasi di schema saat Task 8; (3) `prose` Tailwind — cek `@tailwindcss/typography` di Task 8; (4) hero asset fallback di Task 10 — pakai URL lama bila perlu. Semua ditandai inline di task terkait.
