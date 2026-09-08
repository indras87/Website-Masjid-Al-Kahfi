import assert from 'node:assert/strict';
import { test, describe, after, beforeEach } from 'node:test';
import { auth } from '../../lib/auth';
import { GET as GET_LIST, POST as POST_PESERTA } from '../../app/api/qurban-peserta/route';
import {
  GET as GET_DETAIL,
  PATCH as PATCH_PESERTA,
  DELETE as DELETE_PESERTA,
} from '../../app/api/qurban-peserta/[id]/route';
import { POST as POST_SHOHIBUL } from '../../app/api/qurban-shohibul/route';
import {
  PATCH as PATCH_SHOHIBUL,
  DELETE as DELETE_SHOHIBUL,
} from '../../app/api/qurban-shohibul/[id]/route';
import { GET as GET_SETORAN, POST as POST_SETORAN } from '../../app/api/qurban-setoran/route';
import {
  PATCH as PATCH_SETORAN,
  DELETE as DELETE_SETORAN,
} from '../../app/api/qurban-setoran/[id]/route';
import { call } from '../helpers/request';
import { reset, closeDb, db } from '../helpers/db';
import { qurbanPeserta, qurbanShohibul, qurbanSetoran, user } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';

// SATU file untuk seluruh test API qurban: runner node:test mengeksekusi
// antar-FILE secara paralel pada satu database, jadi 4 file terpisah yang
// sama-sama reset tabel qurban_* saling serang (FK violation acak). Dalam satu
// file, test berjalan serial -> deterministik (tanpa mengubah paralelisme
// file test lainnya).
let currentSession: any = null;
(auth.api as any).getSession = async () => currentSession;

beforeEach(async () => {
  currentSession = null;
  // User mock 'u1' untuk FK created_by_id/updated_by_id pada operasi admin
  // (pola test/api/pengaturan.test.ts). onConflictDoNothing aman bila baris sudah ada.
  await db
    .insert(user)
    .values({ id: 'u1', email: 'u1@test.local', name: 'Admin', role: 'admin' })
    .onConflictDoNothing();
  await reset(qurbanSetoran, qurbanShohibul, qurbanPeserta);
});
after(closeDb);

const validDaftar = {
  namaPeserta: 'Ahmad Fulan',
  alamat: 'Jl. Merdeka No. 1, Bandung',
  whatsapp: '081234567890',
  namaBank: 'BSI',
  nomorRekening: '7011223344',
  namaPemilikRekening: 'AHMAD FULAN',
  periode: '2027',
  shohibul: ['Ahmad Fulan'],
};

/** Seed peserta "Siti Aminah" + 2 shohibul (fixture detail peserta). */
async function seedPesertaSiti() {
  const [row] = await db
    .insert(qurbanPeserta)
    .values({
      namaPeserta: 'Siti Aminah',
      alamat: 'Jl. Kenanga No. 9',
      whatsapp: '628111222333',
      namaBank: 'BRI',
      nomorRekening: '0099887766',
      namaPemilikRekening: 'SITI AMINAH',
      periode: '2027',
    })
    .returning();
  await db.insert(qurbanShohibul).values([
    { pesertaId: row.id, nama: 'Almarhumah Fatimah', urutan: 0 },
    { pesertaId: row.id, nama: 'Almarhum Ahmad', urutan: 1 },
  ]);
  return row;
}

describe('POST/GET /api/qurban-peserta — pendaftaran publik & list admin', () => {
  test('POST publik valid (1 shohibul) -> 200, status baru, WA dinormalisasi', async () => {
    const { status, body } = await call(POST_PESERTA, { method: 'POST', body: validDaftar });
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
    const { body } = await call(POST_PESERTA, {
      method: 'POST',
      body: { ...validDaftar, shohibul: ['Ahmad Fulan', 'Fatimah', 'Almarhum Abdullah'] },
    });
    const sh = await db.select().from(qurbanShohibul);
    assert.equal(sh.length, 3);
    assert.deepEqual(
      sh.sort((a, b) => a.urutan - b.urutan).map((s) => s.nama),
      ['Ahmad Fulan', 'Fatimah', 'Almarhum Abdullah']
    );
  });

  test('POST tanpa shohibul -> 400', async () => {
    const { status } = await call(POST_PESERTA, { method: 'POST', body: { ...validDaftar, shohibul: [] } });
    assert.equal(status, 400);
  });

  test('POST nama shohibul terlalu pendek -> 400', async () => {
    const { status } = await call(POST_PESERTA, { method: 'POST', body: { ...validDaftar, shohibul: ['Ab'] } });
    assert.equal(status, 400);
  });

  test('POST WhatsApp tidak valid -> 400', async () => {
    const { status } = await call(POST_PESERTA, { method: 'POST', body: { ...validDaftar, whatsapp: '123' } });
    assert.equal(status, 400);
  });

  test('POST field wajib kosong -> 400', async () => {
    const { status } = await call(POST_PESERTA, { method: 'POST', body: { ...validDaftar, namaBank: '' } });
    assert.equal(status, 400);
  });

  test('POST periode bukan 4 digit -> 400', async () => {
    const { status } = await call(POST_PESERTA, { method: 'POST', body: { ...validDaftar, periode: '2x27' } });
    assert.equal(status, 400);
  });

  test('GET tanpa sesi -> 401', async () => {
    const { status } = await call(GET_LIST);
    assert.equal(status, 401);
  });

  test('GET dengan sesi -> list + saldo agregat + daftar shohibul', async () => {
    const { body: created } = await call(POST_PESERTA, {
      method: 'POST',
      body: { ...validDaftar, shohibul: ['Ahmad Fulan', 'Fatimah'] },
    });
    await db.insert(qurbanSetoran).values({
      pesertaId: created.id,
      tanggal: new Date(),
      jumlah: 100000,
      metodePembayaran: 'tunai_sekretariat',
    });
    currentSession = { user: { id: 'u1', name: 'Admin' } };
    const { status, body } = await call(GET_LIST);
    assert.equal(status, 200);
    assert.equal(body.length, 1);
    assert.equal(body[0].saldo, 100000);
    assert.deepEqual(body[0].shohibul.sort(), ['Ahmad Fulan', 'Fatimah']);
  });
});

describe('GET/PATCH/DELETE /api/qurban-peserta/[id] — detail peserta (admin)', () => {
  beforeEach(() => {
    currentSession = { user: { id: 'u1', name: 'Admin' } };
  });

  test('GET tanpa sesi -> 401', async () => {
    currentSession = null;
    const row = await seedPesertaSiti();
    const { status } = await call(GET_DETAIL, { params: { id: String(row.id) } });
    assert.equal(status, 401);
  });

  test('GET admin -> detail + saldo + shohibul + riwayat setoran', async () => {
    const row = await seedPesertaSiti();
    await db.insert(qurbanSetoran).values([
      { pesertaId: row.id, tanggal: new Date('2026-01-10'), jumlah: 200000, metodePembayaran: 'transfer_bank' },
      { pesertaId: row.id, tanggal: new Date('2026-02-10'), jumlah: 300000, metodePembayaran: 'qris' },
    ]);
    const { status, body } = await call(GET_DETAIL, { params: { id: String(row.id) } });
    assert.equal(status, 200);
    assert.equal(body.saldo, 500000);
    assert.equal(body.shohibul.length, 2);
    assert.equal(body.shohibul[0].nama, 'Almarhumah Fatimah');
    assert.equal(body.setoran.length, 2);
    assert.equal(body.namaPeserta, 'Siti Aminah');
  });

  test('GET id tidak ada -> 404', async () => {
    const { status } = await call(GET_DETAIL, { params: { id: '9999' } });
    assert.equal(status, 404);
  });

  test('PATCH ubah status -> 200, status berubah', async () => {
    const row = await seedPesertaSiti();
    const { status, body } = await call(PATCH_PESERTA, {
      method: 'PATCH',
      params: { id: String(row.id) },
      body: { status: 'aktif' },
    });
    assert.equal(status, 200);
    assert.equal(body.status, 'aktif');
  });

  test('PATCH status tidak valid -> 400', async () => {
    const row = await seedPesertaSiti();
    const { status } = await call(PATCH_PESERTA, {
      method: 'PATCH',
      params: { id: String(row.id) },
      body: { status: 'ngawur' },
    });
    assert.equal(status, 400);
  });

  test('PATCH edit data peserta + normalisasi WA -> 200', async () => {
    const row = await seedPesertaSiti();
    const { status, body } = await call(PATCH_PESERTA, {
      method: 'PATCH',
      params: { id: String(row.id) },
      body: { namaPeserta: 'Siti Aminah Binti Yusuf', whatsapp: '0819998887777' },
    });
    assert.equal(status, 200);
    assert.equal(body.namaPeserta, 'Siti Aminah Binti Yusuf');
    assert.equal(body.whatsapp, '62819998887777');
  });

  test('PATCH alamat terlalu pendek -> 400', async () => {
    const row = await seedPesertaSiti();
    const { status } = await call(PATCH_PESERTA, {
      method: 'PATCH',
      params: { id: String(row.id) },
      body: { alamat: 'x' },
    });
    assert.equal(status, 400);
  });

  test('DELETE -> 200, peserta + shohibul + setoran terhapus', async () => {
    const row = await seedPesertaSiti();
    await db
      .insert(qurbanSetoran)
      .values({ pesertaId: row.id, tanggal: new Date(), jumlah: 50000, metodePembayaran: 'qris' });
    const { status, body } = await call(DELETE_PESERTA, {
      method: 'DELETE',
      params: { id: String(row.id) },
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.equal((await db.select().from(qurbanPeserta).where(eq(qurbanPeserta.id, row.id))).length, 0);
    assert.equal((await db.select().from(qurbanShohibul)).length, 0);
    assert.equal((await db.select().from(qurbanSetoran)).length, 0);
  });
});

// Fixture bersama untuk kelola shohibul & setoran: peserta "Budi Santoso".
let pesertaId: number;

async function seedPesertaBudi() {
  const [row] = await db
    .insert(qurbanPeserta)
    .values({
      namaPeserta: 'Budi Santoso',
      alamat: 'Jl. Mawar No. 4',
      whatsapp: '628123456789',
      namaBank: 'Mandiri',
      nomorRekening: '1122334455',
      namaPemilikRekening: 'BUDI SANTOSO',
      periode: '2027',
    })
    .returning();
  pesertaId = row.id;
}

describe('POST/PATCH/DELETE /api/qurban-shohibul — kelola shohibul (admin)', () => {
  beforeEach(async () => {
    currentSession = { user: { id: 'u1', name: 'Admin' } };
    await seedPesertaBudi();
  });

  test('POST tanpa sesi -> 401', async () => {
    currentSession = null;
    const { status } = await call(POST_SHOHIBUL, { method: 'POST', body: { pesertaId, nama: 'Fatimah' } });
    assert.equal(status, 401);
  });

  test('POST valid -> 200, tersimpan', async () => {
    const { status, body } = await call(POST_SHOHIBUL, { method: 'POST', body: { pesertaId, nama: 'Fatimah' } });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    const rows = await db.select().from(qurbanShohibul).where(eq(qurbanShohibul.pesertaId, pesertaId));
    assert.equal(rows.length, 1);
    assert.equal(rows[0].nama, 'Fatimah');
  });

  test('POST peserta tidak ada -> 400', async () => {
    const { status } = await call(POST_SHOHIBUL, { method: 'POST', body: { pesertaId: 9999, nama: 'Fatimah' } });
    assert.equal(status, 400);
  });

  test('POST nama terlalu pendek -> 400', async () => {
    const { status } = await call(POST_SHOHIBUL, { method: 'POST', body: { pesertaId, nama: 'Ab' } });
    assert.equal(status, 400);
  });

  test('PATCH ubah nama -> 200', async () => {
    const [sh] = await db.insert(qurbanShohibul).values({ pesertaId, nama: 'Fatimah', urutan: 0 }).returning();
    const { status, body } = await call(PATCH_SHOHIBUL, {
      method: 'PATCH',
      params: { id: String(sh.id) },
      body: { nama: 'Fatimah Binti Abdullah' },
    });
    assert.equal(status, 200);
    assert.equal(body.nama, 'Fatimah Binti Abdullah');
  });

  test('DELETE shohibul terakhir -> 400 (ditolak)', async () => {
    const [sh] = await db.insert(qurbanShohibul).values({ pesertaId, nama: 'Fatimah', urutan: 0 }).returning();
    const { status } = await call(DELETE_SHOHIBUL, { method: 'DELETE', params: { id: String(sh.id) } });
    assert.equal(status, 400);
  });

  test('DELETE salah satu dari 2 shohibul -> 200', async () => {
    const [sh1] = await db.insert(qurbanShohibul).values({ pesertaId, nama: 'Fatimah', urutan: 0 }).returning();
    await db.insert(qurbanShohibul).values({ pesertaId, nama: 'Abdullah', urutan: 1 });
    const { status, body } = await call(DELETE_SHOHIBUL, { method: 'DELETE', params: { id: String(sh1.id) } });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    const rows = await db.select().from(qurbanShohibul).where(eq(qurbanShohibul.pesertaId, pesertaId));
    assert.equal(rows.length, 1);
    assert.equal(rows[0].nama, 'Abdullah');
  });
});

describe('POST/GET/PATCH/DELETE /api/qurban-setoran — pencatatan setoran (admin)', () => {
  beforeEach(async () => {
    currentSession = { user: { id: 'u1', name: 'Admin' } };
    await seedPesertaBudi();
  });

  const validSetoran = () => ({
    pesertaId,
    tanggal: '2026-03-15',
    jumlah: 250000,
    metodePembayaran: 'tunai_sekretariat',
    keterangan: 'Setoran Maret',
  });

  test('POST tanpa sesi -> 401', async () => {
    currentSession = null;
    const { status } = await call(POST_SETORAN, { method: 'POST', body: validSetoran() });
    assert.equal(status, 401);
  });

  test('POST valid -> 200, tersimpan', async () => {
    const { status, body } = await call(POST_SETORAN, { method: 'POST', body: validSetoran() });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    const rows = await db.select().from(qurbanSetoran);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].jumlah, 250000);
  });

  test('POST jumlah <= 0 -> 400', async () => {
    const { status } = await call(POST_SETORAN, { method: 'POST', body: { ...validSetoran(), jumlah: 0 } });
    assert.equal(status, 400);
  });

  test('POST peserta tidak ada -> 400', async () => {
    const { status } = await call(POST_SETORAN, { method: 'POST', body: { ...validSetoran(), pesertaId: 9999 } });
    assert.equal(status, 400);
  });

  test('POST metode tidak valid -> 400', async () => {
    const { status } = await call(POST_SETORAN, {
      method: 'POST',
      body: { ...validSetoran(), metodePembayaran: 'gojek' },
    });
    assert.equal(status, 400);
  });

  test('GET ?pesertaId -> riwayat urut tanggal desc + nama peserta', async () => {
    await db.insert(qurbanSetoran).values([
      { pesertaId, tanggal: new Date('2026-01-10'), jumlah: 100000, metodePembayaran: 'qris' },
      { pesertaId, tanggal: new Date('2026-02-10'), jumlah: 200000, metodePembayaran: 'qris' },
    ]);
    const res = await GET_SETORAN(new Request(`http://localhost/api/qurban-setoran?pesertaId=${pesertaId}`));
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.length, 2);
    assert.equal(body[0].jumlah, 200000); // desc
    assert.equal(body[0].namaPeserta, 'Budi Santoso');
  });

  test('PATCH ubah jumlah -> 200', async () => {
    const [row] = await db
      .insert(qurbanSetoran)
      .values({ pesertaId, tanggal: new Date(), jumlah: 100000, metodePembayaran: 'qris' })
      .returning();
    const { status, body } = await call(PATCH_SETORAN, {
      method: 'PATCH',
      params: { id: String(row.id) },
      body: { jumlah: 150000 },
    });
    assert.equal(status, 200);
    assert.equal(body.jumlah, 150000);
  });

  test('DELETE -> 200', async () => {
    const [row] = await db
      .insert(qurbanSetoran)
      .values({ pesertaId, tanggal: new Date(), jumlah: 100000, metodePembayaran: 'qris' })
      .returning();
    const { status, body } = await call(DELETE_SETORAN, { method: 'DELETE', params: { id: String(row.id) } });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
  });
});
