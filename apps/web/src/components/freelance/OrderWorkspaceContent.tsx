'use client';

import { useState } from 'react';
import { FREELANCE_ORDER_STATUS_LABELS } from '@stagein/shared';
import {
  useCompleteOrder,
  useFreelanceOrder,
  useRequestOrderRevision,
  useSubmitOrderRequirements,
} from '@/hooks/useFreelance';
import { useAuthStore } from '@/stores/authStore';

export function OrderWorkspaceContent({ orderId }: { orderId: string }) {
  const userId = useAuthStore((s) => s.userId);
  const { data: order, isLoading, error } = useFreelanceOrder(orderId);
  const { mutateAsync: submitRequirements, isPending: isSubmittingRequirements } =
    useSubmitOrderRequirements(orderId);
  const { mutateAsync: requestRevision, isPending: isRequestingRevision } = useRequestOrderRevision(orderId);
  const { mutateAsync: completeOrder, isPending: isCompleting } = useCompleteOrder(orderId);

  const [requirements, setRequirements] = useState('');
  const [note, setNote] = useState('');

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 py-12 px-4 text-center text-gray-500">Yükleniyor…</div>;
  }

  if (error || !order) {
    return <div className="min-h-screen bg-gray-50 py-12 px-4 text-center text-gray-600">Sipariş bulunamadı.</div>;
  }

  const isBuyer = userId === order.buyer_id;
  const status = order.status;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Sipariş Çalışma Alanı</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Info */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sipariş Bilgileri</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <span className="font-semibold">Hizmet:</span> {order.gig?.title ?? '—'}
                </p>
                <p>
                  <span className="font-semibold">Paket:</span> {order.package?.title ?? '—'}
                </p>
                <p>
                  <span className="font-semibold">Fiyat:</span> ₺{order.price.toLocaleString('tr-TR')}
                </p>
                <p>
                  <span className="font-semibold">Alıcı:</span>{' '}
                  {order.buyer?.full_name ?? order.buyer?.username ?? '—'}
                </p>
                <p>
                  <span className="font-semibold">Satıcı:</span>{' '}
                  {order.seller?.full_name ?? order.seller?.username ?? '—'}
                </p>
                {order.delivered_at ? (
                  <p>
                    <span className="font-semibold">Teslimat Tarihi:</span>{' '}
                    {new Date(order.delivered_at).toLocaleDateString('tr-TR')}
                  </p>
                ) : null}
                {order.auto_complete_at ? (
                  <p>
                    <span className="font-semibold">Otomatik Onay Tarihi:</span>{' '}
                    {new Date(order.auto_complete_at).toLocaleDateString('tr-TR')}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Durum</h2>
              <div className="space-y-4">
                {Object.entries(FREELANCE_ORDER_STATUS_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${status === key ? 'bg-blue-600' : 'bg-gray-300'}`} />
                    <span className={status === key ? 'font-bold text-blue-600' : 'text-gray-600'}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements Section */}
            {status === 'requirements_pending' && isBuyer && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Gereksinimlerinizi Giriniz</h2>
                <p className="text-gray-600 mb-4">
                  Müzisyene hangi dosyaları göndereceğinizi ve ne yapılması gerektiğini anlatın.
                </p>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Örn: RAW vokal dosyalarını ve arkaplan müziğini WAV formatında göndereceğim..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => submitRequirements(requirements)}
                  disabled={isSubmittingRequirements || !requirements.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition"
                >
                  {isSubmittingRequirements ? 'Gönderiliyor…' : 'Gereksinimler Gönder'}
                </button>
              </div>
            )}

            {/* In Progress Section */}
            {status === 'in_progress' && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">İşlem Devam Ediyor</h2>
                <p className="text-gray-600">
                  {isBuyer
                    ? 'Müzisyen siparişiniz üzerinde çalışıyor. Teslimat yapıldığında burada bildirim alacaksınız.'
                    : 'Alıcının gereksinimleri gönderildi. İşi tamamladığınızda teslim edebilirsiniz.'}
                </p>
                {order.requirements_submitted ? (
                  <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Gönderilen Gereksinimler</p>
                    <p className="text-gray-700 whitespace-pre-line">{order.requirements_submitted}</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Delivery Section */}
            {status === 'delivered' && isBuyer && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Teslim Edilen Dosyalar</h2>
                <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-1">
                  {order.delivered_files.length > 0 ? (
                    order.delivered_files.map((f) => (
                      <p key={f.url} className="text-gray-700">
                        📦 {f.name}
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Dosya bulunamadı.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Dosya hakkında notunuz (isteğe bağlı)"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => completeOrder()}
                      disabled={isCompleting}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                      {isCompleting ? 'İşleniyor…' : 'Onayla & Tamamla'}
                    </button>
                    <button
                      onClick={() => requestRevision(note || null)}
                      disabled={isRequestingRevision}
                      className="flex-1 border-2 border-orange-600 text-orange-600 hover:bg-orange-50 disabled:opacity-50 font-bold py-2 px-4 rounded-lg transition"
                    >
                      {isRequestingRevision ? 'İşleniyor…' : 'Revizyon İste'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Mevcut Durum</h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="font-bold text-green-900">{FREELANCE_ORDER_STATUS_LABELS[status]}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Yardım</h3>
              <p className="text-sm text-gray-600 mb-3">
                Herhangi bir sorun yaşıyorsanız, desteğimize başvurun.
              </p>
              <button className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2 px-4 rounded-lg transition">
                Destek Al
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
