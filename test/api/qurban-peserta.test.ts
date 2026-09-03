import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { auth } from '../../lib/auth';
import { GET, POST } from '../../app/api/qurban-peserta/route';
import { call } from '../helpers/request';
import { reset, closeDb, db } from '../helpers/db';
import { qurbanPeserta, qurbanShohibul, qurbanSetoran } from '../../lib/db/schema';

// Mock sesi (pola test/api/pengaturan.test.ts)
let currentSession: any = null;
(auth.api as any).getSession = async () => currentSession;

beforeEach(async () => {
  currentSession = null;
  await reset(qurbanSetoran, qurbanShohibul, qurbanPeserta);
});
after(closeDb);

const valid = {
  namaPeserta: 'Ahmad Fulan',
  alamat: 'Jl. Merdeka No. 1, Bandung',
  whatsapp: '081234567890',
  namaBank: 'BSI',
  nomorRekening: '7011223344',
  namaPemilikRekening: 'AHMAD FULAN',
  periode: '2027',
  shohibul: ['Ahmad Fulan'],
};

test('POST publik valid (1 shohibul) -> 200, status baru, WA dinormalisasi', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: valid });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  const rows = await db.select().from(qurbanPeserta);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].whatsapp, '6281234567890');
  assert.equal(rows[0].status, 'baru');
  const sh = await db.select().from(qurbanShohibul);
  assert.equal(sh.length, 1);
  assert.equal(sh[0].nama, 'Ahmad Fulan');
});

test('POST publik dengan 3 shohibul -> 3 baris shohibul berurutan', async () => {
  const { body } = await call(POST, {
    method: 'POST',
    body: { ...valid, shohibul: ['Ahmad Fulan', 'Fatimah', 'Almarhum Abdullah'] },
  });
  const sh = await db.select().from(qurbanShohibul);
  assert.equal(sh.length, 3);
  assert.deepEqual(
    sh.sort((a, b) => a.urutan - b.urutan).map((s) => s.nama),
    ['Ahmad Fulan', 'Fatimah', 'Almarhum Abdullah']
  );
});

test('POST tanpa shohibul -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { ...valid, shohibul: [] } });
  assert.equal(status, 400);
});

test('POST nama shohibul terlalu pendek -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { ...valid, shohibul: ['Ab'] } });
  assert.equal(status, 400);
});

test('POST WhatsApp tidak valid -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { ...valid, whatsapp: '123' } });
  assert.equal(status, 400);
});

test('POST field wajib kosong -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { ...valid, namaBank: '' } });
  assert.equal(status, 400);
});

test('POST periode bukan 4 digit -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { ...valid, periode: '2x27' } });
  assert.equal(status, 400);
});

test('GET tanpa sesi -> 401', async () => {
  const { status } = await call(GET);
  assert.equal(status, 401);
});

test('GET dengan sesi -> list + saldo agregat + daftar shohibul', async () => {
  const { body: created } = await call(POST, {
    method: 'POST',
    body: { ...valid, shohibul: ['Ahmad Fulan', 'Fatimah'] },
  });
  await db.insert(qurbanSetoran).values({
    pesertaId: created.id,
    tanggal: new Date(),
    jumlah: 100000,
    metodePembayaran: 'tunai_sekretariat',
  });
  currentSession = { user: { id: 'u1', name: 'Admin' } };
  const { status, body } = await call(GET);
  assert.equal(status, 200);
  assert.equal(body.length, 1);
  assert.equal(body[0].saldo, 100000);
  assert.deepEqual(body[0].shohibul.sort(), ['Ahmad Fulan', 'Fatimah']);
});
