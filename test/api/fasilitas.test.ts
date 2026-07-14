import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { GET, POST } from '../../app/api/fasilitas/route';
import { PUT, DELETE } from '../../app/api/fasilitas/[id]/route';
import { reset, closeDb, fasilitas, db } from '../helpers/db';
import { call } from '../helpers/request';

after(closeDb);
beforeEach(async () => { await reset(fasilitas); });

const valid = { title: 'AC', desc: 'Dingin', icon: 'Snowflake' } as const;

test('GET /api/fasilitas empty -> 200 []', async () => {
  const { status, body } = await call(GET);
  assert.equal(status, 200);
  assert.deepEqual(body, []);
});

test('POST /api/fasilitas missing fields -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { title: 'x' } });
  assert.equal(status, 400);
});

test('POST /api/fasilitas valid -> 201', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: valid });
  assert.equal(status, 201);
  assert.equal(body.title, 'AC');
});

test('PUT /api/fasilitas/[id] valid -> 200', async () => {
  const [{ id }] = await db.insert(fasilitas).values({ title: 'Old', desc: 'd', icon: 'i' }).returning();
  const { status, body } = await call(PUT, { method: 'PUT', params: { id: String(id) }, body: { ...valid, title: 'New' } });
  assert.equal(status, 200);
  assert.equal(body.title, 'New');
});

test('PUT /api/fasilitas/[id] missing -> 404', async () => {
  const { status } = await call(PUT, { method: 'PUT', params: { id: '999999' }, body: valid });
  assert.equal(status, 404);
});

test('DELETE /api/fasilitas/[id] existing -> 200', async () => {
  const [{ id }] = await db.insert(fasilitas).values({ title: 'Del', desc: 'd', icon: 'i' }).returning();
  const { status, body } = await call(DELETE, { method: 'DELETE', params: { id: String(id) } });
  assert.equal(status, 200);
  assert.ok(body.message);
  assert.equal((await db.select().from(fasilitas)).length, 0);
});

test('DELETE /api/fasilitas/[id] missing -> 404', async () => {
  const { status } = await call(DELETE, { method: 'DELETE', params: { id: '999999' } });
  assert.equal(status, 404);
});
