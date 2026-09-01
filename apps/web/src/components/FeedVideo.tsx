'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { Video } from '@stagein/shared'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { UserAvatar } from './UserAvatar'
import { Chip } from './ui'

function useVideoSource(video: Video) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    // HLS'i yalnızca yerel destek varsa (Safari) kullan; diğer tarayıcılarda ham dosyaya düş.
    const el = document.createElement('video')
    const canPlayHls = el.canPlayType('application/vnd.apple.mpegurl') !== ''

    if (video.hls_url && canPlayHls) {
      setSrc(video.hls_url)
      return
    }

    if (!isSupabaseConfigured) return
    const { data } = createClient().storage.from('videos').getPublicUrl(video.storage_path)
    setSrc(data.publicUrl)
  }, [video.hls_url, video.storage_path])

  return src
}

export function FeedVideo({ video }: { video: Video }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const src = useVideoSource(video)
  const [muted, setMuted] = useState(true)

  // Ekranda yalnızca görünür video oynar.
  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const el = videoRef.current
        if (!el) return
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) void el.play().catch(() => {})
        else el.pause()
      },
      { threshold: [0, 0.6, 1] }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [src])

  const author = video.user

  return (
    <div ref={containerRef} className="relative h-[calc(100dvh-4rem)] w-full shrink-0 snap-start snap-always bg-dark">
      {src ? (
        <video
          ref={videoRef}
          src={src}
          poster={video.thumbnail_url ?? undefined}
          className="h-full w-full object-contain"
          playsInline
          loop
          muted={muted}
          preload="metadata"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted">Video yükleniyor…</div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/40 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6">
        <div className="max-w-lg">
          {author ? (
            <Link href={`/profil/${author.username}`} className="pointer-events-auto flex items-center gap-3">
              <UserAvatar name={author.full_name} username={author.username} url={author.avatar_url} size={44} />
              <span>
                <span className="block text-base font-bold">{author.full_name ?? author.username}</span>
                <span className="block text-sm text-text-secondary">@{author.username}</span>
              </span>
            </Link>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {video.city ? <Chip tone="primary">{video.city}</Chip> : null}
            {video.instruments.slice(0, 3).map((i) => (
              <Chip key={i}>{i}</Chip>
            ))}
          </div>
        </div>

        <div className="pointer-events-auto flex flex-col items-center gap-4 text-center">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="rounded-lg border border-border bg-card/80 px-3 py-2 text-xs font-semibold"
          >
            {muted ? 'Sesi Aç' : 'Sesi Kapat'}
          </button>
          <div className="text-sm">
            <span className="block font-bold">{video.like_count}</span>
            <span className="block text-xs text-muted">beğeni</span>
          </div>
          <div className="text-sm">
            <span className="block font-bold">{video.view_count}</span>
            <span className="block text-xs text-muted">izlenme</span>
          </div>
          {author ? (
            <Link
              href={`/profil/${author.username}`}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-all duration-150 ease-out hover:bg-primary/90 active:scale-95"
            >
              Mesaj At
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
