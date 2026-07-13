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
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: opts.title ?? siteConfig.name,
        },
      ],
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
      site: "@masjid_alkahfi", // Add Twitter handle when available
    },
    robots: opts.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    // Additional social meta tags for better sharing
    ...(opts.type === "article"
      ? {
          other: {
            "article:author": opts.author ?? siteConfig.name,
            "article:published_time": opts.publishedTime,
            "article:modified_time": opts.modifiedTime,
            "article:section": "Berita Masjid",
          },
        }
      : {}),
  };
}
