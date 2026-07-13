import assert from 'node:assert/strict';
import { test } from 'node:test';
import { placeOfWorshipJsonLd, newsArticleJsonLd, breadcrumbJsonLd, faqPageJsonLd } from '../../../lib/seo/jsonld';

test('placeOfWorshipJsonLd has correct @type and address, no telephone/sameAs', () => {
  const g = placeOfWorshipJsonLd();
  assert.deepEqual(g['@type'], ['PlaceOfWorship', 'Mosque']);
  assert.equal(g.telephone, undefined);
  assert.equal(g.sameAs, undefined);
  assert.equal(g.address['@type'], 'PostalAddress');
  assert.equal(g.address.addressCountry, 'ID');
  assert.equal(g.geo.latitude, -6.9856);
});

test('newsArticleJsonLd maps berita fields', () => {
  const g = newsArticleJsonLd({ title: 'Judul', slug: 'x', img: 'https://img', date: '01 Januari 2026', desc: 'd', author: 'Tim' });
  assert.equal(g['@type'], 'NewsArticle');
  assert.equal(g.headline, 'Judul');
  assert.equal(g.image, 'https://img');
  assert.equal(g.author.name, 'Tim');
});

test('breadcrumbJsonLd builds itemList', () => {
  const g = breadcrumbJsonLd([{ name: 'Beranda', path: '/beranda' }, { name: 'Berita', path: '/berita' }]);
  assert.equal(g['@type'], 'BreadcrumbList');
  assert.equal(g.itemListElement.length, 2);
  assert.equal(g.itemListElement[1].position, 2);
});

test('faqPageJsonLd maps Q&A', () => {
  const g = faqPageJsonLd([{ q: 'Apa?', a: 'Begini.' }]);
  assert.equal(g['@type'], 'FAQPage');
  assert.equal(g.mainEntity[0].name, 'Apa?');
  assert.equal(g.mainEntity[0].acceptedAnswer.text, 'Begini.');
});
