"use client";

import { useState } from "react";

/**
 * Client island for the "Salin nomor rekening" button on the donasi page.
 * Only the clipboard interactivity lives here — the rest of the donasi page
 * (bank details, QRIS, FAQ) is server-rendered (Task 12).
 */
export function CopyRekeningButton({
  nomorRekening,
}: {
  nomorRekening: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(nomorRekening);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — leave button as-is.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="bg-emerald-900 text-gold-100 hover:bg-gold-500 hover:text-emerald-950 font-bold px-3 py-1.5 rounded-lg text-xs transition"
    >
      {copied ? "Tersalin" : "Salin"}
    </button>
  );
}
