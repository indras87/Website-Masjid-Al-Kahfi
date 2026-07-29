"use client";

import React, { useEffect, useState } from "react";
import { DEFAULT_RUNNING_TEXT } from "@/lib/cms/settings";
import { formatAbsolute } from "@/lib/relative-time";

/** Format angka ke "Rp 1.000.000" untuk input masking. */
const formatRupiah = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return "";
  return "Rp " + new Intl.NumberFormat("id-ID").format(n);
};

/** Ambil angka mentah dari string input rupiah. */
const parseRupiahInput = (s: string): number => {
  const digits = s.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

/** Komponen utama halaman pengaturan teks berjalan (running text) situs. */
export default function PengaturanPage() {
  const [text, setText] = useState(DEFAULT_RUNNING_TEXT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [msgTarget, setMsgTarget] = useState<{ ok: boolean; text: string } | null>(null);
  const [audit, setAudit] = useState<{ updatedAt: string | null; updatedByName: string | null } | null>(null);
  const [target, setTarget] = useState(15000000);

  useEffect(() => {
    fetch("/api/pengaturan")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.running_text === "string" && data.running_text.trim()) {
          setText(data.running_text);
        }
        if (data) {
          setAudit({ updatedAt: data.updatedAt ?? null, updatedByName: data.updatedByName ?? null });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/pengaturan/target-operasional")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.value === "string") {
          const n = parseInt(data.value, 10);
          if (Number.isFinite(n) && n > 0) setTarget(n);
        }
      })
      .catch(() => {});
  }, []);

  /** Menyimpan teks berjalan ke API setelah validasi. */
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

  /** Menyimpan target operasional bulanan. */
  const handleSaveTarget = async () => {
    const n = parseInt(String(target), 10);
    if (!Number.isFinite(n) || n <= 0) {
      setMsgTarget({ ok: false, text: "Target tidak valid (harus angka positif)." });
      return;
    }
    setSavingTarget(true);
    setMsgTarget(null);
    try {
      const res = await fetch("/api/pengaturan/target-operasional", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: n }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal menyimpan target");
      setMsgTarget({ ok: true, text: "Target operasional berhasil disimpan." });
    } catch (err: any) {
      setMsgTarget({ ok: false, text: err?.message || "Gagal menyimpan target." });
    } finally {
      setSavingTarget(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-800">Pengaturan Situs</h1>
        <p className="text-sm text-gray-500">
          Kelola teks berjalan dan target operasional bulanan.
        </p>
        {(audit?.updatedAt || audit?.updatedByName) && (
          <p className="text-xs text-gray-400">
            Terakhir disimpan oleh <span className="font-semibold text-gray-600">{audit.updatedByName || "Sistem"}</span>
            {audit.updatedAt ? <> · {formatAbsolute(audit.updatedAt)}</> : null}
          </p>
        )}
      </div>

      {/* Running Text Form */}
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

      {/* Target Operasional Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <label htmlFor="target_operasional" className="block text-xs font-bold text-gray-700 uppercase mb-2">
            Target Operasional Bulanan (Rp)
          </label>
          <input
            id="target_operasional"
            type="text"
            inputMode="numeric"
            value={target > 0 ? formatRupiah(target) : ""}
            onChange={(e) => setTarget(parseRupiahInput(e.target.value))}
            disabled={savingTarget}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:bg-gray-100"
            placeholder="Rp 15.000.000"
          />
          <p className="text-xs text-gray-400 mt-1">
            Masukkan target operasional bulanan dalam rupiah (contoh: 15000000).
          </p>
        </div>

        {msgTarget && (
          <p className={`text-sm font-medium ${msgTarget.ok ? "text-emerald-700" : "text-red-600"}`}>
            {msgTarget.text}
          </p>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSaveTarget}
            disabled={savingTarget}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingTarget ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
