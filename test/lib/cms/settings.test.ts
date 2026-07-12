import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDefaultContactSettings, getDefaultDonationSettings, DEFAULT_RUNNING_TEXT } from '../../../lib/cms/settings';

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

test('DEFAULT_RUNNING_TEXT is a non-empty running text', () => {
  assert.ok(typeof DEFAULT_RUNNING_TEXT === 'string');
  assert.ok(DEFAULT_RUNNING_TEXT.length > 20);
  assert.ok(DEFAULT_RUNNING_TEXT.includes('masjid'));
});
