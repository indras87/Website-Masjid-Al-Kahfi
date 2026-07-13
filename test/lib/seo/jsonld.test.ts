import assert from 'node:assert/strict';
import { test } from 'node:test';
import { placeOfWorshipJsonLd, newsArticleJsonLd, breadcrumbJsonLd, faqPageJsonLd, organizationJsonLd, websiteJsonLd, imageCollectionJsonLd } from '../../../lib/seo/jsonld';

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
  const g = newsArticleJsonLd({ title: 'Judul', slug: 'x', img: 'https://img', datePublished: '2026-01-01T00:00:00.000Z', dateModified: '2026-01-02T00:00:00.000Z', desc: 'd', author: 'Tim' });
  assert.equal(g['@type'], 'NewsArticle');
  assert.equal(g.headline, 'Judul');
  assert.equal(g.image, 'https://img');
  assert.equal(g.datePublished, '2026-01-01T00:00:00.000Z');
  assert.equal(g.dateModified, '2026-01-02T00:00:00.000Z');
  assert.equal(g.author.name, 'Tim');
});

test('newsArticleJsonLd omits dates when not provided', () => {
  const g: any = newsArticleJsonLd({ title: 'J', slug: 'y' });
  assert.equal(g.datePublished, undefined);
  assert.equal(g.dateModified, undefined);
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

test('organizationJsonLd has correct @type and contact', () => {
  const g = organizationJsonLd();
  assert.equal(g['@type'], 'Organization');
  assert.equal(g.contactPoint['@type'], 'ContactPoint');
  assert.equal(g.contactPoint.contactType, 'customer service');
  assert.equal(g.address.addressCountry, 'ID');
});

test('websiteJsonLd includes SearchAction', () => {
  const g = websiteJsonLd();
  assert.equal(g['@type'], 'WebSite');
  assert.equal(g.potentialAction['@type'], 'SearchAction');
  assert.equal(g.potentialAction.target['@type'], 'EntryPoint');
  assert(g.potentialAction.target.urlTemplate.includes('search_term_string'));
});

test('imageCollectionJsonLd creates CollectionPage with ImageObject', () => {
  const images = [
    { title: 'Foto 1', img: 'https://example.com/img1.jpg' },
    { title: 'Foto 2', img: '/img2.jpg' },
  ];
  const g = imageCollectionJsonLd(images);
  assert.equal(g['@type'], 'CollectionPage');
  assert.equal(g.hasPart.length, 2);
  assert.equal(g.hasPart[0]['@type'], 'ImageObject');
  assert.equal(g.hasPart[0].contentUrl, 'https://example.com/img1.jpg');
  assert.equal(g.hasPart[1].contentUrl, 'https://masjid-alkahfi.id/img2.jpg');
  assert.equal(g.hasPart[0].name, 'Foto 1');
});
