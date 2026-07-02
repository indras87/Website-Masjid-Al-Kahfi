'use client';

import React, { useState, useEffect } from 'react';
import { Lock, LogIn, AlertCircle } from 'lucide-react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check auth on mount
  useEffect(() => {
    setTimeout(() => {
      setIsMounted(true);
      const loggedIn = localStorage.getItem('admin_logged_in');
      if (loggedIn === 'true') {
        setIsAuthenticated(true);
      }
    }, 0);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Default password dkmalkahfi
    if (password === 'dkmalkahfi') {
      localStorage.setItem('admin_logged_in', 'true');
      setIsAuthenticated(true);
    } else {
      setError('Kata sandi yang Anda masukkan salah. Hubungi DKM jika Anda lupa.');
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gold-400"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
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
            <p className="text-sm text-gray-500 max-w-xs mx-auto">Sistem manajemen konten portal digital masjid.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Kata Sandi Administrator</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
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
              className="w-full bg-emerald-900 hover:bg-emerald-800 text-gold-100 font-bold py-2.5 rounded-xl transition shadow-md flex items-center justify-center gap-2"
            >
              <LogIn size={16} /> Masuk ke Dashboard
            </button>
          </form>

          <div className="text-center border-t border-gray-100 pt-4">
            <p className="text-[10px] text-gray-400">
              Kata sandi standar: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded font-bold text-emerald-850">dkmalkahfi</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
