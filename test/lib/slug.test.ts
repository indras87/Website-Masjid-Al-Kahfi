import assert from 'node:assert/strict';
import { test } from 'node:test';
import { slugify, generateSlug, uniqueSlug } from '../../lib/slug';

test('slugify lowercases and joins words with dashes', () => {
  assert.equal(slugify('Kajian Akbar Keluarga'), 'kajian-akbar-keluarga');
});

test('slugify trims surrounding whitespace', () => {
  assert.equal(slugify('  Hello   World  '), 'hello-world');
});

test('slugify strips non-alphanumeric symbols', () => {
  assert.equal(slugify('a@b#c$d'), 'abcd');
});

test('slugify collapses repeated dashes/spaces', () => {
  assert.equal(slugify('foo--bar  baz'), 'foo-bar-baz');
});

test('slugify strips leading/trailing dashes', () => {
  assert.equal(slugify('-hello-'), 'hello');
});

test('generateSlug ignores the id argument and equals slugify', () => {
  assert.equal(generateSlug('Judul Tes', 9), slugify('Judul Tes'));
});

test('uniqueSlug returns base when not taken', () => {
  assert.equal(uniqueSlug('base', []), 'base');
});

test('uniqueSlug appends -2 on direct collision', () => {
  assert.equal(uniqueSlug('base', ['base']), 'base-2');
});

test('uniqueSlug increments past existing suffixed slugs', () => {
  assert.equal(uniqueSlug('base', ['base', 'base-2']), 'base-3');
});

test('uniqueSlug ignores falsy entries in the existing list', () => {
  assert.equal(uniqueSlug('base', ['', null as unknown as string]), 'base');
});
