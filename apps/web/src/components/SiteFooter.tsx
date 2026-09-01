import Link from 'next/link'

const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { href: '/kesfet', label: 'Keşfet' },
      { href: '/ilanlar', label: 'İlanlar' },
      { href: '/pazar', label: 'İkinci El Pazar' },
    ],
  },
  {
    title: 'Kurumsal',
    links: [
      { href: '/hakkimizda', label: 'Hakkımızda' },
      { href: '/blog', label: 'Blog' },
      { href: '/iletisim', label: 'İletişim' },
    ],
  },
  {
    title: 'Yasal',
    links: [
      { href: '/gizlilik', label: 'Gizlilik Politikası' },
      { href: '/kullanim-kosullari', label: 'Kullanım Koşulları' },
    ],
  },
]

const SOCIAL = [
  { href: 'https://instagram.com/stageinapp', label: 'Instagram' },
  { href: 'https://x.com/stageinapp', label: 'X' },
  { href: 'https://youtube.com/@stageinapp', label: 'YouTube' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-dark">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-black tracking-tight">
              Stage<span className="text-primary">In</span>
            </p>
            <p className="mt-3 max-w-xs text-sm text-muted">
              Müzisyenler için video odaklı, şehir bazlı sosyal ağ. Sahne senin.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-white">{col.title}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-text-secondary transition-colors duration-150 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">© {new Date().getFullYear()} StageIn. Tüm hakları saklıdır.</p>
          <ul className="flex gap-5">
            {SOCIAL.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noreferrer" className="text-xs text-text-secondary hover:text-white">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
