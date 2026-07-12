import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MASJID_COORDS,
  FALLBACK_PRAYERS,
  mapAladhanToPrayers,
  buildCacheKey,
  prayerTimesToMinutes,
  computeNextPrayer,
  computeCurrentPrayer,
} from '../../lib/prayer-times';

test('MASJID_COORDS is Cikoneng', () => {
  assert.equal(MASJID_COORDS.lat, -6.9856);
  assert.equal(MASJID_COORDS.lng, 107.6589);
});

test('FALLBACK_PRAYERS has 6 HH:MM entries', () => {
  assert.match(FALLBACK_PRAYERS.subuh, /^\d{2}:\d{2}$/);
  assert.match(FALLBACK_PRAYERS.isya, /^\d{2}:\d{2}$/);
});

test('mapAladhanToPrayers maps fields and strips suffix', () => {
  const timings = {
    Fajr: '04:40',
    Sunrise: '06:03',
    Dhuhr: '11:55',
    Asr: '15:17',
    Maghrib: '17:48',
    Isha: '19:02',
  };
  assert.deepEqual(mapAladhanToPrayers(timings), {
    subuh: '04:40',
    terbit: '06:03',
    dzuhur: '11:55',
    ashar: '15:17',
    maghrib: '17:48',
    isya: '19:02',
  });
});

test('mapAladhanToPrayers extracts HH:MM even if zone suffix present', () => {
  const out = mapAladhanToPrayers({ Fajr: '04:40 (WIB)', Dhuhr: '11:55', Asr: '15:17', Maghrib: '17:48', Isha: '19:02', Sunrise: '06:03' });
  assert.equal(out.subuh, '04:40');
});

test('buildCacheKey rounds to 2 decimals and uses ISO date', () => {
  assert.equal(
    buildCacheKey(-6.98564, 107.65891, '2026-07-13'),
    'jadwal:-6.99,107.66:2026-07-13',
  );
});

test('prayerTimesToMinutes parses HH:MM to total minutes', () => {
  const m = prayerTimesToMinutes({ subuh: '04:40', terbit: '06:03', dzuhur: '11:55', ashar: '15:17', maghrib: '17:48', isya: '19:02' });
  assert.equal(m.subuh, 4 * 60 + 40);
  assert.equal(m.isya, 19 * 60 + 2);
});

test('computeNextPrayer returns next upcoming prayer', () => {
  const times = { subuh: '04:40', terbit: '06:03', dzuhur: '11:55', ashar: '15:17', maghrib: '17:48', isya: '19:02' };
  // 12:00 → next is Ashar 15:17
  const r = computeNextPrayer(times, new Date(2026, 6, 13, 12, 0));
  assert.equal(r.name, 'Ashar');
  assert.equal(r.key, 'ashar');
  assert.equal(r.minutes, 15 * 60 + 17);
});

test('computeNextPrayer after Isya wraps to next-day Subuh', () => {
  const times = { subuh: '04:40', terbit: '06:03', dzuhur: '11:55', ashar: '15:17', maghrib: '17:48', isya: '19:02' };
  const r = computeNextPrayer(times, new Date(2026, 6, 13, 21, 0));
  assert.equal(r.name, 'Subuh');
  assert.equal(r.minutes, 4 * 60 + 40 + 24 * 60);
});

test('computeCurrentPrayer returns last passed entry (Terbit in morning)', () => {
  const times = { subuh: '04:40', terbit: '06:03', dzuhur: '11:55', ashar: '15:17', maghrib: '17:48', isya: '19:02' };
  assert.deepEqual(computeCurrentPrayer(times, new Date(2026, 6, 13, 10, 0)), { name: 'Terbit', key: 'terbit' });
});

test('computeCurrentPrayer at noon is Dzuhur window', () => {
  const times = { subuh: '04:40', terbit: '06:03', dzuhur: '11:55', ashar: '15:17', maghrib: '17:48', isya: '19:02' };
  assert.deepEqual(computeCurrentPrayer(times, new Date(2026, 6, 13, 12, 0)), { name: 'Dzuhur', key: 'dzuhur' });
});

test('computeCurrentPrayer before Subuh wraps to Isya', () => {
  const times = { subuh: '04:40', terbit: '06:03', dzuhur: '11:55', ashar: '15:17', maghrib: '17:48', isya: '19:02' };
  assert.deepEqual(computeCurrentPrayer(times, new Date(2026, 6, 13, 2, 0)), { name: 'Isya', key: 'isya' });
});

test('computeCurrentPrayer exactly at Isya time is Isya', () => {
  const times = { subuh: '04:40', terbit: '06:03', dzuhur: '11:55', ashar: '15:17', maghrib: '17:48', isya: '19:02' };
  assert.deepEqual(computeCurrentPrayer(times, new Date(2026, 6, 13, 19, 2)), { name: 'Isya', key: 'isya' });
});
