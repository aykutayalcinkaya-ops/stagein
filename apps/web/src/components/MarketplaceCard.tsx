import Link from 'next/link'
import type { MarketplaceItem } from '@stagein/shared'
import { formatPrice, formatRelative } from '@/lib/site'
import { Chip } from './ui'

export function MarketplaceCard({ item }: { item: MarketplaceItem }) {
  const cover = item.photos?.[0]

  return (
    <Link
      href={`/pazar/${item.id}`}
      className="group block overflow-hidden rounded-2xl border border-white/[0.06] bg-card/60 transition-all duration-180 hover:-translate-y-1 hover:border-accent/40"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-surface">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted">Görsel yok</div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold leading-snug">{item.title}</h3>
          <span className="shrink-0 text-base font-bold text-accent">{formatPrice(item.price)}</span>
        </div>
        {item.description ? <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{item.description}</p> : null}
        <div className="mt-4 flex items-center justify-between">
          <Chip>{item.city ?? 'Şehir belirtilmedi'}</Chip>
          <span className="text-xs text-muted">{formatRelative(item.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
