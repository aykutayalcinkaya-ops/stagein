'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { CITIES, GENRES, INSTRUMENTS } from '@stagein/shared'
import { LISTING_TYPE_LABELS } from '@/lib/site'
import { cn } from './ui'

const TYPES = ['band', 'session', 'lesson'] as const

const selectClass =
  'w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-white outline-none transition-colors duration-150 focus:border-primary'

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
            'rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150',
            active('type') === '' ? 'border-primary bg-primary text-white' : 'border-border text-text-secondary hover:text-white'
          )}
        >
          Tümü
        </button>
        {TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setParam('type', type)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150',
              active('type') === type ? 'border-primary bg-primary text-white' : 'border-border text-text-secondary hover:text-white'
            )}
          >
            {LISTING_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          placeholder="İlan ara"
          defaultValue={active('q')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setParam('q', (e.target as HTMLInputElement).value.trim())
          }}
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-white outline-none transition-colors duration-150 placeholder:text-muted focus:border-primary"
        />

        <select value={active('city')} onChange={(e) => setParam('city', e.target.value)} className={selectClass}>
          <option value="">Tüm şehirler</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <select value={active('instrument')} onChange={(e) => setParam('instrument', e.target.value)} className={selectClass}>
          <option value="">Tüm enstrümanlar</option>
          {INSTRUMENTS.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>

        <select value={active('genre')} onChange={(e) => setParam('genre', e.target.value)} className={selectClass}>
          <option value="">Tüm tarzlar</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {hasFilters ? (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="self-start text-sm text-muted underline underline-offset-4 hover:text-white"
        >
          Filtreleri temizle
        </button>
      ) : null}
    </div>
  )
}
