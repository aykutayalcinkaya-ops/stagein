'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { GraduationCap, LayoutGrid, Mic2, Search, Users, X } from 'lucide-react'
import { CITIES, GENRES, INSTRUMENTS } from '@stagein/shared'
import { LISTING_TYPE_LABELS } from '@/lib/site'
import { FilterDropdown } from './FilterDropdown'
import { cn } from './ui'

const TYPES = ['band', 'session', 'lesson'] as const

const TYPE_ICONS: Record<(typeof TYPES)[number], typeof Users> = {
  band: Users,
  session: Mic2,
  lesson: GraduationCap,
}

const pillClass =
  'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-dark'

export function ListingFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  const active = (key: string) => searchParams.get(key) ?? ''
  const hasFilters = ['type', 'city', 'instrument', 'genre', 'q'].some((k) => searchParams.get(k))

  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setParam('type', '')}
          className={cn(
            pillClass,
            active('type') === '' ? 'border-primary bg-primary text-white' : 'border-border text-text-secondary hover:text-white'
          )}
        >
          <LayoutGrid className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Tümü
        </button>
        {TYPES.map((type) => {
          const Icon = TYPE_ICONS[type]
          return (
            <button
              key={type}
              type="button"
              onClick={() => setParam('type', type)}
              className={cn(
                pillClass,
                active('type') === type ? 'border-primary bg-primary text-white' : 'border-border text-text-secondary hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              {LISTING_TYPE_LABELS[type]}
            </button>
          )
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            strokeWidth={2}
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="İlan ara"
            defaultValue={active('q')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setParam('q', (e.target as HTMLInputElement).value.trim())
            }}
            className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors duration-150 placeholder:text-muted focus:border-primary"
          />
        </div>

        <FilterDropdown
          label="Şehir"
          options={[...CITIES]}
          selected={active('city') ? [active('city')] : []}
          onChange={(next) => setParam('city', next[0] ?? '')}
          multiple={false}
          className="w-full justify-between"
        />

        <FilterDropdown
          label="Enstrüman"
          options={[...INSTRUMENTS]}
          selected={active('instrument') ? [active('instrument')] : []}
          onChange={(next) => setParam('instrument', next[0] ?? '')}
          multiple={false}
          className="w-full justify-between"
        />

        <FilterDropdown
          label="Tarz"
          options={[...GENRES]}
          selected={active('genre') ? [active('genre')] : []}
          onChange={(next) => setParam('genre', next[0] ?? '')}
          multiple={false}
          className="w-full justify-between"
        />
      </div>

      {hasFilters ? (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="inline-flex min-h-11 w-fit items-center gap-1.5 self-start rounded-full px-2 text-sm text-muted transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-dark"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          Filtreleri temizle
        </button>
      ) : null}
    </div>
  )
}
