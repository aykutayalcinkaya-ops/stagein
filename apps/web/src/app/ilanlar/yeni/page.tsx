'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { GraduationCap, Mic2, Users, X } from 'lucide-react';
import type { ListingType } from '@stagein/shared';
import { CITIES, INSTRUMENTS, GENRES, LISTING_TYPE_LABELS } from '@stagein/shared';
import { useCreateListing } from '@/hooks/useListings';
import { useAuthStore } from '@/stores/authStore';
import { FilterDropdown } from '@/components/FilterDropdown';
import { Button, Card, cn } from '@/components/ui';

const inputClass =
  'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text outline-none transition-colors duration-150 placeholder:text-muted focus:border-primary';
const labelClass = 'mb-3 block text-lg font-bold text-text';

const TYPE_ICONS: Record<string, typeof Users> = {
  band: Users,
  session: Mic2,
  lesson: GraduationCap,
};

export default function NewListingPage() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const { mutateAsync: createListing, isPending, error } = useCreateListing();

  useEffect(() => {
    if (!isAuthLoading && userId === null) router.replace('/giris');
  }, [isAuthLoading, userId, router]);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!userId) return;

    await createListing({
      user_id: userId,
      title: formData.title,
      type: formData.type,
      description: formData.description,
      city: formData.city,
      instruments: formData.instruments,
      genres: formData.genres,
      is_paid: formData.isPaid,
      budget_min: formData.isPaid && formData.budgetMin ? Number(formData.budgetMin) : null,
      budget_max: formData.isPaid && formData.budgetMax ? Number(formData.budgetMax) : null,
      event_date: formData.type === 'venue' && formData.eventDate ? formData.eventDate : null,
      venue_name: formData.type === 'venue' && formData.venueName ? formData.venueName : null,
    });
    router.push('/ilanlar');
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-2xl"
      >
        <h1 className="mb-8 text-4xl font-bold text-text">Yeni İlan Oluştur</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Başlık */}
          <Card>
            <label className={labelClass}>İlan Başlığı</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Örn: Grup bulmak için davulcu arıyorum..."
              required
              className={inputClass}
            />
          </Card>

          {/* Tür */}
          <Card>
            <label className={labelClass}>İlan Türü</label>
            <div className="grid grid-cols-2 gap-3">
              {listingTypes.map((type) => {
                const Icon = TYPE_ICONS[type.value] ?? Users;
                return (
                  <motion.button
                    key={type.value}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setFormData((prev) => ({ ...prev, type: type.value as ListingType }))}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border-2 p-3 text-left font-medium transition-colors duration-150',
                      formData.type === type.value
                        ? 'border-primary bg-primary/10 text-white'
                        : 'border-border bg-surface text-text-secondary hover:border-border-strong'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                    {type.label}
                  </motion.button>
                );
              })}
            </div>
          </Card>

          {/* Şehir */}
          <Card>
            <label className={labelClass}>Şehir</label>
            <select name="city" value={formData.city} onChange={handleChange} required className={inputClass}>
              <option value="">-- Şehir Seç --</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </Card>

          {/* Enstrümanlar */}
          <Card>
            <label className={labelClass}>Enstrümanlar</label>
            <FilterDropdown
              label="Enstrüman seç"
              options={[...INSTRUMENTS]}
              selected={formData.instruments}
              onChange={(next) => setFormData((prev) => ({ ...prev, instruments: next }))}
              multiple
            />
            {formData.instruments.length > 0 ? (
              <p className="mt-3 text-sm text-text-secondary">{formData.instruments.join(', ')}</p>
            ) : null}
          </Card>

          {/* Türler */}
          <Card>
            <label className={labelClass}>Müzik Türleri</label>
            <FilterDropdown
              label="Tarz seç"
              options={[...GENRES]}
              selected={formData.genres}
              onChange={(next) => setFormData((prev) => ({ ...prev, genres: next }))}
              multiple
            />
            {formData.genres.length > 0 ? (
              <p className="mt-3 text-sm text-text-secondary">{formData.genres.join(', ')}</p>
            ) : null}
          </Card>

          {/* Açıklama */}
          <Card>
            <label className={labelClass}>Detaylı Açıklama</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="İlanınızı detaylı bir şekilde anlatın..."
              rows={6}
              required
              className={inputClass}
            />
          </Card>

          {/* Ücretli Seçenek */}
          <Card>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="isPaid"
                checked={formData.isPaid}
                onChange={handleChange}
                className="h-4 w-4 rounded border-border-strong bg-surface accent-primary"
              />
              <span className="text-lg font-bold text-text">Ücretli İş</span>
            </label>

            {formData.isPaid && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-secondary">Minimum Bütçe (₺)</label>
                  <input
                    type="number"
                    name="budgetMin"
                    value={formData.budgetMin}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-secondary">Maksimum Bütçe (₺)</label>
                  <input
                    type="number"
                    name="budgetMax"
                    value={formData.budgetMax}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Etkinlik Tarihi (Venue Tipi İçin) */}
          {formData.type === 'venue' && (
            <Card className="space-y-4">
              <div>
                <label className={labelClass}>Mekan Adı</label>
                <input
                  type="text"
                  name="venueName"
                  value={formData.venueName}
                  onChange={handleChange}
                  placeholder="Örn: Babylon, Zorlu Performans Sanatları Merkezi..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Etkinlik Tarihi</label>
                <input
                  type="datetime-local"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </Card>
          )}

          {error ? (
            <p className="text-sm text-red-400">{error instanceof Error ? error.message : 'İlan oluşturulamadı'}</p>
          ) : null}

          {/* Butonlar */}
          <div className="flex gap-4">
            <Button type="submit" variant="primary" disabled={isPending || !userId} className="flex-1">
              {isPending ? 'Oluşturuluyor…' : 'İlan Oluştur'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1">
              <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              İptal
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
