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
