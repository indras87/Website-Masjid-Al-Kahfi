import { db } from "@/lib/db";
import { berita, kegiatan, galeri, profilMasjid, fasilitas, pengurus, kontak, donasi } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export type Berita = typeof berita.$inferSelect;
export type Kegiatan = typeof kegiatan.$inferSelect;
export type Galeri = typeof galeri.$inferSelect;
export type ProfilMasjid = typeof profilMasjid.$inferSelect;
export type Fasilitas = typeof fasilitas.$inferSelect;
export type Pengurus = typeof pengurus.$inferSelect;
export type Kontak = typeof kontak.$inferSelect;
export type Donasi = typeof donasi.$inferSelect;

export async function getAllBerita(): Promise<Berita[]> {
  return db.select().from(berita).orderBy(desc(berita.createdAt));
}
export async function getRecentBerita(limit = 6): Promise<Berita[]> {
  return db.select().from(berita).orderBy(desc(berita.createdAt)).limit(limit);
}
export async function getBeritaBySlug(slug: string): Promise<Berita | null> {
  const rows = await db.select().from(berita).where(eq(berita.slug, slug)).limit(1);
  return rows[0] ?? null;
}
export async function getAllBeritaSlugs(): Promise<{ slug: string }[]> {
  const rows = await db.select({ slug: berita.slug }).from(berita);
  return rows.filter((r): r is { slug: string } => Boolean(r.slug));
}
export async function getAllKegiatan(): Promise<Kegiatan[]> {
  return db.select().from(kegiatan);
}
export async function getFeaturedKegiatan(limit = 3): Promise<Kegiatan[]> {
  return db.select().from(kegiatan).where(eq(kegiatan.featured, true)).limit(limit);
}
export async function getAllGaleri(): Promise<Galeri[]> {
  return db.select().from(galeri);
}
export async function getRecentGaleri(limit = 6): Promise<Galeri[]> {
  return db.select().from(galeri).limit(limit);
}
export async function getProfilMasjid(): Promise<ProfilMasjid | null> {
  const rows = await db.select().from(profilMasjid).limit(1);
  return rows[0] ?? null;
}
export async function getAllFasilitas(): Promise<Fasilitas[]> {
  return db.select().from(fasilitas);
}
export async function getAllPengurus(): Promise<Pengurus[]> {
  return db.select().from(pengurus);
}
export async function getKontak(): Promise<Kontak | null> {
  const rows = await db.select().from(kontak).limit(1);
  return rows[0] ?? null;
}
export async function getDonasi(): Promise<Donasi | null> {
  const rows = await db.select().from(donasi).limit(1);
  return rows[0] ?? null;
}
