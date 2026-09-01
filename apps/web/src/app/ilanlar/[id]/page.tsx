import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Chip, LinkButton } from '@/components/ui'
import { UserAvatar } from '@/components/UserAvatar'
import { getListing } from '@/lib/data'
import { EXPERIENCE_LABELS, LISTING_TYPE_LABELS, SITE_URL, formatDate, formatRelative } from '@/lib/site'

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

      <Link href="/ilanlar" className="text-sm text-muted underline underline-offset-4 hover:text-white">
        İlanlara dön
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Chip tone="primary">{LISTING_TYPE_LABELS[listing.type] ?? listing.type}</Chip>
        {listing.is_paid ? <Chip tone="accent">Ücretli</Chip> : <Chip>Ücretsiz / paylaşımlı</Chip>}
        {listing.city ? <Chip>{listing.city}</Chip> : null}
      </div>

      <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">{listing.title}</h1>

      <p className="mt-4 text-sm text-muted">
        {formatRelative(listing.created_at)} yayınlandı · {formatDate(listing.expires_at)} tarihine kadar geçerli
      </p>

      {listing.description ? (
        <div className="mt-8 whitespace-pre-line text-lg leading-relaxed text-text-secondary">{listing.description}</div>
      ) : null}

      <dl className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <dt className="text-xs uppercase tracking-wider text-muted">Aranan enstrüman</dt>
          <dd className="mt-3 flex flex-wrap gap-2">
            {listing.instruments.length ? (
              listing.instruments.map((i) => <Chip key={i}>{i}</Chip>)
            ) : (
              <span className="text-sm text-text-secondary">Belirtilmedi</span>
            )}
          </dd>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <dt className="text-xs uppercase tracking-wider text-muted">Müzik tarzı</dt>
          <dd className="mt-3 flex flex-wrap gap-2">
            {listing.genres.length ? (
              listing.genres.map((g) => <Chip key={g}>{g}</Chip>)
            ) : (
              <span className="text-sm text-text-secondary">Belirtilmedi</span>
            )}
          </dd>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <dt className="text-xs uppercase tracking-wider text-muted">Deneyim</dt>
          <dd className="mt-3 text-sm text-text-secondary">
            {listing.experience_level ? EXPERIENCE_LABELS[listing.experience_level] : 'Fark etmez'}
          </dd>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <dt className="text-xs uppercase tracking-wider text-muted">Şehir</dt>
          <dd className="mt-3 text-sm text-text-secondary">{listing.city ?? 'Belirtilmedi'}</dd>
        </div>
      </dl>

      <section className="mt-10 rounded-xl border border-border bg-card p-6">
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

          <LinkButton href="/#indir">Uygulamadan mesaj at</LinkButton>
        </div>
        <p className="mt-4 text-xs text-muted">
          Mesajlaşma uygulama üzerinden yürür. İlan sahibine yazmak için StageIn uygulamasını indir.
        </p>
      </section>
    </article>
  )
}
