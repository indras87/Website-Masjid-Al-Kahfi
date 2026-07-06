import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { kontak } from '@/lib/db/schema';
import { getDefaultContactSettings } from '@/lib/cms/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await db.select().from(kontak).orderBy(desc(kontak.id)).limit(1);
    return NextResponse.json(rows[0] || getDefaultContactSettings());
  } catch (error: any) {
    console.error('Error fetching kontak:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { alamat, hotline, email, jamOperasional, googleMapsUrl } = body;

    if (!alamat || !hotline || !email || !jamOperasional || !googleMapsUrl) {
      return NextResponse.json({ error: 'Semua field kontak wajib diisi' }, { status: 400 });
    }

    const existing = await db.select().from(kontak).limit(1);

    const result = existing.length === 0
      ? await db.insert(kontak).values({
          alamat,
          hotline,
          email,
          jamOperasional,
          googleMapsUrl,
        }).returning()
      : await db.update(kontak)
          .set({
            alamat,
            hotline,
            email,
            jamOperasional,
            googleMapsUrl,
            updatedAt: new Date(),
          })
          .where(eq(kontak.id, existing[0].id))
          .returning();

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating kontak:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await db.delete(kontak);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error deleting kontak:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
