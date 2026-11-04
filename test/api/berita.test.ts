import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { GET, POST } from '../../app/api/berita/route';
import { GET as GET_ID, PUT, DELETE } from '../../app/api/berita/[id]/route';
import { reset, closeDb, berita, db, user } from '../helpers/db';
import { auth } from '../../lib/auth';
import { call } from '../helpers/request';

// Control the session returned by auth.api.getSession (headers() is stubbed globally).
let currentSession: any = null;
(auth.api as any).getSession = async () => currentSession;

after(closeDb);
beforeEach(async () => {
  currentSession = { user: { id: 'b1', name: 'Editor' } };
  await reset(berita, user);
  await db.insert(user).values({ id: 'b1', email: 'editor.berita@test.local', name: 'Editor', role: 'admin' });
});

const validBody = { title: 'Kajian Akbar', tag: 'Tarbiyah', author: 'Ust. X', desc: 'desc', content: 'c' };

test('GET /api/berita empty -> 200 []', async () => {
  const { status, body } = await call(GET);
  assert.equal(status, 200);
  assert.deepEqual(body, []);
});

test('GET /api/berita returns rows newest-first with actor fields', async () => {
  await db.insert(berita).values({ title: 'Seeded', tag: 'Sosial', author: 'A', date: '1', img: 'i', desc: 'd' });
  const { status, body } = await call(GET);
  assert.equal(status, 200);
  assert.equal(body.length, 1);
  assert.equal(body[0].title, 'Seeded');
  assert.equal('createdByName' in body[0], true);
});

test('POST /api/berita missing title+desc -> 400', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: { tag: 'X' } });
  assert.equal(status, 400);
  assert.ok(body.error);
});

test('POST /api/berita without session -> 401', async () => {
  currentSession = null;
  const { status, body } = await call(POST, { method: 'POST', body: validBody });
  assert.equal(status, 401);
  assert.equal(body.error, 'Unauthorized');
});

test('PUT /api/berita/[id] without session -> 401', async () => {
  currentSession = null;
  const { status } = await call(PUT, { method: 'PUT', params: { id: '1' }, body: validBody });
  assert.equal(status, 401);
});

test('DELETE /api/berita/[id] without session -> 401', async () => {
  currentSession = null;
  const { status } = await call(DELETE, { method: 'DELETE', params: { id: '1' } });
  assert.equal(status, 401);
});

test('POST /api/berita valid -> 201 with unique slug', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: validBody });
  assert.equal(status, 201);
  assert.equal(body.slug, 'kajian-akbar');
  assert.equal(body.title, 'Kajian Akbar');
});

test('POST /api/berita duplicate title -> slug suffixed -2', async () => {
  await call(POST, { method: 'POST', body: validBody });
  const { body: second } = await call(POST, { method: 'POST', body: validBody });
  assert.equal(second.slug, 'kajian-akbar-2');
});

test('GET /api/berita/[id] by numeric id -> 200', async () => {
  const [{ id }] = await db.insert(berita).values({ title: 'ById', tag: 'Sosial', author: 'A', date: '1', img: 'i', desc: 'd', slug: 'byid' }).returning();
  const { status, body } = await call(GET_ID, { params: { id: String(id) } });
  assert.equal(status, 200);
  assert.equal(body.title, 'ById');
});

test('GET /api/berita/[id] by exact slug -> 200', async () => {
  await db.insert(berita).values({ title: 'SlugMe', tag: 'Sosial', author: 'A', date: '1', img: 'i', desc: 'd', slug: 'slug-me' });
  const { status } = await call(GET_ID, { params: { id: 'slug-me' } });
  assert.equal(status, 200);
});

test('GET /api/berita/[id] by legacy title-id slug -> 200', async () => {
  const [{ id }] = await db.insert(berita).values({ title: 'Legacy', tag: 'Sosial', author: 'A', date: '1', img: 'i', desc: 'd' }).returning();
  const { status } = await call(GET_ID, { params: { id: `judul-${id}` } });
  assert.equal(status, 200);
});

test('GET /api/berita/[id] unknown -> 404', async () => {
  const { status } = await call(GET_ID, { params: { id: '999999' } });
  assert.equal(status, 404);
});

test('PUT /api/berita/[id] valid -> 200 updated', async () => {
  const [{ id }] = await db.insert(berita).values({ title: 'Old', tag: 'Sosial', author: 'A', date: '1', img: 'i', desc: 'd', slug: 'old' }).returning();
  const { status, body } = await call(PUT, { method: 'PUT', params: { id: String(id) }, body: { ...validBody, title: 'New Title' } });
  assert.equal(status, 200);
  assert.equal(body.title, 'New Title');
  assert.equal(body.slug, 'new-title');
});

test('PUT /api/berita/[id] non-numeric id -> 400', async () => {
  const { status } = await call(PUT, { method: 'PUT', params: { id: 'abc' }, body: validBody });
  assert.equal(status, 400);
});

test('PUT /api/berita/[id] missing id -> 404', async () => {
  const { status } = await call(PUT, { method: 'PUT', params: { id: '999999' }, body: validBody });
  assert.equal(status, 404);
});

test('DELETE /api/berita/[id] existing -> 200 with deleted payload', async () => {
  const [{ id }] = await db.insert(berita).values({ title: 'Del', tag: 'Sosial', author: 'A', date: '1', img: 'i', desc: 'd' }).returning();
  const { status, body } = await call(DELETE, { method: 'DELETE', params: { id: String(id) } });
  assert.equal(status, 200);
  assert.equal(body.deleted.title, 'Del');
  assert.equal((await db.select().from(berita)).length, 0);
});

test('DELETE /api/berita/[id] non-numeric -> 400', async () => {
  const { status } = await call(DELETE, { method: 'DELETE', params: { id: 'abc' } });
  assert.equal(status, 400);
});

test('DELETE /api/berita/[id] missing -> 404', async () => {
  const { status } = await call(DELETE, { method: 'DELETE', params: { id: '999999' } });
  assert.equal(status, 404);
});
