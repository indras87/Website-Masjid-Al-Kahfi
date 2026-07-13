/** Layout sederhana halaman login yang hanya merender children tanpa chrome. */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
