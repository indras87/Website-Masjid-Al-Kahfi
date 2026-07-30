# Manajemen Akun Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambah forgot password, change password (tanpa sandi saat ini), dan change email untuk admin pada area admin Masjid Al-Kahfi.

**Architecture:** Pakai fitur bawaan better-auth (v1.6.23) — `sendResetPassword`, `changeEmail`, `emailVerification` — yang di-wire ke Resend via `lib/email.ts`. Change password tanpa current password memakai method server-side `auth.api.setPassword` lewat route kustom. Semua UI ikut gaya `app/admin/login/page.tsx` (emerald/gold). Tidak ada perubahan skema DB (tabel `verification` sudah ada).

**Tech Stack:** Next.js 15 App Router, better-auth 1.6.23, Drizzle/Postgres, Tailwind v4, lucide-react, Resend, `node:test` + `node:assert`.

## Global Constraints

- Bahasa UI & email: Indonesia. Copy & nama tombol persis seperti di spec.
- Palet: emerald-950/900 + gold (sesuai `globals.css` dan login page). Komponen lucide-react untuk ikon.
- Branch: `feat/auth-account-management` (sudah dibuat, spec sudah di-commit di situ).
- Halaman publik (`forgot-password`, `reset-password`) TIDAK di dalam `(protected)` — tidak butuh sesi.
- Halaman `akun` DI DALAM `app/admin/(protected)/` — mendapat `ProtectedLayout` otomatis.
- Method client better-auth: `authClient.forge tPassword`, `authClient.resetPassword`, `authClient.changeEmail` (semua ada di v1.6.23).
- Method server better-auth: `auth.api.setPassword({ body: { newPassword }, headers })`, `auth.api.getSession({ headers })`.
- Testing: `node:test` + `node:assert/strict`, helper `call()` di `test/helpers/request.ts`, mock session via `(auth.api as any).getSession = async () => currentSession`. Jalankan dengan `npm test` (butuh Postgres di `DATABASE_URL` `.env.local`, port 5433). File test baru: `test/lib/email-templates.test.ts`, `test/api/account-password.test.ts`.
- Password: min 8, max 128 karakter.
- `APP_URL` dipakai untuk URL absolut sisi server (sudah ada di `.env.example` / `.env.local`).

---

## File Structure

**Baru:**
- `lib/email-templates.ts` — pure HTML renderer untuk email reset & verifikasi (1 file, 1 tanggung jawab: merender template email).
- `app/api/account/password/route.ts` — POST handler ubah sandi tanpa current password via `auth.api.setPassword`.
- `app/admin/forgot-password/page.tsx` — halaman publik minta reset.
- `app/admin/reset-password/page.tsx` — halaman publik set sandi baru dari token.
- `app/admin/(protected)/akun/page.tsx` — halaman "Akun Saya" (ubah sandi + ubah email).
- `test/lib/email-templates.test.ts` — unit test renderer email.
- `test/api/account-password.test.ts` — integration test route ubah sandi.

**Ubah:**
- `lib/auth.ts` — tambah `sendResetPassword`, `user.changeEmail.enabled`, `emailVerification.sendVerificationEmail`.
- `app/admin/login/page.tsx` — link "Lupa kata sandi?".
- `app/admin/components/Sidebar.tsx` — menu "Akun Saya".

---

### Task 1: Email template helpers (TDD)

**Files:**
- Create: `lib/email-templates.ts`
- Test: `test/lib/email-templates.test.ts`

**Interfaces:**
- Produces: `renderResetPasswordEmail(opts: { name?: string | null; url: string }): string` dan `renderVerificationEmail(opts: { name?: string | null; url: string }): string`. Kedua fungsi mengembalikan string HTML.

- [ ] **Step 1: Write the failing test**

Create `test/lib/email-templates.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderResetPasswordEmail, renderVerificationEmail } from '../../lib/email-templates';

test('renderResetPasswordEmail mengandung URL reset, nama, dan brand', () => {
  const html = renderResetPasswordEmail({ name: 'Budi', url: 'https://app.test/admin/reset-password?token=abc' });
  assert.ok(html.includes('https://app.test/admin/reset-password?token=abc'));
  assert.ok(html.includes('Budi'));
  assert.ok(html.includes('Masjid Al-Kahfi'));
  assert.ok(html.includes('Atur Ulang Kata Sandi'));
});

test('renderResetPasswordEmail escape HTML pada nama (anti XSS)', () => {
  const html = renderResetPasswordEmail({ name: '<script>', url: 'https://app.test/x' });
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('renderResetPasswordEmail pakai fallback nama "Admin" bila kosong', () => {
  const html = renderResetPasswordEmail({ name: null, url: 'https://app.test/x' });
  assert.ok(html.includes('Admin'));
});

test('renderVerificationEmail mengandung URL verifikasi dan brand', () => {
  const html = renderVerificationEmail({ name: 'Siti', url: 'https://app.test/api/auth/verify-email?token=xyz' });
  assert.ok(html.includes('https://app.test/api/auth/verify-email?token=xyz'));
  assert.ok(html.includes('Siti'));
  assert.ok(html.includes('Verifikasi Email'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="email-templates" 2>&1 | head -20` (atau `npx tsx --test --import ./test/helpers/register-mocks.ts test/lib/email-templates.test.ts`)
Expected: FAIL — module `../../lib/email-templates` tidak ditemukan.

- [ ] **Step 3: Write minimal implementation**

Create `lib/email-templates.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test --import ./test/helpers/register-mocks.ts test/lib/email-templates.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/email-templates.ts test/lib/email-templates.test.ts
git commit -m "feat(auth): tambah template HTML email reset & verifikasi"
```

---

### Task 2: Wire konfigurasi better-auth (reset, change-email, verifikasi)

**Files:**
- Modify: `lib/auth.ts`

**Interfaces:**
- Consumes: `sendEmail` dari `./email`, `renderResetPasswordEmail` & `renderVerificationEmail` dari `./email-templates`.
- Produces: konfigurasi yang membuat endpoint better-auth `/forget-password`, `/reset-password`, `/change-email`, `/send-verification-email`, `/verify-email` aktif (sudah di-mount di `app/api/auth/[...all]/route.ts`).

- [ ] **Step 1: Update imports**

Di `lib/auth.ts`, tambahkan di atas (setelah import bcrypt):

```ts
import { sendEmail } from "./email";
import { renderResetPasswordEmail, renderVerificationEmail } from "./email-templates";
```

- [ ] **Step 2: Tambah sendResetPassword**

Dalam blok `emailAndPassword: { ... }` (setelah `password: { hash, verify }`), tambahkan:

```ts
    sendResetPassword: async ({ user, token }) => {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const resetUrl = `${appUrl}/admin/reset-password?token=${token}`;
      await sendEmail({
        to: user.email,
        subject: "Atur Ulang Kata Sandi — Masjid Al-Kahfi",
        html: renderResetPasswordEmail({ name: user.name, url: resetUrl }),
      });
    },
```

- [ ] **Step 3: Aktifkan changeEmail dan emailVerification**

Dalam blok `user: { ... }` (setelah `additionalFields`), tambahkan:

```ts
    changeEmail: {
      enabled: true,
    },
```

Lalu tambahkan properti top-level `emailVerification` (se level `emailAndPassword`, `session`, `user`) sebelum kurung tutup objek `betterAuth({...})`:

```ts
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verifikasi Email Baru — Masjid Al-Kahfi",
        html: renderVerificationEmail({ name: user.name, url }),
      });
    },
  },
```

Catatan: JANGAN set `emailVerification.requireEmailVerification`. Login admin yang sudah ada tetap diizinkan.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "lib/auth\.ts" || echo "OK lib/auth.ts"`
Expected: `OK lib/auth.ts` (tidak ada error baru di auth.ts; error pre-existing di `test/api/users.test.ts` boleh diabaikan).

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts
git commit -m "feat(auth): aktifkan forgot password, change email, email verification"
```

---

### Task 3: Route ubah sandi tanpa current password (TDD)

**Files:**
- Create: `app/api/account/password/route.ts`
- Test: `test/api/account-password.test.ts`

**Interfaces:**
- Produces: `POST /api/account/password` menerima `{ newPassword: string }`, butuh sesi. Mengembalikan `{ ok: true }` (200), atau 401/400/500 dengan `{ error }`.

- [ ] **Step 1: Write the failing test**

Create `test/api/account-password.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { auth } from '../../lib/auth';
import { POST } from '../../app/api/account/password/route';
import { call } from '../helpers/request';

// Mock session & setPassword — route tidak boleh menyentuh DB sungguhan.
let currentSession: any = { user: { id: 'u1', email: 'a@b.com', name: 'A' } };
let lastSetPassword: any = null;

(auth.api as any).getSession = async () => currentSession;
(auth.api as any).setPassword = async (args: any) => {
  lastSetPassword = args;
  return { message: 'Password updated successfully.' };
};

beforeEach(() => {
  currentSession = { user: { id: 'u1', email: 'a@b.com', name: 'A' } };
  lastSetPassword = null;
});

after(() => {
  (auth.api as any).setPassword = undefined;
});

test('POST /api/account/password tanpa sesi -> 401', async () => {
  currentSession = null;
  const { status, body } = await call(POST, { method: 'POST', body: { newPassword: 'newpass123' } });
  assert.equal(status, 401);
  assert.equal(body.error, 'Unauthorized');
});

test('POST /api/account/password tanpa newPassword -> 400', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: {} });
  assert.equal(status, 400);
  assert.ok(body.error.includes('minimal 8'));
});

test('POST /api/account/password newPassword pendek -> 400', async () => {
  const { status } = await call(POST, { method: 'POST', body: { newPassword: '123' } });
  assert.equal(status, 400);
});

test('POST /api/account/password valid -> 200 & panggil setPassword', async () => {
  const { status, body } = await call(POST, { method: 'POST', body: { newPassword: 'newpass123' } });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.ok(lastSetPassword, 'setPassword dipanggil');
  assert.equal(lastSetPassword.body.newPassword, 'newpass123');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test --import ./test/helpers/register-mocks.ts test/api/account-password.test.ts`
Expected: FAIL — module `../../app/api/account/password/route` tidak ditemukan.

- [ ] **Step 3: Write minimal implementation**

Create `app/api/account/password/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

/** Mengubah kata sandi admin yang sedang login tanpa kata sandi saat ini. */
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

    await auth.api.setPassword({
      body: { newPassword },
      headers: await headers(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test --import ./test/helpers/register-mocks.ts test/api/account-password.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add app/api/account/password/route.ts test/api/account-password.test.ts
git commit -m "feat(auth): route ubah sandi tanpa current password"
```

---

### Task 4: Halaman forgot password + link di login

**Files:**
- Create: `app/admin/forgot-password/page.tsx`
- Modify: `app/admin/login/page.tsx`

**Interfaces:**
- Consumes: `authClient` dari `@/lib/auth-client` (method `forgetPassword({ email, redirectTo })`).

- [ ] **Step 1: Create halaman forgot password**

Create `app/admin/forgot-password/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import Image from "next/image";

/** Halaman publik untuk meminta tautan atur ulang kata sandi. */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await authClient.forgetPassword({
        email,
        redirectTo: "/admin/reset-password",
      });
      // Selalu tampilkan pesan sukses generik (anti-enumerasi email).
      setDone(true);
    } catch {
      setError("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-950 relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-10 islamic-pattern bg-repeat"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl"></div>

      <div className="relative bg-white/95 backdrop-blur-md rounded-2xl w-full max-w-md border-t-4 border-gold-500 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <Image src="/logo.png" alt="Masjid Al-Kahfi Cikoneng" width={160} height={54} className="h-14 w-auto mx-auto" priority />
          <h2 className="font-serif text-2xl font-bold text-emerald-950 mt-4">Atur Ulang Kata Sandi</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">Masukkan email akun admin Anda. Tautan atur ulang akan dikirim via email.</p>
        </div>

        {done ? (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 flex gap-2.5 items-start text-sm">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span>Jika email terdaftar, tautan atur ulang telah dikirim. Periksa kotak masuk Anda.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@masjidalkahfi.test"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 flex gap-2.5 items-start text-xs">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-900 hover:bg-emerald-800 disabled:bg-emerald-950 text-gold-100 font-bold py-2.5 rounded-xl transition shadow-md disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Mengirim..." : "Kirim Tautan Atur Ulang"}
            </button>
          </form>
        )}

        <div className="text-center border-t border-gray-100 pt-4">
          <Link href="/admin/login" className="text-xs text-emerald-700 hover:text-emerald-900 font-medium inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Tambah link "Lupa kata sandi?" di halaman login**

Di `app/admin/login/page.tsx`, tambahkan import `Link` dari `next/link` di bagian import atas:

```tsx
import Link from "next/link";
```

Lalu ganti blok footer bawah (yang berisi teks "Gunakan akun superadmin...") menjadi:

```tsx
        <div className="text-center space-y-2 border-t border-gray-100 pt-4">
          <Link href="/admin/forgot-password" className="text-xs text-emerald-700 hover:text-emerald-900 font-medium">
            Lupa kata sandi?
          </Link>
          <p className="text-[10px] text-gray-400">
            Gunakan akun superadmin yang telah dibuat untuk login.
          </p>
        </div>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "forgot-password|login/page" || echo "OK"`
Expected: `OK`.

- [ ] **Step 4: Verifikasi manual**

Run: `npm run dev`, buka `http://localhost:3000/admin/login` → pastikan link "Lupa kata sandi?" ada dan mengarah ke `/admin/forgot-password`. Submit email apa saja → harus tampil pesan sukses generik.

- [ ] **Step 5: Commit**

```bash
git add app/admin/forgot-password/page.tsx app/admin/login/page.tsx
git commit -m "feat(auth): halaman forgot password + link di login"
```

---

### Task 5: Halaman reset password

**Files:**
- Create: `app/admin/reset-password/page.tsx`

**Interfaces:**
- Consumes: `authClient.resetPassword({ newPassword, token })` dari `@/lib/auth-client`.

- [ ] **Step 1: Create halaman reset password**

Create `app/admin/reset-password/page.tsx` (catatan: `useSearchParams` butuh boundary `<Suspense>`):

```tsx
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";
import Image from "next/image";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <ResultCard
        title="Tautan tidak valid"
        message="Tautan atur ulang tidak berisi token. Mohon minta tautan baru dari halaman lupa kata sandi."
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setIsLoading(true);
    try {
      const { error: apiError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (apiError) {
        setError(apiError.message || "Tautan kedaluwarsa atau tidak valid.");
        return;
      }
      router.push("/admin/login?reset=1");
    } catch {
      setError("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-1">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Kata Sandi Baru</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Konfirmasi Kata Sandi</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Ulangi kata sandi baru"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
            disabled={isLoading}
          />
        </div>
      </div>
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 flex gap-2.5 items-start text-xs">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-emerald-900 hover:bg-emerald-800 disabled:bg-emerald-950 text-gold-100 font-bold py-2.5 rounded-xl transition shadow-md disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
      </button>
    </form>
  );
}

function ResultCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-100 flex gap-2.5 items-start text-sm">
      <AlertCircle size={18} className="shrink-0 mt-0.5" />
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-1">{message}</p>
      </div>
    </div>
  );
}

/** Halaman publik untuk menyetel kata sandi baru dari token reset. */
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-emerald-950 relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-10 islamic-pattern bg-repeat"></div>
      <div className="relative bg-white/95 backdrop-blur-md rounded-2xl w-full max-w-md border-t-4 border-gold-500 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <Image src="/logo.png" alt="Masjid Al-Kahfi Cikoneng" width={160} height={54} className="h-14 w-auto mx-auto" priority />
          <h2 className="font-serif text-2xl font-bold text-emerald-950 mt-4">Set Kata Sandi Baru</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">Buat kata sandi baru untuk akun admin Anda.</p>
        </div>

        <Suspense fallback={<div className="text-center text-sm text-gray-400">Memuat...</div>}>
          <ResetPasswordForm />
        </Suspense>

        <div className="text-center border-t border-gray-100 pt-4">
          <Link href="/admin/login" className="text-xs text-emerald-700 hover:text-emerald-900 font-medium">
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Tampilkan notifikasi sukses di login (opsional, ringan)**

Di `app/admin/login/page.tsx`, agar `?reset=1` memberi umpan balik, tambahkan di atas `return`:

```tsx
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("reset") === "1") {
      setNotice("Kata sandi berhasil diubah. Silakan login dengan sandi baru.");
    }
  }, []);
```

Dan render blok notice (di atas form, hanya jika `notice` tidak kosong) dengan gaya sama seperti blok `error` namun warna emerald + ikon `CheckCircle`. Tambahkan import `CheckCircle` dari `lucide-react`.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "reset-password|login/page" || echo "OK"`
Expected: `OK`.

- [ ] **Step 4: Verifikasi manual**

`npm run dev` → lakukan alur penuh: `POST /api/auth/forget-password` (atau lewat UI forgot-password) → klik tautan di email Resend → landing di `/admin/reset-password?token=...` → set sandi baru → redirect ke login dengan notifikasi.

- [ ] **Step 5: Commit**

```bash
git add app/admin/reset-password/page.tsx app/admin/login/page.tsx
git commit -m "feat(auth): halaman reset password dari token"
```

---

### Task 6: Halaman Akun Saya (ubah sandi + ubah email) + menu sidebar

**Files:**
- Create: `app/admin/(protected)/akun/page.tsx`
- Modify: `app/admin/components/Sidebar.tsx`

**Interfaces:**
- Consumes: `useSession` & `authClient.changeEmail({ newEmail, callbackURL })` dari `@/lib/auth-client`; route `POST /api/account/password`.

- [ ] **Step 1: Create halaman Akun Saya**

Create `app/admin/(protected)/akun/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { Lock, Mail, AlertCircle, CheckCircle } from "lucide-react";

/** Halaman Akun Saya: ubah kata sandi dan ubah email (self-service admin). */
export default function AkunPage() {
  const { data: session } = useSession();
  const currentEmail = session?.user?.email ?? "";

  // State ubah sandi
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // State ubah email
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword.length < 8) {
      setPwMsg({ type: "err", text: "Kata sandi minimal 8 karakter." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "err", text: "Konfirmasi kata sandi tidak cocok." });
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const body = await res.json();
      if (!res.ok) {
        setPwMsg({ type: "err", text: body.error || "Gagal mengubah kata sandi." });
      } else {
        setPwMsg({ type: "ok", text: "Kata sandi berhasil diubah. Saran: login ulang dengan sandi baru." });
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPwMsg({ type: "err", text: "Terjadi kesalahan sistem." });
    } finally {
      setPwLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    if (!newEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) {
      setEmailMsg({ type: "err", text: "Format email tidak valid." });
      return;
    }
    setEmailLoading(true);
    try {
      const { error } = await authClient.changeEmail({
        newEmail,
        callbackURL: "/admin/akun",
      });
      if (error) {
        setEmailMsg({ type: "err", text: error.message || "Gagal mengajukan perubahan email." });
      } else {
        setEmailMsg({ type: "ok", text: "Tautan verifikasi telah dikirim ke email baru. Email baru aktif setelah diverifikasi." });
        setNewEmail("");
      }
    } catch {
      setEmailMsg({ type: "err", text: "Terjadi kesalahan sistem." });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Akun Saya</h1>
        <p className="text-sm text-gray-500">Kelola kata sandi dan email akun admin Anda.</p>
      </div>

      {/* Ubah Kata Sandi */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-bold text-gray-800 flex items-center gap-2"><Lock size={18} /> Ubah Kata Sandi</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase">Kata Sandi Baru</label>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 8 karakter"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none" disabled={pwLoading} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase">Konfirmasi Kata Sandi</label>
            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi kata sandi baru"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none" disabled={pwLoading} />
          </div>
          {pwMsg && <Msg type={pwMsg.type} text={pwMsg.text} />}
          <button type="submit" disabled={pwLoading}
            className="bg-emerald-900 hover:bg-emerald-800 disabled:opacity-70 text-gold-100 font-bold py-2.5 px-6 rounded-xl transition shadow-md disabled:cursor-not-allowed">
            {pwLoading ? "Menyimpan..." : "Ubah Kata Sandi"}
          </button>
        </form>
      </section>

      {/* Ubah Email */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-bold text-gray-800 flex items-center gap-2"><Mail size={18} /> Ubah Email</h2>
        <p className="text-sm text-gray-500">Email saat ini: <strong>{currentEmail || "—"}</strong></p>
        <form onSubmit={handleChangeEmail} className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase">Email Baru</label>
            <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nama@masjidalkahfi.test"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none" disabled={emailLoading} />
          </div>
          {emailMsg && <Msg type={emailMsg.type} text={emailMsg.text} />}
          <button type="submit" disabled={emailLoading}
            className="bg-emerald-900 hover:bg-emerald-800 disabled:opacity-70 text-gold-100 font-bold py-2.5 px-6 rounded-xl transition shadow-md disabled:cursor-not-allowed">
            {emailLoading ? "Mengirim..." : "Kirim Verifikasi Email Baru"}
          </button>
        </form>
      </section>
    </div>
  );
}

function Msg({ type, text }: { type: "ok" | "err"; text: string }) {
  if (type === "ok") {
    return (
      <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 flex gap-2.5 items-start text-xs">
        <CheckCircle size={16} className="shrink-0 mt-0.5" /> <span>{text}</span>
      </div>
    );
  }
  return (
    <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 flex gap-2.5 items-start text-xs">
      <AlertCircle size={16} className="shrink-0 mt-0.5" /> <span>{text}</span>
    </div>
  );
}
```

- [ ] **Step 2: Tambah menu "Akun Saya" di Sidebar**

Di `app/admin/components/Sidebar.tsx`, tambahkan `UserCog` ke import dari `lucide-react`:

```tsx
  Settings,
  UserCog,
} from "lucide-react";
```

Tambahkan entri ke array `links` (setelah `Pengaturan`, sebelum spread superadmin):

```tsx
    { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
    { href: "/admin/akun", label: "Akun Saya", icon: UserCog },
    ...(isSuperadmin
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "akun/page|Sidebar" || echo "OK"`
Expected: `OK`.

- [ ] **Step 4: Verifikasi manual**

`npm run dev` → login sebagai admin → klik menu "Akun Saya" → (a) ubah sandi: set sandi baru → logout → login dengan sandi baru harus berhasil. (b) ubah email: masukkan email baru → cek email Resend → klik link verifikasi → email terupdate.

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(protected)/akun/page.tsx" app/admin/components/Sidebar.tsx
git commit -m "feat(auth): halaman Akun Saya (ubah sandi & email) + menu sidebar"
```

---

### Task 7: Verifikasi akhir

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -vE "test/api/users\.test\.ts" | grep "error TS" || echo "Tipe bersih (selain pre-existing users.test.ts)"`
Expected: `Tipe bersih`.

- [ ] **Step 2: Full test suite**

Run: `npm test 2>&1 | tail -20`
Expected: semua test lulus, termasuk `test/lib/email-templates.test.ts` dan `test/api/account-password.test.ts`. (Pre-existing `test/api/users.test.ts` type-errors adalah masalah lama, bukan dari pekerjaan ini — tapi tetap berjalan saat runtime.)

- [ ] **Step 3: Smoke test manual lengkap**

Dokumentasikan di commit message. Alur:
1. Forgot: `/admin/login` → "Lupa kata sandi?" → input email → email Resend masuk.
2. Reset: klik link → set sandi baru → login berhasil dengan sandi baru.
3. Change password: `/admin/akun` → sandi baru → logout → login sandi baru OK.
4. Change email: `/admin/akun` → email baru → email verifikasi masuk → klik → email terupdate.

- [ ] **Step 4: Commit final (bila ada perubahan)**

Bila step 1–2 butuh perbaikan, commit di sini. Jika tidak, lewati.

---

## Self-Review (selesai)

- **Spec coverage:** Task 1 = template email; Task 2 = config (sendResetPassword, changeEmail, emailVerification); Task 3 = change password tanpa current password; Task 4 = forgot password + link login; Task 5 = reset password; Task 6 = akun (change password + change email) + sidebar. Semua poin spec tercakup.
- **Placeholder:** tidak ada TBD/TODO; semua langkah berisi kode/contoh lengkap.
- **Type consistency:** `renderResetPasswordEmail`/`renderVerificationEmail({ name, url })` konsisten di Task 1 & 2. `authClient.forgetPassword({ email, redirectTo })`, `authClient.resetPassword({ newPassword, token })`, `authClient.changeEmail({ newEmail, callbackURL })`, `auth.api.setPassword({ body: { newPassword }, headers })` konsisten di semua task. Field `{ ok: true }` / `{ error }` konsisten antara route & halaman akun.
