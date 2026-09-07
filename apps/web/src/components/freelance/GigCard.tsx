'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { MediaPlaceholder } from '@/components/MediaPlaceholder';
import { Chip } from '@/components/ui';

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
  categoryName?: string;
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
  categoryName,
}: GigCardProps) {
  const href = `/freelance/${slug || id}`;

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-white/[0.06] bg-card/60 transition-all duration-180 hover:-translate-y-1 hover:border-accent/40"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <MediaPlaceholder label="Kapak görseli yok" />
        )}
        {categoryName ? (
          <div className="absolute left-3 top-3">
            <Chip tone="primary" className="bg-dark/60 backdrop-blur-sm">
              {categoryName}
            </Chip>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-text">{title}</h3>

        <p className="line-clamp-2 text-sm text-text-secondary">{description}</p>

        <div className="flex items-center gap-2">
          <UserAvatar name={sellerName} url={sellerAvatar} size={28} />
          <span className="truncate text-sm text-text-secondary">{sellerName}</span>
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" strokeWidth={1.8} aria-hidden="true" />
            <span className="text-sm font-semibold text-text">{rating.toFixed(1)}</span>
            <span className="text-xs text-muted">({ratingCount})</span>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-accent">₺{minPrice.toLocaleString('tr-TR')}&apos;den</div>
            {orderQueueCount > 0 ? (
              <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-muted">
                <Clock className="h-3 w-3" strokeWidth={1.8} aria-hidden="true" />
                {orderQueueCount} siparişin sırası
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
