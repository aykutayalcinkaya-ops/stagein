import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Banknote,
  Building2,
  CalendarDays,
  Clock,
  Disc3,
  Guitar,
  MapPin,
  TrendingUp,
} from 'lucide-react'
import { Card, Chip } from '@/components/ui'
import { FadeInSection } from '@/components/FadeInSection'
import { UserAvatar } from '@/components/UserAvatar'
import { StartConversationButton } from '@/components/messaging/StartConversationButton'
import { getListing } from '@/lib/data'
import { EXPERIENCE_LABELS, LISTING_TYPE_LABELS, SITE_URL, formatDate, formatRelative } from '@/lib/site'

function DetailLabel({ icon: Icon, children }: { icon: typeof MapPin; children: string }) {
  return (
    <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted">
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
      {children}
    </dt>
  )
}

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const listing = await getListing(id)

  if (!listing) {
    return { title: 'İlan bulunamadı', robots: { index: false } }
  }

  const typeLabel = LISTING_TYPE_LABELS[listing.type] ?? 'İlan'
  const title = `${listing.title} — ${typeLabel}${listing.city ? ` · ${listing.city}` : ''}`
  const description =
    listing.description?.slice(0, 160) ??
    `${listing.city ?? 'Türkiye'} bölgesinde ${typeLabel.toLocaleLowerCase('tr-TR')} ilanı. StageIn üzerinden doğrudan iletişime geç.`

  return {
    title,
    description,
    alternates: { canonical: `/ilanlar/${listing.id}` },
    openGraph: {
      title: `${title} | StageIn`,
      description,
      type: 'article',
      url: `/ilanlar/${listing.id}`,
      publishedTime: listing.created_at,
    },
  }
}

export default async function IlanDetayPage({ params }: PageProps) {
  const { id } = await params
  const listing = await getListing(id)

  if (!listing) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: listing.title,
    description: listing.description ?? listing.title,
    datePosted: listing.created_at,
    validThrough: listing.expires_at,
    employmentType: listing.is_paid ? 'CONTRACTOR' : 'VOLUNTEER',
    hiringOrganization: {
      '@type': 'Organization',
      name: listing.user?.full_name ?? listing.user?.username ?? 'StageIn kullanıcısı',
      url: listing.user?.username ? `${SITE_URL}/profil/${listing.user.username}` : SITE_URL,
    },
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: listing.city ?? 'Türkiye', addressCountry: 'TR' },
    },
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link
        href="/ilanlar"
        className="group inline-flex min-h-11 items-center gap-1.5 text-sm text-muted transition-colors duration-150 hover:text-white"
      >
        <ArrowLeft
          className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
          strokeWidth={2}
          aria-hidden="true"
        />
        İlanlara dön
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Chip tone="primary">{LISTING_TYPE_LABELS[listing.type] ?? listing.type}</Chip>
        {listing.is_paid ? <Chip tone="accent">Ücretli</Chip> : <Chip>Ücretsiz / paylaşımlı</Chip>}
        {listing.city ? <Chip>{listing.city}</Chip> : null}
      </div>

      <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">{listing.title}</h1>

      <p className="mt-4 flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
        {formatRelative(listing.created_at)} yayınlandı · {formatDate(listing.expires_at)} tarihine kadar geçerli
      </p>

      <FadeInSection>
        {listing.description ? (
          <>
            <h2 className="mt-8 text-xs font-semibold uppercase tracking-wider text-muted">Açıklama</h2>
            <div className="mt-3 whitespace-pre-line text-lg leading-relaxed text-text-secondary">
              {listing.description}
            </div>
          </>
        ) : null}

        <dl className="mt-10 grid gap-4 sm:grid-cols-2">
          <Card>
            <DetailLabel icon={Guitar}>Aranan enstrüman</DetailLabel>
            <dd className="mt-3 flex flex-wrap gap-2">
              {listing.instruments.length ? (
                listing.instruments.map((i) => <Chip key={i}>{i}</Chip>)
              ) : (
                <span className="text-sm text-text-secondary">Belirtilmedi</span>
              )}
            </dd>
          </Card>

          <Card>
            <DetailLabel icon={Disc3}>Müzik tarzı</DetailLabel>
            <dd className="mt-3 flex flex-wrap gap-2">
              {listing.genres.length ? (
                listing.genres.map((g) => <Chip key={g}>{g}</Chip>)
              ) : (
                <span className="text-sm text-text-secondary">Belirtilmedi</span>
              )}
            </dd>
          </Card>

          <Card>
            <DetailLabel icon={TrendingUp}>Deneyim</DetailLabel>
            <dd className="mt-3 text-sm text-text-secondary">
              {listing.experience_level ? EXPERIENCE_LABELS[listing.experience_level] : 'Fark etmez'}
            </dd>
          </Card>

          <Card>
            <DetailLabel icon={MapPin}>Şehir</DetailLabel>
            <dd className="mt-3 text-sm text-text-secondary">{listing.city ?? 'Belirtilmedi'}</dd>
          </Card>

          {listing.is_paid && (listing.budget_min || listing.budget_max) && (
            <Card>
              <DetailLabel icon={Banknote}>Bütçe</DetailLabel>
              <dd className="mt-3 text-sm font-semibold text-text-secondary">
                {listing.budget_min && listing.budget_max
                  ? `₺${listing.budget_min.toLocaleString('tr-TR')} - ₺${listing.budget_max.toLocaleString('tr-TR')}`
                  : listing.budget_min
                    ? `₺${listing.budget_min.toLocaleString('tr-TR')}+`
                    : `₺${listing.budget_max?.toLocaleString('tr-TR')} adedine kadar`}
              </dd>
            </Card>
          )}

          {listing.venue_name && (
            <Card>
              <DetailLabel icon={Building2}>Mekan</DetailLabel>
              <dd className="mt-3 text-sm text-text-secondary">{listing.venue_name}</dd>
            </Card>
          )}

          {listing.event_date && (
            <Card>
              <DetailLabel icon={CalendarDays}>Etkinlik Tarihi</DetailLabel>
              <dd className="mt-3 text-sm text-text-secondary">{formatDate(listing.event_date)}</dd>
            </Card>
          )}
        </dl>

        <Card className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <UserAvatar
                name={listing.user?.full_name}
                username={listing.user?.username}
                url={listing.user?.avatar_url}
                size={52}
              />
              <div>
                <p className="text-lg font-bold">{listing.user?.full_name ?? listing.user?.username ?? 'Müzisyen'}</p>
                {listing.user?.username ? (
                  <Link href={`/profil/${listing.user.username}`} className="text-sm text-text-secondary hover:text-white">
                    @{listing.user.username}
                  </Link>
                ) : null}
              </div>
            </div>

            <StartConversationButton otherUserId={listing.user_id} label="Mesaj At" />
          </div>
        </Card>
      </FadeInSection>
    </article>
  )
}
