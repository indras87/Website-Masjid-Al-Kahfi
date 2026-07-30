import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { auth } from '../../lib/auth';
import { POST } from '../../app/api/account/password/route';
import { call } from '../helpers/request';
import { reset, closeDb, user, account, db } from '../helpers/db';

// Mock sesi; route menulis ke tabel account sungguhan.
let currentSession: any = null;
(auth.api as any).getSession = async () => currentSession;

const UID = 'acc-test-user';

beforeEach(async () => {
  currentSession = { user: { id: UID, email: 'acc@b.com', name: 'A' } };
  await reset(account, user);
  await db.insert(user).values({ id: UID, email: 'acc@b.com', name: 'A', role: 'admin' });
  await db.insert(account).values({
    id: 'acc-1',
    accountId: 'acc@b.com',
    providerId: 'credential',
    userId: UID,
    password: 'old-hash',
  });
});

after(closeDb);

test('POST /api/account/password tanpa sesi -> 401', async () => {
  currentSession = null;
  const { status, body } = await call(POST, { method: 'POST', body: { newPassword: 'newpass123' } });
  assert.equal(status, 401);
  assert.equal(body.error, 'Unauthorized');
});

test('POST /api/account/password tanpa newPassword -> 400', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: {} });
  assert.equal(status, 400);
  assert.ok(body.error.includes('minimal 8'));
});

test('POST /api/account/password newPassword pendek -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { newPassword: '123' } });
  assert.equal(status, 400);
});

test('POST /api/account/password valid -> 200 & update password credential account (ter-hash & cocok)', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: { newPassword: 'newpass123' } });
  assert.equal(status, 200);
  assert.equal(body.ok, true);

  const [row] = await db.select().from(account).where(eq(account.userId, UID));
  assert.notEqual(row.password, 'old-hash', 'password lama diganti');
  assert.ok(row.password && row.password.length > 10, 'hash disimpan');
  assert.ok(await bcrypt.compare('newpass123', row.password), 'hash cocok dengan sandi baru');
});

test('POST /api/account/password tanpa credential account -> 404', async () => {
  // Pengguna lain tanpa credential account.
  await db.insert(user).values({ id: 'no-cred', email: 'noc@b.com', name: 'N', role: 'admin' });
  currentSession = { user: { id: 'no-cred', email: 'noc@b.com', name: 'N' } };
  const { status, body } = await call(POST, { method: 'POST', body: { newPassword: 'newpass123' } });
  assert.equal(status, 404);
  assert.ok(body.error.includes('tidak ditemukan'));
});
