'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CITIES } from '@stagein/shared'

export function CityFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <select
      value={searchParams.get('city') ?? ''}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString())
        if (e.target.value) params.set('city', e.target.value)
        else params.delete('city')
        router.push(`${pathname}?${params.toString()}`)
      }}
      className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-white outline-none transition-colors duration-150 focus:border-primary"
    >
      <option value="">Tüm şehirler</option>
      {CITIES.map((city) => (
        <option key={city} value={city}>
          {city}
        </option>
      ))}
    </select>
  )
}
