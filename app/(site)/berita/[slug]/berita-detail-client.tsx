"use client";

import { useState } from "react";
import {
  Link as LinkIcon,
  Check,
  MessageCircle,
  Twitter,
  Facebook,
  Share2,
} from "lucide-react";

/**
 * Client island for the berita detail page.
 *
 * All interactivity that requires the browser (clipboard, window.open share
 * dialogs, local UI state) lives here. The article itself (title, image, body
 * HTML, meta, JSON-LD) is rendered by the Server Component parent so that the
 * content is present in the initial HTML for crawlers.
 */
export function BeritaShareBar({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/berita/${slug}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const onWhatsApp = () => {
    const url = `${window.location.origin}/berita/${slug}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${url}`)}`,
      "_blank"
    );
  };

  const onTwitter = () => {
    const url = `${window.location.origin}/berita/${slug}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        title
      )}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const onFacebook = () => {
    const url = `${window.location.origin}/berita/${slug}`;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="font-serif text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Share2 size={20} className="text-emerald-600" />
        Bagikan Artikel Ini
      </h3>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onCopy}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition"
        >
          {copied ? (
            <Check size={16} className="text-emerald-600" />
          ) : (
            <LinkIcon size={16} />
          )}
          {copied ? "Tersalin!" : "Salin Tautan"}
        </button>
        <button
          onClick={onWhatsApp}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-semibold transition"
        >
          <MessageCircle size={16} />
          WhatsApp
        </button>
        <button
          onClick={onTwitter}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-sm font-semibold transition"
        >
          <Twitter size={16} />
          Twitter
        </button>
        <button
          onClick={onFacebook}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold transition"
        >
          <Facebook size={16} />
          Facebook
        </button>
      </div>
    </div>
  );
}
