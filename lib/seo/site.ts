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
