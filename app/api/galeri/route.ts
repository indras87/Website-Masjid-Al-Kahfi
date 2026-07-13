import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { galeri } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { withActorNames, getActor } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/** Mengambil daftar foto galeri terbaru (GET). */
export async function GET() {
  try {
    const data = await db.select().from(galeri).orderBy(desc(galeri.id));
    return NextResponse.json(await withActorNames(data));
  } catch (error: any) {
    console.error('Error fetching galeri:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/** Menambahkan foto ke galeri baru (POST). */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, img } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const actor = await getActor();

    const defaultImages = [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=300',
    ];
    const finalImg = img || defaultImages[Math.floor(Math.random() * defaultImages.length)];

    const result = await db.insert(galeri).values({
      title,
      img: finalImg,
      createdById: actor?.id ?? null,
      updatedById: actor?.id ?? null,
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating galeri:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
