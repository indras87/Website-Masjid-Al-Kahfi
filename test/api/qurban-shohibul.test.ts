import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { auth } from '../../lib/auth';
import { POST } from '../../app/api/qurban-shohibul/route';
import { PATCH, DELETE } from '../../app/api/qurban-shohibul/[id]/route';
import { call } from '../helpers/request';
import { reset, closeDb, db } from '../helpers/db';
import { qurbanPeserta, qurbanShohibul, user } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';

let currentSession: any = null;
(auth.api as any).getSession = async () => currentSession;

let pesertaId: number;

beforeEach(async () => {
  currentSession = { user: { id: 'u1', name: 'Admin' } };
  // POST/PATCH menyimpan created_by_id/updated_by_id (FK ke tabel user) —
  // pastikan user mock ada di DB (pola test/api/qurban-peserta-detail.test.ts).
  await db.insert(user).values({ id: 'u1', email: 'u1@test.local', name: 'Admin', role: 'admin' }).onConflictDoNothing();
  await reset(qurbanShohibul, qurbanPeserta);
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

test('POST tanpa sesi -> 401', async () => {
  currentSession = null;
  const { status } = await call(POST, { method: 'POST', body: { pesertaId, nama: 'Fatimah' } });
  assert.equal(status, 401);
});

test('POST valid -> 200, tersimpan', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: { pesertaId, nama: 'Fatimah' } });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  const rows = await db.select().from(qurbanShohibul).where(eq(qurbanShohibul.pesertaId, pesertaId));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].nama, 'Fatimah');
});

test('POST peserta tidak ada -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { pesertaId: 9999, nama: 'Fatimah' } });
  assert.equal(status, 400);
});

test('POST nama terlalu pendek -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { pesertaId, nama: 'Ab' } });
  assert.equal(status, 400);
});

test('PATCH ubah nama -> 200', async () => {
  const [sh] = await db.insert(qurbanShohibul).values({ pesertaId, nama: 'Fatimah', urutan: 0 }).returning();
  const { status, body } = await call(PATCH, { method: 'PATCH', params: { id: String(sh.id) }, body: { nama: 'Fatimah Binti Abdullah' } });
  assert.equal(status, 200);
  assert.equal(body.nama, 'Fatimah Binti Abdullah');
});

test('DELETE shohibul terakhir -> 400 (ditolak)', async () => {
  const [sh] = await db.insert(qurbanShohibul).values({ pesertaId, nama: 'Fatimah', urutan: 0 }).returning();
  const { status } = await call(DELETE, { method: 'DELETE', params: { id: String(sh.id) } });
  assert.equal(status, 400);
});

test('DELETE salah satu dari 2 shohibul -> 200', async () => {
  const [sh1] = await db.insert(qurbanShohibul).values({ pesertaId, nama: 'Fatimah', urutan: 0 }).returning();
  await db.insert(qurbanShohibul).values({ pesertaId, nama: 'Abdullah', urutan: 1 });
  const { status, body } = await call(DELETE, { method: 'DELETE', params: { id: String(sh1.id) } });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  const rows = await db.select().from(qurbanShohibul).where(eq(qurbanShohibul.pesertaId, pesertaId));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].nama, 'Abdullah');
});
