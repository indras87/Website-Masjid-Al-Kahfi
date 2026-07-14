import assert from 'node:assert/strict';
import { test, after, before } from 'node:test';
import { getActor, withActorNames } from '../../lib/audit';
import { db, reset, closeDb, user, berita } from '../helpers/db';

after(closeDb);

before(async () => {
  await reset(berita, user);
});

test('getActor returns null when there is no session (anonymous test env)', async () => {
  const actor = await getActor();
  assert.equal(actor, null);
});

test('withActorNames attaches creator/updater names from the user table', async () => {
  await reset(user, berita);
  const [u] = await db.insert(user).values({
    id: 'actor-1',
    email: 'actor1@test.local',
    name: 'Actor One',
    role: 'admin',
  }).returning();
  await db.insert(berita).values({
    title: 'T',
    tag: 'Sosial',
    author: 'Admin',
    date: '1 Januari 2026',
    img: 'i',
    desc: 'd',
    createdById: u.id,
    updatedById: u.id,
  });
  const rows = await db.select().from(berita);
  const enriched = await withActorNames(rows);
  assert.equal(enriched.length, 1);
  assert.equal(enriched[0].createdByName, 'Actor One');
  assert.equal(enriched[0].updatedByName, 'Actor One');
});

test('withActorNames yields null names when actor columns are null', async () => {
  await reset(berita);
  await db.insert(berita).values({
    title: 'Anon',
    tag: 'Sosial',
    author: 'Admin',
    date: '1 Januari 2026',
    img: 'i',
    desc: 'd',
  });
  const rows = await db.select().from(berita);
  const enriched = await withActorNames(rows);
  assert.equal(enriched[0].createdByName, null);
  assert.equal(enriched[0].updatedByName, null);
});

test('withActorNames resolves each actor independently (create vs update)', async () => {
  await reset(user, berita);
  const [creator] = await db.insert(user).values({
    id: 'c-1', email: 'c1@test.local', name: 'Creator', role: 'admin',
  }).returning();
  const [updater] = await db.insert(user).values({
    id: 'u-1', email: 'u1@test.local', name: 'Updater', role: 'admin',
  }).returning();
  await db.insert(berita).values({
    title: 'Mixed',
    tag: 'Sosial',
    author: 'Admin',
    date: '1 Januari 2026',
    img: 'i',
    desc: 'd',
    createdById: creator.id,
    updatedById: updater.id,
  });
  const enriched = await withActorNames(await db.select().from(berita));
  assert.equal(enriched[0].createdByName, 'Creator');
  assert.equal(enriched[0].updatedByName, 'Updater');
});
