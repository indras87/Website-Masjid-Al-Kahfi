import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pengurus } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, role, period, img } = body;

    if (!name || !role || !period || !img) {
      return NextResponse.json({ error: 'Nama, jabatan, periode, dan foto wajib diisi' }, { status: 400 });
    }

    const result = await db.update(pengurus)
      .set({ name, role, period, img })
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
