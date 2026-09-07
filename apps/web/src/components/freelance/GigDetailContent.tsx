'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Star, SearchX } from 'lucide-react';
import type { FreelancePackage } from '@stagein/shared';
import { AudioSamplePlayer } from '@/components/freelance/AudioSamplePlayer';
import { PackageSelector } from '@/components/freelance/PackageSelector';
import { PackageComparisonTable } from '@/components/freelance/PackageComparisonTable';
import { CardSkeleton, useTimeout } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { MediaPlaceholder } from '@/components/MediaPlaceholder';
import { UserAvatar } from '@/components/UserAvatar';
import { formatDateTr } from '@/lib/format';
import { useFreelanceGig, useFreelanceGigReviews, useCreateFreelanceOrder } from '@/hooks/useFreelance';
import { useAuthStore } from '@/stores/authStore';

function toUiPackage(pkg: FreelancePackage) {
  const features: Record<string, boolean> = {
    wav_delivery: !!pkg.features.wav_delivery,
    mp3_delivery: !!pkg.features.mp3_delivery,
    stem_delivery: !!pkg.features.stem_delivery,
    commercial_rights: !!pkg.features.commercial_rights,
  };
  return {
    id: pkg.id,
    tier: pkg.tier,
    title: pkg.title,
    description: pkg.description,
    price: pkg.price,
    deliveryDays: pkg.delivery_days,
    revisionsCount: pkg.revisions_count,
    features,
  };
}

function StarRating({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={i < rounded ? 'h-4 w-4 fill-yellow-400 text-yellow-400' : 'h-4 w-4 text-border-strong'}
          strokeWidth={1.8}
        />
      ))}
    </span>
  );
}

export function GigDetailContent({ gigId }: { gigId: string }) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const { data: gig, isLoading, error, refetch } = useFreelanceGig(gigId);
  const { data: reviews } = useFreelanceGigReviews(gigId);
  const { mutateAsync: createOrder, isPending: isCreatingOrder } = useCreateFreelanceOrder();
  const timedOut = useTimeout(9000, isLoading);

  const handleSelectPackage = async (pkg: ReturnType<typeof toUiPackage>) => {
    if (!userId || !gig) return;
    const order = await createOrder({
      gig_id: gig.id,
      package_id: pkg.id,
      buyer_id: userId,
      seller_id: gig.seller_id,
      price: pkg.price,
    });
    router.push(`/freelance/siparis/${order.id}`);
  };

  const handleContactSeller = () => {
    if (!gig) return;
    router.push(`/profil/${gig.seller?.username ?? ''}`);
  };

  if (isLoading && !timedOut) {
    return (
      <div className="min-h-screen bg-dark px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (isLoading && timedOut) {
    return (
      <div className="min-h-screen bg-dark px-4 py-16">
        <EmptyState
          icon={SearchX}
          title="Yükleme çok uzun sürdü"
          description="Bağlantı yavaş olabilir ya da bir şeyler ters gitti. Tekrar dene."
          action={{ label: 'Tekrar Dene', onClick: () => refetch() }}
          className="mx-auto max-w-lg"
        />
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="min-h-screen bg-dark px-4 py-16">
        <EmptyState
          icon={SearchX}
          title="İlan bulunamadı"
          description="Bu ilan kaldırılmış ya da hiç var olmamış olabilir. Diğer hizmetlere göz atabilirsin."
          action={{ label: 'Tüm İlanlara Dön', onClick: () => router.push('/freelance') }}
          className="mx-auto max-w-lg"
        />
      </div>
    );
  }

  const packages = (gig.packages ?? []).map(toUiPackage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-dark"
    >
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Cover Image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-surface">
              {gig.cover_image ? (
                <Image src={gig.cover_image} alt={gig.title} fill className="object-cover" priority />
              ) : (
                <MediaPlaceholder label="Kapak görseli yok" />
              )}
            </div>

            {/* Gig Title & Rating */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h1 className="mb-4 text-3xl font-bold text-text">{gig.title}</h1>

              <div className="mb-6 flex items-center gap-3">
                <StarRating value={gig.rating_avg} />
                <span className="text-xl font-bold text-text">{gig.rating_avg.toFixed(1)}</span>
                <span className="text-text-secondary">({gig.rating_count} değerlendirme)</span>
              </div>

              <p className="text-lg leading-relaxed text-text-secondary">{gig.description}</p>
            </div>

            {/* Audio Samples */}
            {gig.audio_samples.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-6 text-2xl font-bold text-text">Ses Örnekleri</h2>
                <AudioSamplePlayer samples={gig.audio_samples} />
              </div>
            )}

            {/* Package Comparison */}
            {packages.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-6 text-2xl font-bold text-text">Paket Karşılaştırması</h2>
                <PackageComparisonTable packages={packages} />
              </div>
            )}

            {/* FAQ */}
            {gig.faq.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-6 text-2xl font-bold text-text">Sıkça Sorulan Sorular</h2>
                <div className="space-y-4">
                  {gig.faq.map((item, idx) => (
                    <details key={idx} className="rounded-lg bg-surface p-4">
                      <summary className="cursor-pointer font-semibold text-text">{item.question}</summary>
                      <p className="mt-2 text-text-secondary">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-6 text-2xl font-bold text-text">Değerlendirmeler</h2>
              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-lg bg-surface p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="font-semibold text-text">
                          {review.buyer?.full_name ?? review.buyer?.username ?? 'Kullanıcı'}
                        </h4>
                        <StarRating value={review.rating} />
                      </div>
                      {review.comment ? <p className="text-text-secondary">{review.comment}</p> : null}
                      <p className="mt-2 text-xs text-muted">{formatDateTr(review.created_at)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">Henüz değerlendirme yok.</p>
              )}
            </div>

            {/* Seller Info */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-2xl font-bold text-text">Müzisyen Hakkında</h2>
              <div className="flex items-start gap-4">
                <UserAvatar
                  name={gig.seller?.full_name}
                  username={gig.seller?.username}
                  url={gig.seller?.avatar_url}
                  size={64}
                />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-text">
                    {gig.seller?.full_name ?? gig.seller?.username ?? 'Bilinmiyor'}
                  </h3>
                  {gig.seller?.bio ? <p className="mb-2 text-text-secondary">{gig.seller.bio}</p> : null}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Package Selector */}
          <div className="lg:col-span-1">
            {packages.length > 0 ? (
              <PackageSelector
                packages={packages}
                onSelect={handleSelectPackage}
                onContactSeller={handleContactSeller}
              />
            ) : null}
            {isCreatingOrder ? <p className="mt-3 text-center text-sm text-text-secondary">Sipariş oluşturuluyor…</p> : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
