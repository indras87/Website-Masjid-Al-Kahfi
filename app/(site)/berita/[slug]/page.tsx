import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBeritaBySlug, getAllBeritaSlugs } from "@/lib/queries/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { newsArticleJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/json-ld";
import { BeritaShareBar } from "./berita-detail-client";

type Params = { params: Promise<{ slug: string }> };

// Allow on-demand rendering for slugs not pre-rendered by generateStaticParams.
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllBeritaSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const b = await getBeritaBySlug(slug);
  if (!b) {
    return buildMetadata({
      title: "Berita tidak ditemukan",
      description: "",
      path: `/berita/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: b.title,
    description: b.desc ?? "",
    path: `/berita/${slug}`,
    image: b.img ?? undefined,
    type: "article",
    publishedTime: b.createdAt ? new Date(b.createdAt).toISOString() : undefined,
    modifiedTime: b.updatedAt ? new Date(b.updatedAt).toISOString() : undefined,
    author: b.author ?? undefined,
  });
}

export default async function BeritaDetail({ params }: Params) {
  const { slug } = await params;
  const b = await getBeritaBySlug(slug);
  if (!b) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Beranda", path: "/beranda" },
          { name: "Berita", path: "/berita" },
          { name: b.title, path: `/berita/${slug}` },
        ])}
      />
      <JsonLd
        data={newsArticleJsonLd({
          title: b.title,
          slug,
          img: b.img,
          datePublished: b.createdAt
            ? new Date(b.createdAt).toISOString()
            : undefined,
          dateModified: b.updatedAt
            ? new Date(b.updatedAt).toISOString()
            : undefined,
          desc: b.desc,
          author: b.author,
        })}
      />

      <nav className="text-sm text-emerald-700 mb-4" aria-label="Breadcrumb">
        <Link href="/beranda">Beranda</Link> /{" "}
        <Link href="/berita">Berita</Link> /{" "}
        <span className="text-gray-500">{b.title}</span>
      </nav>

      <h1 className="font-serif text-3xl md:text-4xl font-bold text-emerald-950 leading-tight">
        {b.title}
      </h1>
      <p className="mt-3 text-sm text-gray-500">
        {b.author ? `oleh ${b.author} • ` : ""}
        {b.date}
        {b.tag ? ` • ${b.tag}` : ""}
      </p>

      {b.img && (
        <Image
          src={b.img}
          alt={b.title}
          width={1200}
          height={675}
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          className="rounded-xl mt-6 w-full h-auto object-cover"
        />
      )}

      {/*
        NOTE: @tailwindcss/typography is listed in package.json but is NOT
        registered via `@plugin` in app/globals.css, so `prose` classes are
        no-ops. Using explicit classes instead so the article body is styled
        regardless. (See task-8-report.md → prose decision.)
      */}
      <div
        className="text-gray-700 leading-relaxed mt-6 [&_img]:rounded-xl [&_a]:text-emerald-700"
        dangerouslySetInnerHTML={{ __html: b.content ?? b.desc ?? "" }}
      />

      <div className="mt-8">
        <BeritaShareBar title={b.title} slug={slug} />
      </div>

      <div className="text-center mt-8">
        <Link
          href="/berita"
          className="inline-flex items-center gap-2 text-emerald-900 font-semibold hover:text-gold-600 transition"
        >
          <ArrowLeft size={18} />
          Kembali ke Berita
        </Link>
      </div>
    </article>
  );
}
