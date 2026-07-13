import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fasilitas } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getActor } from '@/lib/audit';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, desc: description, icon } = body;

    if (!title || !description || !icon) {
      return NextResponse.json({ error: 'Nama fasilitas, deskripsi, dan ikon wajib diisi' }, { status: 400 });
    }

    const actor = await getActor();

    const result = await db.update(fasilitas)
      .set({
        title,
        desc: description,
        icon,
        updatedById: actor?.id ?? null,
        updatedAt: new Date(),
      })
      .where(eq(fasilitas.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Fasilitas tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating fasilitas:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await db.delete(fasilitas)
      .where(eq(fasilitas.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Fasilitas tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Fasilitas berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting fasilitas:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
