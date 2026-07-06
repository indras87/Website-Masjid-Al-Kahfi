import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const berita = pgTable('berita', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  tag: text('tag').notNull(), // e.g. "Sosial", "Kebersihan", "Tarbiyah"
  author: text('author').notNull(),
  date: text('date').notNull(),
  img: text('img').notNull(),
  desc: text('desc').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const kegiatan = pgTable('kegiatan', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  type: text('type').notNull(), // "Harian", "Jum'at", "Hari Besar"
  time: text('time').notNull(),
  ust: text('ust').notNull(),
  status: text('status').default('Aktif').notNull(), // "Aktif", "Nonaktif"
  desc: text('desc'),
  note: text('note'),
  icon: text('icon'),
  color: text('color'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const galeri = pgTable('galeri', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  img: text('img').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
