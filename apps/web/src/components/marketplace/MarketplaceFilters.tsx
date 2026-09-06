'use client';

import { MARKETPLACE_CATEGORIES } from '@stagein/shared';

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
  return (
    <div className="space-y-6">
      {/* Kategoriler */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Kategoriler</h3>
        <div className="space-y-2">
          <button
            onClick={() => onCategoryChange('')}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              !selectedCategory
                ? 'bg-blue-100 text-blue-900 font-semibold'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tümü
          </button>
          {MARKETPLACE_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`w-full text-left px-4 py-2 rounded-lg transition ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-900 font-semibold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Fiyat Aralığı */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Fiyat Aralığı</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum: ₺{minPrice.toLocaleString('tr-TR')}
            </label>
            <input
              type="range"
              min={0}
              max={100000}
              value={minPrice}
              onChange={(e) => onPriceChange(Number(e.target.value), maxPrice)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maksimum: ₺{maxPrice.toLocaleString('tr-TR')}
            </label>
            <input
              type="range"
              min={0}
              max={100000}
              value={maxPrice}
              onChange={(e) => onPriceChange(minPrice, Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
