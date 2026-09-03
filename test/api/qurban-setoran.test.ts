import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { auth } from '../../lib/auth';
import { GET, POST } from '../../app/api/qurban-setoran/route';
import { PATCH, DELETE } from '../../app/api/qurban-setoran/[id]/route';
import { call } from '../helpers/request';
import { reset, closeDb, db } from '../helpers/db';
import { qurbanPeserta, qurbanShohibul, qurbanSetoran, user } from '../../lib/db/schema';

let currentSession: any = null;
(auth.api as any).getSession = async () => currentSession;

let pesertaId: number;

beforeEach(async () => {
  currentSession = { user: { id: 'u1', name: 'Admin' } };
  // POST menyimpan created_by_id/updated_by_id (FK ke tabel user) —
  // pastikan user mock ada di DB (pola test/api/qurban-shohibul.test.ts).
  await db.insert(user).values({ id: 'u1', email: 'u1@t.local', name: 'Admin', role: 'admin' }).onConflictDoNothing();
  await reset(qurbanSetoran, qurbanShohibul, qurbanPeserta);
  const [row] = await db.insert(qurbanPeserta).values({
    namaPeserta: 'Budi Santoso',
    alamat: 'Jl. Mawar No. 4',
    whatsapp: '628123456789',
    namaBank: 'Mandiri',
    nomorRekening: '1122334455',
    namaPemilikRekening: 'BUDI SANTOSO',
    periode: '2027',
  }).returning();
  pesertaId = row.id;
});
after(closeDb);

const validBody = () => ({
  pesertaId,
  tanggal: '2026-03-15',
  jumlah: 250000,
  metodePembayaran: 'tunai_sekretariat',
  keterangan: 'Setoran Maret',
});

test('POST tanpa sesi -> 401', async () => {
  currentSession = null;
  const { status } = await call(POST, { method: 'POST', body: validBody() });
  assert.equal(status, 401);
});

test('POST valid -> 200, tersimpan', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: validBody() });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  const rows = await db.select().from(qurbanSetoran);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].jumlah, 250000);
});

test('POST jumlah <= 0 -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { ...validBody(), jumlah: 0 } });
  assert.equal(status, 400);
});

test('POST peserta tidak ada -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { ...validBody(), pesertaId: 9999 } });
  assert.equal(status, 400);
});

test('POST metode tidak valid -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { ...validBody(), metodePembayaran: 'gojek' } });
  assert.equal(status, 400);
});

test('GET ?pesertaId -> riwayat urut tanggal desc + nama peserta', async () => {
  await db.insert(qurbanSetoran).values([
    { pesertaId, tanggal: new Date('2026-01-10'), jumlah: 100000, metodePembayaran: 'qris' },
    { pesertaId, tanggal: new Date('2026-02-10'), jumlah: 200000, metodePembayaran: 'qris' },
  ]);
  const res = await GET(new Request(`http://localhost/api/qurban-setoran?pesertaId=${pesertaId}`));
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.length, 2);
  assert.equal(body[0].jumlah, 200000); // desc
  assert.equal(body[0].namaPeserta, 'Budi Santoso');
});

test('PATCH ubah jumlah -> 200', async () => {
  const [row] = await db.insert(qurbanSetoran).values({ pesertaId, tanggal: new Date(), jumlah: 100000, metodePembayaran: 'qris' }).returning();
  const { status, body } = await call(PATCH, { method: 'PATCH', params: { id: String(row.id) }, body: { jumlah: 150000 } });
  assert.equal(status, 200);
  assert.equal(body.jumlah, 150000);
});

test('DELETE -> 200', async () => {
  const [row] = await db.insert(qurbanSetoran).values({ pesertaId, tanggal: new Date(), jumlah: 100000, metodePembayaran: 'qris' }).returning();
  const { status, body } = await call(DELETE, { method: 'DELETE', params: { id: String(row.id) } });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
});
