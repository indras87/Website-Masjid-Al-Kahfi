import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { GET, POST } from '../../app/api/kegiatan/route';
import { PUT, DELETE } from '../../app/api/kegiatan/[id]/route';
import { reset, closeDb, kegiatan, db, user } from '../helpers/db';
import { auth } from '../../lib/auth';
import { call } from '../helpers/request';

// Control the session returned by auth.api.getSession (headers() is stubbed globally).
let currentSession: any = null;
(auth.api as any).getSession = async () => currentSession;

after(closeDb);
beforeEach(async () => {
  currentSession = { user: { id: 'k1', name: 'Editor' } };
  await reset(kegiatan, user);
  await db.insert(user).values({ id: 'k1', email: 'editor.kegiatan@test.local', name: 'Editor', role: 'admin' });
});

const base = { title: 'Tahsin', type: 'Harian', time: 'Bada Subuh', ust: 'Ust. S' } as const;

test('GET /api/kegiatan empty -> 200 []', async () => {
  const { status, body } = await call(GET);
  assert.equal(status, 200);
  assert.deepEqual(body, []);
});

test('GET /api/kegiatan ordered by id ASC', async () => {
  const [a] = await db.insert(kegiatan).values({ title: 'First', type: 'Harian', time: 't', ust: 'u' }).returning();
  await db.insert(kegiatan).values({ title: 'Second', type: 'Harian', time: 't', ust: 'u' });
  const { body } = await call(GET);
  assert.equal(body[0].id, a.id);
  assert.equal(body[1].title, 'Second');
});

test('POST /api/kegiatan missing required fields -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { title: 'x' } });
  assert.equal(status, 400);
});

test('POST /api/kegiatan type Harian -> default icon/color/status/featured', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: base });
  assert.equal(status, 201);
  assert.equal(body.icon, 'CircleUser');
  assert.equal(body.color, 'bg-emerald-50 text-emerald-800');
  assert.equal(body.status, 'Aktif');
  assert.equal(body.featured, false);
});

test('POST /api/kegiatan type Jum\'at -> Mic icon', async () => {
  const { body } = await call(POST, { method: 'POST', body: { ...base, type: "Jum'at" } });
  assert.equal(body.icon, 'Mic');
});

test('POST /api/kegiatan type Hari Besar -> Gift icon', async () => {
  const { body } = await call(POST, { method: 'POST', body: { ...base, type: 'Hari Besar' } });
  assert.equal(body.icon, 'Gift');
});

test('PUT /api/kegiatan/[id] valid -> 200', async () => {
  const [{ id }] = await db.insert(kegiatan).values({ title: 'Old', type: 'Harian', time: 't', ust: 'u' }).returning();
  const { status, body } = await call(PUT, { method: 'PUT', params: { id: String(id) }, body: { ...base, title: 'Updated' } });
  assert.equal(status, 200);
  assert.equal(body.title, 'Updated');
});

test('PUT /api/kegiatan/[id] non-numeric -> 400', async () => {
  const { status } = await call(PUT, { method: 'PUT', params: { id: 'x' }, body: base });
  assert.equal(status, 400);
});

test('PUT /api/kegiatan/[id] missing -> 404', async () => {
  const { status } = await call(PUT, { method: 'PUT', params: { id: '999999' }, body: base });
  assert.equal(status, 404);
});

test('DELETE /api/kegiatan/[id] existing -> 200', async () => {
  const [{ id }] = await db.insert(kegiatan).values({ title: 'Del', type: 'Harian', time: 't', ust: 'u' }).returning();
  const { status } = await call(DELETE, { method: 'DELETE', params: { id: String(id) } });
  assert.equal(status, 200);
  assert.equal((await db.select().from(kegiatan)).length, 0);
});

test('DELETE /api/kegiatan/[id] missing -> 404', async () => {
  const { status } = await call(DELETE, { method: 'DELETE', params: { id: '999999' } });
  assert.equal(status, 404);
});

test('POST /api/kegiatan without session -> 401', async () => {
  currentSession = null;
  const { status, body } = await call(POST, { method: 'POST', body: base });
  assert.equal(status, 401);
  assert.equal(body.error, 'Unauthorized');
});

test('PUT /api/kegiatan/[id] without session -> 401', async () => {
  currentSession = null;
  const { status } = await call(PUT, { method: 'PUT', params: { id: '1' }, body: base });
  assert.equal(status, 401);
});

test('DELETE /api/kegiatan/[id] without session -> 401', async () => {
  currentSession = null;
  const { status } = await call(DELETE, { method: 'DELETE', params: { id: '1' } });
  assert.equal(status, 401);
});
