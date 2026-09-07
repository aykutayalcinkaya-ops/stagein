'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ImageGallery } from '@/components/marketplace/ImageGallery';
import { OfferModal } from '@/components/marketplace/OfferModal';
import { CONDITION_LABELS } from '@stagein/shared';
import { useCreateMarketplaceOffer, useMarketplaceItem } from '@/hooks/useMarketplace';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';

export function MarketplaceDetailContent({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const userId = useAuthStore((s) => s.userId);
  const { data: item, isLoading, error } = useMarketplaceItem(itemId);
  const { mutateAsync: createOffer } = useCreateMarketplaceOffer();

  const handleOfferSubmit = async (amount: number, message?: string) => {
    if (!userId || !item) return;
    await createOffer({
      item_id: itemId,
      buyer_id: userId,
      seller_id: item.seller_id,
      offer_amount: amount,
      message: message ?? null,
    });
  };

  if (isLoading) {
    return <div className="min-h-screen py-8 px-4 text-center text-muted">Yükleniyor…</div>;
  }

  if (error || !item) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="mx-auto max-w-md">
          <EmptyState
            title="Ürün bulunamadı"
            description="Bu ilan kaldırılmış veya hiç var olmamış olabilir."
            action={{ label: '← Pazara Dön', onClick: () => router.push('/pazar') }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-6xl"
      >
        {/* Breadcrumb */}
        <Link href="/pazar" className="mb-6 inline-block text-sm font-medium text-primary hover:text-primary-dim">
          ← Pazara Dön
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Sol Kolon: Resimler */}
          <div className="lg:col-span-2">
            <ImageGallery images={item.photos} title={item.title} />

            {/* Açıklama */}
            <div className="mt-8 rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-2xl font-bold text-text">Açıklama</h2>
              <p className="whitespace-pre-line text-text-secondary">{item.description}</p>
            </div>

            {/* Teknik Özellikler */}
            <div className="mt-8 rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-2xl font-bold text-text">Teknik Özellikler</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted">Marka</dt>
                  <dd className="text-lg font-semibold text-text">{item.brand ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">Model</dt>
                  <dd className="text-lg font-semibold text-text">{item.model ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">Durum</dt>
                  <dd className="text-lg font-semibold text-text">
                    {item.condition ? CONDITION_LABELS[item.condition] ?? 'Bilinmiyor' : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">Şehir</dt>
                  <dd className="text-lg font-semibold text-text">{item.city ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted">Takas</dt>
                  <dd className="text-lg font-semibold text-text">
                    {item.is_open_to_trade ? 'Açık' : 'Kapalı'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Sağ Kolon: Satıcı & Butonlar */}
          <div className="space-y-6">
            {/* Fiyat Kartı */}
            <div className="sticky top-6 rounded-lg border border-border bg-card p-6">
              <div className="mb-6 text-4xl font-bold text-accent">
                ₺{(item.price ?? 0).toLocaleString('tr-TR')}
              </div>

              <div className="mb-6">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => setIsOfferModalOpen(true)}
                  disabled={!userId || userId === item.seller_id}
                >
                  Teklif Ver
                </Button>
              </div>

              <p className="text-center text-xs text-muted">
                👁 {item.view_count ?? 0} kişi bu ürünü görüntüledi
              </p>
            </div>

            {/* Satıcı Bilgisi */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-bold text-text">Satıcı Hakkında</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted">Ad Soyad</p>
                  <p className="text-lg font-semibold text-text">
                    {item.seller?.full_name ?? item.seller?.username ?? 'Bilinmiyor'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted">Şehir</p>
                  <p className="text-lg font-semibold text-text">{item.seller?.city ?? '—'}</p>
                </div>
              </div>
            </div>

            {/* Güvenli Alışveriş Bilgisi */}
            <div className="rounded-lg border border-primary/25 bg-primary/10 p-4">
              <h4 className="mb-2 font-bold text-text">Güvenli Alışveriş İpuçları</h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-text-secondary">
                <li>Ürünü görüp kontrol ettikten sonra ödeme yapın</li>
                <li>Konum seçiminde dikkatli olun</li>
                <li>Ödeme öncesi mutabakat kaydedin</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      <OfferModal
        itemId={itemId}
        currentPrice={item.price ?? 0}
        itemTitle={item.title}
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        onSubmit={handleOfferSubmit}
      />
    </div>
  );
}
