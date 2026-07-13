"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "@/lib/auth-client";
import { Lock, LogIn, AlertCircle, Mail } from "lucide-react";

/** Halaman login admin dengan formulir kredensial email dan kata sandi. */
export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (session?.user) {
      router.push("/admin");
    }
  }, [session, router]);

  /** Menangani submit formulir login, mengautentikasi pengguna, dan mengarahkan ke dashboard. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Login gagal. Periksa email dan kata sandi Anda.");
      } else {
        router.push("/admin");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-950 relative overflow-hidden flex items-center justify-center p-4">
      {/* Decorative background patterns */}
      <div className="absolute inset-0 opacity-10 islamic-pattern bg-repeat"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl"></div>

      <div className="relative bg-white/95 backdrop-blur-md rounded-2xl w-full max-w-md border-t-4 border-gold-500 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-900 border-2 border-gold-500 rounded-full flex items-center justify-center mx-auto text-gold-300 text-3xl shadow-lg">
            🕌
          </div>
          <h2 className="font-serif text-2xl font-bold text-emerald-950 mt-4">Panel Kontrol DKM</h2>
          <p className="text-xs text-gold-600 font-semibold uppercase tracking-widest">Masjid Al-Kahfi Cikoneng</p>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">Login untuk mengakses sistem manajemen konten.</p>
        </div>

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

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Kata Sandi</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 flex gap-2.5 items-start text-xs leading-relaxed animate-shake">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-900 hover:bg-emerald-800 disabled:bg-emerald-950 text-gold-100 font-bold py-2.5 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gold-100 border-t-transparent"></div>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <LogIn size={16} /> Masuk ke Dashboard
              </>
            )}
          </button>
        </form>

        <div className="text-center border-t border-gray-100 pt-4">
          <p className="text-[10px] text-gray-400">
            Gunakan akun superadmin yang telah dibuat untuk login.
          </p>
        </div>
      </div>
    </div>
  );
}
