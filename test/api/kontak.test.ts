import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { GET, PUT, DELETE } from '../../app/api/kontak/route';
import { reset, closeDb, kontak, db, user } from '../helpers/db';
import { getDefaultContactSettings } from '../../lib/cms/settings';
import { auth } from '../../lib/auth';
import { call } from '../helpers/request';

// Control the session returned by auth.api.getSession (headers() is stubbed globally).
let currentSession: any = null;
(auth.api as any).getSession = async () => currentSession;

after(closeDb);
beforeEach(async () => {
  currentSession = { user: { id: 'kt1', name: 'Sekretaris' } };
  await reset(kontak, user);
  await db.insert(user).values({ id: 'kt1', email: 'sekretaris.kontak@test.local', name: 'Sekretaris', role: 'admin' });
});

const valid = {
  alamat: 'Jl. X',
  hotline: '081',
  email: 'a@b.com',
  jamOperasional: '08-20',
  googleMapsUrl: 'https://maps',
};

test('GET /api/kontak empty -> default settings', async () => {
  const { status, body } = await call(GET);
  assert.equal(status, 200);
  assert.deepEqual(body, getDefaultContactSettings());
});

test('PUT /api/kontak missing a field -> 400', async () => {
  const { status } = await call(PUT, { method: 'PUT', body: { alamat: 'x' } });
  assert.equal(status, 400);
});

test('PUT /api/kontak first time -> creates one row', async () => {
  const { status, body } = await call(PUT, { method: 'PUT', body: valid });
  assert.equal(status, 200);
  assert.equal(body.alamat, 'Jl. X');
  assert.equal((await db.select().from(kontak)).length, 1);
});

test('PUT /api/kontak second time -> upsert keeps a single row', async () => {
  await call(PUT, { method: 'PUT', body: valid });
  const { body } = await call(PUT, { method: 'PUT', body: { ...valid, alamat: 'Jl. Y' } });
  assert.equal(body.alamat, 'Jl. Y');
  assert.equal((await db.select().from(kontak)).length, 1);
});

test('GET /api/kontak after upsert returns the stored row', async () => {
  await call(PUT, { method: 'PUT', body: { ...valid, hotline: '080' } });
  const { body } = await call(GET);
  assert.equal(body.hotline, '080');
});

test('DELETE /api/kontak -> ok true, table empty', async () => {
  await call(PUT, { method: 'PUT', body: valid });
  const { status, body } = await call(DELETE, { method: 'DELETE' });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal((await db.select().from(kontak)).length, 0);
});

test('PUT /api/kontak without session -> 401', async () => {
  currentSession = null;
  const { status, body } = await call(PUT, { method: 'PUT', body: valid });
  assert.equal(status, 401);
  assert.equal(body.error, 'Unauthorized');
});

test('DELETE /api/kontak without session -> 401', async () => {
  currentSession = null;
  const { status } = await call(DELETE, { method: 'DELETE' });
  assert.equal(status, 401);
});
