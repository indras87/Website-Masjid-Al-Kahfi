import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import UserClientPage from "./_components/UserClientPage";

/** Halaman server manajemen user; memverifikasi sesi dan role superadmin sebelum menampilkan daftar. */
export default async function UsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/admin/login");
  }

  // Only superadmin can access
  if (session.user.role !== "superadmin") {
    redirect("/admin");
  }

  const users = await db.query.user.findMany({
    columns: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <UserClientPage
      initialUsers={users}
      currentUserId={session.user.id}
    />
  );
}
