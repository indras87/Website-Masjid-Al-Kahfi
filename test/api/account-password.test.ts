import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { auth } from '../../lib/auth';
import { POST } from '../../app/api/account/password/route';
import { call } from '../helpers/request';

// Mock session & setPassword — route tidak boleh menyentuh DB sungguhan.
let currentSession: any = { user: { id: 'u1', email: 'a@b.com', name: 'A' } };
let lastSetPassword: any = null;

(auth.api as any).getSession = async () => currentSession;
(auth.api as any).setPassword = async (args: any) => {
  lastSetPassword = args;
  return { message: 'Password updated successfully.' };
};

beforeEach(() => {
  currentSession = { user: { id: 'u1', email: 'a@b.com', name: 'A' } };
  lastSetPassword = null;
});

after(() => {
  (auth.api as any).setPassword = undefined;
});

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

test('POST /api/account/password valid -> 200 & panggil setPassword', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: { newPassword: 'newpass123' } });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.ok(lastSetPassword, 'setPassword dipanggil');
  assert.equal(lastSetPassword.body.newPassword, 'newpass123');
});
