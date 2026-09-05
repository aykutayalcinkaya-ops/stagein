'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useVideoFeed } from '@/hooks/useVideoFeed'
import { useVideoFeedRealtime } from '@/hooks/useRealtimeUpdates'
import { FeedVideo } from './FeedVideo'
import { CITIES } from '@stagein/shared'
import { EmptyState, LinkButton, Skeleton, cn } from './ui'

export function VideoFeed({ startVideoId }: { startVideoId?: string }) {
  useVideoFeedRealtime()
  const [city, setCity] = useState<string>('')
  const [tab, setTab] = useState<'kesfet' | 'takip'>('kesfet')
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useVideoFeed(
    city || undefined,
    startVideoId
  )
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage()
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const videos = data?.pages.flat() ?? []

  return (
    <div className="relative h-dvh w-full bg-black">
      {/* immersive üst çubuk — Keşfet'te SiteHeader gizli */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link href="/" className="pointer-events-auto font-display text-xl uppercase tracking-wide text-white">
          Stage<span className="text-primary">In</span>
        </Link>

        <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-white/10 p-1 backdrop-blur-md">
          {(['takip', 'kesfet'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors duration-180',
                tab === t ? 'bg-white text-dark' : 'text-white/70 hover:text-white'
              )}
            >
              {t === 'kesfet' ? 'Keşfet' : 'Takip'}
            </button>
          ))}
        </div>

        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="pointer-events-auto rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white outline-none backdrop-blur-md"
        >
          <option value="" className="text-dark">
            Tüm şehirler
          </option>
          {CITIES.map((c) => (
            <option key={c} value={c} className="text-dark">
              {c}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center bg-black">
          <Skeleton className="h-4/5 w-full max-w-sm rounded-2xl bg-white/10" />
        </div>
      ) : isError ? (
        <div className="flex h-full items-center justify-center px-4">
          <EmptyState title="Akış yüklenemedi" description="Bağlantını kontrol edip tekrar dene." />
        </div>
      ) : tab === 'takip' ? (
        <div className="flex h-full items-center justify-center px-4">
          <EmptyState
            title="Henüz kimseyi takip etmiyorsun"
            description="Keşfet'te beğendiğin müzisyenleri takip et, burada onların videolarını gör."
            action={
              <button type="button" onClick={() => setTab('kesfet')} className="text-sm font-semibold text-primary underline underline-offset-4">
                Keşfet'e dön
              </button>
            }
          />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex h-full items-center justify-center px-4">
          <EmptyState
            title="Burada henüz video yok"
            description="Bu şehirde henüz kimse video yüklememiş. İlk sen ol — uygulamayı indir ve sahneye çık."
            action={<LinkButton href="/#indir">Uygulamayı İndir</LinkButton>}
          />
        </div>
      ) : (
        <div className="h-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain">
          {videos.map((video) => (
            <FeedVideo key={video.id} video={video} />
          ))}
          <div ref={sentinelRef} className="h-px w-full" />
          {isFetchingNextPage ? (
            <div className="flex h-16 items-center justify-center text-xs text-muted">Yükleniyor…</div>
          ) : null}
        </div>
      )}
    </div>
  )
}
