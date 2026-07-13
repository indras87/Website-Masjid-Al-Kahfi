import type { Metadata } from "next";
import { Playfair_Display, Sora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-client";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "Masjid Al-Kahfi Cikoneng - Kab. Bandung",
  description: "Pusat Pembinaan Keimanan dan Pemberdayaan Sosial Ekonomi Umat",
};

/** Root layout aplikasi yang menerapkan font global, metadata, dan provider autentikasi. */
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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
