import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { profilMasjid } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await db.select().from(profilMasjid);
    if (data.length === 0) {
      return NextResponse.json({
        visi: '',
        misi: '',
        history: ''
      });
    }
    return NextResponse.json(data[0]);
  } catch (error: any) {
    console.error('Error fetching profil:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { visi, misi, history } = body;

    if (!visi || !misi) {
      return NextResponse.json({ error: 'Visi dan Misi wajib diisi' }, { status: 400 });
    }

    // Ambil data profil pertama (ID tunggal)
    const existing = await db.select().from(profilMasjid).limit(1);

    let result;
    if (existing.length === 0) {
      // Masukkan baru jika belum ada sama sekali
      result = await db.insert(profilMasjid).values({
        visi,
        misi,
        history: history || ''
      }).returning();
    } else {
      // Perbarui jika sudah ada
      result = await db.update(profilMasjid)
        .set({ visi, misi, history: history || '', updatedAt: new Date() })
        .where(eq(profilMasjid.id, existing[0].id))
        .returning();
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating profil:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
