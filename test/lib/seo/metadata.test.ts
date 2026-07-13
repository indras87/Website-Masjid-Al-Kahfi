import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildMetadata } from '../../../lib/seo/metadata';
import { siteConfig } from '../../../lib/seo/site';

test('siteConfig.url defaults to production domain when APP_URL unset', () => {
  assert.equal(siteConfig.url, 'https://masjid-alkahfi.id');
});

test('buildMetadata sets canonical, openGraph, twitter from path', () => {
  const m = buildMetadata({ title: 'Berita', description: 'desc', path: '/berita' });
  assert.equal(m.title, 'Berita');
  assert.equal(m.alternates?.canonical, 'https://masjid-alkahfi.id/berita');
  assert.equal(m.openGraph?.url, 'https://masjid-alkahfi.id/berita');
  assert.equal(m.openGraph?.type, 'website');
  assert.equal(m.openGraph?.locale, 'id_ID');
  assert.equal(m.twitter?.card, 'summary_large_image');
});

test('buildMetadata article type passes published/modified time', () => {
  const m: any = buildMetadata({ title: 'A', description: 'd', path: '/berita/x', type: 'article', publishedTime: '2026-01-01', modifiedTime: '2026-01-02', author: 'Tim' });
  assert.equal(m.openGraph?.type, 'article');
  assert.equal(m.openGraph?.publishedTime, '2026-01-01');
  assert.equal(m.openGraph?.modifiedTime, '2026-01-02');
  assert.equal(m.openGraph?.authors?.[0], 'Tim');
});

test('buildMetadata noIndex sets robots', () => {
  const m: any = buildMetadata({ title: 'A', description: 'd', path: '/x', noIndex: true });
  assert.deepEqual(m.robots, { index: false, follow: false });
});
