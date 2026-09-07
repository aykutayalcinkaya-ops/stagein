import { Metadata } from 'next';
import type { LucideIcon } from 'lucide-react';
import { SlidersHorizontal, Disc3, Mic2, Mic, PenTool, Wand2, GraduationCap, Sparkles } from 'lucide-react';
import { FREELANCE_CATEGORIES } from '@stagein/shared';
import { GigCard } from '@/components/freelance/GigCard';
import { EmptyState, LinkButton } from '@/components/ui';
import { FadeInSection } from '@/components/FadeInSection';
import { getFreelanceGigs } from '@/lib/data';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'mix-mastering': SlidersHorizontal,
  'beat-production': Disc3,
  'session-musician': Mic2,
  voiceover: Mic,
  songwriting: PenTool,
  'audio-editing': Wand2,
  lessons: GraduationCap,
};

const CATEGORY_NAME_BY_ID = Object.fromEntries(FREELANCE_CATEGORIES.map((cat) => [cat.id, cat.name]));

export const metadata: Metadata = {
  title: 'Freelance Müzik Hizmetleri | StageIn',
  description: 'Müzisyenler, prodüktörler ve ses mühendisleri tarafından sunulan profesyonel müzik hizmetleri pazaryeri.',
};

export default async function FreelancePage() {
  const gigs = await getFreelanceGigs();

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero Section */}
      <FadeInSection className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Freelance</p>
          <h1 className="mb-4 font-display text-4xl uppercase leading-[0.95] tracking-tight text-text md:text-5xl">
            Profesyonel Müzik Hizmetleri Pazaryeri
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-text-secondary">
            Müzisyenler, prodüktörler, ses mühendisleri tarafından sunulan kaliteli hizmetleri keşfedin.
          </p>
        </div>
      </FadeInSection>

      {/* Categories Section */}
      <section className="border-t border-border bg-card/40 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 font-display text-2xl uppercase tracking-tight text-text">Kategoriler</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FREELANCE_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id] ?? Sparkles;
              return (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card/80 p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_16px_32px_-20px_rgba(0,0,0,0.6)] backdrop-blur-sm"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold leading-snug text-text">{cat.name}</h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gigs Section */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-2xl uppercase tracking-tight text-text">Öne Çıkanlar</h2>
            {gigs.length > 0 ? (
              <span className="text-sm text-text-secondary">{gigs.length} hizmet listelendi</span>
            ) : null}
          </div>

          {gigs.length === 0 ? (
            <EmptyState
              title="Henüz hizmet ilanı yok"
              description="İlk hizmet ilanını sen oluştur ve yeteneklerini müşterilerle buluştur."
              action={<LinkButton href="/freelance/yeni">İlan Oluştur</LinkButton>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {gigs.map((gig) => {
                const minPrice = gig.packages && gig.packages.length > 0
                  ? Math.min(...gig.packages.map((p) => p.price))
                  : 0;
                return (
                  <GigCard
                    key={gig.id}
                    id={gig.id}
                    slug={gig.slug ?? undefined}
                    title={gig.title}
                    description={gig.description}
                    coverImage={gig.cover_image}
                    minPrice={minPrice}
                    rating={gig.rating_avg}
                    ratingCount={gig.rating_count}
                    sellerName={gig.seller?.full_name ?? gig.seller?.username ?? 'Bilinmiyor'}
                    sellerAvatar={gig.seller?.avatar_url}
                    orderQueueCount={gig.order_queue_count}
                    categoryName={CATEGORY_NAME_BY_ID[gig.category_id]}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden border-t border-border px-4 py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent),radial-gradient(ellipse_60%_50%_at_100%_100%,color-mix(in_oklab,var(--color-accent)_12%,transparent),transparent)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Sparkles className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
          </div>
          <h2 className="mb-4 font-display text-3xl uppercase tracking-tight text-text">
            Müzik Hizmeti Sunmak İster Misin?
          </h2>
          <p className="mb-8 text-text-secondary">
            Yeteneklerini göster ve geçiminizi müzik yaparak sağla.
          </p>
          <LinkButton href="/freelance/yeni" variant="accent">
            İlan Oluştur
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
