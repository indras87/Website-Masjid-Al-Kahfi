import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const berita = pgTable("berita", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  tag: text("tag").notNull(), // e.g. "Sosial", "Kebersihan", "Tarbiyah"
  author: text("author").notNull(),
  date: text("date").notNull(),
  img: text("img").notNull(),
  desc: text("desc").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kegiatan = pgTable("kegiatan", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // "Harian", "Jum'at", "Hari Besar"
  time: text("time").notNull(),
  ust: text("ust").notNull(),
  status: text("status").default("Aktif").notNull(), // "Aktif", "Nonaktif"
  desc: text("desc"),
  note: text("note"),
  icon: text("icon"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const galeri = pgTable("galeri", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  img: text("img").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pengurus = pgTable("pengurus", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  period: text("period").notNull(), // e.g. "Periode 2024-2028"
  img: text("img").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profilMasjid = pgTable("profil_masjid", {
  id: serial("id").primaryKey(),
  visi: text("visi").notNull(),
  misi: text("misi").notNull(), // Newline-separated values
  history: text("history"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fasilitas = pgTable("fasilitas", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  desc: text("desc").notNull(),
  icon: text("icon").notNull(), // Lucide icon names like "User", "Droplet", etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kontak = pgTable("kontak", {
  id: serial("id").primaryKey(),
  alamat: text("alamat").notNull(),
  hotline: text("hotline").notNull(),
  email: text("email").notNull(),
  jamOperasional: text("jam_operasional").notNull(),
  googleMapsUrl: text("google_maps_url").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const donasi = pgTable("donasi", {
  id: serial("id").primaryKey(),
  namaRekening: text("nama_rekening").notNull(),
  nomorRekening: text("nomor_rekening").notNull(),
  atasNamaRekening: text("atas_nama_rekening").notNull(),
  qrisImage: text("qris_image").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
