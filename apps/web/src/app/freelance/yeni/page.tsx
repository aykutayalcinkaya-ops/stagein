'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Package, Star, Crown } from 'lucide-react';
import { FREELANCE_CATEGORIES } from '@stagein/shared';
import { Button } from '@/components/ui';
import { useCreateFreelanceGig } from '@/hooks/useFreelance';
import { useAuthStore } from '@/stores/authStore';

const inputClass =
  'w-full rounded-lg border border-border bg-surface px-4 py-2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary';

export default function NewGigPage() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const { mutateAsync: createFreelanceGig, isPending, error } = useCreateFreelanceGig();

  useEffect(() => {
    if (!isAuthLoading && userId === null) router.replace('/giris');
  }, [isAuthLoading, userId, router]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;

    const gig = await createFreelanceGig({
      seller_id: userId,
      category_id: formData.category,
      title: formData.title,
      description: formData.description,
      requirements: formData.requirements || null,
      packages: [
        {
          tier: 'basic',
          title: 'Başlangıç Paketi',
          price: Number(formData.basicPrice),
          delivery_days: Number(formData.basicDays),
          revisions_count: Number(formData.basicRevisions),
        },
        {
          tier: 'standard',
          title: 'Standart Paket',
          price: Number(formData.standardPrice),
          delivery_days: Number(formData.standardDays),
          revisions_count: Number(formData.standardRevisions),
        },
        {
          tier: 'premium',
          title: 'Premium Paket',
          price: Number(formData.premiumPrice),
          delivery_days: Number(formData.premiumDays),
          revisions_count: Number(formData.premiumRevisions),
        },
      ],
    });
    router.push(`/freelance/${gig.id}`);
  };

  return (
    <div className="min-h-screen bg-dark px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-3xl"
      >
        <h1 className="mb-8 text-4xl font-bold text-text">Yeni Hizmet İlanı Oluştur</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Kategori */}
          <div className="rounded-lg border border-border bg-card p-6">
            <label className="mb-3 block text-lg font-bold text-text">
              Kategori Seç
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="">-- Kategori Seç --</option>
              {FREELANCE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* İlan Başlığı */}
          <div className="rounded-lg border border-border bg-card p-6">
            <label className="mb-3 block text-lg font-bold text-text">
              İlan Başlığı
            </label>
            <p className="mb-3 text-sm text-text-secondary">
              Format: &quot;Ben, [hizmetin] yapabilirim.&quot;
            </p>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ben, şarkınızın profesyonel mix &amp; mastering işlemlerini yapabilirim."
              required
              className={inputClass}
            />
          </div>

          {/* Açıklama */}
          <div className="rounded-lg border border-border bg-card p-6">
            <label className="mb-3 block text-lg font-bold text-text">
              Detaylı Açıklama
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Hizmetinizin detaylarını, özellikleri ve deneyiminizi yazın..."
              required
              rows={6}
              className={inputClass}
            />
          </div>

          {/* Gereksinimler */}
          <div className="rounded-lg border border-border bg-card p-6">
            <label className="mb-3 block text-lg font-bold text-text">
              Müşteriden Istenecekler
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="Örn: Ses dosyalarını WAV formatında, 44.1kHz örnekleme oranında gönderin..."
              rows={4}
              className={inputClass}
            />
          </div>

          {/* 3 Kademeli Paketler */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-6 text-2xl font-bold text-text">3 Kademeli Paketler</h2>

            {/* Başlangıç Paketi */}
            <div className="mb-8 rounded-lg bg-primary/10 p-4">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-text">
                <Package className="h-5 w-5 text-primary" strokeWidth={1.8} aria-hidden="true" />
                Başlangıç Paketi
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
                    Fiyat (₺)
                  </label>
                  <input
                    type="number"
                    name="basicPrice"
                    value={formData.basicPrice}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
                    Teslimat (gün)
                  </label>
                  <input
                    type="number"
                    name="basicDays"
                    value={formData.basicDays}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Standart Paketi */}
            <div className="mb-8 rounded-lg bg-emerald-500/10 p-4">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-text">
                <Star className="h-5 w-5 text-emerald-400" strokeWidth={1.8} aria-hidden="true" />
                Standart Paketi
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
                    Fiyat (₺)
                  </label>
                  <input
                    type="number"
                    name="standardPrice"
                    value={formData.standardPrice}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
                    Teslimat (gün)
                  </label>
                  <input
                    type="number"
                    name="standardDays"
                    value={formData.standardDays}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Premium Paketi */}
            <div className="rounded-lg bg-accent/10 p-4">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-text">
                <Crown className="h-5 w-5 text-accent" strokeWidth={1.8} aria-hidden="true" />
                Premium Paketi
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
                    Fiyat (₺)
                  </label>
                  <input
                    type="number"
                    name="premiumPrice"
                    value={formData.premiumPrice}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
                    Teslimat (gün)
                  </label>
                  <input
                    type="number"
                    name="premiumDays"
                    value={formData.premiumDays}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <p className="text-sm text-red-400">
              {error instanceof Error ? error.message : 'İlan oluşturulamadı.'} Bilgileri kontrol edip tekrar dene.
            </p>
          ) : null}

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" variant="primary" disabled={isPending || !userId} className="flex-1">
              {isPending ? 'Oluşturuluyor…' : 'İlan Oluştur'}
            </Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={() => router.back()}>
              İptal
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
