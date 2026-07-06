'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  HandCoins,
  Loader2,
  MapPin,
  Save,
  Trash2,
} from 'lucide-react';
import ImageUpload from '@/app/admin/components/ImageUpload';

type ContactForm = {
  alamat: string;
  hotline: string;
  email: string;
  jamOperasional: string;
  googleMapsUrl: string;
};

type DonationForm = {
  namaRekening: string;
  nomorRekening: string;
  atasNamaRekening: string;
  qrisImage: string;
};

const EMPTY_CONTACT: ContactForm = {
  alamat: '',
  hotline: '',
  email: '',
  jamOperasional: '',
  googleMapsUrl: '',
};

const EMPTY_DONATION: DonationForm = {
  namaRekening: '',
  nomorRekening: '',
  atasNamaRekening: '',
  qrisImage: '',
};

export default function AdminKontakDonasi() {
  const [contact, setContact] = useState<ContactForm>(EMPTY_CONTACT);
  const [donation, setDonation] = useState<DonationForm>(EMPTY_DONATION);
  const [loading, setLoading] = useState(true);
  const [savingContact, setSavingContact] = useState(false);
  const [savingDonation, setSavingDonation] = useState(false);
  const [deletingContact, setDeletingContact] = useState(false);
  const [deletingDonation, setDeletingDonation] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contactRes, donationRes] = await Promise.all([
        fetch('/api/kontak'),
        fetch('/api/donasi'),
      ]);

      if (contactRes.ok) {
        const contactJson = await contactRes.json();
        setContact({
          alamat: contactJson.alamat || '',
          hotline: contactJson.hotline || '',
          email: contactJson.email || '',
          jamOperasional: contactJson.jamOperasional || '',
          googleMapsUrl: contactJson.googleMapsUrl || '',
        });
      }

      if (donationRes.ok) {
        const donationJson = await donationRes.json();
        setDonation({
          namaRekening: donationJson.namaRekening || '',
          nomorRekening: donationJson.nomorRekening || '',
          atasNamaRekening: donationJson.atasNamaRekening || '',
          qrisImage: donationJson.qrisImage || '',
        });
      }
    } catch (error) {
      console.error('Gagal memuat data kontak/donasi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contact.alamat || !contact.hotline || !contact.email || !contact.jamOperasional || !contact.googleMapsUrl) {
      alert('Semua field kontak wajib diisi.');
      return;
    }

    try {
      setSavingContact(true);
      const res = await fetch('/api/kontak', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });

      if (res.ok) {
        alert('Data kontak berhasil disimpan.');
        const updated = await res.json();
        setContact({
          alamat: updated.alamat || '',
          hotline: updated.hotline || '',
          email: updated.email || '',
          jamOperasional: updated.jamOperasional || '',
          googleMapsUrl: updated.googleMapsUrl || '',
        });
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menyimpan data kontak.');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menyimpan kontak.');
    } finally {
      setSavingContact(false);
    }
  };

  const handleSaveDonation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!donation.namaRekening || !donation.nomorRekening || !donation.atasNamaRekening || !donation.qrisImage) {
      alert('Semua field donasi wajib diisi.');
      return;
    }

    try {
      setSavingDonation(true);
      const res = await fetch('/api/donasi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donation),
      });

      if (res.ok) {
        alert('Data donasi berhasil disimpan.');
        const updated = await res.json();
        setDonation({
          namaRekening: updated.namaRekening || '',
          nomorRekening: updated.nomorRekening || '',
          atasNamaRekening: updated.atasNamaRekening || '',
          qrisImage: updated.qrisImage || '',
        });
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menyimpan data donasi.');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menyimpan donasi.');
    } finally {
      setSavingDonation(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!confirm('Hapus semua data kontak dan kembalikan ke default?')) {
      return;
    }

    try {
      setDeletingContact(true);
      const res = await fetch('/api/kontak', { method: 'DELETE' });

      if (res.ok) {
        alert('Data kontak berhasil dihapus.');
        setContact(EMPTY_CONTACT);
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menghapus data kontak.');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menghapus kontak.');
    } finally {
      setDeletingContact(false);
    }
  };

  const handleDeleteDonation = async () => {
    if (!confirm('Hapus semua data donasi dan kembalikan ke default?')) {
      return;
    }

    try {
      setDeletingDonation(true);
      const res = await fetch('/api/donasi', { method: 'DELETE' });

      if (res.ok) {
        alert('Data donasi berhasil dihapus.');
        setDonation(EMPTY_DONATION);
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menghapus data donasi.');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menghapus donasi.');
    } finally {
      setDeletingDonation(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Kontak & Donasi</h2>
        <p className="text-sm text-gray-500 mt-1">
          Kelola data kontak masjid dan informasi rekening donasi dari satu tempat.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-500">
          Memuat data CMS...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <form onSubmit={handleSaveContact} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">CMS Kontak</h3>
                <p className="text-sm text-gray-500">Alamat, hotline, email, jam operasional, dan maps.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Alamat</label>
                <textarea
                  value={contact.alamat}
                  onChange={(e) => setContact({ ...contact, alamat: e.target.value })}
                  className="w-full min-h-24 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Hotline</label>
                  <input
                    value={contact.hotline}
                    onChange={(e) => setContact({ ...contact, hotline: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Jam Operasional Kantor</label>
                <input
                  value={contact.jamOperasional}
                  onChange={(e) => setContact({ ...contact, jamOperasional: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Google Maps URL</label>
                <textarea
                  value={contact.googleMapsUrl}
                  onChange={(e) => setContact({ ...contact, googleMapsUrl: e.target.value })}
                  className="w-full min-h-28 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={savingContact}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm hover:shadow-md"
              >
                {savingContact ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Simpan Kontak
              </button>
              <button
                type="button"
                onClick={handleDeleteContact}
                disabled={deletingContact}
                className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition disabled:opacity-60"
              >
                {deletingContact ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Hapus Kontak
              </button>
            </div>
          </form>

          <form onSubmit={handleSaveDonation} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <HandCoins size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">CMS Donasi / Infaq</h3>
                <p className="text-sm text-gray-500">Kelola rekening transfer dan gambar QRIS.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Nama Rekening</label>
                <input
                  value={donation.namaRekening}
                  onChange={(e) => setDonation({ ...donation, namaRekening: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Nomor Rekening</label>
                <input
                  value={donation.nomorRekening}
                  onChange={(e) => setDonation({ ...donation, nomorRekening: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Atas Nama Rekening</label>
                <input
                  value={donation.atasNamaRekening}
                  onChange={(e) => setDonation({ ...donation, atasNamaRekening: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
              <ImageUpload
                value={donation.qrisImage}
                onChange={(url) => setDonation({ ...donation, qrisImage: url })}
                label="Gambar QRIS"
              />
              {donation.qrisImage && (
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                  <div className="relative aspect-square w-full max-w-sm mx-auto">
                    <Image
                      src={donation.qrisImage}
                      alt="Preview QRIS"
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={savingDonation}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm hover:shadow-md"
              >
                {savingDonation ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Simpan Donasi
              </button>
              <button
                type="button"
                onClick={handleDeleteDonation}
                disabled={deletingDonation}
                className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition disabled:opacity-60"
              >
                {deletingDonation ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Hapus Donasi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
