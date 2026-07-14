import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { GET, PUT } from '../../app/api/pengaturan/route';
import { auth } from '../../lib/auth';
import { reset, closeDb, pengaturan, db, user } from '../helpers/db';
import { DEFAULT_RUNNING_TEXT } from '../../lib/cms/settings';
import { call } from '../helpers/request';

// Control the session returned by auth.api.getSession (headers() is stubbed globally).
let currentSession: any = null;
(auth.api as any).getSession = async () => currentSession;

after(closeDb);
beforeEach(async () => {
  currentSession = null;
  await reset(pengaturan, user);
  await db.insert(user).values({ id: 'u1', email: 'u1@test.local', name: 'Updater', role: 'admin' });
});

test('GET /api/pengaturan empty -> default running text, nulls', async () => {
  const { status, body } = await call(GET);
  assert.equal(status, 200);
  assert.equal(body.running_text, DEFAULT_RUNNING_TEXT);
  assert.equal(body.updatedAt, null);
  assert.equal(body.updatedByName, null);
});

test('PUT /api/pengaturan without session -> 401', async () => {
  currentSession = null;
  const { status, body } = await call(PUT, { method: 'PUT', body: { running_text: 'hi' } });
  assert.equal(status, 401);
  assert.equal(body.error, 'Unauthorized');
});

test('PUT /api/pengaturan empty/whitespace text -> 400', async () => {
  currentSession = { user: { id: 'u1', name: 'U' } };
  const { status, body } = await call(PUT, { method: 'PUT', body: { running_text: '   ' } });
  assert.equal(status, 400);
  assert.equal(body.error, 'Teks berjalan tidak boleh kosong');
});

test('PUT /api/pengaturan valid first time -> stores value', async () => {
  currentSession = { user: { id: 'u1', name: 'Updater' } };
  const { status, body } = await call(PUT, { method: 'PUT', body: { running_text: 'Running now' } });
  assert.equal(status, 200);
  assert.equal(body.running_text, 'Running now');
  assert.equal((await db.select().from(pengaturan)).length, 1);
});

test('PUT /api/pengaturan second time -> upsert, single row', async () => {
  currentSession = { user: { id: 'u1', name: 'Updater' } };
  await call(PUT, { method: 'PUT', body: { running_text: 'A' } });
  const { body } = await call(PUT, { method: 'PUT', body: { running_text: 'B' } });
  assert.equal(body.running_text, 'B');
  assert.equal((await db.select().from(pengaturan)).length, 1);
});

test('GET /api/pengaturan after PUT resolves updater name', async () => {
  currentSession = { user: { id: 'u1', name: 'Updater' } };
  await call(PUT, { method: 'PUT', body: { running_text: 'X' } });
  const { body } = await call(GET);
  assert.equal(body.running_text, 'X');
  assert.equal(body.updatedByName, 'Updater');
});
