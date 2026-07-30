-- Migration: donatur_tetap + campaign donasi (kitabisa-style)
-- Di-generate manual dari lib/db/schema.ts karena drizzle-kit 0.31.10
-- membandingkan schema vs snapshot usang (drizzle/meta) dan melaporkan
-- "No changes detected" meski tabel belum ada di DB.
-- Idempoten (IF NOT EXISTS / DO $$) agar aman dijalankan ulang.

-- =========================================================
-- ENUMS
-- =========================================================
DO $$ BEGIN CREATE TYPE "jenis_kelamin" AS ENUM ('laki-laki', 'perempuan'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "metode_pembayaran" AS ENUM ('transfer_bank', 'qris', 'tunai_sekretariat'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "donatur_tetap_status" AS ENUM ('baru', 'terkonfirmasi', 'aktif', 'berhenti'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "campaign_kategori" AS ENUM ('zakat', 'sedekah', 'wakaf', 'bencana_alam', 'pembangunan', 'yatim_dhuafa', 'kemanusiaan', 'pendidikan', 'operasional', 'lainnya'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "campaign_status" AS ENUM ('draft', 'aktif', 'tercapai', 'berakhir', 'dibatalkan'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "donasi_status" AS ENUM ('menunggu', 'terverifikasi', 'ditolak'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- donatur_tetap
-- =========================================================
CREATE TABLE IF NOT EXISTS "donatur_tetap" (
  "id" SERIAL PRIMARY KEY,
  "nama" TEXT NOT NULL,
  "jenis_kelamin" "jenis_kelamin" NOT NULL,
  "whatsapp" TEXT NOT NULL,
  "alamat" TEXT,
  "email" TEXT,
  "nominal_bulanan" INTEGER NOT NULL,
  "nominal_lainnya" BOOLEAN DEFAULT false NOT NULL,
  "tanggal_pembayaran" TEXT NOT NULL,
  "metode_pembayaran" "metode_pembayaran" NOT NULL,
  "persetujuan_donatur" BOOLEAN DEFAULT false NOT NULL,
  "persetujuan_pengingat_wa" BOOLEAN DEFAULT false NOT NULL,
  "persetujuan_laporan" BOOLEAN DEFAULT false NOT NULL,
  "status" "donatur_tetap_status" DEFAULT 'baru' NOT NULL,
  "catatan_admin" TEXT,
  "created_by_id" TEXT REFERENCES "user"("id") ON DELETE SET NULL,
  "updated_by_id" TEXT REFERENCES "user"("id") ON DELETE SET NULL,
  "updated_at" TIMESTAMP DEFAULT now() NOT NULL,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL
);

-- =========================================================
-- campaign
-- =========================================================
CREATE TABLE IF NOT EXISTS "campaign" (
  "id" SERIAL PRIMARY KEY,
  "judul" TEXT NOT NULL,
  "slug" TEXT,
  "kategori" "campaign_kategori" NOT NULL,
  "deskripsi_singkat" TEXT NOT NULL,
  "cerita" TEXT,
  "img" TEXT NOT NULL,
  "target_nominal" INTEGER NOT NULL,
  "tanggal_mulai" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "tanggal_berakhir" TIMESTAMPTZ,
  "status" "campaign_status" DEFAULT 'draft' NOT NULL,
  "featured" BOOLEAN DEFAULT false NOT NULL,
  "created_by_id" TEXT REFERENCES "user"("id") ON DELETE SET NULL,
  "updated_by_id" TEXT REFERENCES "user"("id") ON DELETE SET NULL,
  "updated_at" TIMESTAMP DEFAULT now() NOT NULL,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL
);

-- =========================================================
-- campaign_donasi  (termasuk kolom baru bukti_pembayaran)
-- =========================================================
CREATE TABLE IF NOT EXISTS "campaign_donasi" (
  "id" SERIAL PRIMARY KEY,
  "campaign_id" INTEGER NOT NULL REFERENCES "campaign"("id") ON DELETE CASCADE,
  "nama_donatur" TEXT NOT NULL,
  "anonim" BOOLEAN DEFAULT false NOT NULL,
  "whatsapp" TEXT,
  "nominal" INTEGER NOT NULL,
  "pesan" TEXT,
  "bukti_pembayaran" TEXT,
  "metode_pembayaran" "metode_pembayaran" NOT NULL,
  "status" "donasi_status" DEFAULT 'menunggu' NOT NULL,
  "catatan_admin" TEXT,
  "created_by_id" TEXT REFERENCES "user"("id") ON DELETE SET NULL,
  "updated_by_id" TEXT REFERENCES "user"("id") ON DELETE SET NULL,
  "updated_at" TIMESTAMP DEFAULT now() NOT NULL,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL
);

-- =========================================================
-- campaign_update
-- =========================================================
CREATE TABLE IF NOT EXISTS "campaign_update" (
  "id" SERIAL PRIMARY KEY,
  "campaign_id" INTEGER NOT NULL REFERENCES "campaign"("id") ON DELETE CASCADE,
  "judul" TEXT NOT NULL,
  "isi" TEXT NOT NULL,
  "img" TEXT,
  "created_by_id" TEXT REFERENCES "user"("id") ON DELETE SET NULL,
  "updated_by_id" TEXT REFERENCES "user"("id") ON DELETE SET NULL,
  "updated_at" TIMESTAMP DEFAULT now() NOT NULL,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL
);
