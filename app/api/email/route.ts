import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/** Mengirim email pengujian via Resend (POST). */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      from,
      to = 'indras87@gmail.com',
      subject = 'Hello World',
      html = '<p>Congrats on sending your <strong>first email</strong>!</p>',
    } = body;

    if (!to) {
      return NextResponse.json({ error: 'Field "to" wajib diisi' }, { status: 400 });
    }

    const data = await sendEmail({ from, to, subject, html });
    return NextResponse.json({ ok: true, id: data?.id });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
