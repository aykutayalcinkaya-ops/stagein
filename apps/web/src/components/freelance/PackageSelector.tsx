'use client';

import { useState } from 'react';
import { Truck, RefreshCw, Package, Star, Crown } from 'lucide-react';
import { Button, Chip } from '@/components/ui';

interface PackageType {
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
  packages: PackageType[];
  onSelect: (pkg: PackageType) => void;
  onContactSeller: () => void;
}

const tierLabels = {
  basic: 'Başlangıç',
  standard: 'Standart',
  premium: 'Premium (Pro)',
} as const;

const tierIcons = {
  basic: Package,
  standard: Star,
  premium: Crown,
} as const;

/** Önerilen kademe: satıcı en çok bu paketten sipariş alır, orta fiyat/değer noktası. */
const RECOMMENDED_TIER = 'standard';

export function PackageSelector({ packages, onSelect, onContactSeller }: PackageSelectorProps) {
  const [selected, setSelected] = useState(packages[1]?.id || packages[0]?.id);

  const handleSelect = (id: string) => {
    setSelected(id);
    const pkg = packages.find((p) => p.id === id);
    if (pkg) onSelect(pkg);
  };

  const selectedPkg = packages.find((p) => p.id === selected);
  const SelectedIcon = selectedPkg ? tierIcons[selectedPkg.tier] : Package;

  return (
    <div className="sticky top-6 rounded-2xl border border-border bg-card/80 p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_16px_32px_-20px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-bold text-text">Paket Seç</h3>

      <div className="mb-6 grid grid-cols-3 gap-2">
        {packages.map((pkg) => {
          const Icon = tierIcons[pkg.tier];
          const isSelected = selected === pkg.id;
          const isRecommended = pkg.tier === RECOMMENDED_TIER;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => handleSelect(pkg.id)}
              className={`relative flex min-h-11 flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-xs font-medium transition-all duration-180 ${
                isSelected
                  ? 'bg-primary text-white shadow-[0_8px_20px_-8px_var(--color-primary)]'
                  : 'bg-surface text-text-secondary hover:bg-white/[0.08]'
              }`}
            >
              {isRecommended ? (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-dark">
                  Önerilen
                </span>
              ) : null}
              <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              {tierLabels[pkg.tier]}
            </button>
          );
        })}
      </div>

      {selectedPkg && (
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <SelectedIcon className="h-4 w-4 text-primary" strokeWidth={1.8} aria-hidden="true" />
              <h4 className="text-lg font-bold text-text">{selectedPkg.title}</h4>
              {selectedPkg.tier === RECOMMENDED_TIER ? <Chip tone="accent">Önerilen</Chip> : null}
            </div>
            <p className="mb-4 text-sm text-text-secondary">{selectedPkg.description}</p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
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
                  className="rounded accent-primary"
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
