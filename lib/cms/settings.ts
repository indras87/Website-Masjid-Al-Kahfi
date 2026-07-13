export type ContactSettings = {
  alamat: string;
  hotline: string;
  email: string;
  jamOperasional: string;
  googleMapsUrl: string;
};

export type DonationSettings = {
  namaRekening: string;
  nomorRekening: string;
  atasNamaRekening: string;
  qrisImage: string;
};

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  alamat: '',
  hotline: '',
  email: '',
  jamOperasional: '',
  googleMapsUrl: '',
};

export const DEFAULT_DONATION_SETTINGS: DonationSettings = {
  namaRekening: '',
  nomorRekening: '',
  atasNamaRekening: '',
  qrisImage: '',
};

/** Mengembalikan salinan default pengaturan kontak masjid. */
export function getDefaultContactSettings(): ContactSettings {
  return { ...DEFAULT_CONTACT_SETTINGS };
}

/** Mengembalikan salinan default pengaturan donasi masjid. */
export function getDefaultDonationSettings(): DonationSettings {
  return { ...DEFAULT_DONATION_SETTINGS };
}

export const DEFAULT_RUNNING_TEXT =
  '"Siapa yang membangun masjid karena Allah, maka Allah akan membangunkan baginya rumah di surga." (HR. Bukhari dan Muslim) — Selamat datang di Layanan Digital Masjid Al-Kahfi Cikoneng, Kabupaten Bandung.';
