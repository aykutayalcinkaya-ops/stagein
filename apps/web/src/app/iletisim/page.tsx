import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'İletişim',
  description: 'StageIn ekibine ulaş: destek, iş birliği, stüdyo ve eğitmen başvuruları, basın.',
  alternates: { canonical: '/iletisim' },
}

const CHANNELS = [
  { title: 'Destek', detail: 'destek@stagein.app', body: 'Hesap, yükleme ve mesajlaşma sorunları için.' },
  { title: 'Stüdyo & Eğitmen', detail: 'is@stagein.app', body: 'Rezervasyon ve ders pilot programına katılmak için.' },
  { title: 'İş birliği & Basın', detail: 'merhaba@stagein.app', body: 'Etkinlik, iş birliği ve basın talepleri için.' },
]

export default function IletisimPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-black tracking-tight sm:text-5xl">İletişim</h1>
      <p className="mt-4 max-w-2xl text-lg text-text-secondary">
        Hangi konuda yazacağını seç; doğru kanala yazılan mesaj daha hızlı dönüş alır. Hafta içi 24 saat içinde
        yanıtlıyoruz.
      </p>

      <div className="mt-10 flex flex-col gap-4">
        {CHANNELS.map((c) => (
          <div key={c.title} className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold tracking-tight">{c.title}</h2>
            <a
              href={`mailto:${c.detail}`}
              className="mt-2 inline-block text-lg font-semibold text-primary underline underline-offset-4"
            >
              {c.detail}
            </a>
            <p className="mt-3 text-sm text-text-secondary">{c.body}</p>
          </div>
        ))}
      </div>

      <section className="mt-12 rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold tracking-tight">Sosyal</h2>
        <ul className="mt-4 flex flex-wrap gap-5 text-sm">
          <li>
            <a href="https://instagram.com/stageinapp" target="_blank" rel="noreferrer" className="text-text-secondary hover:text-white">
              Instagram
            </a>
          </li>
          <li>
            <a href="https://x.com/stageinapp" target="_blank" rel="noreferrer" className="text-text-secondary hover:text-white">
              X
            </a>
          </li>
          <li>
            <a href="https://youtube.com/@stageinapp" target="_blank" rel="noreferrer" className="text-text-secondary hover:text-white">
              YouTube
            </a>
          </li>
        </ul>
      </section>
    </div>
  )
}
