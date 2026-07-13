export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        // Escape '<' so DB-controlled strings containing '</script>' cannot
        // break out of this script element (stored-XSS / DOM corruption).
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
