/** Menghasilkan slug URL-friendly dari judul teks dengan menambahkan id di akhir. */
export function generateSlug(title: string, id: number): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug}-${id}`;
}
