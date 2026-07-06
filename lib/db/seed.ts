import { db } from './index';
import { berita, kegiatan, galeri } from './schema';

const DEFAULT_BERITA = [
  {
    title: 'Penyaluran Sembako Rutin Bulanan Bagi Janda dan Lansia Dhuafa Cikoneng',
    date: '15 Juni 2026',
    author: 'Admin Sosial',
    tag: 'Sosial',
    img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300',
    desc: 'Berkat kerjasama para muhsinin dan Baitul Mal Al-Kahfi, pekan lalu DKM telah berhasil mendistribusikan sebanyak 45 paket kebutuhan pokok untuk mengurangi beban perekonomian dhuafa di RT 03 dan RT 04 Cikoneng. Agenda rutin bulanan ini diharapkan mampu meringankan belanja sembako bulanan mereka di tengah inflasi harga sembako daerah Kabupaten Bandung. Pembagian berjalan dengan santun berkat bantuan para pemuda karang taruna dan panitia ikhwan DKM Al-Kahfi.'
  },
  {
    title: 'Sinergi Pemuda Cikoneng dalam Agenda Bersih-bersih Masjid',
    date: '08 Juni 2026',
    author: 'Ketua Pemuda',
    tag: 'Kebersihan',
    img: 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&q=80&w=300',
    desc: 'DKM Al-Kahfi menggerakkan kerja bakti bersama puluhan pemuda lingkungan. Pembersihan difokuskan ke karpet utama ruang shalat serta parit luar guna mengantisipasi banjir genangan musim penghujan. Selain melatih kebersamaan antar warga dan pemuda, kebersihan fasilitas umum tempat beribadah diyakini membawa berkah ukhuwah serta menciptakan kenyamanan ekstra bagi para jamaah yang sholat.'
  },
  {
    title: 'Kajian Akbar Keluarga Sakinah Sambut Tahun Baru Hijriyah',
    date: '01 Juni 2026',
    author: 'Seksi Dakwah',
    tag: 'Tarbiyah',
    img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=300',
    desc: 'Kajian spesial yang diselenggarakan DKM dihadiri oleh ratusan ibu-ibu dan bapak-bapak Cikoneng. Menghadirkan narasumber utama Dr. KH. Mulyana membahas cara membangun keharmonisan rumah tangga di tengah tantangan teknologi modern yang melingkupi keseharian anak-anak zaman sekarang.'
  }
];

const DEFAULT_KEGIATAN = [
  {
    title: 'Tahsin & Bimbingan Mengaji Quran Dewasa',
    type: 'Harian',
    time: 'Setiap Hari (Bada Subuh)',
    ust: 'Ust. Sulaeman Al-Hafidz',
    status: 'Aktif',
    desc: 'Program pengentasan buta aksara Quran yang diorientasikan bagi bapak-bapak dan remaja pria di lingkungan Cikoneng. Dibimbing langsung secara privat & kelompok.',
    note: 'Gratis & Terbuka',
    icon: 'CircleUser',
    color: 'bg-emerald-50 text-emerald-800'
  },
  {
    title: 'Pelaksanaan Sholat Jum\'t Berjamaah',
    type: 'Jum\'at',
    time: 'Setiap Jum\'at (11:55 WIB)',
    ust: 'Khotib Bergilir (DKM Al-Kahfi)',
    status: 'Aktif',
    desc: 'Jadwal bergilir penceramah/Khotib berkompeten yang mengedukasi jamaah secara moderat, membangkitkan ketaqwaan, dan bersandar pada keaslian literatur dalil shahih.',
    note: 'Lantai Utama',
    icon: 'Mic',
    color: 'bg-gold-100 text-gold-800'
  },
  {
    title: 'Taman Pendidikan Al-Qur\'an (TPA) Anak',
    type: 'Harian',
    time: 'Senin & Kamis (Bada Ashar)',
    ust: 'Ustadzah Khadijah & Tim',
    status: 'Aktif',
    desc: 'Wadah belajar anak usia dini hingga sekolah dasar di lingkungan Cikoneng guna mendalami adab harian, hafalan doa pendek, juz amma, dan cara penulisan huruf hijaiyah.',
    note: 'Khusus Anak-anak',
    icon: 'GraduationCap',
    color: 'bg-emerald-50 text-emerald-800'
  },
  {
    title: 'Penyelenggaraan Qurban Al-Kahfi',
    type: 'Hari Besar',
    time: 'Tentative (Hari Raya)',
    ust: 'Panitia Qurban Bersama',
    status: 'Nonaktif',
    desc: 'Program pengumpulan, penyembelihan, dan pendistribusian daging hewan kurban secara modern, steril, tertib administrasi, dan dijamin adil bagi dhuafa Cikoneng.',
    note: 'Halaman Samping',
    icon: 'Gift',
    color: 'bg-emerald-900 text-gold-300'
  }
];

const DEFAULT_GALERI = [
  { title: 'Kajian Rutin', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300' },
  { title: 'Pembagian Sembako', img: 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&q=80&w=300' },
  { title: 'Pengajian Ibu-ibu', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=300' },
  { title: 'Kerja Bakti', img: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=300' },
  { title: 'TPA Anak', img: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=300' }
];

async function main() {
  console.log('Seeding database...');
  
  // Clean tables
  await db.delete(berita);
  await db.delete(kegiatan);
  await db.delete(galeri);

  // Insert Berita
  console.log('Seeding berita...');
  await db.insert(berita).values(DEFAULT_BERITA);

  // Insert Kegiatan
  console.log('Seeding kegiatan...');
  await db.insert(kegiatan).values(DEFAULT_KEGIATAN);

  // Insert Galeri
  console.log('Seeding galeri...');
  await db.insert(galeri).values(DEFAULT_GALERI);

  console.log('Database seeded successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
