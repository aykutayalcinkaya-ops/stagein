'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Package, SearchX } from 'lucide-react';
import { FREELANCE_ORDER_STATUS_LABELS } from '@stagein/shared';
import { Button } from '@/components/ui';
import { CardSkeleton, useTimeout } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { formatDateTr } from '@/lib/format';
import {
  useCompleteOrder,
  useFreelanceOrder,
  useRequestOrderRevision,
  useSubmitOrderRequirements,
} from '@/hooks/useFreelance';
import { useAuthStore } from '@/stores/authStore';

const textareaClass =
  'w-full rounded-lg border border-border bg-surface px-4 py-2 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary';

export function OrderWorkspaceContent({ orderId }: { orderId: string }) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const { data: order, isLoading, error, refetch } = useFreelanceOrder(orderId);
  const { mutateAsync: submitRequirements, isPending: isSubmittingRequirements } =
    useSubmitOrderRequirements(orderId);
  const { mutateAsync: requestRevision, isPending: isRequestingRevision } = useRequestOrderRevision(orderId);
  const { mutateAsync: completeOrder, isPending: isCompleting } = useCompleteOrder(orderId);
  const timedOut = useTimeout(9000, isLoading);

  const [requirements, setRequirements] = useState('');
  const [note, setNote] = useState('');

  if (isLoading && !timedOut) {
    return (
      <div className="min-h-screen bg-dark px-4 py-12">
        <div className="mx-auto max-w-6xl space-y-6">
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

  if (error || !order) {
    return (
      <div className="min-h-screen bg-dark px-4 py-16">
        <EmptyState
          icon={SearchX}
          title="Sipariş bulunamadı"
          description="Bu sipariş kaldırılmış olabilir ya da erişim yetkin yok. Siparişlerine profilinden ulaşabilirsin."
          action={{ label: 'Freelance Sayfasına Dön', onClick: () => router.push('/freelance') }}
          className="mx-auto max-w-lg"
        />
      </div>
    );
  }

  const isBuyer = userId === order.buyer_id;
  const status = order.status;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-dark px-4 py-12"
    >
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold text-text">Sipariş Çalışma Alanı</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Order Info */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-2xl font-bold text-text">Sipariş Bilgileri</h2>
              <div className="space-y-3 text-text-secondary">
                <p>
                  <span className="font-semibold text-text">Hizmet:</span> {order.gig?.title ?? '—'}
                </p>
                <p>
                  <span className="font-semibold text-text">Paket:</span> {order.package?.title ?? '—'}
                </p>
                <p>
                  <span className="font-semibold text-text">Fiyat:</span> ₺{order.price.toLocaleString('tr-TR')}
                </p>
                <p>
                  <span className="font-semibold text-text">Alıcı:</span>{' '}
                  {order.buyer?.full_name ?? order.buyer?.username ?? '—'}
                </p>
                <p>
                  <span className="font-semibold text-text">Satıcı:</span>{' '}
                  {order.seller?.full_name ?? order.seller?.username ?? '—'}
                </p>
                {order.delivered_at ? (
                  <p>
                    <span className="font-semibold text-text">Teslimat Tarihi:</span> {formatDateTr(order.delivered_at)}
                  </p>
                ) : null}
                {order.auto_complete_at ? (
                  <p>
                    <span className="font-semibold text-text">Otomatik Onay Tarihi:</span>{' '}
                    {formatDateTr(order.auto_complete_at)}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Status Timeline */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-6 text-2xl font-bold text-text">Durum</h2>
              <div className="space-y-4">
                {Object.entries(FREELANCE_ORDER_STATUS_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className={`h-4 w-4 rounded-full ${status === key ? 'bg-primary' : 'bg-white/10'}`} />
                    <span className={status === key ? 'font-bold text-primary' : 'text-text-secondary'}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements Section */}
            {status === 'requirements_pending' && isBuyer && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-2xl font-bold text-text">Gereksinimlerinizi Giriniz</h2>
                <p className="mb-4 text-text-secondary">
                  Müzisyene hangi dosyaları göndereceğinizi ve ne yapılması gerektiğini anlatın.
                </p>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Örn: RAW vokal dosyalarını ve arkaplan müziğini WAV formatında göndereceğim..."
                  rows={6}
                  className={`${textareaClass} mb-4`}
                />
                <Button
                  variant="primary"
                  onClick={() => submitRequirements(requirements)}
                  disabled={isSubmittingRequirements || !requirements.trim()}
                >
                  {isSubmittingRequirements ? 'Gönderiliyor…' : 'Gereksinimler Gönder'}
                </Button>
              </div>
            )}

            {/* In Progress Section */}
            {status === 'in_progress' && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-2xl font-bold text-text">İşlem Devam Ediyor</h2>
                <p className="text-text-secondary">
                  {isBuyer
                    ? 'Müzisyen siparişiniz üzerinde çalışıyor. Teslimat yapıldığında burada bildirim alacaksınız.'
                    : 'Alıcının gereksinimleri gönderildi. İşi tamamladığınızda teslim edebilirsiniz.'}
                </p>
                {order.requirements_submitted ? (
                  <div className="mt-4 rounded-lg bg-surface p-4">
                    <p className="mb-1 text-sm font-semibold text-text-secondary">Gönderilen Gereksinimler</p>
                    <p className="whitespace-pre-line text-text-secondary">{order.requirements_submitted}</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Delivery Section */}
            {status === 'delivered' && isBuyer && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-2xl font-bold text-text">Teslim Edilen Dosyalar</h2>
                <div className="mb-4 space-y-1 rounded-lg bg-surface p-4">
                  {order.delivered_files.length > 0 ? (
                    order.delivered_files.map((f) => (
                      <p key={f.url} className="flex items-center gap-2 text-text-secondary">
                        <Package className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.8} aria-hidden="true" />
                        {f.name}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-text-secondary">Dosya bulunamadı.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Dosya hakkında notunuz (isteğe bağlı)"
                    rows={3}
                    className={textareaClass}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => completeOrder()}
                      disabled={isCompleting}
                    >
                      {isCompleting ? 'İşleniyor…' : 'Onayla & Tamamla'}
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => requestRevision(note || null)}
                      disabled={isRequestingRevision}
                    >
                      {isRequestingRevision ? 'İşleniyor…' : 'Revizyon İste'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-bold text-text">Mevcut Durum</h3>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="font-bold text-emerald-300">{FREELANCE_ORDER_STATUS_LABELS[status]}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-bold text-text">Yardım</h3>
              <p className="mb-3 text-sm text-text-secondary">
                Herhangi bir sorun yaşıyorsanız, desteğimize başvurun.
              </p>
              <Button variant="secondary" className="w-full" onClick={() => router.push('/iletisim')}>
                Destek Al
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
