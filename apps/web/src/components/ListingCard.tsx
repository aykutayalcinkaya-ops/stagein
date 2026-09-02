import Link from 'next/link'
import type { Listing } from '@stagein/shared'
import { EXPERIENCE_LABELS, LISTING_TYPE_LABELS, formatRelative } from '@/lib/site'
import { Chip } from './ui'
import { UserAvatar } from './UserAvatar'

export function ListingCard({ listing }: { listing: Listing }) {
  const tags = [...listing.instruments, ...listing.genres].slice(0, 4)

  return (
    <Link
      href={`/ilanlar/${listing.id}`}
      className="group block rounded-2xl border border-white/[0.06] bg-card/60 p-5 transition-all duration-180 ease-out hover:-translate-y-1 hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="primary">{LISTING_TYPE_LABELS[listing.type] ?? listing.type}</Chip>
          {listing.is_paid ? <Chip tone="accent">Ücretli</Chip> : null}
        </div>
        <span className="shrink-0 text-xs text-muted">{formatRelative(listing.created_at)}</span>
      </div>

      <h3 className="mt-4 text-xl font-bold leading-snug tracking-tight group-hover:text-white">{listing.title}</h3>

      {listing.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{listing.description}</p>
      ) : null}

      {tags.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <UserAvatar name={listing.user?.full_name} username={listing.user?.username} url={listing.user?.avatar_url} size={28} />
          <span className="text-sm text-text-secondary">{listing.user?.full_name ?? listing.user?.username ?? 'Müzisyen'}</span>
        </div>
        <span className="text-xs text-muted">
          {[listing.city, listing.experience_level ? EXPERIENCE_LABELS[listing.experience_level] : null]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>
    </Link>
  )
}
