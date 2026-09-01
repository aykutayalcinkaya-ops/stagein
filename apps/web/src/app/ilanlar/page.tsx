import type { Metadata } from 'next'
import { Suspense } from 'react'
import type { ListingType } from '@stagein/shared'
import { ListingCard } from '@/components/ListingCard'
import { ListingFilters } from '@/components/ListingFilters'
import { EmptyState, LinkButton } from '@/components/ui'
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
      <header className="mb-10">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">İlanlar</h1>
        <p className="mt-4 max-w-2xl text-lg text-text-secondary">
          Grup arayanlar, session arayanlar, ders verenler. Şehrine ve enstrümanına göre filtrele.
        </p>
      </header>

      <Suspense fallback={<div className="mb-8 h-32 rounded-xl border border-border bg-card" />}>
        <ListingFilters />
      </Suspense>

      {listings.length === 0 ? (
        <EmptyState
          title="Bu filtrelerle ilan bulunamadı"
          description="Filtreleri gevşetmeyi dene ya da ilanını uygulamadan yayınla — arayan seni bulsun."
          action={<LinkButton href="/#indir">Uygulamayı İndir</LinkButton>}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">{listings.length} ilan listeleniyor</p>
          <div className="grid gap-4 md:grid-cols-2">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
