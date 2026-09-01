import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Chip, LinkButton } from '@/components/ui'
import { UserAvatar } from '@/components/UserAvatar'
import { getStudio } from '@/lib/data'
import { SITE_URL } from '@/lib/site'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const studio = await getStudio(id)

  if (!studio) return { title: 'Stüdyo bulunamadı', robots: { index: false } }

  const name = studio.full_name ?? studio.username
  const title = `${name}${studio.city ? ` — ${studio.city} prova stüdyosu` : ' — Prova stüdyosu'}`
  const description =
    studio.bio?.slice(0, 160) ??
    `${name}, StageIn üzerinde ${studio.city ?? 'Türkiye'} bölgesinde prova ve kayıt stüdyosu. Saatlik rezervasyon bilgisi için profili incele.`

  return {
    title,
    description,
    alternates: { canonical: `/studyo/${studio.id}` },
    openGraph: { title: `${title} | StageIn`, description, type: 'website', url: `/studyo/${studio.id}` },
  }
}

export default async function StudyoPage({ params }: PageProps) {
  const { id } = await params
  const studio = await getStudio(id)

  if (!studio) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicVenue',
    name: studio.full_name ?? studio.username,
    description: studio.bio ?? undefined,
    image: studio.avatar_url ?? undefined,
    url: `${SITE_URL}/studyo/${studio.id}`,
    address: studio.city
      ? { '@type': 'PostalAddress', addressLocality: studio.city, addressCountry: 'TR' }
      : undefined,
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="flex flex-col gap-6 border-b border-border pb-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <UserAvatar name={studio.full_name} username={studio.username} url={studio.avatar_url} size={88} />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Prova & Kayıt Stüdyosu</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">{studio.full_name ?? studio.username}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              {studio.city ? <Chip tone="primary">{studio.city}</Chip> : null}
              <Chip>@{studio.username}</Chip>
            </div>
          </div>
        </div>

        <LinkButton href="/#indir">İletişime geç</LinkButton>
      </header>

      {studio.bio ? <p className="mt-8 max-w-2xl text-lg leading-relaxed text-text-secondary">{studio.bio}</p> : null}

      <section className="mt-12 rounded-xl border border-border bg-card p-6">
        <h2 className="text-2xl font-bold tracking-tight">Rezervasyon</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Online saatlik rezervasyon ve ödeme, StageIn Faz 2 kapsamında açılıyor. Şimdilik stüdyoya uygulama üzerinden
          mesaj atarak müsait saatleri sorabilirsin.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {['Hafta içi 10:00 - 22:00', 'Hafta sonu 12:00 - 24:00', 'Saatlik ücret stüdyoya sorulur'].map((item) => (
            <div key={item} className="rounded-lg border border-border bg-surface p-4 text-sm text-text-secondary">
              {item}
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted">
          Stüdyo sahibiysen ve takvimini burada yayınlamak istiyorsan bize yaz — pilot programa alıyoruz.
        </p>
      </section>
    </div>
  )
}
