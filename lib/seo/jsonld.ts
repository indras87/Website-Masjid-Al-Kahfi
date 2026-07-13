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

type BeritaLike = {
  title: string;
  slug: string;
  img?: string | null;
  datePublished?: string; // ISO 8601, e.g. from berita.createdAt
  dateModified?: string;  // ISO 8601, e.g. from berita.updatedAt
  desc?: string | null;
  author?: string | null;
};

export function newsArticleJsonLd(b: BeritaLike) {
  return {
    "@context": GRAPH,
    "@type": "NewsArticle",
    headline: b.title,
    image: b.img ? (b.img.startsWith("http") ? b.img : `${BASE}${b.img}`) : `${BASE}${siteConfig.ogImage}`,
    ...(b.datePublished ? { datePublished: b.datePublished } : {}),
    ...(b.dateModified ? { dateModified: b.dateModified } : {}),
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

export function organizationJsonLd() {
  return {
    "@context": GRAPH,
    "@type": "Organization",
    name: siteConfig.name,
    url: BASE,
    logo: `${BASE}${siteConfig.ogImage}`,
    description: siteConfig.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jl. Cikoneng No.15",
      addressLocality: "Bojongsoang, Kab. Bandung",
      addressRegion: "Jawa Barat",
      postalCode: "40288",
      addressCountry: "ID",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: siteConfig.contact.email,
      areaServed: "ID",
      availableLanguage: "Indonesian",
    },
    sameAs: [], // Add social media links when available
  };
}

export function websiteJsonLd() {
  return {
    "@context": GRAPH,
    "@type": "WebSite",
    url: BASE,
    name: siteConfig.name,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE}/berita?q={search_term_string}`,
      },
      "query-input": {
        "@type": "PropertyValueSpecification",
        valueRequired: true,
        valueName: "search_term_string",
      },
    },
  };
}

type ImageLike = {
  title: string;
  img: string;
};

export function imageCollectionJsonLd(images: ImageLike[]) {
  return {
    "@context": GRAPH,
    "@type": "CollectionPage",
    name: `Galeri Dokumentasi ${siteConfig.name}`,
    description: "Kumpulan foto dokumentasi kegiatan dan momen ibadah di Masjid Al-Kahfi Cikoneng.",
    url: `${BASE}/galeri`,
    about: {
      "@type": "PlaceOfWorship",
      name: siteConfig.name,
      url: BASE,
    },
    hasPart: images.map((img) => ({
      "@type": "ImageObject",
      contentUrl: img.img.startsWith("http") ? img.img : `${BASE}${img.img}`,
      name: img.title,
      description: img.title,
      author: {
        "@type": "Organization",
        name: siteConfig.name,
      },
    })),
  };
}
