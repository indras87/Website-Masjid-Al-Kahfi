import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { donasi } from '@/lib/db/schema';
import { getDefaultDonationSettings } from '@/lib/cms/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await db.select().from(donasi).orderBy(desc(donasi.id)).limit(1);
    return NextResponse.json(rows[0] || getDefaultDonationSettings());
  } catch (error: any) {
    console.error('Error fetching donasi:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { namaRekening, nomorRekening, atasNamaRekening, qrisImage } = body;

    if (!namaRekening || !nomorRekening || !atasNamaRekening || !qrisImage) {
      return NextResponse.json({ error: 'Semua field donasi wajib diisi' }, { status: 400 });
    }

    const existing = await db.select().from(donasi).limit(1);

    const result = existing.length === 0
      ? await db.insert(donasi).values({
          namaRekening,
          nomorRekening,
          atasNamaRekening,
          qrisImage,
        }).returning()
      : await db.update(donasi)
          .set({
            namaRekening,
            nomorRekening,
            atasNamaRekening,
            qrisImage,
            updatedAt: new Date(),
          })
          .where(eq(donasi.id, existing[0].id))
          .returning();

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating donasi:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await db.delete(donasi);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error deleting donasi:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
