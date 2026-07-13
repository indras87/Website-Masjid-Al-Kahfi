import { redirect } from "next/navigation";

/** Halaman root yang langsung mengalihkan pengguna ke rute beranda. */
export default function Page() {
  redirect("/beranda");
}
