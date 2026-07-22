import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { auth, hashPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { account } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

/**
 * Mengubah kata sandi admin yang sedang login tanpa kata sandi saat ini.
 *
 * Catatan: `auth.api.setPassword` hanya untuk set password pertama kali
 * (menolak bila credential account sudah punya password). Karena itu kita
 * mengganti langsung password pada credential account, sama seperti internal
 * changePassword better-auth, memakai hasher yang sama (hashPassword).
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { newPassword } = body;

    if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter` },
        { status: 400 }
      );
    }
    if (newPassword.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json({ error: 'Kata sandi terlalu panjang' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(newPassword);

    const updated = await db
      .update(account)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(and(eq(account.userId, session.user.id), eq(account.providerId, 'credential')))
      .returning({ id: account.id });

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Akun kredensial tidak ditemukan untuk pengguna ini' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
