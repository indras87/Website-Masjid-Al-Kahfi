import React from 'react';
import Sidebar from './components/Sidebar';

export const metadata = {
  title: 'Admin Dashboard - Masjid Al-Kahfi',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col md:h-screen overflow-hidden relative">
        <header className="bg-white border-b border-gray-200 h-16 flex-shrink-0 flex items-center justify-between px-6 shadow-sm z-10">
           <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">Sistem Manajemen Konten</h1>
           <h1 className="text-xl font-semibold text-gray-800 sm:hidden">CMS</h1>
           <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800">Admin Utama</p>
                <p className="text-xs text-gray-500">Superadmin</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-bold border-2 border-emerald-500 shadow-sm">
                 A
              </div>
           </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
           {children}
        </div>
      </main>
    </div>
  );
}
