# Manajemen Akun Admin — Forgot Password, Change Password, Change Email

**Tanggal:** 2026-07-22
**Status:** Design — menunggu review
**Pendekatan:** A (paket lengkap self-service)

## Ringkasan

Menambahkan tiga kemampuan pada area admin Masjid Al-Kahfi:

1. **Forgot password** (publik, pre-login) — admin yang lupa sandi minta link reset via email, lalu set sandi baru.
2. **Change password** (self-service, terproteksi) — admin yang sedang login mengubah sandinya sendiri.
3. **Change email** (self-service, terproteksi) — admin mengubah emailnya; email baru aktif setelah diverifikasi via email.

Mekanisme ketiganya memakai fitur bawaan better-auth (v1.6.23) — tidak ada plugin tambahan. Semua pengiriman email memakai integrasi Resend yang sudah ada (`lib/email.ts`). Tidak ada perubahan skema DB: tabel `verification` yang sudah ada dipakai better-auth untuk menyimpan token reset & verifikasi beserta expiry-nya.

Model akses: **self-service per admin**. Setiap admin mengubah kredensialnya sendiri dari halaman "Akun Saya". Superadmin tetap mengelola user lain via halaman Users yang sudah ada (tidak diubah dalam spec ini).

## Tujuan & non-tujuan

**Tujuan:**
- Admin bisa memulihkan akses sendiri tanpa intervensi superadmin saat lupa sandi.
- Admin bisa memperbarui sandi & emailnya sendiri secara aman.
- Memanfaatkan Resend untuk semua email transaksional auth.

**Non-tujuan (YAGNI):**
- Superadmin mengubah kredensial user lain dari halaman Users (di luar lingkup).
- 2FA / passkey / magic link.
- Self-registration admin publik (alur pembuatan admin tetap via superadmin / seed).
- Verifikasi email wajib saat login (`requireEmailVerification` tidak diaktifkan).

## Perubahan konfigurasi better-auth (`lib/auth.ts`)

Tambahkan pada config yang sudah ada:

```ts
emailAndPassword: {
  enabled: true,
  autoSignIn: true,
  password: { hash, verify }, // existing, unchanged
  sendResetPassword: async ({ user, url, token }, request) => {
    const resetUrl = `${process.env.APP_URL}/admin/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Atur Ulang Kata Sandi — Masjid Al-Kahfi",
      html: renderResetPasswordEmail({ name: user.name, resetUrl }),
    });
  },
},
user: {
  additionalFields: { role: { /* existing */ } },
  changeEmail: { enabled: true },
},
emailVerification: {
  sendVerificationEmail: async ({ user, url, token }, request) => {
    // `url` menunjuk ke endpoint bawaan better-auth /api/auth/verify-email?token=...
    await sendEmail({
      to: user.email, // alamat email BARU saat flow change-email
      subject: "Verifikasi Email Baru — Masjid Al-Kahfi",
      html: renderVerificationEmail({ name: user.name, verifyUrl: url }),
    });
  },
},
```

Penting:
- `emailVerification` diaktifkan **hanya** untuk mendukung change-email. `requireEmailVerification` **tidak di-set**, sehingga login admin yang sudah ada tidak diblokir.
- Nama method client untuk forgot-password bervariasi antar versi (`forgetPassword` vs `requestPasswordReset`). Saat implementasi, cocokkan dengan method yang tersedia di paket terinstal (`authClient.forgetPassword ?? authClient.requestPasswordReset`).

## Halaman & routing

Semua halaman baru memakai gaya visual yang sudah ada (emerald/gold, `globals.css`, komponen lucide-react), konsisten dengan `app/admin/login/page.tsx`.

### `/admin/forgot-password` (publik)
- Layout mandiri (sama dengan login — di luar `(protected)`), bukan turunan `ProtectedLayout`.
- Form: input email → submit → `authClient.forgetPassword({ email, redirectTo: "/admin/reset-password" })` (atau `requestPasswordReset`).
- Setelah submit, tampilkan pesan sukses generik **tanpa peduli** email terdaftar atau tidak: *"Jika email terdaftar, tautan atur ulang telah dikirim."* Mencegah enumerasi email.
- Link kembali ke login.

### `/admin/reset-password` (publik)
- Baca `token` dari query string (`?token=...`).
- Bila `token` hilang → tampilkan error.
- Form: sandi baru + konfirmasi → `authClient.resetPassword({ newPassword, token })`.
- Validasi sisi klien: panjang minimum (8), kedua input sama.
- Sukses → redirect ke `/admin/login` dengan notifikasi "kata sandi berhasil diubah, silakan login".
- Error token (invalid/expired) → tampilkan pesan jelas + link minta reset ulang.

### `/admin/akun` (terproteksi, dalam `(protected)`)
- Halaman baru "Akun Saya". Bekerja di balik `ProtectedLayout` (butuh sesi).
- Dua kartu/form:

  **Ubah Kata Sandi** (tanpa sandi saat ini)
  - Field: sandi baru + konfirmasi (tidak meminta sandi lama).
  - Submit → POST `/api/account/password` `{ newPassword }`. Route memanggil method server-side better-auth `auth.api.setPassword({ body: { newPassword }, headers })` — menyetel sandi baru tanpa verifikasi sandi lama, tapi mewajibkan sesi aktif (token sesi di headers). Opsi `revokeOtherSessions` untuk memaksa login ulang.
  - Sukses → tampilkan pesan; saran login ulang.

  **Ubah Email**
  - Tampilkan email saat ini (read-only).
  - Field: email baru → `authClient.changeEmail({ newEmail, callbackURL: "/admin/akun" })`.
  - Sukses → pesan *"Tautan verifikasi telah dikirim ke email baru. Email baru aktif setelah diverifikasi."*
  - Email lama tetap aktif sampai email baru diverifikasi.

### Modifikasi halaman login (`app/admin/login/page.tsx`)
- Tambah link "Lupa kata sandi?" di bawah tombol submit → `/admin/forgot-password`.

### Sidebar (`app/admin/components/Sidebar.tsx`)
- Tambah item menu "Akun Saya" → `/admin/akun`.

## Email & template (Resend)

- Tambah helper render di `lib/email.ts` (atau file `lib/email-templates.tsx`):
  - `renderResetPasswordEmail({ name, resetUrl })`
  - `renderVerificationEmail({ name, verifyUrl })`
- Template HTML berbahasa Indonesia, sederhana, menyebut brand Masjid Al-Kahfi, catatan "tautan berlaku 1 jam", dan instruksi mengabaikan bila tidak merasa meminta.
- Link reset dibangun dari `token` + path kita sendiri (kontrol penuh). Link verifikasi memakai `url` yang disediakan better-auth (endpoint `/api/auth/verify-email`).
- Variabel `APP_URL` (sudah ada di `.env.example` / `.env.local`) dipakai untuk membentuk URL absolut sisi server.

## Keamanan

- **Anti enumerasi email:** forgot-password selalu respons sukses generik.
- **Token:** dibuat, disimpan di tabel `verification`, dan diekspos/divalidasi oleh better-auth dengan expiry bawaan (default ~1 jam). Token invalid/expired menghasilkan `?error=INVALID_TOKEN`.
- **Ubah sandi tanpa sandi saat ini:** memakai `auth.api.setPassword` (server-side, butuh sesi aktif). Konsekuensi: siapa pun dengan sesi aktif (mis. browser tak terkunci) dapat mengganti sandi. Diterima karena ini panel admin internal; mitigasi: logout manual + expiry sesi 7 hari yang sudah berlaku.
- **Revoke sesi:** setelah `resetPassword` (dan idealnya `changePassword`), sesi lain di-revoke sehingga memaksa login ulang. Verifikasi perilaku bawaan better-auth saat implementasi; tambahkan revoke eksplisit bila belum otomatis.
- **Rate limit:** endpoint auth better-auth punya rate-limit bawaan — pastikan aktif (default).
- **Validasi input:** panjang & kompleksitas sandi, format email, kesesuaian konfirmasi — di sisi klien dan andal di sisi server via better-auth.

## Edge case & error handling

- Email forgot-password tidak terdaftar → tetap tampil sukses generik.
- Token reset sudah dipakai / kedaluwarsa → pesan jelas + ajakan minta ulang.
- Email baru sudah dipakai akun lain → error dari better-auth ditampilkan (konflik unik).
- User mengganti email lalu logout sebelum verifikasi → email lama tetap aktif; tidak ada akun "menggantung".
- Resend belum dikonfigurasi (`RESEND_API_KEY` kosong) → error jelas di log server; endpoint mengembalikan 500 dengan pesan generik (jangan bocorkan detail).

## File yang terpengaruh

**Berubah:**
- `lib/auth.ts` — tambah `sendResetPassword`, `changeEmail.enabled`, `emailVerification.sendVerificationEmail`.
- `lib/email.ts` (atau baru `lib/email-templates.tsx`) — helper template HTML.
- `app/admin/login/page.tsx` — link "Lupa kata sandi?".
- `app/admin/components/Sidebar.tsx` — menu "Akun Saya".
- `.env.example` — dokumentasi `APP_URL` (sudah ada) dipastikan ada.

**Baru:**
- `app/admin/forgot-password/page.tsx`
- `app/admin/reset-password/page.tsx`
- `app/admin/(protected)/akun/page.tsx`
- `app/api/account/password/route.ts` — ubah sandi tanpa current password via `auth.api.setPassword`.

## Testing

- Unit/integration (mengikuti pola `test/` yang sudah ada, memakai mock Resend):
  - forgot-password selalu 200 bahkan untuk email tak terdaftar.
  - reset-password sukses dengan token valid; gagal dengan token invalid/expired.
  - change-password memvalidasi panjang sandi baru; sukses memperbarui kredensial lewat `auth.api.setPassword`; menolak sandi terlalu pendek/panjang.
  - change-email memicu `sendVerificationEmail` ke email baru; email baru aktif setelah `verifyEmail`.
- Manual: alur penuh end-to-end dengan Resend dev (`onboarding@resend.dev`) ke mailbox nyata.

## Implementasi terbagi (untuk writing-plans)

1. Config better-auth + helper email + template.
2. Halaman forgot-password + reset-password + link di login.
3. Halaman akun (change password + change email) + menu sidebar.
4. Tes + verifikasi manual.
