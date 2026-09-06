'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ListingType } from '@stagein/shared';
import { CITIES, INSTRUMENTS, GENRES, LISTING_TYPE_LABELS } from '@stagein/shared';

export default function NewListingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<{
    title: string;
    type: ListingType;
    description: string;
    city: string;
    instruments: string[];
    genres: string[];
    isPaid: boolean;
    budgetMin: string;
    budgetMax: string;
    eventDate: string;
    venueName: string;
  }>({
    title: '',
    type: 'band',
    description: '',
    city: '',
    instruments: [],
    genres: [],
    isPaid: false,
    budgetMin: '',
    budgetMax: '',
    eventDate: '',
    venueName: '',
  });

  const listingTypes = Object.entries(LISTING_TYPE_LABELS).map(([key, label]) => ({
    value: key,
    label,
  }));

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

  const toggleInstrument = (instrument: string): void => {
    setFormData((prev) => ({
      ...prev,
      instruments: prev.instruments.includes(instrument)
        ? prev.instruments.filter((i) => i !== instrument)
        : [...prev.instruments, instrument],
    }));
  };

  const toggleGenre = (genre: string): void => {
    setFormData((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    console.log('İlan oluşturuluyor:', formData);
    // API çağrısı yapılacak
    alert('İlan başarıyla oluşturuldu!');
    router.push('/ilanlar');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Yeni İlan Oluştur</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Başlık */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <label className="block text-lg font-bold text-gray-900 mb-3">
              İlan Başlığı
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Örn: Grup bulmak için davulcu arıyorum..."
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tür */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <label className="block text-lg font-bold text-gray-900 mb-3">
              İlan Türü
            </label>
            <div className="grid grid-cols-2 gap-3">
              {listingTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: type.value as any }))}
                  className={`p-3 rounded-lg border-2 transition text-left font-medium ${
                    formData.type === type.value
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Şehir */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <label className="block text-lg font-bold text-gray-900 mb-3">
              Şehir
            </label>
            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Şehir Seç --</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Enstrümanlar */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <label className="block text-lg font-bold text-gray-900 mb-4">
              Enstrümanlar
            </label>
            <div className="grid grid-cols-2 gap-3">
              {INSTRUMENTS.map((instrument) => (
                <label key={instrument} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.instruments.includes(instrument)}
                    onChange={() => toggleInstrument(instrument)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-700">{instrument}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Türler */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <label className="block text-lg font-bold text-gray-900 mb-4">
              Müzik Türleri
            </label>
            <div className="grid grid-cols-2 gap-3">
              {GENRES.map((genre) => (
                <label key={genre} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.genres.includes(genre)}
                    onChange={() => toggleGenre(genre)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-700">{genre}</span>
                </label>
              ))}
            </div>
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
              placeholder="İlanınızı detaylı bir şekilde anlatın..."
              rows={6}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Ücretli Seçenek */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isPaid"
                checked={formData.isPaid}
                onChange={handleChange}
                className="w-4 h-4 rounded"
              />
              <span className="text-lg font-bold text-gray-900">Ücretli İş</span>
            </label>

            {formData.isPaid && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Bütçe (₺)
                  </label>
                  <input
                    type="number"
                    name="budgetMin"
                    value={formData.budgetMin}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maksimum Bütçe (₺)
                  </label>
                  <input
                    type="number"
                    name="budgetMax"
                    value={formData.budgetMax}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Etkinlik Tarihi (Venue Tipi İçin) */}
          {(formData.type as ListingType) === 'venue' && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
              <div>
                <label className="block text-lg font-bold text-gray-900 mb-3">
                  Mekan Adı
                </label>
                <input
                  type="text"
                  name="venueName"
                  value={formData.venueName}
                  onChange={handleChange}
                  placeholder="Örn: Babylon, Zorlu Performans Sanatları Merkezi..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-900 mb-3">
                  Etkinlik Tarihi
                </label>
                <input
                  type="datetime-local"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Butonlar */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              İlan Oluştur
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
