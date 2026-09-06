'use client';

import { useState } from 'react';
import { Metadata } from 'next';

export default function NewGigPage() {
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    requirements: '',
    basicPrice: '',
    basicDays: 7,
    basicRevisions: 1,
    standardPrice: '',
    standardDays: 5,
    standardRevisions: 3,
    premiumPrice: '',
    premiumDays: 3,
    premiumRevisions: 999,
  });

  const categories = [
    { id: 'mix-mastering', name: 'Mix & Mastering' },
    { id: 'beat-production', name: 'Müzik Prodüksiyonu & Beste' },
    { id: 'session-musician', name: 'Enstrüman & Session Kayıt' },
    { id: 'voiceover', name: 'Seslendirme & Dublaj' },
    { id: 'songwriting', name: 'Şarkı Sözü & Beste' },
    { id: 'audio-editing', name: 'Ses Düzenleme & Restorasyon' },
    { id: 'lessons', name: 'Müzik Dersi & Danışmanlık' },
  ];

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log('Form gönderiliyor:', formData);
    alert('İlan oluşturma işlemi devam edecek.');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Yeni Hizmet İlanı Oluştur</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Kategori */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <label className="block text-lg font-bold text-gray-900 mb-3">
              Kategori Seç
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Kategori Seç --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* İlan Başlığı */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <label className="block text-lg font-bold text-gray-900 mb-3">
              İlan Başlığı
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Format: "Ben, [hizmetin] yapabilirim."
            </p>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ben, şarkınızın profesyonel mix & mastering işlemlerini yapabilirim."
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Açıklama */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <label className="block text-lg font-bold text-gray-900 mb-3">
              Detaylı Açıklama
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Hizmetinizin detaylarını, özellikleri ve deneyiminizi yazın..."
              required
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Gereksinimler */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <label className="block text-lg font-bold text-gray-900 mb-3">
              Müşteriden Istenecekler
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="Örn: Ses dosyalarını WAV formatında, 44.1kHz örnekleme oranında gönderin..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 3 Kademeli Paketler */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">3 Kademeli Paketler</h2>

            {/* Başlangıç Paketi */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-lg text-gray-900 mb-4">📦 Başlangıç Paketi</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fiyat (₺)
                  </label>
                  <input
                    type="number"
                    name="basicPrice"
                    value={formData.basicPrice}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teslimat (gün)
                  </label>
                  <input
                    type="number"
                    name="basicDays"
                    value={formData.basicDays}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Standart Paketi */}
            <div className="mb-8 p-4 bg-green-50 rounded-lg">
              <h3 className="font-bold text-lg text-gray-900 mb-4">⭐ Standart Paketi</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fiyat (₺)
                  </label>
                  <input
                    type="number"
                    name="standardPrice"
                    value={formData.standardPrice}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teslimat (gün)
                  </label>
                  <input
                    type="number"
                    name="standardDays"
                    value={formData.standardDays}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Premium Paketi */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-bold text-lg text-gray-900 mb-4">👑 Premium Paketi</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fiyat (₺)
                  </label>
                  <input
                    type="number"
                    name="premiumPrice"
                    value={formData.premiumPrice}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teslimat (gün)
                  </label>
                  <input
                    type="number"
                    name="premiumDays"
                    value={formData.premiumDays}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              İlan Oluştur
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-3 px-6 rounded-lg transition"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
