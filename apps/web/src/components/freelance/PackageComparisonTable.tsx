'use client';

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
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-4 text-left font-bold text-gray-900">Özellik</th>
            {sortedPackages.map((pkg) => (
              <th key={pkg.id} className="p-4 text-center font-bold text-gray-900">
                <div>{tierLabels[pkg.tier]}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-gray-200">
            <td className="p-4 font-semibold text-gray-900">Fiyat</td>
            {sortedPackages.map((pkg) => (
              <td key={pkg.id} className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {pkg.price.toLocaleString('tr-TR')}₺
                </div>
              </td>
            ))}
          </tr>

          <tr className="border-t border-gray-200">
            <td className="p-4 font-semibold text-gray-900">Teslimat</td>
            {sortedPackages.map((pkg) => (
              <td key={pkg.id} className="p-4 text-center text-gray-700">
                {pkg.deliveryDays} gün
              </td>
            ))}
          </tr>

          <tr className="border-t border-gray-200">
            <td className="p-4 font-semibold text-gray-900">Revizyon</td>
            {sortedPackages.map((pkg) => (
              <td key={pkg.id} className="p-4 text-center text-gray-700">
                {pkg.revisionsCount === 999 ? 'Sınırsız' : pkg.revisionsCount}
              </td>
            ))}
          </tr>

          {allFeatures.map((feature) => (
            <tr key={feature} className="border-t border-gray-200">
              <td className="p-4 text-gray-700 capitalize">{feature.replace(/_/g, ' ')}</td>
              {sortedPackages.map((pkg) => (
                <td key={pkg.id} className="p-4 text-center">
                  {pkg.features[feature] ? (
                    <span className="text-green-600 font-bold">✓</span>
                  ) : (
                    <span className="text-gray-300">—</span>
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
