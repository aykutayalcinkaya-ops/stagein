'use client';

import { useState } from 'react';
import { Truck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';

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
    <div className="sticky top-6 rounded-lg border border-border bg-card p-6 shadow-2xl">
      <h3 className="mb-4 text-lg font-bold text-text">Paket Seç</h3>

      <div className="mb-6 flex gap-2">
        {packages.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => handleSelect(pkg.id)}
            className={`min-h-11 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              selected === pkg.id
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:bg-white/[0.08]'
            }`}
          >
            {tierLabels[pkg.tier]}
          </button>
        ))}
      </div>

      {selectedPkg && (
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-lg font-bold text-text">{selectedPkg.title}</h4>
            <p className="mb-4 text-sm text-text-secondary">{selectedPkg.description}</p>
          </div>

          <div className="rounded-lg bg-surface p-4">
            <div className="mb-2 text-3xl font-bold text-text">
              {selectedPkg.price.toLocaleString('tr-TR')}₺
            </div>
            <div className="space-y-1 text-sm text-text-secondary">
              <p className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted" strokeWidth={1.8} aria-hidden="true" />
                Teslimat: {selectedPkg.deliveryDays} gün
              </p>
              <p className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-muted" strokeWidth={1.8} aria-hidden="true" />
                Revizyon: {selectedPkg.revisionsCount === 999 ? 'Sınırsız' : selectedPkg.revisionsCount}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="text-sm font-semibold text-text">Dahil Olan Özellikler:</h5>
            {Object.entries(selectedPkg.features).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={value}
                  disabled
                  className="rounded"
                />
                <span className="capitalize text-text-secondary">{key.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4">
            <Button variant="primary" onClick={() => onSelect(selectedPkg)}>
              Sipariş Ver
            </Button>
            <Button variant="secondary" onClick={onContactSeller}>
              Soru Sor
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
