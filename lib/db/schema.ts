import { pgTable, serial, text, timestamp, boolean, index, integer } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// User role enum
export const userRoleEnum = pgEnum("user_role", ["superadmin", "admin"]);

// Better-auth tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"), // Password is optional here - mainly for credential accounts
  name: text("name"),
  image: text("image"),
  role: userRoleEnum("role").default("admin").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}, (table) => [
  index("session_userId_idx").on(table.userId),
]);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("account_userId_idx").on(table.userId),
]);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("verification_identifier_idx").on(table.identifier),
]);

// Relations for better-auth tables
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const berita = pgTable("berita", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  tag: text("tag").notNull(), // e.g. "Sosial", "Kebersihan", "Tarbiyah"
  author: text("author").notNull(),
  date: text("date").notNull(),
  img: text("img").notNull(),
  desc: text("desc").notNull(),
  content: text("content"),
  slug: text("slug"),
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
  img: text("img"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const galeri = pgTable("galeri", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  img: text("img").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enum tingkat hierarki pengurus DKM
export const pengurusTingkatEnum = pgEnum("pengurus_tingkat", [
  "pembina",
  "penasehat",
  "pimpinan",
  "idarah",
  "imarah",
  "riayah",
]);

export const pengurus = pgTable("pengurus", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  foto: text("foto").notNull(),
  tingkat: pengurusTingkatEnum("tingkat").notNull(),
  subBidang: text("sub_bidang"), // nullable: null = anggota langsung tingkat/bidang
  jabatan: text("jabatan"), // nullable: "Ketua","Sekretaris","Koordinator Bidang", null = anggota
  urutan: integer("urutan").default(0).notNull(),
  periode: text("periode").default("2024-2028").notNull(),
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
