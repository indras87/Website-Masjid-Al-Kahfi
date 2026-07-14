import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { getDashboardStats, getRecentActivity } from '../../lib/dashboard';
import { db, resetContent, reset, closeDb, berita, kegiatan, galeri, user } from '../helpers/db';

after(closeDb);

test('getDashboardStats reports zeros on an empty content set', async () => {
  await resetContent();
  const stats = await getDashboardStats();
  assert.deepEqual(stats, { kegiatan: 0, berita: 0, pengurus: 0, galeri: 0 });
});

test('getDashboardStats counts rows per entity', async () => {
  await resetContent();
  await db.insert(berita).values([
    { title: 'B1', tag: 'Sosial', author: 'A', date: '1', img: 'i', desc: 'd' },
    { title: 'B2', tag: 'Sosial', author: 'A', date: '1', img: 'i', desc: 'd' },
  ]);
  await db.insert(kegiatan).values({ title: 'K', type: 'Harian', time: 't', ust: 'u' });
  const stats = await getDashboardStats();
  assert.equal(stats.berita, 2);
  assert.equal(stats.kegiatan, 1);
  assert.equal(stats.galeri, 0);
});

test('getRecentActivity merges entities sorted by updatedAt desc and respects limit', async () => {
  await resetContent();
  // Insert with distinct updatedAt timestamps (older first).
  const older = new Date(Date.now() - 60_000);
  const newer = new Date(Date.now() - 1_000);
  await db.insert(berita).values({
    title: 'OldBerita', tag: 'Sosial', author: 'A', date: '1', img: 'i', desc: 'd', updatedAt: older,
  });
  await db.insert(kegiatan).values({
    title: 'NewKegiatan', type: 'Harian', time: 't', ust: 'u', updatedAt: newer,
  });
  const activity = await getRecentActivity(8);
  assert.ok(activity.length >= 2);
  // Newest first.
  assert.equal(activity[0].title, 'NewKegiatan');
  // titles array contains both.
  const titles = activity.map((a) => a.title);
  assert.ok(titles.includes('OldBerita'));
  assert.ok(titles.includes('NewKegiatan'));
});

test('getRecentActivity marks a fresh row as action=create', async () => {
  await resetContent();
  await db.insert(galeri).values({ title: 'FreshGallery', img: 'i' });
  const activity = await getRecentActivity(8);
  const item = activity.find((a) => a.title === 'FreshGallery');
  assert.ok(item, 'fresh galeri row should appear in recent activity');
  assert.equal(item!.action, 'create');
});

test('getRecentActivity resolves updatedByName from the user table', async () => {
  await resetContent();
  await reset(user);
  const [u] = await db.insert(user).values({
    id: 'dash-1', email: 'dash1@test.local', name: 'Dash User', role: 'admin',
  }).returning();
  await db.insert(berita).values({
    title: 'Attributed', tag: 'Sosial', author: 'A', date: '1', img: 'i', desc: 'd', updatedById: u.id,
  });
  const activity = await getRecentActivity(8);
  const item = activity.find((a) => a.title === 'Attributed');
  assert.equal(item!.updatedByName, 'Dash User');
});
