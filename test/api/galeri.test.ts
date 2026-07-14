import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { GET, POST } from '../../app/api/galeri/route';
import { DELETE } from '../../app/api/galeri/[id]/route';
import { reset, closeDb, galeri, db } from '../helpers/db';
import { call } from '../helpers/request';

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=300',
];

after(closeDb);
beforeEach(async () => { await reset(galeri); });

test('GET /api/galeri empty -> 200 []', async () => {
  const { status, body } = await call(GET);
  assert.equal(status, 200);
  assert.deepEqual(body, []);
});

test('GET /api/galeri newest first (id DESC)', async () => {
  await db.insert(galeri).values({ title: 'A', img: 'x' });
  await db.insert(galeri).values({ title: 'B', img: 'x' });
  const { body } = await call(GET);
  assert.equal(body[0].title, 'B');
});

test('POST /api/galeri missing title -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: {} });
  assert.equal(status, 400);
});

test('POST /api/galeri with img -> 201 stored as given', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: { title: 'G', img: 'https://example.com/x.png' } });
  assert.equal(status, 201);
  assert.equal(body.img, 'https://example.com/x.png');
});

test('POST /api/galeri without img -> 201 uses a default image', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: { title: 'G' } });
  assert.equal(status, 201);
  assert.ok(DEFAULT_IMAGES.includes(body.img));
});

test('DELETE /api/galeri/[id] existing -> 200', async () => {
  const [{ id }] = await db.insert(galeri).values({ title: 'Del', img: 'x' }).returning();
  const { status } = await call(DELETE, { method: 'DELETE', params: { id: String(id) } });
  assert.equal(status, 200);
  assert.equal((await db.select().from(galeri)).length, 0);
});

test('DELETE /api/galeri/[id] non-numeric -> 400', async () => {
  const { status } = await call(DELETE, { method: 'DELETE', params: { id: 'abc' } });
  assert.equal(status, 400);
});

test('DELETE /api/galeri/[id] missing -> 404', async () => {
  const { status } = await call(DELETE, { method: 'DELETE', params: { id: '999999' } });
  assert.equal(status, 404);
});
