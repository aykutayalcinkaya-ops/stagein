'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';

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
      <div className="cursor-pointer overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-2xl">
        {coverImage && (
          <div className="relative h-48 w-full bg-surface">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="space-y-3 p-4">
          <h3 className="line-clamp-2 font-bold text-text">{title}</h3>

          <p className="line-clamp-2 text-sm text-text-secondary">{description}</p>

          <div className="flex items-center gap-2">
            <UserAvatar name={sellerName} url={sellerAvatar} size={32} />
            <span className="text-sm text-text-secondary">{sellerName}</span>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" strokeWidth={1.8} aria-hidden="true" />
              <span className="text-sm font-medium text-text">
                {rating.toFixed(1)}
              </span>
              <span className="text-xs text-muted">({ratingCount})</span>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                ₺{minPrice.toLocaleString('tr-TR')}
              </div>
              {orderQueueCount > 0 && (
                <p className="text-xs text-muted">
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
