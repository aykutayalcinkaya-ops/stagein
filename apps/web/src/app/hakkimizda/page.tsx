import type { Metadata } from 'next'
import { LinkButton } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Hakkımızda',
  description:
    'StageIn, müzisyenlerin birbirini bulması için kurulmuş video odaklı, şehir bazlı bir sosyal ağdır. Neden var olduğumuzu anlatıyoruz.',
  alternates: { canonical: '/hakkimizda' },
}

const PRINCIPLES = [
  {
    title: 'Çaldığın konuşur',
    body: 'Profilinde kaç yıllık deneyim yazdığın değil, yüklediğin videodaki tavır önemli. Platform bunun üzerine kurulu.',
  },
  {
    title: 'Şehir önce gelir',
    body: 'Prova salonuna aynı gün gidebileceğin insanlar önce görünür. Global akış müzisyene iş getirmez, komşu şehir getirir.',
  },
  {
    title: 'Aracı yok',
    body: 'İki müzisyen arasına kimse girmiyor. Mesajlar doğrudan, anlaşma ikinizin arasında.',
  },
  {
    title: 'Müzisyen ödemez',
    body: 'Gelir stüdyo rezervasyonu ve ders komisyonundan gelir. Müzisyen için platform ücretsiz kalır.',
  },
]

export default function HakkimizdaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Hakkımızda</h1>

      <div className="mt-8 flex flex-col gap-6 text-lg leading-relaxed text-text-secondary">
        <p>
          StageIn, çalan insanların birbirini bulması için var. Türkiye&apos;de yetenekli müzisyen eksikliği yok; olan
          şey, o müzisyenlerin birbirinden haberdar olmaması. Bas gitarist arayan bir grup ile grup arayan bir bas
          gitarist aynı şehirde, çoğu zaman aynı ilçede yaşıyor ve hiç karşılaşmıyor.
        </p>
        <p>
          Mevcut yollar dağınık: Facebook grupları, ilan siteleri, tanıdık üzerinden gelen tavsiyeler. Hepsinde ortak
          sorun aynı — karşındaki kişinin nasıl çaldığını göremiyorsun. Biz de akışın merkezine metni değil videoyu
          koyduk.
        </p>
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight">İlkelerimiz</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-xl font-bold tracking-tight">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-xl border border-border bg-card p-6">
        <h2 className="text-2xl font-bold tracking-tight">Nerede duruyoruz?</h2>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          İstanbul, Ankara ve İzmir ile başlıyoruz. Ekip küçük, yol haritası açık: önce keşfet ve ilanlar, ardından
          stüdyo rezervasyonu ve ders altyapısı.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton href="/#indir">Uygulamayı İndir</LinkButton>
          <LinkButton href="/iletisim" variant="outline">
            Bize ulaş
          </LinkButton>
        </div>
      </section>
    </div>
  )
}
