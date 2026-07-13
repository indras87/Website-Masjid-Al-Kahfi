import { AppShell } from "@/components/app-shell";

/** Layout grup rute publik yang membungkus halaman dengan AppShell (navbar & footer). */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}