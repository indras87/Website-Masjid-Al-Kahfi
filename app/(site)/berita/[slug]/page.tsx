"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Share2, Copy, MessageCircle, Twitter, Facebook, ArrowLeft } from "lucide-react";

export default function BeritaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const slugParam = params.slug as string;
  const id = parseInt(slugParam.split("-").pop() || "0");

  useEffect(() => {
    const fetchData = async () => {
      if (!id || isNaN(id)) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/berita/${id}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          console.error("Failed to fetch berita detail");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const url = window.location.href;
    const text = `${data?.title || "Berita"}\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareTwitter = () => {
    const url = window.location.href;
    const text = data?.title || "Berita";
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const handleShareFacebook = () => {
    const url = window.location.href;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-950"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Berita tidak ditemukan</h2>
          <button
            onClick={() => router.push("/berita")}
            className="mt-4 text-emerald-900 font-semibold hover:underline"
          >
            Kembali ke Berita
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Hero Image */}
      <div className="relative w-full h-72 md:h-96">
        <Image
          src={data.img}
          alt={data.title}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-4xl mx-auto">
            <span
              className={`text-[10px] md:text-xs ${data.color || "bg-emerald-50 text-emerald-800"} font-bold px-3 py-1 rounded-full mb-3 inline-block`}
            >
              {data.tag}
            </span>
            <h1 className="font-serif text-2xl md:text-4xl font-bold text-white leading-tight">
              {data.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-gray-500 border-b border-gray-100 pb-6">
          <span className="font-semibold text-gray-700">{data.author}</span>
          <span className="text-gray-300">|</span>
          <span>{data.date}</span>
        </div>

        {/* Content */}
        <div
          className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl text-gray-700 leading-relaxed mb-12"
          dangerouslySetInnerHTML={{ __html: data.content || data.desc }}
        />

        {/* Share Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h3 className="font-serif text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Share2 size={20} className="text-emerald-600" />
            Bagikan Artikel Ini
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition"
            >
              {copied ? (
                <>
                  <Copy size={16} className="text-emerald-600" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy Link
                </>
              )}
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-semibold transition"
            >
              <MessageCircle size={16} />
              WhatsApp
            </button>
            <button
              onClick={handleShareTwitter}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-sm font-semibold transition"
            >
              <Twitter size={16} />
              Twitter
            </button>
            <button
              onClick={handleShareFacebook}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold transition"
            >
              <Facebook size={16} />
              Facebook
            </button>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => router.push("/berita")}
            className="inline-flex items-center gap-2 text-emerald-900 font-semibold hover:text-gold-600 transition"
          >
            <ArrowLeft size={18} />
            Kembali ke Berita
          </button>
        </div>
      </div>
    </div>
  );
}
