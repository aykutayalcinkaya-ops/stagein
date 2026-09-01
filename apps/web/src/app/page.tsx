import type { Metadata } from 'next'
import Link from 'next/link'
import { CITIES } from '@stagein/shared'
import { PhoneMockup } from '@/components/PhoneMockup'
import { LinkButton, SectionTitle } from '@/components/ui'
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/site'
import { getCityStats } from '@/lib/data'

export const metadata: Metadata = {
  title: 'StageIn — Müzisyenlerin Platformu',
  description:
    'Çal, yükle, keşfedil. Şehrindeki müzisyenlerle doğrudan bağlan; grup kur, session bul, ders ver.',
  alternates: { canonical: '/' },
}

const FEATURES = [
  {
    title: 'Keşfet',
    body: 'Dikey video akışı. Şehrindeki müzisyenler, senin enstrümanın, senin tarzın. Algoritma değil, coğrafya ve enstrüman.',
  },
  {
    title: 'İlanlar',
    body: 'Grup arayan gruplar, session arayan müzisyenler, öğrenci arayan eğitmenler. Şehre ve enstrümana göre filtrele.',
  },
  {
    title: 'Mesajlaş',
    body: 'Ajans yok, aracı yok. Videoyu izle, doğrudan yaz. Anlatması zor olanı 60 saniyelik sesli notla gönder.',
  },
]

const STEPS = [
  { step: '01', title: 'Video Yükle', body: 'Telefonla çal, 60 saniyeye kadar dikey video yükle. Prodüksiyon gerekmez.' },
  { step: '02', title: 'Keşfedil', body: 'Videon şehrindeki ve enstrümanındaki müzisyenlerin akışında görünür.' },
  { step: '03', title: 'Bağlan', body: 'Mesaj kutun açık. Prova, kayıt, sahne — gerisi ikinizin arasında.' },
]

const REVENUE = [
  { who: 'Müzisyenler', price: 'Ücretsiz', body: 'Video, ilan, mesaj, profil. Tamamı ücretsiz ve öyle kalacak.' },
  { who: 'Stüdyolar', price: 'Rezervasyon komisyonu', body: 'Saatlik takvim, online rezervasyon ve ödeme. Boş saatlerini doldur.' },
  { who: 'Eğitmenler', price: 'Ders komisyonu', body: 'Ders ilanı yayınla, öğrenci bul, takvimini platform üzerinden yönet.' },
]

export default async function HomePage() {
  const stats = await getCityStats()
  const featured = CITIES.slice(0, 3)

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundColor: '#0A0A0A',
            backgroundImage:
              'linear-gradient(to right, #2A2A2A 1px, transparent 1px), linear-gradient(to bottom, #2A2A2A 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(ellipse at 30% 40%, black 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 30% 40%, black 20%, transparent 75%)',
          }}
        />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-20 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Türkiye&apos;nin müzisyen ağı
            </p>
            <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Müzisyenlerin
              <br />
              Platformu
            </h1>
            <p className="mt-6 max-w-xl text-lg text-text-secondary">
              Çaldığın videoyu yükle, şehrindeki müzisyenler seni bulsun. Grup kur, session al, ders ver — aracısız,
              doğrudan.
            </p>

            <div className="mt-9 flex flex-wrap gap-3" id="indir">
              <a
                href={APP_STORE_URL}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all duration-150 ease-out hover:bg-primary/90 active:scale-95"
              >
                App Store
              </a>
              <a
                href={PLAY_STORE_URL}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold text-text transition-colors duration-150 hover:border-primary hover:text-white"
              >
                Google Play
              </a>
              <LinkButton href="/ilanlar" variant="ghost">
                İlanlara göz at
              </LinkButton>
            </div>

            <p className="mt-6 text-sm text-muted">Kayıt olmadan keşfet akışını izleyebilirsin.</p>
          </div>

          <PhoneMockup />
        </div>
      </section>

      {/* Özellikler */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <SectionTitle sub="Üç iş yapar, üçünü de iyi yapar.">Ne işe yarar?</SectionTitle>
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-2xl font-bold tracking-tight">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <SectionTitle>Nasıl çalışır?</SectionTitle>
          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="rounded-xl border border-border bg-card p-6">
                <span className="text-4xl font-black text-primary">{s.step}</span>
                <h3 className="mt-4 text-xl font-bold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Şehirler */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <SectionTitle sub="Önce üç şehirde başlıyoruz, sonra tüm Türkiye.">Şehirler</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            {featured.map((city) => (
              <div key={city} className="rounded-xl border border-border bg-card p-6">
                <p className="text-3xl font-black tracking-tight">{city}</p>
                <p className="mt-2 text-sm text-text-secondary">
                  {stats[city] ? `${stats[city]} müzisyen` : 'Yeni açıldı'}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">
            Şehrinde StageIn yok mu?{' '}
            <Link href="/iletisim" className="underline underline-offset-4 hover:text-white">
              Bize yaz
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Gelir modeli */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <SectionTitle sub="Müzisyenden para almıyoruz. Platformu, müzisyene hizmet satan taraf finanse ediyor.">
            Kim ne öder?
          </SectionTitle>
          <div className="grid gap-4 md:grid-cols-3">
            {REVENUE.map((r) => (
              <div key={r.who} className="rounded-xl border border-border bg-card p-6">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted">{r.who}</p>
                <p className="mt-3 text-2xl font-bold tracking-tight text-accent">{r.price}</p>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-24 text-center">
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Sahne senin.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">
            Uygulamayı indir, ilk videonu yükle. Şehrindeki müzisyenler seni bekliyor.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={APP_STORE_URL}
              className="inline-flex items-center rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all duration-150 ease-out hover:bg-primary/90 active:scale-95"
            >
              App Store
            </a>
            <a
              href={PLAY_STORE_URL}
              className="inline-flex items-center rounded-lg border border-border px-6 py-3 font-semibold text-text transition-colors duration-150 hover:border-primary hover:text-white"
            >
              Google Play
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
