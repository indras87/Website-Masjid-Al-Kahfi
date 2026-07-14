import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { auth } from '../../lib/auth';
import { GET, POST } from '../../app/api/users/route';
import { GET as GET_ID, PUT, DELETE } from '../../app/api/users/[id]/route';
import { reset, closeDb, user, account, db } from '../helpers/db';
import { call } from '../helpers/request';
import { eq } from 'drizzle-orm';

const SU = 'superadmin-001';

// Control the session; default = superadmin matching the id used for self-rule checks.
let currentSession: any = { user: { id: SU, role: 'superadmin', name: 'Superadmin' } };
(auth.api as any).getSession = async () => currentSession;

after(closeDb);
beforeEach(async () => {
  currentSession = { user: { id: SU, role: 'superadmin', name: 'Superadmin' } };
  await reset(account, user);
});

test('GET /api/users without session -> 401', async () => {
  currentSession = null;
  const { status } = await call(GET);
  assert.equal(status, 401);
});

test('GET /api/users as admin (non-superadmin) -> 401', async () => {
  currentSession = { user: { id: 'a1', role: 'admin' } };
  const { status } = await call(GET);
  assert.equal(status, 401);
});

test('GET /api/users as superadmin, empty -> 200 []', async () => {
  const { status, body } = await call(GET);
  assert.equal(status, 200);
  assert.deepEqual(body, []);
});

test('POST /api/users missing fields -> 400', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: { email: 'x@y.com' } });
  assert.equal(status, 400);
  assert.equal(body.error, 'Missing required fields');
});

test('POST /api/users invalid role -> 400', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: { email: 'x@y.com', password: 'pass', name: 'N', role: 'boss' } });
  assert.equal(status, 400);
  assert.equal(body.error, 'Invalid role');
});

test('POST /api/users duplicate email -> 400', async () => {
  await db.insert(user).values({ id: 'e1', email: 'dup@y.com', name: 'N', role: 'admin' });
  const { status, body } = await call(POST, { method: 'POST', body: { email: 'dup@y.com', password: 'pass', name: 'N', role: 'admin' } });
  assert.equal(status, 400);
  assert.equal(body.error, 'Email already exists');
});

test('POST /api/users valid -> 201, sanitized (no password), persisted', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: { email: 'new@y.com', password: 'secret123', name: 'New', role: 'admin' } });
  assert.equal(status, 201);
  assert.equal(body.email, 'new@y.com');
  assert.equal(body.role, 'admin');
  assert.equal('password' in body, false);
  const found = await db.select().from(user).where(eq(user.email, 'new@y.com'));
  assert.equal(found.length, 1);
});

test('GET /api/users/[id] found / not found', async () => {
  await db.insert(user).values({ id: 'find1', email: 'f@y.com', name: 'F', role: 'admin' });
  const ok = await call(GET_ID, { params: { id: 'find1' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.email, 'f@y.com');
  const miss = await call(GET_ID, { params: { id: 'nope' } });
  assert.equal(miss.status, 404);
});

test('PUT /api/users/[id] valid without password -> 200', async () => {
  await db.insert(user).values({ id: 'put1', email: 'p@y.com', name: 'P', role: 'admin' });
  const { status, body } = await call(PUT, { method: 'PUT', params: { id: 'put1' }, body: { email: 'p2@y.com', name: 'P2', role: 'admin' } });
  assert.equal(status, 200);
  assert.equal(body.name, 'P2');
});

test('PUT /api/users/[id] with password -> re-hashes', async () => {
  await db.insert(user).values({ id: 'put2', email: 'pw@y.com', name: 'P', role: 'admin', password: 'old' });
  await call(PUT, { method: 'PUT', params: { id: 'put2' }, body: { email: 'pw@y.com', name: 'P', role: 'admin', password: 'newpass' } });
  const [row] = await db.select().from(user).where(eq(user.id, 'put2'));
  assert.notEqual(row.password, 'old');
  assert.ok(row.password && row.password.length > 10, 'hashed password stored');
});

test('PUT /api/users/[id] changing own role away from superadmin -> 400', async () => {
  await db.insert(user).values({ id: SU, email: 'su@y.com', name: 'SU', role: 'superadmin' });
  const { status, body } = await call(PUT, { method: 'PUT', params: { id: SU }, body: { email: 'su@y.com', name: 'SU', role: 'admin' } });
  assert.equal(status, 400);
  assert.equal(body.error, 'Cannot change your own role');
});

test('PUT /api/users/[id] missing user -> 404', async () => {
  const { status } = await call(PUT, { method: 'PUT', params: { id: 'ghost' }, body: { email: 'g@y.com', name: 'G', role: 'admin' } });
  assert.equal(status, 404);
});

test('DELETE /api/users/[id] other user -> 200 success', async () => {
  await db.insert(user).values({ id: 'del1', email: 'd@y.com', name: 'D', role: 'admin' });
  const { status, body } = await call(DELETE, { method: 'DELETE', params: { id: 'del1' } });
  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.equal((await db.select().from(user).where(eq(user.id, 'del1'))).length, 0);
});

test('DELETE /api/users/[id] self -> 400', async () => {
  await db.insert(user).values({ id: SU, email: 'su@y.com', name: 'SU', role: 'superadmin' });
  const { status, body } = await call(DELETE, { method: 'DELETE', params: { id: SU } });
  assert.equal(status, 400);
  assert.equal(body.error, 'Cannot delete your own account');
});

test('DELETE /api/users/[id] missing -> 404', async () => {
  const { status } = await call(DELETE, { method: 'DELETE', params: { id: 'ghost' } });
  assert.equal(status, 404);
});
