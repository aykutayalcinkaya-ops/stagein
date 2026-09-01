'use client'

import { useEffect, useRef, useState } from 'react'
import { useVideoFeed } from '@/hooks/useVideoFeed'
import { FeedVideo } from './FeedVideo'
import { CITIES } from '@stagein/shared'
import { EmptyState, LinkButton } from './ui'

export function VideoFeed() {
  const [city, setCity] = useState<string>('')
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useVideoFeed(city || undefined)
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
    <div className="relative">
      <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-lg border border-border bg-card/90 px-4 py-2 text-sm text-white outline-none focus:border-primary"
        >
          <option value="">Tüm şehirler</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex h-[calc(100dvh-4rem)] items-center justify-center text-sm text-muted">Akış yükleniyor…</div>
      ) : isError ? (
        <div className="flex h-[calc(100dvh-4rem)] items-center justify-center px-4">
          <EmptyState title="Akış yüklenemedi" description="Bağlantını kontrol edip tekrar dene." />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex h-[calc(100dvh-4rem)] items-center justify-center px-4">
          <EmptyState
            title="Burada henüz video yok"
            description="Bu şehirde henüz kimse video yüklememiş. İlk sen ol — uygulamayı indir ve sahneye çık."
            action={<LinkButton href="/#indir">Uygulamayı İndir</LinkButton>}
          />
        </div>
      ) : (
        <div className="h-[calc(100dvh-4rem)] snap-y snap-mandatory overflow-y-scroll">
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
