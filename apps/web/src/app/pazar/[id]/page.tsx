'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ImageGallery } from '@/components/marketplace/ImageGallery';
import { OfferModal } from '@/components/marketplace/OfferModal';
import { CONDITION_LABELS } from '@stagein/shared';

function MarketplaceDetailContent({ itemId }: { itemId: string }) {
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

  const item = {
    id: itemId,
    title: 'Fender Stratocaster Elektro Gitar — 1998',
    price: 2500,
    condition: 'very_good',
    brand: 'Fender',
    model: 'Stratocaster',
    year: 1998,
    category: 'electric-guitar',
    city: 'İstanbul',
    description:
      'İyi durumda 1998 Fender Stratocaster. Orijinal hard case ile gelecek. Sadece ciddi sorgulamalara cevap verilecektir.',
    images: [
      'https://via.placeholder.com/800x600?text=Fender+Strat',
      'https://via.placeholder.com/800x600?text=Fender+Strat+2',
    ],
    seller: {
      name: 'Ahmet Yılmaz',
      city: 'İstanbul',
      verified: true,
      responseTime: '< 1 saat',
    },
    isOpenToTrade: false,
    viewCount: 45,
  };

  const handleOfferSubmit = async (amount: number, message?: string) => {
    console.log('Teklif gönderiliyor:', { amount, message, itemId });
    // API call yapılacak
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <Link href="/pazar" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-6 inline-block">
          ← Pazara Dön
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Kolon: Resimler */}
          <div className="lg:col-span-2">
            <ImageGallery images={item.images} title={item.title} />

            {/* Açıklama */}
            <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Açıklama</h2>
              <p className="text-gray-700 whitespace-pre-line">{item.description}</p>
            </div>

            {/* Teknik Özellikler */}
            <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Teknik Özellikler</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-600">Marka</dt>
                  <dd className="text-lg font-semibold text-gray-900">{item.brand}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Model</dt>
                  <dd className="text-lg font-semibold text-gray-900">{item.model}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Üretim Yılı</dt>
                  <dd className="text-lg font-semibold text-gray-900">{item.year}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Durum</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {CONDITION_LABELS[item.condition] || 'Bilinmiyor'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Şehir</dt>
                  <dd className="text-lg font-semibold text-gray-900">{item.city}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Takas</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {item.isOpenToTrade ? 'Açık' : 'Kapalı'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Sağ Kolon: Satıcı & Butonlar */}
          <div className="space-y-6">
            {/* Fiyat Kartı */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-6">
              <div className="text-4xl font-bold text-blue-600 mb-6">
                ₺{item.price.toLocaleString('tr-TR')}
              </div>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setIsOfferModalOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
                >
                  Teklif Ver
                </button>
                <button className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-3 px-4 rounded-lg transition">
                  Satıcıya Mesaj At
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                👁 {item.viewCount} kişi bu ürünü görüntüledi
              </p>
            </div>

            {/* Satıcı Bilgisi */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Satıcı Hakkında</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ad Soyad</p>
                  <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {item.seller.name}
                    {item.seller.verified && <span className="text-blue-600">✓</span>}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Şehir</p>
                  <p className="text-lg font-semibold text-gray-900">{item.seller.city}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Yanıt Süresi</p>
                  <p className="text-lg font-semibold text-gray-900">{item.seller.responseTime}</p>
                </div>
              </div>
            </div>

            {/* Aman Ol Bilgisi */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-2">Güvenli Alışveriş İpuçları</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Ürünü görüp kontrol ettikten sonra ödeme yapın</li>
                <li>Konum seçiminde dikkatli olun</li>
                <li>Ödeme öncesi mutabakat kaydedin</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <OfferModal
        itemId={itemId}
        currentPrice={item.price}
        itemTitle={item.title}
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        onSubmit={handleOfferSubmit}
      />
    </div>
  );
}

export default async function MarketplaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MarketplaceDetailContent itemId={id} />;
}
