import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test, after, afterEach, before } from 'node:test';
import { POST } from '../../app/api/upload/route';
import { call } from '../helpers/request';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Minimal valid 1x1 transparent PNG.
const PNG_1x1 = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x62, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

let snapshot: Set<string>;

before(() => {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
});

after(() => {
  // Final cleanup of any stray files created during the suite.
  cleanupNewFiles(new Set());
});

afterEach(() => {
  cleanupNewFiles(snapshot);
});

function listDir(): Set<string> {
  return new Set(fs.readdirSync(UPLOAD_DIR));
}

function cleanupNewFiles(beforeSet: Set<string>) {
  const now = listDir();
  for (const f of now) {
    if (!beforeSet.has(f)) {
      try { fs.unlinkSync(path.join(UPLOAD_DIR, f)); } catch { /* ignore */ }
    }
  }
}

function formDataWith(file: { buf: Buffer; name: string; type: string }) {
  const fd = new FormData();
  const blob = new Blob([file.buf], { type: file.type });
  fd.append('file', blob, file.name);
  return fd;
}

test('POST /api/upload no file -> 400', async () => {
  snapshot = listDir();
  const fd = new FormData();
  const { status, body } = await call(POST, { method: 'POST', rawBody: fd });
  assert.equal(status, 400);
  assert.equal(body.error, 'Tidak ada file yang diunggah');
});

test('POST /api/upload over 2MB -> 400', async () => {
  snapshot = listDir();
  const fd = formDataWith({ buf: Buffer.alloc(3 * 1024 * 1024, 0), name: 'big.png', type: 'image/png' });
  const { status, body } = await call(POST, { method: 'POST', rawBody: fd });
  assert.equal(status, 400);
  assert.equal(body.error, 'Ukuran file melebihi batas 2MB');
});

test('POST /api/upload wrong mime -> 400', async () => {
  snapshot = listDir();
  const fd = formDataWith({ buf: Buffer.from('%PDF-1.4 hello'), name: 'doc.pdf', type: 'application/pdf' });
  const { status, body } = await call(POST, { method: 'POST', rawBody: fd });
  assert.equal(status, 400);
  assert.match(body.error, /Tipe file tidak valid/);
});

test('POST /api/upload valid PNG -> 200, file on disk, sanitized name', async () => {
  snapshot = listDir();
  const fd = formDataWith({ buf: PNG_1x1, name: 'my pic!!!.png', type: 'image/png' });
  const { status, body } = await call(POST, { method: 'POST', rawBody: fd });
  assert.equal(status, 200);
  assert.ok(body.url.startsWith('/uploads/'));
  const filename = path.basename(body.url);
  assert.ok(fs.existsSync(path.join(UPLOAD_DIR, filename)), 'file written to disk');
  // special characters sanitized to underscores
  assert.match(filename, /my_pic/);
  assert.equal(/[^a-zA-Z0-9._-]/.test(filename.replace(/my_pic/, '')), false);
});
