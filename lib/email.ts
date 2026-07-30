import { Resend } from 'resend';

/**
 * Klien Resend singleton.
 * API key dibaca dari RESEND_API_KEY (jangan hardcode di source).
 */
let client: Resend | null = null;

/** Mengembalikan instance Resend, atau throw bila API key belum dikonfigurasi. */
export function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY belum dikonfigurasi. Tambahkan di .env.local');
  }
  if (!client) {
    client = new Resend(apiKey);
  }
  return client;
}

/** Domain "from" default (sesuaikan dengan domain terverifikasi di Resend). */
export const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

export interface SendEmailInput {
  from?: string;
  to: string;
  subject: string;
  html: string;
}

/** Mengirim email lewat Resend. */
export async function sendEmail({ from, to, subject, html }: SendEmailInput) {
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: from ?? DEFAULT_FROM,
    to,
    subject,
    html,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
