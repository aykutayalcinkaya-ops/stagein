'use client';

import { AudioSamplePlayer } from '@/components/freelance/AudioSamplePlayer';
import { PackageSelector } from '@/components/freelance/PackageSelector';
import { PackageComparisonTable } from '@/components/freelance/PackageComparisonTable';

const SAMPLE_GIG = {
  id: 'gig-1',
  title: 'Ben, şarkınızın profesyonel mix & mastering işlemlerini yapabilirim.',
  description:
    'Uluslararası standartlarda mix ve mastering hizmeti sunuyorum. Profesyonel stüdyoda yıllar deneyimle birlikte, en son teknoloji ve yazılımlarla çalışıyorum.',
  coverImage: null,
  audioSamples: [
    { title: 'Örnek 1: Trap Beat', url: '/samples/trap.mp3', duration: 180 },
    { title: 'Örnek 2: Pop Mix', url: '/samples/pop.mp3', duration: 240 },
  ],
  requirements:
    'Ses dosyalarınızı WAV veya MP3 formatında gönderin. Maksimum 10 stemi kabul ediyorum.',
  faq: [
    {
      question: 'Kaç gün içinde bitiriyor?',
      answer: 'Pakete göre değişmekle beraber, 3-7 gün içerisinde ilk versionu sunuyorum.',
    },
    {
      question: 'Revizyon yapılıyor mu?',
      answer: 'Evet, paketine göre 1-3 revizyon hakkın var. Premium pakette sınırsız revizyon.',
    },
    {
      question: 'Hangi formatta dosya alacağım?',
      answer: 'WAV (24bit), MP3 (320kbps) veya her iki formatta isteğin üzerine.',
    },
  ],
  rating: 4.9,
  ratingCount: 42,
  sellerName: 'Mehmet Yılmaz',
  sellerAvatar: null,
  sellerBio: '10+ yıl müzik prodüksiyonu deneyimi. International festival jüri üyesi.',
  sellerFollowers: 1240,
  packages: [
    {
      id: 'pkg-basic',
      tier: 'basic' as const,
      title: 'Başlangıç Mix',
      description: 'Temel mix ve mastering',
      price: 500,
      deliveryDays: 7,
      revisionsCount: 1,
      features: {
        wav_delivery: true,
        mp3_delivery: true,
        stem_delivery: false,
        commercial_rights: false,
      },
    },
    {
      id: 'pkg-standard',
      tier: 'standard' as const,
      title: 'Standart Mix Pro',
      description: 'Detaylı mix ve profesyonel mastering',
      price: 1000,
      deliveryDays: 5,
      revisionsCount: 3,
      features: {
        wav_delivery: true,
        mp3_delivery: true,
        stem_delivery: true,
        commercial_rights: true,
      },
    },
    {
      id: 'pkg-premium',
      tier: 'premium' as const,
      title: 'Premium Studio Mix',
      description: 'Ekip çalışması ve sınırsız revizyon',
      price: 2500,
      deliveryDays: 3,
      revisionsCount: 999,
      features: {
        wav_delivery: true,
        mp3_delivery: true,
        stem_delivery: true,
        commercial_rights: true,
      },
    },
  ],
  reviews: [
    {
      id: 'rev-1',
      buyerName: 'Ahmet K.',
      rating: 5,
      comment: 'Harika bir deneyim. Tam istediğim gibi mix yaptı.',
      createdAt: '2026-09-01',
    },
    {
      id: 'rev-2',
      buyerName: 'Fatma G.',
      rating: 5,
      comment: 'Profesyonel ve hızlı. Kesinlikle tavsiye ederim.',
      createdAt: '2026-08-28',
    },
  ],
};

function GigDetailContent() {
  const handleSelectPackage = (pkg: any) => {
    console.log('Sipariş ver:', pkg);
  };

  const handleContactSeller = () => {
    console.log('Satıcıya soru sor');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gig Title & Rating */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{SAMPLE_GIG.title}</h1>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  <span className="text-2xl text-yellow-400">★</span>
                  <span className="text-xl font-bold text-gray-900">
                    {SAMPLE_GIG.rating.toFixed(1)}
                  </span>
                  <span className="text-gray-500">({SAMPLE_GIG.ratingCount} değerlendirme)</span>
                </div>
              </div>

              <p className="text-lg text-gray-700 leading-relaxed">{SAMPLE_GIG.description}</p>
            </div>

            {/* Audio Samples */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Ses Örnekleri</h2>
              <AudioSamplePlayer samples={SAMPLE_GIG.audioSamples} />
            </div>

            {/* Package Comparison */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Paket Karşılaştırması</h2>
              <PackageComparisonTable packages={SAMPLE_GIG.packages} />
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sıkça Sorulan Sorular</h2>
              <div className="space-y-4">
                {SAMPLE_GIG.faq.map((item, idx) => (
                  <details key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <summary className="font-semibold text-gray-900 cursor-pointer">
                      {item.question}
                    </summary>
                    <p className="mt-2 text-gray-700">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Değerlendirmeler</h2>
              <div className="space-y-4">
                {SAMPLE_GIG.reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{review.buyerName}</h4>
                      <div className="text-yellow-400">{'★'.repeat(review.rating)}</div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                    <p className="text-xs text-gray-500 mt-2">{review.createdAt}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Müzisyen Hakkında</h2>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{SAMPLE_GIG.sellerName}</h3>
                  <p className="text-gray-600 mb-2">{SAMPLE_GIG.sellerBio}</p>
                  <p className="text-sm text-gray-500">
                    {SAMPLE_GIG.sellerFollowers} takipçi
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Package Selector */}
          <div className="lg:col-span-1">
            <PackageSelector
              packages={SAMPLE_GIG.packages}
              onSelect={handleSelectPackage}
              onContactSeller={handleContactSeller}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function GigDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GigDetailContent />;
}
