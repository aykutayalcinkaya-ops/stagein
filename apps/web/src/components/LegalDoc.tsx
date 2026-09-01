export interface LegalSection {
  heading: string
  paragraphs?: string[]
  items?: string[]
}

interface Props {
  title: string
  updatedAt: string
  intro: string
  sections: LegalSection[]
}

/** Gizlilik / kullanım koşulları gibi uzun metin sayfaları için ortak düzen. */
export function LegalDoc({ title, updatedAt, intro, sections }: Props) {
  return (
    <div className="bg-surface">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 text-sm text-muted">Son güncelleme: {updatedAt}</p>

        <p className="mt-8 text-lg leading-relaxed text-text-secondary">{intro}</p>

        <div className="mt-4 rounded-lg border border-border bg-card p-4 text-sm text-muted">
          Bu metin yayına hazırlık aşamasındaki taslaktır; ürün canlıya alınmadan önce hukuki incelemeden geçirilmelidir.
        </div>

        <div className="mt-12 flex flex-col gap-10">
          {sections.map((section, index) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-bold tracking-tight">
                <span className="mr-3 text-primary">{String(index + 1).padStart(2, '0')}</span>
                {section.heading}
              </h2>

              {section.paragraphs?.map((p) => (
                <p key={p} className="mt-4 text-base leading-relaxed text-text-secondary">
                  {p}
                </p>
              ))}

              {section.items ? (
                <ul className="mt-4 flex flex-col gap-3">
                  {section.items.map((item) => (
                    <li key={item} className="border-l-2 border-border pl-4 text-base leading-relaxed text-text-secondary">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
