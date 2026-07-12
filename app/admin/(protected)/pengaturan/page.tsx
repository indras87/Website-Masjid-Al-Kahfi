"use client";

import React, { useEffect, useState } from "react";
import { DEFAULT_RUNNING_TEXT } from "@/lib/cms/settings";

export default function PengaturanPage() {
  const [text, setText] = useState(DEFAULT_RUNNING_TEXT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/pengaturan")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.running_text === "string" && data.running_text.trim()) {
          setText(data.running_text);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length === 0) {
      setMsg({ ok: false, text: "Teks tidak boleh kosong." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ running_text: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal menyimpan");
      setMsg({ ok: true, text: "Teks berjalan berhasil disimpan." });
    } catch (err: any) {
      setMsg({ ok: false, text: err?.message || "Gagal menyimpan." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Pengaturan Situs</h1>
      <p className="text-sm text-gray-500 mb-6">
        Kelola teks berjalan yang tampil di banner atas situs publik.
      </p>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <label htmlFor="running_text" className="block text-xs font-bold text-gray-700 uppercase mb-2">
            Teks Berjalan (Running Text)
          </label>
          <textarea
            id="running_text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading || saving}
            rows={4}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:bg-gray-100"
            placeholder="Tulis teks berjalan..."
          />
          <p className="text-xs text-gray-400 mt-1">
            Tip: teks panjang akan melintas lebih lama. Kecepatan tetap (durasi 30 detik).
          </p>
        </div>

        {msg && (
          <p className={`text-sm font-medium ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>
            {msg.text}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
