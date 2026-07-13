import { db } from "./index";
import {
  berita,
  donasi,
  kegiatan,
  galeri,
  kontak,
  pengurus,
  profilMasjid,
  fasilitas,
  pengaturan,
  user,
  account,
} from "./schema";
import { DEFAULT_RUNNING_TEXT } from "../cms/settings";
import { slugify, uniqueSlug } from "../slug";
import bcrypt from "bcryptjs";

// Helper: generate placeholder avatar URL dari inisial nama
const avatar = (nama: string): string => {
  const initials = nama
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return `https://placehold.co/200x200/064e3b/fbbf24?text=${encodeURIComponent(initials)}`;
};

// Struktur pengurus DKM Al-Kahfi periode 2024-2028
// Field: nama, tingkat, jabatan?, subBidang?, urutan
const DEFAULT_PENGURUS: Array<{
  nama: string;
  tingkat: "pembina" | "penasehat" | "pimpinan" | "idarah" | "imarah" | "riayah";
  jabatan?: string;
  subBidang?: string;
  urutan: number;
}> = [
  // I. PEMBINA
  { nama: "Brio Pradiko Pero", tingkat: "pembina", urutan: 1 },
  { nama: "Kurnia Aji", tingkat: "pembina", urutan: 2 },
  // II. PENASEHAT
  { nama: "Cecep Hidayat", tingkat: "penasehat", urutan: 1 },
  { nama: "Tresna Acip", tingkat: "penasehat", urutan: 2 },
  { nama: "Ujang Saepudin", tingkat: "penasehat", urutan: 3 },
  // III. PIMPINAN INTI
  { nama: "Budi Ramdani", tingkat: "pimpinan", jabatan: "Ketua", urutan: 1 },
  { nama: "Idham Faisal", tingkat: "pimpinan", jabatan: "Wakil Ketua", urutan: 2 },
  // IV. BIDANG IDARAH
  { nama: "Theo Ras Komara", tingkat: "idarah", jabatan: "Sekretaris", urutan: 1 },
  { nama: "Ruhiyat", tingkat: "idarah", jabatan: "Bendahara", urutan: 2 },
  { nama: "Khairul T S", tingkat: "idarah", jabatan: "Humas Eksternal", urutan: 3 },
  { nama: "Fauzy Al Adam", tingkat: "idarah", jabatan: "Humas Internal", urutan: 4 },
  { nama: "Ian Agung Prakoso", tingkat: "idarah", jabatan: "Humas Internal", urutan: 5 },
  { nama: "Angga Dwi Kusumah", tingkat: "idarah", jabatan: "AMC (Al-Kahfi Media Center)", urutan: 6 },
  { nama: "Rifan Sopian", tingkat: "idarah", jabatan: "AMC (Al-Kahfi Media Center)", urutan: 7 },
  { nama: "Indra Gunawan W", tingkat: "idarah", jabatan: "SIMA (Sistem Informasi Masjid Al-Kahfi)", urutan: 8 },
  { nama: "Agung Yuliaji", tingkat: "idarah", jabatan: "SIMA (Sistem Informasi Masjid Al-Kahfi)", urutan: 9 },
  // V. BIDANG IMARAH
  { nama: "Irfanudin Ma'sum", tingkat: "imarah", jabatan: "Koordinator Bidang", urutan: 1 },
  { nama: "Dawam", tingkat: "imarah", subBidang: "Syiar Islam", urutan: 2 },
  { nama: "Irfanudin Ma'sum", tingkat: "imarah", subBidang: "Syiar Islam", urutan: 3 },
  { nama: "Abdul Malik Khusaeri", tingkat: "imarah", subBidang: "Syiar Islam", urutan: 4 },
  { nama: "Fauzy Al Adam", tingkat: "imarah", subBidang: "PHBI", urutan: 5 },
  { nama: "Abdul Malik Khusaeri", tingkat: "imarah", subBidang: "PHBI", urutan: 6 },
  { nama: "Jagad Sidhayoda", tingkat: "imarah", subBidang: "PHBI", urutan: 7 },
  { nama: "Sahdam Amir", tingkat: "imarah", subBidang: "PHBI", urutan: 8 },
  { nama: "Caca Sukma", tingkat: "imarah", subBidang: "Pendidikan & TPQ", urutan: 9 },
  { nama: "Raditiana Fatmasari", tingkat: "imarah", subBidang: "Pendidikan & TPQ", urutan: 10 },
  { nama: "Irfanudin Ma'sum", tingkat: "imarah", subBidang: "Pendidikan & TPQ", urutan: 11 },
  { nama: "Sri Nuryani Erwinsyah", tingkat: "imarah", subBidang: "Pendidikan & TPQ", urutan: 12 },
  { nama: "Yunnie Cindo Raina Shari", tingkat: "imarah", subBidang: "Pendidikan & TPQ", urutan: 13 },
  { nama: "Abdul Aziz", tingkat: "imarah", subBidang: "ZISWAF", urutan: 14 },
  { nama: "Denny Jatnika", tingkat: "imarah", subBidang: "ZISWAF", urutan: 15 },
  { nama: "Syahroni Noorman P", tingkat: "imarah", subBidang: "ZISWAF", urutan: 16 },
  { nama: "Agus Sobirin", tingkat: "imarah", subBidang: "Cinta Qurban", urutan: 17 },
  { nama: "Moch Rosin", tingkat: "imarah", subBidang: "Cinta Qurban", urutan: 18 },
  { nama: "Sigit Jaelani", tingkat: "imarah", subBidang: "Cinta Qurban", urutan: 19 },
  { nama: "Alief Muhammad", tingkat: "imarah", subBidang: "Cinta Qurban", urutan: 20 },
  { nama: "Akhmad Syarif", tingkat: "imarah", subBidang: "Al-Kahfi Care", urutan: 21 },
  { nama: "Dian Zaini Arief", tingkat: "imarah", subBidang: "Al-Kahfi Care", urutan: 22 },
  { nama: "Tresna", tingkat: "imarah", subBidang: "Al-Kahfi Care", urutan: 23 },
  { nama: "Sigit Jaelani", tingkat: "imarah", subBidang: "Al-Kahfi Care", urutan: 24 },
  { nama: "Ruhiyat", tingkat: "imarah", subBidang: "Al-Kahfi Care", urutan: 25 },
  { nama: "Muhammad Iqbal", tingkat: "imarah", subBidang: "Remaja Masjid", urutan: 26 },
  { nama: "Rahma Sari Ridwan", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 27 },
  { nama: "Putri Oviolanda Irianto", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 28 },
  { nama: "Sri Nuryani Erwinsyah", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 29 },
  { nama: "Maryana Saumi Ulfah", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 30 },
  { nama: "Yunnie Cindo Raina Shari", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 31 },
  { nama: "Astrylia Rosiana Wulansary", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 32 },
  { nama: "Raditiana Fatmasari", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 33 },
  { nama: "Rina Kartini", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 34 },
  { nama: "Vita Indriani", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 35 },
  { nama: "Fitriani", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 36 },
  { nama: "Santi Nopita", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 37 },
  { nama: "Neng Siti Nurmala", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 38 },
  { nama: "Eva Nur'avyani", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 39 },
  { nama: "Siska Rachman", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 40 },
  { nama: "Lia Martiyanti", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 41 },
  { nama: "Vena Monica", tingkat: "imarah", subBidang: "Majelis Taklim Al-Kahfi", urutan: 42 },
  { nama: "Fahmi Gerald", tingkat: "imarah", subBidang: "BUMM (Bidang Usaha Milik Masjid)", urutan: 43 },
  { nama: "Sigit Jaelani", tingkat: "imarah", subBidang: "BUMM (Bidang Usaha Milik Masjid)", urutan: 44 },
  // VI. BIDANG RI'AYAH
  { nama: "Dian Zaini Arief", tingkat: "riayah", jabatan: "Koordinator Bidang", urutan: 1 },
  { nama: "Fahmi Gerald", tingkat: "riayah", subBidang: "Sarana & Prasarana (SARPAS)", urutan: 2 },
  { nama: "Muhammad Zamzam", tingkat: "riayah", subBidang: "Sarana & Prasarana (SARPAS)", urutan: 3 },
  { nama: "Irfan Januar", tingkat: "riayah", subBidang: "Kebersihan & Keindahan", urutan: 4 },
  { nama: "Tedi Surahman", tingkat: "riayah", subBidang: "Kebersihan & Keindahan", urutan: 5 },
  { nama: "Akhmad Syarif", tingkat: "riayah", subBidang: "Kebersihan & Keindahan", urutan: 6 },
  { nama: "Aep S", tingkat: "riayah", subBidang: "Keamanan", urutan: 7 },
  { nama: "Rian Sidik Permana", tingkat: "riayah", subBidang: "Keamanan", urutan: 8 },
  { nama: "Rijal", tingkat: "riayah", subBidang: "Keamanan", urutan: 9 },
  { nama: "Sinung Wahyono", tingkat: "riayah", subBidang: "Pengembangan Aset", urutan: 10 },
  { nama: "Yogi Yogaswara", tingkat: "riayah", subBidang: "Pengembangan Aset", urutan: 11 },
];

const DEFAULT_PROFIL = [
  {
    visi: "Menjadi masjid yang mandiri, makmur, serta melahirkan generasi rabbani yang berilmu, bertaqwa, berakhlak mulia, dan bermanfaat sosial di Kabupaten Bandung.",
    misi: "Menyelenggarakan kegiatan ibadah fardhu & sunnah secara istiqomah sesuai tuntunan Al-Qur'an dan Sunnah.\nMenyelenggarakan pendidikan agama (TPA, Kajian, Tahsin) yang terarah bagi semua kalangan usia.\nMengembangkan pengelolaan dana ziswaf yang produktif, transparan, dan berdaya guna tinggi bagi dhuafa.",
  },
];

const DEFAULT_FASILITAS = [
  {
    title: "Ruang Utama Sholat",
    desc: "Dilengkapi sajadah empuk, pendingin ruangan (AC), sound system berkualitas, menampung hingga 500 jamaah.",
    icon: "User",
  },
  {
    title: "Wudhu & Toilet Higienis",
    desc: "Fasilitas bersuci terpisah permanen antara ikhwan dan akhwat, air bersih bersih langsung dari mata air sumur dalam.",
    icon: "Droplet",
  },
  {
    title: "Ambulans Gratis 24 Jam",
    desc: "Siap siaga melayani kebutuhan gawat darurat dan pengantaran jenazah bagi warga Cikoneng tanpa biaya.",
    icon: "Ambulance",
  },
  {
    title: "Ruang Belajar & TPA",
    desc: "Wadah khusus pembelajaran TPA sore hari yang ramah anak, lengkap dengan koleksi kitab dan papan tulis interaktif.",
    icon: "BookOpen",
  },
  {
    title: "Area Parkir Ber-CCTV",
    desc: "Lahan parkir kendaraan roda dua dan empat yang aman, dikontrol dengan kamera CCTV pengawas 24 jam penuh.",
    icon: "Car",
  },
  {
    title: "Akses Wifi Hotspot",
    desc: "Layanan internet nirkabel gratis di area teras untuk mendukung operasional dawah digital dan administrasi santri.",
    icon: "Wifi",
  },
];

const DEFAULT_KONTAK = [
  {
    alamat: "Jl. Cikoneng No.15, Bojongsoang, Kab. Bandung 40288",
    hotline: "+62 812-3456-7890",
    email: "alkahfi.cikoneng@gmail.com",
    jamOperasional: "Setiap Hari: 08:00 - 20:00 WIB (Bada Isya)",
    googleMapsUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15840.403487310565!2d107.65886676342774!3d-6.985587799999991!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68c22755e378c3%3A0xe5a363717dfbbf5e!2sCikoneng%2C%20Bojongsoang%2C%20Bandung%20Regency%2C%20West%20Java!5e0!3m2!1sen!2sid!4v1700000000000",
  },
];

const DEFAULT_DONASI = [
  {
    namaRekening: "Bank Syariah Indonesia (BSI)",
    nomorRekening: "7123-4567-89",
    atasNamaRekening: "DKM AL-KAHFI CIKONENG",
    qrisImage:
      "https://placehold.co/400x400/ffffff/064e3b?text=QRIS+AL-KAHFI",
  },
];

const DEFAULT_BERITA = [
  {
    title:
      "Penyaluran Sembako Rutin Bulanan Bagi Janda dan Lansia Dhuafa Cikoneng",
    date: "15 Juni 2026",
    author: "Admin Sosial",
    tag: "Sosial",
    img: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300",
    desc: "Berkat kerjasama para muhsinin dan Baitul Mal Al-Kahfi, pekan lalu DKM telah berhasil mendistribusikan sebanyak 45 paket kebutuhan pokok untuk mengurangi beban perekonomian dhuafa di RT 03 dan RT 04 Cikoneng. Agenda rutin bulanan ini diharapkan mampu meringankan belanja sembako bulanan mereka di tengah inflasi harga sembako daerah Kabupaten Bandung. Pembagian berjalan dengan santun berkat bantuan para pemuda karang taruna dan panitia ikhwan DKM Al-Kahfi.",
  },
  {
    title: "Sinergi Pemuda Cikoneng dalam Agenda Bersih-bersih Masjid",
    date: "08 Juni 2026",
    author: "Ketua Pemuda",
    tag: "Kebersihan",
    img: "https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&q=80&w=300",
    desc: "DKM Al-Kahfi menggerakkan kerja bakti bersama puluhan pemuda lingkungan. Pembersihan difokuskan ke karpet utama ruang shalat serta parit luar guna mengantisipasi banjir genangan musim penghujan. Selain melatih kebersamaan antar warga dan pemuda, kebersihan fasilitas umum tempat beribadah diyakini membawa berkah ukhuwah serta menciptakan kenyamanan ekstra bagi para jamaah yang sholat.",
  },
  {
    title: "Kajian Akbar Keluarga Sakinah Sambut Tahun Baru Hijriyah",
    date: "01 Juni 2026",
    author: "Seksi Dakwah",
    tag: "Tarbiyah",
    img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=300",
    desc: "Kajian spesial yang diselenggarakan DKM dihadiri oleh ratusan ibu-ibu dan bapak-bapak Cikoneng. Menghadirkan narasumber utama Dr. KH. Mulyana membahas cara membangun keharmonisan rumah tangga di tengah tantangan teknologi modern yang melingkupi keseharian anak-anak zaman sekarang.",
  },
];

const DEFAULT_KEGIATAN = [
  {
    title: "Tahsin & Bimbingan Mengaji Quran Dewasa",
    type: "Harian",
    time: "Setiap Hari (Bada Subuh)",
    ust: "Ust. Sulaeman Al-Hafidz",
    status: "Aktif",
    desc: "Program pengentasan buta aksara Quran yang diorientasikan bagi bapak-bapak dan remaja pria di lingkungan Cikoneng. Dibimbing langsung secara privat & kelompok.",
    note: "Gratis & Terbuka",
    icon: "CircleUser",
    color: "bg-emerald-50 text-emerald-800",
  },
  {
    title: "Pelaksanaan Sholat Jum't Berjamaah",
    type: "Jum'at",
    time: "Setiap Jum'at (11:55 WIB)",
    ust: "Khotib Bergilir (DKM Al-Kahfi)",
    status: "Aktif",
    desc: "Jadwal bergilir penceramah/Khotib berkompeten yang mengedukasi jamaah secara moderat, membangkitkan ketaqwaan, dan bersandar pada keaslian literatur dalil shahih.",
    note: "Lantai Utama",
    icon: "Mic",
    color: "bg-gold-100 text-gold-800",
  },
  {
    title: "Taman Pendidikan Al-Qur'an (TPA) Anak",
    type: "Harian",
    time: "Senin & Kamis (Bada Ashar)",
    ust: "Ustadzah Khadijah & Tim",
    status: "Aktif",
    desc: "Wadah belajar anak usia dini hingga sekolah dasar di lingkungan Cikoneng guna mendalami adab harian, hafalan doa pendek, juz amma, dan cara penulisan huruf hijaiyah.",
    note: "Khusus Anak-anak",
    icon: "GraduationCap",
    color: "bg-emerald-50 text-emerald-800",
  },
  {
    title: "Penyelenggaraan Qurban Al-Kahfi",
    type: "Hari Besar",
    time: "Tentative (Hari Raya)",
    ust: "Panitia Qurban Bersama",
    status: "Nonaktif",
    desc: "Program pengumpulan, penyembelihan, dan pendistribusian daging hewan kurban secara modern, steril, tertib administrasi, dan dijamin adil bagi dhuafa Cikoneng.",
    note: "Halaman Samping",
    icon: "Gift",
    color: "bg-emerald-900 text-gold-300",
  },
];

const DEFAULT_GALERI = [
  {
    title: "Kajian Rutin",
    img: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300",
  },
  {
    title: "Pembagian Sembako",
    img: "https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&q=80&w=300",
  },
  {
    title: "Pengajian Ibu-ibu",
    img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=300",
  },
  {
    title: "Kerja Bakti",
    img: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=300",
  },
  {
    title: "TPA Anak",
    img: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=300",
  },
];

const SUPERADMIN_USER = {
  id: "superadmin-001",
  email: "superadmin@masjidalkahfi.test",
  name: "Superadmin DKM",
  role: "superadmin" as const,
  emailVerified: new Date(),
};

/** Menghasilkan hash bcrypt dari password teks biasa. */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** Fungsi utama seeding: membersihkan tabel lalu mengisi data awal (user, konten, pengaturan). */
async function main() {
  console.log("Seeding database...");

  // Clean tables
  await db.delete(berita);
  await db.delete(kegiatan);
  await db.delete(galeri);
  await db.delete(pengurus);
  await db.delete(profilMasjid);
  await db.delete(fasilitas);
  await db.delete(kontak);
  await db.delete(donasi);
  await db.delete(pengaturan);
  await db.delete(account); // Clean account before user (foreign key constraint)
  await db.delete(user);

  // Seed superadmin user
  console.log("Seeding superadmin user...");
  const hashedPassword = await hashPassword("Superadmin123!");
  await db.insert(user).values({
    ...SUPERADMIN_USER,
    emailVerified: true, // Set as boolean
  }).onConflictDoNothing(); // Avoid duplicate on re-seed

  // Seed credential account for superadmin
  // For Better Auth v1.6+, password is stored in account table for credential auth
  console.log("Seeding credential account for superadmin...");
  await db.insert(account).values({
    id: `${SUPERADMIN_USER.id}-credential`,
    accountId: SUPERADMIN_USER.email, // Account ID = email for credential auth
    providerId: "credential", // Provider ID for email/password auth
    userId: SUPERADMIN_USER.id,
    password: hashedPassword, // Password stored in account table
  }).onConflictDoNothing(); // Avoid duplicate on re-seed

  // Insert Berita
  console.log("Seeding berita...");
  // Sertakan slug unik (tanpa id) pada setiap berita seed agar URL bersih.
  const seedSlugs: string[] = [];
  const beritaWithSlug = DEFAULT_BERITA.map((b) => {
    const slug = uniqueSlug(slugify(b.title), seedSlugs);
    seedSlugs.push(slug);
    return { ...b, slug };
  });
  await db.insert(berita).values(beritaWithSlug);

  // Insert Kegiatan
  console.log("Seeding kegiatan...");
  await db.insert(kegiatan).values(DEFAULT_KEGIATAN);

  // Insert Galeri
  console.log("Seeding galeri...");
  await db.insert(galeri).values(DEFAULT_GALERI);

  // Insert Pengurus (struktur hierarki baru)
  console.log("Seeding pengurus...");
  await db.insert(pengurus).values(
    DEFAULT_PENGURUS.map((p) => ({
      nama: p.nama,
      foto: avatar(p.nama),
      tingkat: p.tingkat,
      jabatan: p.jabatan ?? null,
      subBidang: p.subBidang ?? null,
      urutan: p.urutan,
    }))
  );

  // Insert Profil
  console.log("Seeding profil...");
  await db.insert(profilMasjid).values(DEFAULT_PROFIL);

  // Insert Fasilitas
  console.log("Seeding fasilitas...");
  await db.insert(fasilitas).values(DEFAULT_FASILITAS);

  // Insert Kontak
  console.log("Seeding kontak...");
  await db.insert(kontak).values(DEFAULT_KONTAK);

  // Insert Donasi
  console.log("Seeding donasi...");
  await db.insert(donasi).values(DEFAULT_DONASI);

  // Insert Pengaturan (running text)
  console.log("Seeding pengaturan...");
  await db.insert(pengaturan).values({
    key: "running_text",
    value: DEFAULT_RUNNING_TEXT,
  });

  console.log("Database seeded successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
