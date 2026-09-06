'use client';

import { useState } from 'react';

interface Package {
  id: string;
  tier: 'basic' | 'standard' | 'premium';
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisionsCount: number;
  features: Record<string, boolean>;
}

interface PackageSelectorProps {
  packages: Package[];
  onSelect: (pkg: Package) => void;
  onContactSeller: () => void;
}

export function PackageSelector({ packages, onSelect, onContactSeller }: PackageSelectorProps) {
  const [selected, setSelected] = useState(packages[1]?.id || packages[0]?.id);

  const handleSelect = (id: string) => {
    setSelected(id);
    const pkg = packages.find((p) => p.id === id);
    if (pkg) onSelect(pkg);
  };

  const tierLabels = {
    basic: 'Başlangıç',
    standard: 'Standart',
    premium: 'Premium (Pro)',
  };

  const selectedPkg = packages.find((p) => p.id === selected);

  return (
    <div className="sticky top-6 bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-bold mb-4">Paket Seç</h3>

      <div className="flex gap-2 mb-6">
        {packages.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => handleSelect(pkg.id)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition ${
              selected === pkg.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tierLabels[pkg.tier]}
          </button>
        ))}
      </div>

      {selectedPkg && (
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-lg mb-2">{selectedPkg.title}</h4>
            <p className="text-sm text-gray-600 mb-4">{selectedPkg.description}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {selectedPkg.price.toLocaleString('tr-TR')}₺
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>📦 Teslimat: {selectedPkg.deliveryDays} gün</p>
              <p>🔄 Revizyon: {selectedPkg.revisionsCount === 999 ? 'Sınırsız' : selectedPkg.revisionsCount}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-semibold text-sm">Dahil Olan Özellikler:</h5>
            {Object.entries(selectedPkg.features).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={value}
                  disabled
                  className="rounded"
                />
                <span className="text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4">
            <button
              onClick={() => onSelect(selectedPkg)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Sipariş Ver
            </button>
            <button
              onClick={onContactSeller}
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-2 px-4 rounded-lg transition"
            >
              Soru Sor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
