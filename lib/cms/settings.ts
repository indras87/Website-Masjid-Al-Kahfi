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

export function getDefaultContactSettings(): ContactSettings {
  return { ...DEFAULT_CONTACT_SETTINGS };
}

export function getDefaultDonationSettings(): DonationSettings {
  return { ...DEFAULT_DONATION_SETTINGS };
}
