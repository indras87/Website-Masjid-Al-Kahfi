import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { auth } from '../../lib/auth';
import { GET, PATCH, DELETE } from '../../app/api/qurban-peserta/[id]/route';
import { call } from '../helpers/request';
import { reset, closeDb, db } from '../helpers/db';
import { qurbanPeserta, qurbanShohibul, qurbanSetoran, user } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';

let currentSession: any = null;
(auth.api as any).getSession = async () => currentSession;

beforeEach(async () => {
  currentSession = { user: { id: 'u1', name: 'Admin' } };
  // PATCH menyimpan updated_by_id (FK ke tabel user) — pastikan user mock ada di DB
  // (pola test/api/pengaturan.test.ts). onConflictDoNothing aman bila baris sudah ada.
  await db.insert(user).values({ id: 'u1', email: 'u1@test.local', name: 'Admin', role: 'admin' }).onConflictDoNothing();
  await reset(qurbanSetoran, qurbanShohibul, qurbanPeserta);
});
after(closeDb);

async function seedPeserta() {
  const [row] = await db.insert(qurbanPeserta).values({
    namaPeserta: 'Siti Aminah',
    alamat: 'Jl. Kenanga No. 9',
    whatsapp: '628111222333',
    namaBank: 'BRI',
    nomorRekening: '0099887766',
    namaPemilikRekening: 'SITI AMINAH',
    periode: '2027',
  }).returning();
  await db.insert(qurbanShohibul).values([
    { pesertaId: row.id, nama: 'Almarhumah Fatimah', urutan: 0 },
    { pesertaId: row.id, nama: 'Almarhum Ahmad', urutan: 1 },
  ]);
  return row;
}

test('GET tanpa sesi -> 401', async () => {
  currentSession = null;
  const row = await seedPeserta();
  const { status } = await call(GET, { params: { id: String(row.id) } });
  assert.equal(status, 401);
});

test('GET admin -> detail + saldo + shohibul + riwayat setoran', async () => {
  const row = await seedPeserta();
  await db.insert(qurbanSetoran).values([
    { pesertaId: row.id, tanggal: new Date('2026-01-10'), jumlah: 200000, metodePembayaran: 'transfer_bank' },
    { pesertaId: row.id, tanggal: new Date('2026-02-10'), jumlah: 300000, metodePembayaran: 'qris' },
  ]);
  const { status, body } = await call(GET, { params: { id: String(row.id) } });
  assert.equal(status, 200);
  assert.equal(body.saldo, 500000);
  assert.equal(body.shohibul.length, 2);
  assert.equal(body.shohibul[0].nama, 'Almarhumah Fatimah');
  assert.equal(body.setoran.length, 2);
  assert.equal(body.namaPeserta, 'Siti Aminah');
});

test('GET id tidak ada -> 404', async () => {
  const { status } = await call(GET, { params: { id: '9999' } });
  assert.equal(status, 404);
});

test('PATCH ubah status -> 200, status berubah', async () => {
  const row = await seedPeserta();
  const { status, body } = await call(PATCH, { method: 'PATCH', params: { id: String(row.id) }, body: { status: 'aktif' } });
  assert.equal(status, 200);
  assert.equal(body.status, 'aktif');
});

test('PATCH status tidak valid -> 400', async () => {
  const row = await seedPeserta();
  const { status } = await call(PATCH, { method: 'PATCH', params: { id: String(row.id) }, body: { status: 'ngawur' } });
  assert.equal(status, 400);
});

test('PATCH edit data peserta + normalisasi WA -> 200', async () => {
  const row = await seedPeserta();
  const { status, body } = await call(PATCH, {
    method: 'PATCH',
    params: { id: String(row.id) },
    body: { namaPeserta: 'Siti Aminah Binti Yusuf', whatsapp: '0819998887777' },
  });
  assert.equal(status, 200);
  assert.equal(body.namaPeserta, 'Siti Aminah Binti Yusuf');
  assert.equal(body.whatsapp, '62819998887777');
});

test('PATCH alamat terlalu pendek -> 400', async () => {
  const row = await seedPeserta();
  const { status } = await call(PATCH, { method: 'PATCH', params: { id: String(row.id) }, body: { alamat: 'x' } });
  assert.equal(status, 400);
});

test('DELETE -> 200, peserta + shohibul + setoran terhapus', async () => {
  const row = await seedPeserta();
  await db.insert(qurbanSetoran).values({ pesertaId: row.id, tanggal: new Date(), jumlah: 50000, metodePembayaran: 'qris' });
  const { status, body } = await call(DELETE, { method: 'DELETE', params: { id: String(row.id) } });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal((await db.select().from(qurbanPeserta).where(eq(qurbanPeserta.id, row.id))).length, 0);
  assert.equal((await db.select().from(qurbanShohibul)).length, 0);
  assert.equal((await db.select().from(qurbanSetoran)).length, 0);
});
