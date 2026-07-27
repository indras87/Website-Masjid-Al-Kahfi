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
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  featured: boolean("featured").default(false).notNull(),
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const galeri = pgTable("galeri", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  img: text("img").notNull(),
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  periode: text("periode").default("2025-2031").notNull(),
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profilMasjid = pgTable("profil_masjid", {
  id: serial("id").primaryKey(),
  visi: text("visi").notNull(),
  misi: text("misi").notNull(), // Newline-separated values
  history: text("history"),
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fasilitas = pgTable("fasilitas", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  desc: text("desc").notNull(),
  icon: text("icon").notNull(), // Lucide icon names like "User", "Droplet", etc.
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kontak = pgTable("kontak", {
  id: serial("id").primaryKey(),
  alamat: text("alamat").notNull(),
  hotline: text("hotline").notNull(),
  email: text("email").notNull(),
  jamOperasional: text("jam_operasional").notNull(),
  googleMapsUrl: text("google_maps_url").notNull(),
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const donasi = pgTable("donasi", {
  id: serial("id").primaryKey(),
  namaRekening: text("nama_rekening").notNull(),
  nomorRekening: text("nomor_rekening").notNull(),
  atasNamaRekening: text("atas_nama_rekening").notNull(),
  qrisImage: text("qris_image").notNull(),
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Site-wide key-value settings (e.g. running text)
export const pengaturan = pgTable("pengaturan", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === Donatur Tetap Operasional ===

export const jenisKelaminEnum = pgEnum("jenis_kelamin", ["laki-laki", "perempuan"]);

export const metodePembayaranEnum = pgEnum("metode_pembayaran", [
  "transfer_bank",
  "qris",
  "tunai_sekretariat",
]);

export const donaturTetapStatusEnum = pgEnum("donatur_tetap_status", [
  "baru",
  "terkonfirmasi",
  "aktif",
  "berhenti",
]);

export const donaturTetap = pgTable("donatur_tetap", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  jenisKelamin: jenisKelaminEnum("jenis_kelamin").notNull(),
  whatsapp: text("whatsapp").notNull(),
  alamat: text("alamat"),
  email: text("email"),
  nominalBulanan: integer("nominal_bulanan").notNull(),
  nominalLainnya: boolean("nominal_lainnya").default(false).notNull(),
  tanggalPembayaran: text("tanggal_pembayaran").notNull(),
  metodePembayaran: metodePembayaranEnum("metode_pembayaran").notNull(),
  persetujuanDonatur: boolean("persetujuan_donatur").default(false).notNull(),
  persetujuanPengingatWa: boolean("persetujuan_pengingat_wa").default(false).notNull(),
  persetujuanLaporan: boolean("persetujuan_laporan").default(false).notNull(),
  status: donaturTetapStatusEnum("status").default("baru").notNull(),
  catatanAdmin: text("catatan_admin"),
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === Campaign Donasi (kitabisa-style) ===

// Kategori campaign (untuk filter publik)
export const campaignKategoriEnum = pgEnum("campaign_kategori", [
  "zakat",
  "sedekah",
  "wakaf",
  "bencana_alam",
  "pembangunan",
  "yatim_dhuafa",
  "kemanusiaan",
  "pendidikan",
  "operasional",
  "lainnya",
]);

// Status campaign (kontrol admin)
export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",       // belum tampil di publik
  "aktif",       // tampil & menerima donasi
  "tercapai",    // target tercapai (manual)
  "berakhir",    // deadline lewat / ditutup
  "dibatalkan",  // dibatalkan
]);

// Status verifikasi donasi
export const donasiStatusEnum = pgEnum("donasi_status", [
  "menunggu",      // baru submit, belum dibayar/diverifikasi
  "terverifikasi", // admin konfirmasi pembayaran -> masuk hitungan progress
  "ditolak",       // ditolak / tidak valid
]);

export const campaign = pgTable("campaign", {
  id: serial("id").primaryKey(),
  judul: text("judul").notNull(),
  slug: text("slug"), // generated via slugify + uniqueSlug
  kategori: campaignKategoriEnum("kategori").notNull(),
  deskripsiSingkat: text("deskripsi_singkat").notNull(), // preview kartu (max ~160 char)
  cerita: text("cerita"), // cerita lengkap (boleh multi-paragraf)
  img: text("img").notNull(), // URL foto sampul (via /api/upload)
  targetNominal: integer("target_nominal").notNull(), // rupiah, > 0
  tanggalMulai: timestamp("tanggal_mulai", { withTimezone: true }).defaultNow().notNull(),
  tanggalBerakhir: timestamp("tanggal_berakhir", { withTimezone: true }), // OPSIONAL; NULL = tanpa batas waktu (open-ended)
  status: campaignStatusEnum("status").default("draft").notNull(),
  featured: boolean("featured").default(false).notNull(),
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaignDonasi = pgTable("campaign_donasi", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id")
    .references(() => campaign.id, { onDelete: "cascade" })
    .notNull(),
  namaDonatur: text("nama_donatur").notNull(),
  anonim: boolean("anonim").default(false).notNull(), // true -> wall tampil "Hamba Allah"
  whatsapp: text("whatsapp"), // ternormalisasi "62xxx"; NULL bila input manual admin tanpa WA
  nominal: integer("nominal").notNull(), // rupiah, > 0
  pesan: text("pesan"), // pesan/doa baik di wall (opsional, max 300 char)
  metodePembayaran: metodePembayaranEnum("metode_pembayaran").notNull(), // reuse enum yang ada
  status: donasiStatusEnum("status").default("menunggu").notNull(),
  catatanAdmin: text("catatan_admin"), // catatan internal admin (nullable)
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaignUpdate = pgTable("campaign_update", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id")
    .references(() => campaign.id, { onDelete: "cascade" })
    .notNull(),
  judul: text("judul").notNull(),
  isi: text("isi").notNull(),
  img: text("img"), // opsional, URL via /api/upload
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedById: text("updated_by_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
