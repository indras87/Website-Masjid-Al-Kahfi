import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { GET, POST } from '../../app/api/pengurus/route';
import { PUT, DELETE } from '../../app/api/pengurus/[id]/route';
import { reset, closeDb, pengurus, db } from '../helpers/db';
import { call } from '../helpers/request';

after(closeDb);
beforeEach(async () => { await reset(pengurus); });

const valid = { nama: 'Budi', foto: 'https://img.x/budi.png', tingkat: 'pimpinan' } as const;

test('GET /api/pengurus empty -> 200 []', async () => {
  const { status, body } = await call(GET);
  assert.equal(status, 200);
  assert.deepEqual(body, []);
});

test('GET /api/pengurus ordered by tingkat then urutan', async () => {
  await db.insert(pengurus).values({ nama: 'R', foto: 'f', tingkat: 'riayah', urutan: 1 });
  await db.insert(pengurus).values({ nama: 'P', foto: 'f', tingkat: 'pembina', urutan: 1 });
  await db.insert(pengurus).values({ nama: 'P2', foto: 'f', tingkat: 'pembina', urutan: 2 });
  const { body } = await call(GET);
  // pembina sorts before riayah
  assert.equal(body[0].tingkat, 'pembina');
  assert.equal(body[0].urutan, 1);
  assert.equal(body[1].tingkat, 'pembina');
  assert.equal(body[1].urutan, 2);
  assert.equal(body[2].tingkat, 'riayah');
});

test('POST /api/pengurus missing required -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { nama: 'x' } });
  assert.equal(status, 400);
});

test('POST /api/pengurus invalid tingkat -> 400', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: { nama: 'x', foto: 'f', tingkat: 'boss' } });
  assert.equal(status, 400);
  assert.equal(body.error, 'Tingkat tidak valid');
});

test('POST /api/pengurus valid -> defaults urutan 0 and null jabatan/subBidang', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: valid });
  assert.equal(status, 201);
  assert.equal(body.urutan, 0);
  assert.equal(body.jabatan, null);
  assert.equal(body.subBidang, null);
});

test('PUT /api/pengurus/[id] valid -> 200', async () => {
  const [{ id }] = await db.insert(pengurus).values({ nama: 'Old', foto: 'f', tingkat: 'pembina' }).returning();
  const { status, body } = await call(PUT, { method: 'PUT', params: { id: String(id) }, body: { ...valid, nama: 'New' } });
  assert.equal(status, 200);
  assert.equal(body.nama, 'New');
});

test('PUT /api/pengurus/[id] invalid tingkat -> 400', async () => {
  const [{ id }] = await db.insert(pengurus).values({ nama: 'Old', foto: 'f', tingkat: 'pembina' }).returning();
  const { status } = await call(PUT, { method: 'PUT', params: { id: String(id) }, body: { nama: 'x', foto: 'f', tingkat: 'boss' } });
  assert.equal(status, 400);
});

test('PUT /api/pengurus/[id] missing -> 404', async () => {
  const { status } = await call(PUT, { method: 'PUT', params: { id: '999999' }, body: valid });
  assert.equal(status, 404);
});

test('DELETE /api/pengurus/[id] existing -> 200 message', async () => {
  const [{ id }] = await db.insert(pengurus).values({ nama: 'Del', foto: 'f', tingkat: 'pembina' }).returning();
  const { status, body } = await call(DELETE, { method: 'DELETE', params: { id: String(id) } });
  assert.equal(status, 200);
  assert.ok(body.message);
  assert.equal((await db.select().from(pengurus)).length, 0);
});

test('DELETE /api/pengurus/[id] missing -> 404', async () => {
  const { status } = await call(DELETE, { method: 'DELETE', params: { id: '999999' } });
  assert.equal(status, 404);
});
