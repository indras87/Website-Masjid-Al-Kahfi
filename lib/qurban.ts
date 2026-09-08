/** Helper bersama fitur Tabungan Qurban (dipakai API routes; bukan route file). */

/** Normalisasi nomor WhatsApp ke format 62xxx. */
export function normalizeWa(input: string): string {
  let d = input.replace(/[^\d]/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  if (!d.startsWith("62")) d = "62" + d;
  return d;
}

/** Validasi field peserta; mengembalikan pesan error atau null. */
export function validatePeserta(p: {
  namaPeserta: string; alamat: string; whatsapp: string; namaBank: string;
  nomorRekening: string; namaPemilikRekening: string; periode: string;
}): string | null {
  if (p.namaPeserta.length < 3 || p.namaPeserta.length > 100)
    return "Nama peserta wajib diisi (3–100 karakter)";
  if (p.alamat.length < 5 || p.alamat.length > 500)
    return "Alamat lengkap wajib diisi (5–500 karakter)";
  if (!/^62\d{8,13}$/.test(p.whatsapp)) return "Nomor WhatsApp tidak valid";
  if (p.namaBank.length < 2 || p.namaBank.length > 50) return "Nama bank wajib diisi";
  if (!/^\d{4,30}$/.test(p.nomorRekening)) return "Nomor rekening tidak valid (4–30 digit)";
  if (p.namaPemilikRekening.length < 3 || p.namaPemilikRekening.length > 100)
    return "Nama pemilik rekening wajib diisi (3–100 karakter)";
  if (!/^\d{4}$/.test(p.periode)) return "Periode (tahun) tidak valid";
  return null;
}

/** Validasi & bersihkan daftar nama shohibul; mengembalikan { list, error }. */
export function parseShohibulList(input: unknown): { list: string[]; error: string | null } {
  if (!Array.isArray(input)) return { list: [], error: "Daftar shohibul wajib diisi" };
  const list = input.map((n) => String(n).trim()).filter(Boolean);
  if (list.length < 1) return { list: [], error: "Minimal 1 nama shohibul qurban" };
  if (list.length > 10) return { list: [], error: "Maksimal 10 nama shohibul qurban" };
  for (const nama of list) {
    if (nama.length < 3 || nama.length > 100)
      return { list: [], error: "Nama shohibul wajib diisi (3–100 karakter)" };
  }
  return { list, error: null };
}
