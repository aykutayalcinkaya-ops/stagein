'use client';

import { Check } from 'lucide-react';

interface Package {
  id: string;
  tier: 'basic' | 'standard' | 'premium';
  title: string;
  price: number;
  deliveryDays: number;
  revisionsCount: number;
  features: Record<string, boolean>;
}

interface PackageComparisonTableProps {
  packages: Package[];
}

export function PackageComparisonTable({ packages }: PackageComparisonTableProps) {
  const tierLabels = {
    basic: 'Başlangıç',
    standard: 'Standart',
    premium: 'Premium (Pro)',
  };

  const sortedPackages = [...packages].sort((a, b) => {
    const tierOrder = { basic: 0, standard: 1, premium: 2 };
    return tierOrder[a.tier] - tierOrder[b.tier];
  });

  const allFeatures = Object.keys(
    sortedPackages.reduce((acc, pkg) => ({ ...acc, ...pkg.features }), {})
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-surface">
            <th className="p-4 text-left font-bold text-text">Özellik</th>
            {sortedPackages.map((pkg) => (
              <th key={pkg.id} className="p-4 text-center font-bold text-text">
                <div>{tierLabels[pkg.tier]}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-border">
            <td className="p-4 font-semibold text-text">Fiyat</td>
            {sortedPackages.map((pkg) => (
              <td key={pkg.id} className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {pkg.price.toLocaleString('tr-TR')}₺
                </div>
              </td>
            ))}
          </tr>

          <tr className="border-t border-border">
            <td className="p-4 font-semibold text-text">Teslimat</td>
            {sortedPackages.map((pkg) => (
              <td key={pkg.id} className="p-4 text-center text-text-secondary">
                {pkg.deliveryDays} gün
              </td>
            ))}
          </tr>

          <tr className="border-t border-border">
            <td className="p-4 font-semibold text-text">Revizyon</td>
            {sortedPackages.map((pkg) => (
              <td key={pkg.id} className="p-4 text-center text-text-secondary">
                {pkg.revisionsCount === 999 ? 'Sınırsız' : pkg.revisionsCount}
              </td>
            ))}
          </tr>

          {allFeatures.map((feature) => (
            <tr key={feature} className="border-t border-border">
              <td className="p-4 capitalize text-text-secondary">{feature.replace(/_/g, ' ')}</td>
              {sortedPackages.map((pkg) => (
                <td key={pkg.id} className="p-4 text-center">
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
