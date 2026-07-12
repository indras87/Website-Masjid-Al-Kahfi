import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pengaturan } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { DEFAULT_RUNNING_TEXT } from '@/lib/cms/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await db.select().from(pengaturan).where(eq(pengaturan.key, 'running_text')).limit(1);
    return NextResponse.json({ running_text: rows[0]?.value ?? DEFAULT_RUNNING_TEXT });
  } catch (error: any) {
    console.error('Error fetching pengaturan:', error);
    return NextResponse.json({ running_text: DEFAULT_RUNNING_TEXT });
  }
}

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session ?? null;
}

export async function PUT(request: Request) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const running_text = typeof body?.running_text === 'string' ? body.running_text : '';

    if (running_text.trim().length === 0) {
      return NextResponse.json({ error: 'Teks berjalan tidak boleh kosong' }, { status: 400 });
    }

    const existing = await db.select().from(pengaturan).where(eq(pengaturan.key, 'running_text')).limit(1);
    const result =
      existing.length === 0
        ? await db.insert(pengaturan).values({ key: 'running_text', value: running_text }).returning()
        : await db
            .update(pengaturan)
            .set({ value: running_text, updatedAt: new Date() })
            .where(eq(pengaturan.key, 'running_text'))
            .returning();

    return NextResponse.json({ running_text: result[0].value });
  } catch (error: any) {
    console.error('Error updating pengaturan:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
