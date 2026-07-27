import type ContactSettings from "./constants";

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  alamat: '',
  hotline: '',
  email: '',
  jamOperasional: '',
  googleMapsUrl: '',
};

export const DEFAULT_DONATION_SETTINGS = {
  namaRekening: '',
  nomorRekening: '',
  atasNamaRekening: '',
  qrisImage: '',
};

/** Mengembalikan salinan default pengaturan kontak masjid. */
export function getDefaultContactSettings() {
  return { ...DEFAULT_CONTACT_SETTINGS };
}

/** Mengembalikan salinan default pengaturan donasi masjid. */
export function getDefaultDonationSettings() {
  return { ...DEFAULT_DONATION_SETTINGS };
}
