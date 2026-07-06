import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    // Validasi Sisi Server (Maksimal 2MB)
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Ukuran file melebihi batas 2MB' }, { status: 400 });
    }

    // Validasi tipe mime gambar yang diperbolehkan
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Tipe file tidak valid. Hanya JPG, PNG, WEBP, dan GIF yang diperbolehkan'
      }, { status: 400 });
    }

    // Konversi file stream menjadi buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ambil nama file asli dan bersihkan dari karakter berbahaya
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    // Tambahkan timestamp unik di awal nama file
    const timestamp = Date.now();
    const filename = `${timestamp}_${originalName}`;

    // Lokasi folder tujuan: /public/uploads
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // Buat foldernya jika belum ada
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Tulis buffer file ke disk
    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    // Return URL publik yang dapat diakses static oleh Next.js
    const fileUrl = `/uploads/${filename}`;
    return NextResponse.json({ url: fileUrl }, { status: 200 });

  } catch (error: any) {
    console.error('Error saat upload file:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
