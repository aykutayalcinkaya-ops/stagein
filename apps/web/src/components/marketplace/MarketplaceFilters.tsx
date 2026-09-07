'use client';

import { MARKETPLACE_CATEGORIES } from '@stagein/shared';
import { FilterDropdown } from '@/components/FilterDropdown';

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
    <div className="space-y-6">
      {/* Kategoriler */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-text">Kategoriler</h3>
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
      <div>
        <h3 className="mb-4 text-lg font-bold text-text">Fiyat Aralığı</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Minimum: ₺{minPrice.toLocaleString('tr-TR')}
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
              Maksimum: ₺{maxPrice.toLocaleString('tr-TR')}
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
    </div>
  );
}
