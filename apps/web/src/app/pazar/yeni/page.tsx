'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CITIES, MARKETPLACE_CATEGORIES, CONDITION_LABELS } from '@stagein/shared';

export default function NewMarketplaceItemPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'electric-guitar',
    condition: 'very_good',
    price: '',
    city: '',
    isOpenToTrade: false,
    photos: [] as File[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const { name, value } = target;
    const isCheckbox = (target as HTMLInputElement).type === 'checkbox';
    const checked = (target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...Array.from(e.target.files || [])],
      }));
    }
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Ürün oluşturuluyor:', formData);
    alert('Ürün başarıyla oluşturuldu!');
    router.push('/pazar');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Ekipman Sat</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Başlık */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <label className="block text-lg font-bold text-gray-900 mb-3">
              Ürün Başlığı
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Örn: Fender Stratocaster 1998..."
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Kategori */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <label className="block text-lg font-bold text-gray-900 mb-3">
              Kategori
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MARKETPLACE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Teknik Özellikler */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Teknik Özellikler</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marka
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Örn: Fender"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="Örn: Stratocaster"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Üretim Yılı
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min={1950}
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durum
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Fiyat & Şehir */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fiyat (₺)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="2500"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şehir
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Şehir Seç --</option>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isOpenToTrade"
                checked={formData.isOpenToTrade}
                onChange={handleChange}
                className="w-4 h-4 rounded"
              />
              <span className="text-gray-700">Takas yapabilirim</span>
            </label>
          </div>

          {/* Açıklama */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <label className="block text-lg font-bold text-gray-900 mb-3">
              Açıklama
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Ürünün durumu, özellikleri ve kullanım alanı hakkında bilgi verin..."
              rows={6}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fotoğraflar */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <label className="block text-lg font-bold text-gray-900 mb-4">
              Fotoğraflar
            </label>
            <div className="mb-4 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-gray-400 transition">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-input"
              />
              <label htmlFor="photo-input" className="cursor-pointer">
                <p className="text-gray-700 font-medium">Fotoğraf yüklemek için tıklayın</p>
                <p className="text-sm text-gray-500">veya sürükle bırak</p>
              </label>
            </div>

            {/* Yüklenen Fotoğraflar */}
            {formData.photos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Yüklenen Fotoğraflar ({formData.photos.length})</p>
                <div className="space-y-2">
                  {formData.photos.map((photo, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">{photo.name}</span>
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Kaldır
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Butonlar */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Ürünü Yayınla
            </button>
            <button
              type="button"
              onClick={() => router.back()}
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
