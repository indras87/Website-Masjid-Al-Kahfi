import type {Metadata} from 'next';
import { Playfair_Display, Sora } from 'next/font/google';
import './globals.css'; // Global styles

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
});

export const metadata: Metadata = {
  title: 'Masjid Al-Kahfi Cikoneng - Kab. Bandung',
  description: 'Pusat Pembinaan Keimanan dan Pemberdayaan Sosial Ekonomi Umat',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" className={`${playfair.variable} ${sora.variable} scroll-smooth`}>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
