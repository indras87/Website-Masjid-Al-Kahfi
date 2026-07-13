import { siteConfig } from "@/lib/seo/site";
import { getAllBerita } from "@/lib/queries/content";

export const dynamic = "force-static";

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string));
}

export async function GET(): Promise<Response> {
  const base = siteConfig.url;
  const items = await getAllBerita();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${base}/berita</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>id</language>
${items
  .map(
    (b) => `    <item>
      <title>${escapeXml(b.title)}</title>
      <link>${base}/berita/${b.slug}</link>
      <guid>${base}/berita/${b.slug}</guid>
      <description>${escapeXml(b.desc ?? "")}</description>
      ${b.author ? `<author>${escapeXml(b.author)}</author>` : ""}
    </item>`
  )
  .join("\n")}
  </channel>
</rss>`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
