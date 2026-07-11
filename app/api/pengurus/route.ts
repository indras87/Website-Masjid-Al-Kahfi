import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pengurus } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const VALID_TINGKAT = ['pembina', 'penasehat', 'pimpinan', 'idarah', 'imarah', 'riayah'] as const;

export async function GET() {
  try {
    const data = await db.select().from(pengurus).orderBy(asc(pengurus.tingkat), asc(pengurus.urutan));
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching pengurus:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, foto, tingkat, jabatan, subBidang, urutan } = body;

    if (!nama || !foto || !tingkat) {
      return NextResponse.json({ error: 'Nama, foto, dan tingkat wajib diisi' }, { status: 400 });
    }

    if (!VALID_TINGKAT.includes(tingkat)) {
      return NextResponse.json({ error: 'Tingkat tidak valid' }, { status: 400 });
    }

    const result = await db.insert(pengurus).values({
      nama,
      foto,
      tingkat,
      jabatan: jabatan || null,
      subBidang: subBidang || null,
      urutan: typeof urutan === 'number' ? urutan : 0,
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating pengurus:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
