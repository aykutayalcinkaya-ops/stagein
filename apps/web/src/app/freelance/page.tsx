import { Metadata } from 'next';
import { GigCard } from '@/components/freelance/GigCard';

export const metadata: Metadata = {
  title: 'Freelance Müzik Hizmetleri | StageIn',
  description: 'Müzisyenler, prodüktörler ve ses mühendisleri tarafından sunulan profesyonel müzik hizmetleri pazaryeri.',
};

const CATEGORIES = [
  { id: 'mix-mastering', name: 'Mix & Mastering', icon: '🎚️' },
  { id: 'beat-production', name: 'Müzik Prodüksiyonu & Beste', icon: '🎵' },
  { id: 'session-musician', name: 'Enstrüman & Session Kayıt', icon: '🎸' },
  { id: 'voiceover', name: 'Seslendirme & Dublaj', icon: '🎤' },
  { id: 'songwriting', name: 'Şarkı Sözü & Beste', icon: '✍️' },
  { id: 'audio-editing', name: 'Ses Düzenleme & Restorasyon', icon: '🔧' },
  { id: 'lessons', name: 'Müzik Dersi & Danışmanlık', icon: '📚' },
];

const SAMPLE_GIGS = [
  {
    id: '1',
    slug: 'mix-mastering-prof',
    title: 'Ben, şarkınızın profesyonel mix & mastering işlemlerini yapabilirim.',
    description: 'Stem mix, vokal tuning, stereo mastering ve streaming optimizasyonu',
    coverImage: null,
    minPrice: 500,
    rating: 4.9,
    ratingCount: 42,
    sellerName: 'Mehmet Yılmaz',
    sellerAvatar: null,
    orderQueueCount: 3,
  },
  {
    id: '2',
    slug: 'beat-production',
    title: 'Ben, özel beat ve altyapı üretebilirim.',
    description: 'Trap, hip-hop, R&B, pop ve electronic müzik türlerinde özel beatler',
    coverImage: null,
    minPrice: 300,
    rating: 4.8,
    ratingCount: 28,
    sellerName: 'Ayşe Kaya',
    sellerAvatar: null,
    orderQueueCount: 1,
  },
  {
    id: '3',
    slug: 'vocal-recording',
    title: 'Ben, profesyonel vocal recording ve tuning yapabilirim.',
    description: 'Studio kalitesinde vokal kayıt, pitch correction, autotune',
    coverImage: null,
    minPrice: 400,
    rating: 5.0,
    ratingCount: 15,
    sellerName: 'Ali Demir',
    sellerAvatar: null,
    orderQueueCount: 2,
  },
];

export default function FreelancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Profesyonel Müzik Hizmetleri Pazaryeri
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Müzisyenler, prodüktörler, ses mühendisleri tarafından sunulan kaliteli hizmetleri keşfedin.
          </p>

          {/* Search & Filter */}
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Hizmet ara..."
              className="flex-1 min-w-64 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition">
              Ara
            </button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 px-4 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Kategoriler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className="p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition text-left"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gigs Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Öne Çıkanlar</h2>
            <button className="text-blue-600 hover:text-blue-700 font-semibold">
              Tümünü Gör →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SAMPLE_GIGS.map((gig) => (
              <GigCard key={gig.id} {...gig} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 bg-blue-50 border-t border-gray-200">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Müzik Hizmeti Sunmak İster Misin?
          </h2>
          <p className="text-gray-600 mb-8">
            Yeteneklerini göster ve geçiminizi müzik yaparak sağla.
          </p>
          <a
            href="/freelance/yeni"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition"
          >
            İlan Oluştur
          </a>
        </div>
      </section>
    </div>
  );
}
