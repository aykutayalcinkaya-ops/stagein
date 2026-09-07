import Link from 'next/link'
import { ArrowUpRight, Clock, MapPin } from 'lucide-react'
import type { Listing } from '@stagein/shared'
import { EXPERIENCE_LABELS, LISTING_TYPE_LABELS, formatRelative } from '@/lib/site'
import { Chip } from './ui'
import { UserAvatar } from './UserAvatar'

export function ListingCard({ listing }: { listing: Listing }) {
  const tags = [...listing.instruments, ...listing.genres].slice(0, 4)
  const meta = [listing.city, listing.experience_level ? EXPERIENCE_LABELS[listing.experience_level] : null].filter(
    Boolean
  )

  return (
    <Link
      href={`/ilanlar/${listing.id}`}
      className="group relative block rounded-2xl border border-border bg-card/80 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_16px_32px_-20px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:border-primary/40 focus-visible:-translate-y-1 focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-dark"
    >
      <ArrowUpRight
        className="absolute right-5 top-5 h-4 w-4 text-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
        strokeWidth={2}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-4 pr-6">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="primary">{LISTING_TYPE_LABELS[listing.type] ?? listing.type}</Chip>
          {listing.is_paid ? <Chip tone="accent">Ücretli</Chip> : null}
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
          <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          {formatRelative(listing.created_at)}
        </span>
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
        {meta.length ? (
          <span className="flex items-center gap-1 text-xs text-muted">
            <MapPin className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            {meta.join(' · ')}
          </span>
        ) : null}
      </div>
    </Link>
  )
}
