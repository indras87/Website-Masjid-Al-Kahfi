import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { kegiatan } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { withActorNames, getActor } from '@/lib/audit';

/** Memperbarui data kegiatan berdasarkan ID (PUT). */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, type, time, ust, status, desc, note, icon, color, img, featured } = body;

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const actor = await getActor();

    const result = await db.update(kegiatan)
      .set({
        title,
        type,
        time,
        ust,
        status,
        desc,
        note,
        icon,
        color,
        img: img || null,
        featured: featured ?? false,
        updatedById: actor?.id ?? null,
        updatedAt: new Date(),
      })
      .where(eq(kegiatan.id, numericId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Kegiatan not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating kegiatan:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/** Menghapus kegiatan berdasarkan ID (DELETE). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const result = await db.delete(kegiatan)
      .where(eq(kegiatan.id, numericId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Kegiatan not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Kegiatan deleted successfully', deleted: result[0] });
  } catch (error: any) {
    console.error('Error deleting kegiatan:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
