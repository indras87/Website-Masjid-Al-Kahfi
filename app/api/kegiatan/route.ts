import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { kegiatan } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await db.select().from(kegiatan).orderBy(asc(kegiatan.id));
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching kegiatan:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type, time, ust, status, desc, note, icon, color } = body;

    if (!title || !type || !time || !ust) {
      return NextResponse.json({ error: 'Title, type, time, and ust are required' }, { status: 400 });
    }

    const defaultIcons: Record<string, string> = {
      'Harian': 'CircleUser',
      "Jum'at": 'Mic',
      'Hari Besar': 'Gift',
    };
    const defaultColors: Record<string, string> = {
      'Harian': 'bg-emerald-50 text-emerald-800',
      "Jum'at": 'bg-gold-100 text-gold-800',
      'Hari Besar': 'bg-emerald-900 text-gold-300',
    };

    const finalIcon = icon || defaultIcons[type] || 'CalendarCheck';
    const finalColor = color || defaultColors[type] || 'bg-emerald-50 text-emerald-800';

    const result = await db.insert(kegiatan).values({
      title,
      type,
      time,
      ust,
      status: status || 'Aktif',
      desc: desc || '',
      note: note || '',
      icon: finalIcon,
      color: finalColor,
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating kegiatan:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
