import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { berita } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, tag, author, img, desc: description } = body;

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const result = await db.update(berita)
      .set({
        title,
        tag,
        author,
        img,
        desc: description,
      })
      .where(eq(berita.id, numericId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Berita not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating berita:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

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

    const result = await db.delete(berita)
      .where(eq(berita.id, numericId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Berita not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Berita deleted successfully', deleted: result[0] });
  } catch (error: any) {
    console.error('Error deleting berita:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
