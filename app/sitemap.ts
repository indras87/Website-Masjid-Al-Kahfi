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
