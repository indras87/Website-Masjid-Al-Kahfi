/** Mengubah judul menjadi bentuk URL-friendly (lowercase, strip, pisah '-'). */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Menghasilkan slug dari judul tanpa menyertakan id di akhir.
 * Parameter id dipertahankan untuk kompatibilitas pemanggil lama dan diabaikan.
 */
export function generateSlug(title: string, _id?: number): string {
  return slugify(title);
}

/**
 * Memastikan slug unik terhadap daftar slug yang sudah ada.
 * Bila base belum dipakai, kembalikan apa adanya; bila bentrok, tambahkan
 * sufiks numerik (-2, -3, ...).
 */
export function uniqueSlug(base: string, existing: string[]): string {
  const taken = new Set(existing.filter(Boolean));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
