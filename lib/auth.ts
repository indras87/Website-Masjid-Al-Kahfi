import { betterAuth } from "better-auth";
import { db } from "./db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "./db/schema";
import bcrypt from "bcryptjs";
import { sendEmail } from "./email";
import { renderResetPasswordEmail, renderVerificationEmail } from "./email-templates";

/** Hash kata sandi dengan bcrypt cost 10 (sama dengan yang dipakai seed). */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** Verifikasi kata sandi terhadap hash bcrypt. */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    // Configure bcrypt for password hashing and verification
    // to match the hashes created in the seed script
    password: {
      hash: hashPassword,
      verify: ({ hash, password }) => verifyPassword(password, hash),
    },
    sendResetPassword: async ({ user, token }) => {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const resetUrl = `${appUrl}/admin/reset-password?token=${token}`;
      await sendEmail({
        to: user.email,
        subject: "Atur Ulang Kata Sandi — Masjid Al-Kahfi",
        html: renderResetPasswordEmail({ name: user.name, url: resetUrl }),
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        default: "admin",
        required: false,
        input: false, // Users cannot set their own role
      },
    },
    changeEmail: {
      enabled: true,
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verifikasi Email Baru — Masjid Al-Kahfi",
        html: renderVerificationEmail({ name: user.name, url }),
      });
    },
  },
});
