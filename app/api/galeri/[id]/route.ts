import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { galeri } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/** Menghapus foto galeri berdasarkan ID (DELETE). */
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

    const result = await db.delete(galeri)
      .where(eq(galeri.id, numericId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Galeri not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Foto deleted successfully', deleted: result[0] });
  } catch (error: any) {
    console.error('Error deleting galeri:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
