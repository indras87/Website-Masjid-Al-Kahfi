import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pengurus } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await db.select().from(pengurus).orderBy(asc(pengurus.id));
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching pengurus:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, role, period, img } = body;

    if (!name || !role || !period || !img) {
      return NextResponse.json({ error: 'Nama, jabatan, periode, dan foto wajib diisi' }, { status: 400 });
    }

    const result = await db.insert(pengurus).values({
      name,
      role,
      period,
      img,
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating pengurus:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
