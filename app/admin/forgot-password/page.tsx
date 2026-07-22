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
      await authClient.requestPasswordReset({
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
