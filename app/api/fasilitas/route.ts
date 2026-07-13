import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fasilitas } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { withActorNames, getActor } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await db.select().from(fasilitas).orderBy(asc(fasilitas.id));
    return NextResponse.json(await withActorNames(data));
  } catch (error: any) {
    console.error('Error fetching fasilitas:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, desc: description, icon } = body;

    if (!title || !description || !icon) {
      return NextResponse.json({ error: 'Nama fasilitas, deskripsi, dan ikon wajib diisi' }, { status: 400 });
    }

    const actor = await getActor();

    const result = await db.insert(fasilitas).values({
      title,
      desc: description,
      icon,
      createdById: actor?.id ?? null,
      updatedById: actor?.id ?? null,
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating fasilitas:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
