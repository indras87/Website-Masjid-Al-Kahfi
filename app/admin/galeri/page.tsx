import React from 'react';
import { Plus, Trash2, Search, Filter } from 'lucide-react';
import Image from 'next/image';

// Simulasi koneksi database (mudah diubah ke Prisma/Drizzle/Cloud SQL nantinya)
async function getGaleriData() {
  return [
    { id: 1, title: 'Kajian Rutin', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300' },
    { id: 2, title: 'Pembagian Sembako', img: 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&q=80&w=300' },
    { id: 3, title: 'Pengajian Ibu-ibu', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=300' },
    { id: 4, title: 'Kerja Bakti', img: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=300' },
    { id: 5, title: 'TPA Anak', img: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=300' }
  ];
}

export default async function AdminGaleri() {
  const dummyData = await getGaleriData();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kelola Galeri</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola dokumentasi foto kegiatan masjid.</p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm hover:shadow-md w-full sm:w-auto justify-center">
          <Plus size={18} /> Unggah Foto
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <div className="relative w-full sm:w-72">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input type="text" placeholder="Cari foto..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white" />
          </div>
          <button className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 w-full sm:w-auto justify-center">
             <Filter size={16}/> Filter
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {dummyData.map(item => (
            <div key={item.id} className="group relative rounded-xl overflow-hidden border border-gray-200 aspect-square">
              <Image src={item.img} alt={item.title} fill className="object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-3">
                 <p className="text-white text-xs font-semibold truncate mb-2">{item.title}</p>
                 <button className="bg-red-500 hover:bg-red-600 text-white p-2 rounded flex items-center justify-center transition">
                   <Trash2 size={14} />
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
