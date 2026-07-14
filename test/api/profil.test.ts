import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { GET, PUT } from '../../app/api/profil/route';
import { reset, closeDb, profilMasjid, db } from '../helpers/db';
import { call } from '../helpers/request';

after(closeDb);
beforeEach(async () => { await reset(profilMasjid); });

test('GET /api/profil empty -> blank visi/misi/history', async () => {
  const { status, body } = await call(GET);
  assert.equal(status, 200);
  assert.deepEqual(body, { visi: '', misi: '', history: '' });
});

test('PUT /api/profil missing visi or misi -> 400', async () => {
  const { status } = await call(PUT, { method: 'PUT', body: { visi: 'v' } });
  assert.equal(status, 400);
});

test('PUT /api/profil first time -> creates one row', async () => {
  const { status, body } = await call(PUT, { method: 'PUT', body: { visi: 'V', misi: 'M', history: 'H' } });
  assert.equal(status, 200);
  assert.equal(body.visi, 'V');
  assert.equal((await db.select().from(profilMasjid)).length, 1);
});

test('PUT /api/profil second time -> upsert keeps single row', async () => {
  await call(PUT, { method: 'PUT', body: { visi: 'V', misi: 'M' } });
  const { body } = await call(PUT, { method: 'PUT', body: { visi: 'V2', misi: 'M2' } });
  assert.equal(body.visi, 'V2');
  assert.equal((await db.select().from(profilMasjid)).length, 1);
});

test('PUT /api/profil defaults history to empty string when omitted', async () => {
  const { body } = await call(PUT, { method: 'PUT', body: { visi: 'V', misi: 'M' } });
  assert.equal(body.history, '');
});
