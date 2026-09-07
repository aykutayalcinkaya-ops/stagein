import { Metadata } from 'next';
import { FREELANCE_CATEGORIES } from '@stagein/shared';
import { GigCard } from '@/components/freelance/GigCard';
import { EmptyState, LinkButton } from '@/components/ui';
import { FadeInSection } from '@/components/FadeInSection';
import { getFreelanceGigs } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Freelance Müzik Hizmetleri | StageIn',
  description: 'Müzisyenler, prodüktörler ve ses mühendisleri tarafından sunulan profesyonel müzik hizmetleri pazaryeri.',
};

export default async function FreelancePage() {
  const gigs = await getFreelanceGigs();

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero Section */}
      <FadeInSection className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-4 text-4xl font-bold text-text md:text-5xl">
            Profesyonel Müzik Hizmetleri Pazaryeri
          </h1>
          <p className="mb-8 text-xl text-text-secondary">
            Müzisyenler, prodüktörler, ses mühendisleri tarafından sunulan kaliteli hizmetleri keşfedin.
          </p>
        </div>
      </FadeInSection>

      {/* Categories Section */}
      <section className="border-t border-border bg-card/40 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-2xl font-bold text-text">Kategoriler</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {FREELANCE_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="rounded-lg border border-border bg-surface p-4 text-left"
              >
                <h3 className="font-semibold text-text">{cat.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gigs Section */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text">Öne Çıkanlar</h2>
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
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-primary/10 px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-text">
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
