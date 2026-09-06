'use client';

import { useState } from 'react';

function OrderWorkspaceContent({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState('requirements_pending');
  const [requirements, setRequirements] = useState('');
  const [note, setNote] = useState('');

  const SAMPLE_ORDER = {
    id: orderId,
    gigTitle: 'Ben, şarkınızın profesyonel mix & mastering işlemlerini yapabilirim.',
    packageTitle: 'Standart Mix Pro',
    packagePrice: 1000,
    buyerName: 'Ahmet Çelik',
    sellerName: 'Mehmet Yılmaz',
    deliveryDays: 5,
    createdAt: '2026-09-01',
    deliveryDate: '2026-09-06',
    autoCompleteDate: '2026-09-09',
  };

  const statusLabels: Record<string, string> = {
    requirements_pending: 'Gereksinimler Bekleniyor',
    in_progress: 'İşlem Devam Ediyor',
    delivered: 'Teslim Edildi',
    revision_requested: 'Revizyon İstenmiş',
    completed: 'Tamamlandı',
    cancelled: 'İptal Edilmiş',
    disputed: 'Uyuşmazlık',
  };

  const handleSubmitRequirements = () => {
    console.log('Gereksinimler gönderiliyor:', requirements);
    setStatus('in_progress');
  };

  const handleRequestRevision = () => {
    console.log('Revizyon isteniyor:', note);
    setStatus('revision_requested');
  };

  const handleCompleteOrder = () => {
    console.log('Sipariş onaylanıyor');
    setStatus('completed');
  };

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
                  <span className="font-semibold">Hizmet:</span> {SAMPLE_ORDER.gigTitle}
                </p>
                <p>
                  <span className="font-semibold">Paket:</span> {SAMPLE_ORDER.packageTitle}
                </p>
                <p>
                  <span className="font-semibold">Fiyat:</span> ₺{SAMPLE_ORDER.packagePrice}
                </p>
                <p>
                  <span className="font-semibold">Alıcı:</span> {SAMPLE_ORDER.buyerName}
                </p>
                <p>
                  <span className="font-semibold">Satıcı:</span> {SAMPLE_ORDER.sellerName}
                </p>
                <p>
                  <span className="font-semibold">Teslimat Tarihi:</span>{' '}
                  {SAMPLE_ORDER.deliveryDate}
                </p>
                <p>
                  <span className="font-semibold">Otomatik Onay Tarihi:</span>{' '}
                  {SAMPLE_ORDER.autoCompleteDate}
                </p>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Durum</h2>
              <div className="space-y-4">
                {Object.entries(statusLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        status === key ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                    <span className={status === key ? 'font-bold text-blue-600' : 'text-gray-600'}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements Section */}
            {status === 'requirements_pending' && (
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
                  onClick={handleSubmitRequirements}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
                >
                  Gereksinimler Gönder
                </button>
              </div>
            )}

            {/* File Upload Section */}
            {status === 'in_progress' && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Dosya Yükleme</h2>
                <p className="text-gray-600 mb-4">
                  Müzisyen, işlenmiş dosyaları buraya yükleyecektir.
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-500">📁 Dosya yükleme alanı</p>
                </div>
              </div>
            )}

            {/* Delivery Section */}
            {status === 'delivered' && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Teslim Edilen Dosyalar</h2>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-gray-700">📦 mix_final.wav</p>
                  <p className="text-gray-700">📦 mastering_final.mp3</p>
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
                      onClick={handleCompleteOrder}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                      Onayla & Tamamla
                    </button>
                    <button
                      onClick={handleRequestRevision}
                      className="flex-1 border-2 border-orange-600 text-orange-600 hover:bg-orange-50 font-bold py-2 px-4 rounded-lg transition"
                    >
                      Revizyon İste
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Section */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Mesajlar</h2>
              <div className="space-y-3 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900">Müzisyen</p>
                  <p className="text-gray-700">Merhaba! Gereksinimlerinizi aldım, şimdi başlıyorum.</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900">Siz</p>
                  <p className="text-gray-700">
                    Teşekkür ederim! Daha yüksek vokal levelini tercih ederim.
                  </p>
                </div>
              </div>
              <input
                type="text"
                placeholder="Mesaj yazın..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Sidebar - Countdown Timer */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Teslimat Sayacı</h3>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">2 gün</div>
                <p className="text-sm text-gray-600">kalan süre</p>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                İşin tamamlanması gereken tarih: {SAMPLE_ORDER.deliveryDate}
              </p>
            </div>

            {/* Status Badge */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Mevcut Durum</h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="font-bold text-green-900">{statusLabels[status]}</p>
              </div>
            </div>

            {/* Help */}
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

export default async function OrderWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderWorkspaceContent orderId={id} />;
}
