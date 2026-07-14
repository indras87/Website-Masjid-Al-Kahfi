import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { GET, PUT, DELETE } from '../../app/api/donasi/route';
import { reset, closeDb, donasi, db } from '../helpers/db';
import { getDefaultDonationSettings } from '../../lib/cms/settings';
import { call } from '../helpers/request';

after(closeDb);
beforeEach(async () => { await reset(donasi); });

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
