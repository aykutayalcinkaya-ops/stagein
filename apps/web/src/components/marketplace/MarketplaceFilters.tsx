'use client';

import { Tag, Banknote } from 'lucide-react';
import { MARKETPLACE_CATEGORIES } from '@stagein/shared';
import { FilterDropdown } from '@/components/FilterDropdown';
import { Card } from '@/components/ui';

interface MarketplaceFiltersProps {
  selectedCategory?: string;
  minPrice?: number;
  maxPrice?: number;
  onCategoryChange: (category: string) => void;
  onPriceChange: (min: number, max: number) => void;
}

export function MarketplaceFilters({
  selectedCategory,
  minPrice = 0,
  maxPrice = 100000,
  onCategoryChange,
  onPriceChange,
}: MarketplaceFiltersProps) {
  const categoryNames = MARKETPLACE_CATEGORIES.map((c) => c.name);
  const selectedCategoryName = MARKETPLACE_CATEGORIES.find((c) => c.id === selectedCategory)?.name;

  return (
    <Card className="space-y-6">
      {/* Kategoriler */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-text">
          <Tag className="h-4 w-4 text-primary" strokeWidth={1.8} aria-hidden="true" />
          Kategoriler
        </h3>
        <FilterDropdown
          label="Tüm kategoriler"
          options={categoryNames}
          selected={selectedCategoryName ? [selectedCategoryName] : []}
          onChange={(next) => {
            const name = next[0];
            const id = name ? MARKETPLACE_CATEGORIES.find((c) => c.name === name)?.id ?? '' : '';
            onCategoryChange(id);
          }}
          multiple={false}
        />
      </div>

      {/* Fiyat Aralığı */}
      <div className="border-t border-white/[0.06] pt-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-text">
          <Banknote className="h-4 w-4 text-primary" strokeWidth={1.8} aria-hidden="true" />
          Fiyat Aralığı
        </h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Minimum: <span className="font-semibold text-text">₺{minPrice.toLocaleString('tr-TR')}</span>
            </label>
            <input
              type="range"
              min={0}
              max={100000}
              value={minPrice}
              onChange={(e) => onPriceChange(Number(e.target.value), maxPrice)}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Maksimum: <span className="font-semibold text-text">₺{maxPrice.toLocaleString('tr-TR')}</span>
            </label>
            <input
              type="range"
              min={0}
              max={100000}
              value={maxPrice}
              onChange={(e) => onPriceChange(minPrice, Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
