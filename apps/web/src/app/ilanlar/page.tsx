import type { Metadata } from 'next'
import { Suspense } from 'react'
import type { ListingType } from '@stagein/shared'
import { ListingCard } from '@/components/ListingCard'
import { ListingFilters } from '@/components/ListingFilters'
import { FadeInSection } from '@/components/FadeInSection'
import { EmptyState, LinkButton, Skeleton } from '@/components/ui'
import { getListings, type ListingFilters as Filters } from '@/lib/data'
import { LISTING_TYPE_LABELS } from '@/lib/site'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const VALID_TYPES: ListingType[] = ['band', 'session', 'lesson']

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const city = first(params.city)
  const type = first(params.type)
  const typeLabel = type && LISTING_TYPE_LABELS[type] ? LISTING_TYPE_LABELS[type] : null

  const title = [typeLabel ? `${typeLabel} ilanları` : 'Müzisyen ilanları', city].filter(Boolean).join(' — ')
  const description = city
    ? `${city} şehrindeki ${typeLabel ? typeLabel.toLocaleLowerCase('tr-TR') : 'müzisyen'} ilanları. Enstrümana ve tarza göre filtrele, doğrudan iletişime geç.`
    : 'Türkiye genelindeki grup, session ve ders ilanları. Şehre, enstrümana ve tarza göre filtrele.'

  return {
    title,
    description,
    alternates: { canonical: '/ilanlar' },
    openGraph: { title: `${title} | StageIn`, description, type: 'website', url: '/ilanlar' },
  }
}

export default async function IlanlarPage({ searchParams }: PageProps) {
  const params = await searchParams
  const rawType = first(params.type)

  const filters: Filters = {
    city: first(params.city),
    type: VALID_TYPES.includes(rawType as ListingType) ? (rawType as ListingType) : undefined,
    instrument: first(params.instrument),
    genre: first(params.genre),
    q: first(params.q),
  }

  const listings = await getListings(filters)

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">İlanlar</h1>
          <p className="mt-4 max-w-2xl text-lg text-text-secondary">
            Grup arayanlar, session arayanlar, ders verenler. Şehrine ve enstrümanına göre filtrele.
          </p>
        </div>
        <LinkButton href="/ilanlar/yeni" variant="primary" className="shrink-0">
          İlan Oluştur
        </LinkButton>
      </header>

      <Suspense fallback={<Skeleton className="mb-8 h-32 w-full" />}>
        <ListingFilters />
      </Suspense>

      {listings.length === 0 ? (
        <EmptyState
          title="Bu filtrelerle ilan bulunamadı"
          description="Filtreleri gevşetmeyi dene ya da kendi ilanını yayınla — arayan seni bulsun."
          action={<LinkButton href="/ilanlar/yeni">İlan Oluştur</LinkButton>}
        />
      ) : (
        <FadeInSection>
          <p className="mb-4 text-sm text-muted">{listings.length} ilan listeleniyor</p>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </FadeInSection>
      )}
    </div>
  )
}
