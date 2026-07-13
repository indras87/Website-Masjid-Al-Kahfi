"use client";

import { useState, useEffect } from "react";
import { X, Mail, Lock, User, Shield } from "lucide-react";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "superadmin" | "admin";
  createdAt: Date | string;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserData) => Promise<void>;
  user?: User;
}

export type UserData = {
  email: string;
  name: string;
  role: "superadmin" | "admin";
  password: string;
};

/** Komponen modal form untuk membuat atau mengedit pengguna. */
export default function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  user,
}: UserFormModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"superadmin" | "admin">("admin");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!user;

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name || "");
      setRole(user.role);
      setPassword("");
    } else {
      setEmail("");
      setName("");
      setRole("admin");
      setPassword("");
    }
    setError("");
  }, [user, isOpen]);

  /** Menangani submit form untuk membuat/memperbarui user dengan validasi input. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !name || !role) {
      setError("Semua field wajib diisi.");
      return;
    }

    if (!isEdit && !password) {
      setError("Kata sandi wajib diisi untuk pengguna baru.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ email, name, role, password });
      onClose();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold font-serif">
            {isEdit ? "Edit Pengguna" : "Tambah Pengguna"}
          </h2>
          <button
            onClick={onClose}
            className="text-gold-300 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 flex gap-2 items-start text-sm">
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Nama Lengkap</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama pengguna"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Role</label>
            <div className="relative">
              <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "superadmin" | "admin")}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none bg-white"
                disabled={isSubmitting}
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Kata Sandi {isEdit && "(kosakkan jika tidak ingin mengubah)"}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? "Kosakkan untuk tidak mengubah" : "Masukkan kata sandi"}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Menyimpan...
                </>
              ) : (
                isEdit ? "Simpan" : "Tambah"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
