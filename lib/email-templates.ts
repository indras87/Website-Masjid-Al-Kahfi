/** Template HTML berbahasa Indonesia untuk email transaksional auth. Pure functions. */

export interface EmailTemplateInput {
  name?: string | null;
  url: string;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

function shell(content: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<body style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;margin:0;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;border-top:4px solid #d4af37;padding:32px;">
    <h1 style="color:#064e3b;font-size:20px;margin:0 0 16px;">Masjid Al-Kahfi Cikoneng</h1>
    ${content}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p style="color:#6b7280;font-size:12px;margin:0;">Email ini dikirim otomatis. Abaikan jika Anda tidak merasa memintanya.</p>
  </div>
</body>
</html>`;
}

/** Merender email berisi tautan atur ulang kata sandi. */
export function renderResetPasswordEmail({ name, url }: EmailTemplateInput): string {
  const safeName = escapeHtml(name || 'Admin');
  return shell(`
    <p style="color:#374151;font-size:15px;margin:0 0 8px;">Halo <strong>${safeName}</strong>,</p>
    <p style="color:#374151;font-size:15px;margin:0 0 16px;">Klik tombol di bawah untuk mengatur ulang kata sandi Anda. Tautan berlaku 1 jam.</p>
    <p style="margin:0 0 16px;">
      <a href="${url}" style="display:inline-block;background:#064e3b;color:#fef3c7;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:12px;">Atur Ulang Kata Sandi</a>
    </p>
    <p style="color:#6b7280;font-size:13px;margin:0;">Jika tombol tidak berfungsi, salin tautan ini: ${url}</p>
  `);
}

/** Merender email verifikasi (untuk email baru saat change-email). */
export function renderVerificationEmail({ name, url }: EmailTemplateInput): string {
  const safeName = escapeHtml(name || 'Admin');
  return shell(`
    <p style="color:#374151;font-size:15px;margin:0 0 8px;">Halo <strong>${safeName}</strong>,</p>
    <p style="color:#374151;font-size:15px;margin:0 0 16px;">Konfirmasi alamat email baru Anda dengan menekan tombol di bawah.</p>
    <p style="margin:0 0 16px;">
      <a href="${url}" style="display:inline-block;background:#064e3b;color:#fef3c7;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:12px;">Verifikasi Email</a>
    </p>
    <p style="color:#6b7280;font-size:13px;margin:0;">Jika tombol tidak berfungsi, salin tautan ini: ${url}</p>
  `);
}
