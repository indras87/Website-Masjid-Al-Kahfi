import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pengurus } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const VALID_TINGKAT = ['pembina', 'penasehat', 'pimpinan', 'idarah', 'imarah', 'riayah'] as const;

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nama, foto, tingkat, jabatan, subBidang, urutan } = body;

    if (!nama || !foto || !tingkat) {
      return NextResponse.json({ error: 'Nama, foto, dan tingkat wajib diisi' }, { status: 400 });
    }

    if (!VALID_TINGKAT.includes(tingkat)) {
      return NextResponse.json({ error: 'Tingkat tidak valid' }, { status: 400 });
    }

    const result = await db.update(pengurus)
      .set({
        nama,
        foto,
        tingkat,
        jabatan: jabatan || null,
        subBidang: subBidang || null,
        urutan: typeof urutan === 'number' ? urutan : 0,
      })
      .where(eq(pengurus.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Data pengurus tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating pengurus:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await db.delete(pengurus)
      .where(eq(pengurus.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Data pengurus tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Data pengurus berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting pengurus:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
