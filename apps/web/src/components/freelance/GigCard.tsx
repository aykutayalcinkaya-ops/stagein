'use client';

import Link from 'next/link';
import Image from 'next/image';

interface GigCardProps {
  id: string;
  slug?: string;
  title: string;
  description: string;
  coverImage?: string | null;
  minPrice: number;
  rating: number;
  ratingCount: number;
  sellerName: string;
  sellerAvatar?: string | null;
  orderQueueCount: number;
}

export function GigCard({
  id,
  slug,
  title,
  description,
  coverImage,
  minPrice,
  rating,
  ratingCount,
  sellerName,
  sellerAvatar,
  orderQueueCount,
}: GigCardProps) {
  const href = `/freelance/${slug || id}`;

  return (
    <Link href={href}>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        {coverImage && (
          <div className="relative w-full h-48 bg-gray-200">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="p-4 space-y-3">
          <h3 className="font-bold text-gray-900 line-clamp-2">{title}</h3>

          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>

          <div className="flex items-center gap-2">
            {sellerAvatar && (
              <img
                src={sellerAvatar}
                alt={sellerName}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <span className="text-sm text-gray-700">{sellerName}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span className="text-sm font-medium text-gray-900">
                {rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">({ratingCount})</span>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                ₺{minPrice.toLocaleString('tr-TR')}
              </div>
              {orderQueueCount > 0 && (
                <p className="text-xs text-gray-500">
                  {orderQueueCount} siparişin sırası
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
