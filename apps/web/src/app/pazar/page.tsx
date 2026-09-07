import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CityFilter } from '@/components/CityFilter'
import { MarketplaceCard } from '@/components/MarketplaceCard'
import { EmptyState, LinkButton } from '@/components/ui'
import { getMarketplaceItems } from '@/lib/data'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const city = Array.isArray(params.city) ? params.city[0] : params.city

  const title = city ? `İkinci el enstrüman — ${city}` : 'İkinci el enstrüman pazarı'
  const description = city
    ? `${city} şehrinde satılık ikinci el enstrüman, amfi ve ekipman ilanları.`
    : 'Müzisyenden müzisyene ikinci el enstrüman, amfi, pedal ve stüdyo ekipmanı ilanları.'

  return {
    title,
    description,
    alternates: { canonical: '/pazar' },
    openGraph: { title: `${title} | StageIn`, description, type: 'website', url: '/pazar' },
  }
}

export default async function PazarPage({ searchParams }: PageProps) {
  const params = await searchParams
  const city = Array.isArray(params.city) ? params.city[0] : params.city
  const items = await getMarketplaceItems(city)

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-accent">İkinci El</p>
          <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-tight sm:text-5xl">Pazar</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-text-secondary">
            Müzisyenden müzisyene ikinci el enstrüman, amfi ve ekipman. Aracı yok, komisyon yok.
          </p>
          {items.length > 0 ? (
            <p className="mt-3 text-sm text-text-secondary">
              {items.length} ilan{city ? ` · ${city}` : ''}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Suspense fallback={<div className="h-12 w-44 rounded-lg border border-border bg-card" />}>
            <CityFilter />
          </Suspense>
          <LinkButton href="/pazar/yeni" variant="primary" className="shrink-0">
            İlan Ver
          </LinkButton>
        </div>
      </header>

      {items.length === 0 ? (
        <EmptyState
          title="Bu şehirde henüz ilan yok"
          description="Filtreyi genişletmeyi dene ya da kendi ekipman ilanını yayınla — ilk ilan sen ol."
          action={<LinkButton href="/pazar/yeni">İlan Ver</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <MarketplaceCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
