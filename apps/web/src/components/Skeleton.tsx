'use client'

import { useEffect, useState } from 'react'
import { cn } from './ui'

/**
 * Genel amaçlı, nabız (pulse) animasyonlu placeholder bloğu. Boyut/şekil
 * tamamen `className` ile kontrol edilir (ör. `h-4 w-1/2 rounded-full`).
 *
 * Not: `apps/web/src/components/ui.tsx` içinde de aynı işlevi gören bir
 * `Skeleton` var (geriye dönük uyumluluk için korunuyor — `Wall.tsx` ve
 * `VideoFeed.tsx` onu `./ui`'dan import ediyor). Bu dosyadaki `Skeleton`,
 * yeni kod için önerilen, `CardSkeleton`/`LineSkeleton`/`AvatarSkeleton` ile
 * birlikte gelen daha zengin settir: `import { Skeleton } from '@/components/Skeleton'`.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-white/[0.06]', className)} />
}

/** Tek satırlık metin placeholder'ı (başlık/alt satır simülasyonu). */
export function LineSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-3.5 w-full rounded-full', className)} />
}

/** Yuvarlak avatar placeholder'ı. */
export function AvatarSkeleton({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = { sm: 'h-8 w-8', md: 'h-11 w-11', lg: 'h-16 w-16' } as const
  return <Skeleton className={cn('shrink-0 rounded-full', sizes[size], className)} />
}

/** Avatar + başlık + gövde satırlarından oluşan kart iskeleti (feed/liste kartları için). */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card/80 p-5', className)}>
      <div className="flex items-center gap-3">
        <AvatarSkeleton />
        <div className="flex-1 space-y-2">
          <LineSkeleton className="w-1/3" />
          <LineSkeleton className="h-3 w-1/4" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <LineSkeleton />
        <LineSkeleton className="w-5/6" />
        <LineSkeleton className="w-2/3" />
      </div>
    </div>
  )
}

/**
 * `ms` milisaniye dolduğunda `true` döner. Amaç: bir yükleme durumu
 * (spinner/skeleton) makul bir süre içinde bitmezse arayüzü "sonsuz
 * spinner" halinde bırakmak yerine bir hata/`EmptyState` düşüşüne
 * geçirmek (gravity.md madde 4).
 *
 * `resetKey` değiştiğinde zamanlayıcı sıfırlanır — ör. kullanıcı "tekrar
 * dene" dediğinde `resetKey`'i artırarak sayaç yeniden başlatılabilir.
 *
 * Örnek:
 * ```tsx
 * const timedOut = useTimeout(8000, retryCount)
 * if (timedOut) return <EmptyState title="Bir şeyler ters gitti" description="Tekrar dene." action={{ label: 'Tekrar Dene', onClick: retry }} />
 * if (isLoading) return <CardSkeleton />
 * ```
 */
export function useTimeout(ms: number, resetKey?: unknown): boolean {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    setTimedOut(false)
    const id = setTimeout(() => setTimedOut(true), ms)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, resetKey])

  return timedOut
}
