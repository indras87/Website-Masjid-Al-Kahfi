import { db } from "@/lib/db";
import { berita, kegiatan, galeri, pengurus, fasilitas, user } from "@/lib/db/schema";
import { count, desc, inArray } from "drizzle-orm";

/** Mengambil jumlah total kegiatan, berita, pengurus, dan galeri untuk statistik dashboard. */
export async function getDashboardStats() {
  const [kegiatanRow, beritaRow, pengurusRow, galeriRow] = await Promise.all([
    db.select({ value: count() }).from(kegiatan),
    db.select({ value: count() }).from(berita),
    db.select({ value: count() }).from(pengurus),
    db.select({ value: count() }).from(galeri),
  ]);
  return {
    kegiatan: Number(kegiatanRow[0]?.value ?? 0),
    berita: Number(beritaRow[0]?.value ?? 0),
    pengurus: Number(pengurusRow[0]?.value ?? 0),
    galeri: Number(galeriRow[0]?.value ?? 0),
  };
}

export type ActivityItem = {
  entity: "berita" | "kegiatan" | "galeri" | "pengurus" | "fasilitas";
  title: string;
  action: "create" | "update";
  updatedAt: Date;
  updatedByName: string | null;
  href: string;
};

type RawRow = {
  entity: ActivityItem["entity"];
  title: string;
  href: string;
  updatedAt: Date;
  updatedById: string | null;
  createdById: string | null;
  createdAt: Date;
};

/** Mengambil aktivitas terbaru lintas entitas (berita, kegiatan, galeri, dll) beserta nama pelaku. */
export async function getRecentActivity(limit = 8): Promise<ActivityItem[]> {
  const N = limit;
  const [b, k, g, p, f] = await Promise.all([
    db.select().from(berita).orderBy(desc(berita.updatedAt)).limit(N),
    db.select().from(kegiatan).orderBy(desc(kegiatan.updatedAt)).limit(N),
    db.select().from(galeri).orderBy(desc(galeri.updatedAt)).limit(N),
    db.select().from(pengurus).orderBy(desc(pengurus.updatedAt)).limit(N),
    db.select().from(fasilitas).orderBy(desc(fasilitas.updatedAt)).limit(N),
  ]);

  const all: RawRow[] = [
    ...b.map((x) => ({ entity: "berita" as const, title: x.title, href: "/admin/berita", updatedAt: x.updatedAt, updatedById: x.updatedById, createdById: x.createdById, createdAt: x.createdAt })),
    ...k.map((x) => ({ entity: "kegiatan" as const, title: x.title, href: "/admin/kegiatan", updatedAt: x.updatedAt, updatedById: x.updatedById, createdById: x.createdById, createdAt: x.createdAt })),
    ...g.map((x) => ({ entity: "galeri" as const, title: x.title, href: "/admin/galeri", updatedAt: x.updatedAt, updatedById: x.updatedById, createdById: x.createdById, createdAt: x.createdAt })),
    ...p.map((x) => ({ entity: "pengurus" as const, title: x.nama, href: "/admin/pengurus", updatedAt: x.updatedAt, updatedById: x.updatedById, createdById: x.createdById, createdAt: x.createdAt })),
    ...f.map((x) => ({ entity: "fasilitas" as const, title: x.title, href: "/admin/fasilitas", updatedAt: x.updatedAt, updatedById: x.updatedById, createdById: x.createdById, createdAt: x.createdAt })),
  ];

  const sorted = all
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);

  const ids = Array.from(new Set(sorted.map((s) => s.updatedById).filter(Boolean) as string[]));
  const nameById = new Map<string, string | null>();
  if (ids.length) {
    const users = await db.select({ id: user.id, name: user.name }).from(user).where(inArray(user.id, ids));
    users.forEach((u) => nameById.set(u.id, u.name ?? null));
  }

  return sorted.map((s) => {
    const isCreate =
      s.updatedById === s.createdById &&
      Math.abs(s.updatedAt.getTime() - s.createdAt.getTime()) < 1000;
    return {
      entity: s.entity,
      title: s.title,
      action: isCreate ? "create" : "update",
      updatedAt: s.updatedAt,
      updatedByName: (s.updatedById && nameById.get(s.updatedById)) ?? null,
      href: s.href,
    };
  });
}
