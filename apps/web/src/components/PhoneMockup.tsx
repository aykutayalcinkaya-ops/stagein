/** Landing hero'daki telefon çerçevesi — görsel varlık gerektirmez, saf CSS. */
export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[300px]">
      <div className="rounded-[2rem] border border-border bg-card p-3 shadow-none">
        <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.4rem] border border-border bg-dark">
          <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />

          <div className="flex h-full flex-col justify-between p-4 pt-10">
            <div className="flex justify-center">
              <span className="rounded-full border border-border bg-card px-3 py-1 text-[10px] text-text-secondary">
                İstanbul · Keşfet
              </span>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <div className="h-32 w-full rounded-lg border border-border bg-surface" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-border" />
                <span className="flex flex-col gap-1">
                  <span className="block h-2 w-24 rounded bg-border" />
                  <span className="block h-2 w-16 rounded bg-border/60" />
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <span className="rounded-full bg-primary/20 px-2 py-1 text-[10px] text-[#B9A6FF]">Bas Gitar</span>
                <span className="rounded-full bg-border px-2 py-1 text-[10px] text-text-secondary">Rock</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                {['Keşfet', 'İlanlar', '+', 'Mesaj', 'Profil'].map((label) => (
                  <span
                    key={label}
                    className={
                      label === '+'
                        ? 'flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white'
                        : 'text-[9px] text-muted'
                    }
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
