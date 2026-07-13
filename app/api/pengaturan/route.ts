import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pengaturan, user } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { DEFAULT_RUNNING_TEXT } from '@/lib/cms/settings';
import { inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await db.select().from(pengaturan).where(eq(pengaturan.key, 'running_text')).limit(1);

    // Resolve updater name if exists
    let updatedByName = null;
    if (rows[0]?.updatedById) {
      const users = await db.select({ name: user.name }).from(user).where(eq(user.id, rows[0].updatedById));
      updatedByName = users[0]?.name ?? null;
    }

    return NextResponse.json({
      running_text: rows[0]?.value ?? DEFAULT_RUNNING_TEXT,
      updatedAt: rows[0]?.updatedAt ?? null,
      updatedByName: updatedByName,
    });
  } catch (error: any) {
    console.error('Error fetching pengaturan:', error);
    return NextResponse.json({ running_text: DEFAULT_RUNNING_TEXT, updatedAt: null, updatedByName: null });
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

    const actor = session?.user ? { id: session.user.id, name: session.user.name ?? null } : null;

    const existing = await db.select().from(pengaturan).where(eq(pengaturan.key, 'running_text')).limit(1);
    const result =
      existing.length === 0
        ? await db.insert(pengaturan).values({
            key: 'running_text',
            value: running_text,
            createdById: actor?.id ?? null,
            updatedById: actor?.id ?? null,
            updatedAt: new Date(),
          }).returning()
        : await db
            .update(pengaturan)
            .set({
              value: running_text,
              updatedById: actor?.id ?? null,
              updatedAt: new Date(),
            })
            .where(eq(pengaturan.key, 'running_text'))
            .returning();

    return NextResponse.json({ running_text: result[0].value });
  } catch (error: any) {
    console.error('Error updating pengaturan:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
