import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderResetPasswordEmail, renderVerificationEmail } from '../../lib/email-templates';

test('renderResetPasswordEmail mengandung URL reset, nama, dan brand', () => {
  const html = renderResetPasswordEmail({ name: 'Budi', url: 'https://app.test/admin/reset-password?token=abc' });
  assert.ok(html.includes('https://app.test/admin/reset-password?token=abc'));
  assert.ok(html.includes('Budi'));
  assert.ok(html.includes('Masjid Al-Kahfi'));
  assert.ok(html.includes('Atur Ulang Kata Sandi'));
});

test('renderResetPasswordEmail escape HTML pada nama (anti XSS)', () => {
  const html = renderResetPasswordEmail({ name: '<script>', url: 'https://app.test/x' });
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('renderResetPasswordEmail pakai fallback nama "Admin" bila kosong', () => {
  const html = renderResetPasswordEmail({ name: null, url: 'https://app.test/x' });
  assert.ok(html.includes('Admin'));
});

test('renderVerificationEmail mengandung URL verifikasi dan brand', () => {
  const html = renderVerificationEmail({ name: 'Siti', url: 'https://app.test/api/auth/verify-email?token=xyz' });
  assert.ok(html.includes('https://app.test/api/auth/verify-email?token=xyz'));
  assert.ok(html.includes('Siti'));
  assert.ok(html.includes('Verifikasi Email'));
});
