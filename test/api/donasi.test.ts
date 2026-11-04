import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { GET, PUT, DELETE } from '../../app/api/donasi/route';
import { reset, closeDb, donasi, db, user } from '../helpers/db';
import { getDefaultDonationSettings } from '../../lib/cms/settings';
import { auth } from '../../lib/auth';
import { call } from '../helpers/request';

// Control the session returned by auth.api.getSession (headers() is stubbed globally).
let currentSession: any = null;
(auth.api as any).getSession = async () => currentSession;

after(closeDb);
beforeEach(async () => {
  currentSession = { user: { id: 'd1', name: 'Bendahara' } };
  await reset(donasi, user);
  await db.insert(user).values({ id: 'd1', email: 'bendahara.donasi@test.local', name: 'Bendahara', role: 'admin' });
});

const valid = {
  namaRekening: 'BSI',
  nomorRekening: '123',
  atasNamaRekening: 'DKM',
  qrisImage: 'https://qris',
};

test('GET /api/donasi empty -> default settings', async () => {
  const { status, body } = await call(GET);
  assert.equal(status, 200);
  assert.deepEqual(body, getDefaultDonationSettings());
});

test('PUT /api/donasi missing a field -> 400', async () => {
  const { status } = await call(PUT, { method: 'PUT', body: { namaRekening: 'x' } });
  assert.equal(status, 400);
});

test('PUT /api/donasi first time -> creates one row', async () => {
  const { status, body } = await call(PUT, { method: 'PUT', body: valid });
  assert.equal(status, 200);
  assert.equal(body.namaRekening, 'BSI');
  assert.equal((await db.select().from(donasi)).length, 1);
});

test('PUT /api/donasi second time -> upsert keeps a single row', async () => {
  await call(PUT, { method: 'PUT', body: valid });
  const { body } = await call(PUT, { method: 'PUT', body: { ...valid, nomorRekening: '999' } });
  assert.equal(body.nomorRekening, '999');
  assert.equal((await db.select().from(donasi)).length, 1);
});

test('DELETE /api/donasi -> ok true, table empty', async () => {
  await call(PUT, { method: 'PUT', body: valid });
  const { status, body } = await call(DELETE, { method: 'DELETE' });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal((await db.select().from(donasi)).length, 0);
});

test('PUT /api/donasi without session -> 401', async () => {
  currentSession = null;
  const { status, body } = await call(PUT, { method: 'PUT', body: valid });
  assert.equal(status, 401);
  assert.equal(body.error, 'Unauthorized');
});

test('DELETE /api/donasi without session -> 401', async () => {
  currentSession = null;
  const { status } = await call(DELETE, { method: 'DELETE' });
  assert.equal(status, 401);
});
