import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDefaultContactSettings, getDefaultDonationSettings } from '../../../lib/cms/settings';

test('returns default contact settings', () => {
  assert.deepEqual(getDefaultContactSettings(), {
    alamat: '',
    hotline: '',
    email: '',
    jamOperasional: '',
    googleMapsUrl: '',
  });
});

test('returns default donation settings', () => {
  assert.deepEqual(getDefaultDonationSettings(), {
    namaRekening: '',
    nomorRekening: '',
    atasNamaRekening: '',
    qrisImage: '',
  });
});
