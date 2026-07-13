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
    ...(process.env.NEXT_PUBLIC_BING_VERIFICATION
      ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION } }
      : {}),
  },
  alternates: {
    canonical: siteConfig.url,
    types: { "application/rss+xml": `${siteConfig.url}/feed.xml` },
  },
};

export const viewport: Viewport = { themeColor: siteConfig.themeColor };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${playfair.variable} ${sora.variable} scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          <JsonLd data={placeOfWorshipJsonLd()} />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
