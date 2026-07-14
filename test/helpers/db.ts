import { db } from '../../lib/db';
import {
  berita,
  kegiatan,
  galeri,
  pengurus,
  fasilitas,
  kontak,
  donasi,
  profilMasjid,
  pengaturan,
  user,
  account,
  session as sessionTable,
} from '../../lib/db/schema';

/** Wipe the given table(s) (all rows). Call in before/beforeEach for deterministic state. */
export async function reset(...tables: any[]) {
  for (const t of tables) await db.delete(t);
}

/** Wipe all CMS content tables (leaves user/session/account intact). */
export async function resetContent() {
  await reset(berita, kegiatan, galeri, pengurus, fasilitas, kontak, donasi, profilMasjid, pengaturan);
}

/**
 * Close the underlying postgres connection pool so the Node test runner can exit.
 * Call `after(closeDb)` in every test file that touches the database.
 */
export async function closeDb() {
  try {
    // drizzle-orm/postgres-js exposes the postgres Sql instance as `$client`.
    await (db as any).$client.end();
  } catch {
    /* already closed */
  }
}

export {
  db,
  berita,
  kegiatan,
  galeri,
  pengurus,
  fasilitas,
  kontak,
  donasi,
  profilMasjid,
  pengaturan,
  user,
  account,
  sessionTable,
};
