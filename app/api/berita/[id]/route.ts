import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { berita } from '@/lib/db/schema';
import { eq, like, and, ne } from 'drizzle-orm';
import { generateSlug, slugify, uniqueSlug } from '@/lib/slug';
import { withActorNames, getActor } from '@/lib/audit';

/**
 * Mengambil detail berita. Parameter route `[id]` dapat berupa:
 * - id numerik (mis. `5`) untuk admin, atau
 * - slug (mis. `kajian-akbar-keluarga-sakinah`).
 * Kompatibel dengan slug bentuk lama `judul-123` (id diekstrak dari sufiks).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await resolveBerita(id);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Berita not found' }, { status: 404 });
    }

    const enriched = await withActorNames(result);
    const item = enriched[0];
    const slug = item.slug || generateSlug(item.title, item.id);

    return NextResponse.json({ ...item, slug });
  } catch (error: any) {
    console.error('Error fetching berita:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Mencari satu baris berita dari nilai route. Mencoba numeric id lebih dulu,
 * lalu slug eksak, lalu slug bentuk lama yang berakhiran `-id`.
 */
async function resolveBerita(id: string) {
  const numericId = parseInt(id, 10);
  if (!isNaN(numericId) && String(numericId) === id) {
    return db.select().from(berita).where(eq(berita.id, numericId)).limit(1);
  }

  // slug eksak
  const bySlug = await db.select().from(berita).where(eq(berita.slug, id)).limit(1);
  if (bySlug.length > 0) return bySlug;

  // kompatibilitas slug lama: "judul-123"
  const trailing = id.match(/-(\d+)$/);
  if (trailing) {
    const oldId = parseInt(trailing[1], 10);
    return db.select().from(berita).where(eq(berita.id, oldId)).limit(1);
  }

  return [];
}

/** Memperbarui data berita berdasarkan ID (PUT). */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, tag, author, img, desc: description, content } = body;

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const actor = await getActor();

    const base = slugify(title);
    const conflicts = await db
      .select({ slug: berita.slug })
      .from(berita)
      .where(and(like(berita.slug, `${base}%`), ne(berita.id, numericId)));
    const slug = uniqueSlug(base, conflicts.map((c) => c.slug).filter(Boolean) as string[]);

    const result = await db.update(berita)
      .set({
        title,
        tag,
        author,
        img,
        desc: description,
        content: content || description,
        slug,
        updatedById: actor?.id ?? null,
        updatedAt: new Date(),
      })
      .where(eq(berita.id, numericId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Berita not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating berita:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/** Menghapus berita berdasarkan ID (DELETE). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const result = await db.delete(berita)
      .where(eq(berita.id, numericId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Berita not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Berita deleted successfully', deleted: result[0] });
  } catch (error: any) {
    console.error('Error deleting berita:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
