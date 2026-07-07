import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { berita } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await db.select().from(berita).orderBy(desc(berita.createdAt));
    return NextResponse.json(data);
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
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating berita:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
