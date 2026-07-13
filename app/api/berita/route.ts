import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { berita } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateSlug } from '@/lib/slug';
import { withActorNames, getActor } from '@/lib/audit';
import { getAllBerita } from '@/lib/queries/content';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getAllBerita();
    return NextResponse.json(await withActorNames(data));
  } catch (error: any) {
    console.error('Error fetching berita:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, tag, author, img, desc: description, date, content } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const actor = await getActor();

    const options = { day: 'numeric', month: 'long', year: 'numeric' } as const;
    const formattedDate = date || new Date().toLocaleDateString('id-ID', options);

    const result = await db.insert(berita).values({
      title,
      tag: tag || 'Sosial',
      author: author || 'Admin',
      img: img || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300',
      desc: description,
      content: content || description,
      date: formattedDate,
      createdById: actor?.id ?? null,
      updatedById: actor?.id ?? null,
      updatedAt: new Date(),
    }).returning();

    const inserted = result[0];
    const slug = generateSlug(inserted.title, inserted.id);

    await db.update(berita).set({ slug }).where(eq(berita.id, inserted.id));

    return NextResponse.json({ ...inserted, slug }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating berita:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
