"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Lock, AlertCircle } from "lucide-react";
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
