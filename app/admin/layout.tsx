export const metadata = {
  title: 'Admin Dashboard - Masjid Al-Kahfi',
};

/** Layout root admin yang meneruskan children tanpa pembungkus tambahan. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
