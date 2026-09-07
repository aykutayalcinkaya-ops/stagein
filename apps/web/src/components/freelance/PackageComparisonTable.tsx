'use client';

import { Check, Package, Star, Crown } from 'lucide-react';
import { cn } from '@/components/ui';

interface PackageType {
  id: string;
  tier: 'basic' | 'standard' | 'premium';
  title: string;
  price: number;
  deliveryDays: number;
  revisionsCount: number;
  features: Record<string, boolean>;
}

interface PackageComparisonTableProps {
  packages: PackageType[];
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

/** Önerilen kademe: en dengeli fiyat/değer noktası, karşılaştırma tablosunda vurgulanır. */
const RECOMMENDED_TIER = 'standard';

export function PackageComparisonTable({ packages }: PackageComparisonTableProps) {
  const sortedPackages = [...packages].sort((a, b) => {
    const tierOrder = { basic: 0, standard: 1, premium: 2 };
    return tierOrder[a.tier] - tierOrder[b.tier];
  });

  const allFeatures = Object.keys(
    sortedPackages.reduce((acc, pkg) => ({ ...acc, ...pkg.features }), {})
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-surface">
            <th className="p-4 text-left font-bold text-text">Özellik</th>
            {sortedPackages.map((pkg) => {
              const Icon = tierIcons[pkg.tier];
              const isRecommended = pkg.tier === RECOMMENDED_TIER;
              return (
                <th
                  key={pkg.id}
                  className={cn(
                    'p-4 text-center font-bold text-text',
                    isRecommended && 'relative bg-primary/10'
                  )}
                >
                  {isRecommended ? (
                    <span className="absolute left-1/2 top-1.5 -translate-x-1/2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-dark">
                      Önerilen
                    </span>
                  ) : null}
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    <Icon
                      className={cn('h-4 w-4', isRecommended ? 'text-primary' : 'text-muted')}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                    {tierLabels[pkg.tier]}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-border">
            <td className="p-4 font-semibold text-text">Fiyat</td>
            {sortedPackages.map((pkg) => (
              <td
                key={pkg.id}
                className={cn('p-4 text-center', pkg.tier === RECOMMENDED_TIER && 'bg-primary/10')}
              >
                <div className={cn('text-2xl font-bold', pkg.tier === RECOMMENDED_TIER ? 'text-accent' : 'text-primary')}>
                  {pkg.price.toLocaleString('tr-TR')}₺
                </div>
              </td>
            ))}
          </tr>

          <tr className="border-t border-border">
            <td className="p-4 font-semibold text-text">Teslimat</td>
            {sortedPackages.map((pkg) => (
              <td
                key={pkg.id}
                className={cn(
                  'p-4 text-center text-text-secondary',
                  pkg.tier === RECOMMENDED_TIER && 'bg-primary/10'
                )}
              >
                {pkg.deliveryDays} gün
              </td>
            ))}
          </tr>

          <tr className="border-t border-border">
            <td className="p-4 font-semibold text-text">Revizyon</td>
            {sortedPackages.map((pkg) => (
              <td
                key={pkg.id}
                className={cn(
                  'p-4 text-center text-text-secondary',
                  pkg.tier === RECOMMENDED_TIER && 'bg-primary/10'
                )}
              >
                {pkg.revisionsCount === 999 ? 'Sınırsız' : pkg.revisionsCount}
              </td>
            ))}
          </tr>

          {allFeatures.map((feature) => (
            <tr key={feature} className="border-t border-border">
              <td className="p-4 capitalize text-text-secondary">{feature.replace(/_/g, ' ')}</td>
              {sortedPackages.map((pkg) => (
                <td
                  key={pkg.id}
                  className={cn('p-4 text-center', pkg.tier === RECOMMENDED_TIER && 'bg-primary/10')}
                >
                  {pkg.features[feature] ? (
                    <Check className="mx-auto h-5 w-5 text-emerald-400" strokeWidth={1.8} aria-label="Dahil" />
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
