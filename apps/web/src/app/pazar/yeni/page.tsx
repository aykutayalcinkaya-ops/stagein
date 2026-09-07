'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Tag, LayoutGrid, Wrench, Banknote, FileText, ImagePlus, X } from 'lucide-react';
import { CITIES, MARKETPLACE_CATEGORIES, CONDITION_LABELS } from '@stagein/shared';
import type { MarketplaceItem } from '@stagein/shared';
import { useCreateMarketplaceItem } from '@/hooks/useMarketplace';
import { uploadMarketplacePhoto } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui';

const inputClass =
  'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text outline-none transition-colors duration-150 placeholder:text-muted focus:border-primary';
const sectionClass = 'rounded-xl border border-border bg-card p-6';
const labelClass = 'mb-3 block text-lg font-bold text-text';

export default function NewMarketplaceItemPage() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const { mutateAsync: createMarketplaceItem, isPending, error } = useCreateMarketplaceItem();
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && userId === null) router.replace('/giris');
  }, [isAuthLoading, userId, router]);

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

  const photoPreviews = useMemo(() => formData.photos.map((file) => URL.createObjectURL(file)), [formData.photos]);
  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoPreviews]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;

    setIsUploadingPhotos(true);
    let photoUrls: string[];
    try {
      photoUrls = await Promise.all(formData.photos.map((file) => uploadMarketplacePhoto(userId, file)));
    } finally {
      setIsUploadingPhotos(false);
    }

    await createMarketplaceItem({
      seller_id: userId,
      title: formData.title,
      description: formData.description,
      photos: photoUrls,
      price: Number(formData.price),
      city: formData.city,
      brand: formData.brand || null,
      model: formData.model || null,
      condition: formData.condition as NonNullable<MarketplaceItem['condition']>,
      category: formData.category,
      is_open_to_trade: formData.isOpenToTrade,
    });
    router.push('/pazar');
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-2xl"
      >
        <h1 className="mb-8 text-4xl font-bold text-text">Ekipman Sat</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Başlık */}
          <div className={sectionClass}>
            <label className={`${labelClass} flex items-center gap-2`}>
              <Tag className="h-4 w-4 text-primary" strokeWidth={1.8} aria-hidden="true" />
              Ürün Başlığı
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Örn: Fender Stratocaster 1998..."
              required
              className={inputClass}
            />
          </div>

          {/* Kategori */}
          <div className={sectionClass}>
            <label className={labelClass}>Kategori</label>
            <select name="category" value={formData.category} onChange={handleChange} className={inputClass}>
              {MARKETPLACE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Teknik Özellikler */}
          <div className={`${sectionClass} space-y-4`}>
            <h2 className="text-lg font-bold text-text">Teknik Özellikler</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">Marka</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Örn: Fender"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="Örn: Stratocaster"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">Üretim Yılı</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min={1950}
                  max={new Date().getFullYear()}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">Durum</label>
                <select name="condition" value={formData.condition} onChange={handleChange} className={inputClass}>
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
          <div className={`${sectionClass} space-y-4`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">Fiyat (₺)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="2500"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">Şehir</label>
                <select name="city" value={formData.city} onChange={handleChange} required className={inputClass}>
                  <option value="">-- Şehir Seç --</option>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                name="isOpenToTrade"
                checked={formData.isOpenToTrade}
                onChange={handleChange}
                className="h-4 w-4 rounded border-border-strong bg-surface accent-primary"
              />
              <span className="text-text-secondary">Takas yapabilirim</span>
            </label>
          </div>

          {/* Açıklama */}
          <div className={sectionClass}>
            <label className={labelClass}>Açıklama</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Ürünün durumu, özellikleri ve kullanım alanı hakkında bilgi verin..."
              rows={6}
              required
              className={inputClass}
            />
          </div>

          {/* Fotoğraflar */}
          <div className={sectionClass}>
            <label className="mb-4 block text-lg font-bold text-text">Fotoğraflar</label>
            <div className="mb-4 cursor-pointer rounded-lg border-2 border-dashed border-border-strong p-6 text-center transition-colors duration-150 hover:border-primary/60">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-input"
              />
              <label htmlFor="photo-input" className="cursor-pointer">
                <p className="font-medium text-text">Fotoğraf yüklemek için tıklayın</p>
                <p className="text-sm text-muted">veya sürükle bırak</p>
              </label>
            </div>

            {/* Yüklenen Fotoğraflar */}
            {formData.photos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-secondary">
                  Yüklenen Fotoğraflar ({formData.photos.length})
                </p>
                <div className="space-y-2">
                  {formData.photos.map((photo, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-surface p-3">
                      <span className="truncate text-sm text-text-secondary">{photo.name}</span>
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="min-h-11 shrink-0 px-2 text-sm font-medium text-red-400 hover:text-red-300"
                      >
                        Kaldır
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error ? (
            <p className="text-sm text-red-400">{error instanceof Error ? error.message : 'Ürün oluşturulamadı'}</p>
          ) : null}

          {/* Butonlar */}
          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isPending || isUploadingPhotos || !userId}
              className="flex-1"
            >
              {isUploadingPhotos ? 'Fotoğraflar yükleniyor…' : isPending ? 'Yayınlanıyor…' : 'Ürünü Yayınla'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1">
              İptal
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
