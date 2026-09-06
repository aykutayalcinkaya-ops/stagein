'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { ReactionType, Video } from '@stagein/shared'
import { REACTION_EMOJIS, REACTION_LABELS } from '@stagein/shared'
import { useVideoToggleReaction } from '@/hooks/usePostReactions'
import { useToggleVideoShare } from '@/hooks/usePostShares'
import { useVideoSource } from '@/hooks/useVideoSource'
import { useYoutubePlayer } from '@/hooks/useYoutubePlayer'
import { useAuthStore } from '@/stores/authStore'
import { useFeedPlaybackStore } from '@/stores/feedPlaybackStore'
import { sortedReactionEntries } from '@/lib/site'
import { extractYoutubeVideoId } from '@/lib/youtube'
import { UserAvatar } from './UserAvatar'
import { ReactionPicker } from './ReactionPicker'
import { ShareMenu } from './ShareMenu'

function IconButton({
  onClick,
  active,
  label,
  count,
  children,
}: {
  onClick?: () => void
  active?: boolean
  label: string
  count?: number | string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="pointer-events-auto flex flex-col items-center gap-1 text-white"
    >
      <span
        className={
          'flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md transition-all duration-180 active:scale-90 ' +
          (active ? 'bg-accent text-dark' : 'bg-white/10 hover:bg-white/15')
        }
      >
        {children}
      </span>
      {count !== undefined ? <span className="text-xs font-semibold [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">{count}</span> : null}
    </button>
  )
}

function VideoReactionPanel({ video }: { video: Video }) {
  const userId = useAuthStore((s) => s.userId)
  const { mutate: toggleReaction, isPending } = useVideoToggleReaction()
  const topReactions = sortedReactionEntries(video.reactions).slice(0, 3)
  const myReaction = video.my_reaction ?? null

  function quickToggle(reaction: ReactionType) {
    if (!userId) return
    const add = reaction !== myReaction
    toggleReaction({ videoId: video.id, reactionType: reaction, add, oldReaction: myReaction })
  }

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-1.5">
      {topReactions.map(([reaction, count]) => (
        <IconButton
          key={reaction}
          onClick={() => quickToggle(reaction)}
          active={myReaction === reaction}
          label={REACTION_LABELS[reaction]}
          count={count}
        >
          <span className="text-lg leading-none">{REACTION_EMOJIS[reaction]}</span>
        </IconButton>
      ))}

      {userId ? (
        <ReactionPicker
          postId=""
          videoId={video.id}
          currentReaction={myReaction}
          isLoading={isPending}
          onSelect={quickToggle}
        />
      ) : (
        <Link href="/giris" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
            <path d="M12 21s-6.7-4.3-9.3-8.1C.8 10 1.4 6.4 4.4 4.8c2.1-1.1 4.6-.6 6.1 1.2.4.5.7.9 1.5.9.8 0 1.1-.4 1.5-.9 1.5-1.8 4-2.3 6.1-1.2 3 1.6 3.6 5.2 1.7 8.1C18.7 16.7 12 21 12 21Z" />
          </svg>
        </Link>
      )}
    </div>
  )
}

export function FeedVideo({ video }: { video: Video }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const src = useVideoSource(video)
  const muted = useFeedPlaybackStore((s) => s.muted)
  const toggleMuted = useFeedPlaybackStore((s) => s.toggleMuted)
  const paused = useFeedPlaybackStore((s) => s.paused)
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const [burst, setBurst] = useState(false)
  const userId = useAuthStore((s) => s.userId)
  const { mutate: toggleReaction } = useVideoToggleReaction()
  const { mutate: toggleShare } = useToggleVideoShare()

  const youtubeId = video.video_source === 'youtube' && video.youtube_url ? extractYoutubeVideoId(video.youtube_url) : null
  const shouldPlay = isVisible && !paused
  const youtubeContainerRef = useYoutubePlayer(youtubeId ?? '', { muted, shouldPlay: shouldPlay && !!youtubeId, onProgress: setProgress })

  // Ekranda yalnızca görünür video oynar.
  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting && entry.intersectionRatio > 0.6),
      { threshold: [0, 0.6, 1] }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Native <video> oynatma/durdurmayı görünürlük + genel duraklatma durumuna göre uygular.
  useEffect(() => {
    if (youtubeId) return
    const el = videoRef.current
    if (!el) return
    if (shouldPlay) void el.play().catch(() => {})
    else el.pause()
  }, [shouldPlay, src, youtubeId])

  function handleDoubleClick() {
    if (!userId) return
    if ((video.my_reaction ?? null) !== 'love') {
      toggleReaction({ videoId: video.id, reactionType: 'love', add: true, oldReaction: video.my_reaction ?? null })
    }
    setBurst(true)
    window.setTimeout(() => setBurst(false), 700)
  }

  const author = video.user

  return (
    <div
      ref={containerRef}
      className="relative h-dvh w-full shrink-0 snap-start snap-always overflow-hidden bg-black"
      onDoubleClick={handleDoubleClick}
    >
      {youtubeId ? (
        <>
          <div ref={youtubeContainerRef} className="absolute inset-0 z-[1] h-full w-full" />
          {/* YouTube iframe'i cross-origin olduğundan çift-tık gibi jestleri kendi içinde yutar; üstüne şeffaf bir katman koyup jestleri konteynıra taşıyoruz. */}
          <div className="absolute inset-0 z-[2]" onDoubleClick={handleDoubleClick} />
        </>
      ) : src ? (
        <>
          <video
            aria-hidden
            src={src}
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
            playsInline
            autoPlay
            muted
            loop
            preload="auto"
          />
          <video
            ref={videoRef}
            src={src}
            poster={video.thumbnail_url ?? undefined}
            className="relative z-[1] h-full w-full object-contain"
            playsInline
            loop
            muted={muted}
            preload="metadata"
            onTimeUpdate={(e) => {
              const el = e.currentTarget
              if (el.duration) setProgress(el.currentTime / el.duration)
            }}
          />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted">Video yükleniyor…</div>
      )}

      {/* üst ilerleme çubuğu */}
      <div className="absolute inset-x-0 top-0 z-20 h-[3px] bg-white/10">
        <div className="h-full bg-white transition-[width] duration-150 ease-linear" style={{ width: `${progress * 100}%` }} />
      </div>

      {video.id.startsWith('demo-') ? (
        <span className="pointer-events-none absolute right-4 top-4 z-20 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">
          Örnek içerik
        </span>
      ) : null}

      {/* çift-tık kalp animasyonu */}
      {burst ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-24 w-24 animate-[ping_0.7s_ease-out] text-accent drop-shadow-[0_4px_18px_rgba(0,0,0,0.5)]"
          >
            <path d="M12 21s-6.7-4.3-9.3-8.1C.8 10 1.4 6.4 4.4 4.8c2.1-1.1 4.6-.6 6.1 1.2.4.5.7.9 1.5.9.8 0 1.1-.4 1.5-.9 1.5-1.8 4-2.3 6.1-1.2 3 1.6 3.6 5.2 1.7 8.1C18.7 16.7 12 21 12 21Z" />
          </svg>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/3 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 p-4 pb-6 sm:p-6">
        <div className="min-w-0 max-w-[calc(100%-4.5rem)]">
          {author ? (
            <Link href={`/profil/${author.username}`} className="pointer-events-auto flex items-center gap-3">
              <UserAvatar
                name={author.full_name}
                username={author.username}
                url={author.avatar_url}
                size={40}
                className="ring-2 ring-white/80"
              />
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-bold [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
                  {author.full_name ?? author.username}
                </span>
                <span className="block truncate text-xs text-white/70">@{author.username}</span>
              </span>
            </Link>
          ) : null}

          {video.title ? (
            <p className="mt-2.5 line-clamp-1 text-[15px] font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">{video.title}</p>
          ) : null}
          {video.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-white/85 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">{video.description}</p>
          ) : null}

          <p className="mt-3 line-clamp-2 text-sm leading-snug text-white/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
            {[video.city ? `#${video.city.replace(/\s+/g, '')}` : null, ...video.instruments.slice(0, 2).map((i) => `#${i.replace(/\s+/g, '')}`), ...video.genres.slice(0, 1).map((g) => `#${g.replace(/\s+/g, '')}`)]
              .filter(Boolean)
              .join('  ')}
          </p>

          <div className="mt-2.5 flex items-center gap-2 text-xs text-white/70">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 shrink-0 animate-pulse">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <span className="truncate">Orijinal ses · {author?.username ?? 'stagein'}</span>
          </div>
        </div>

        <div className="pointer-events-none flex shrink-0 flex-col items-center gap-3.5">
          {author ? (
            <Link
              href={`/profil/${author.username}`}
              className="pointer-events-auto relative -mb-1 flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-white"
            >
              <UserAvatar name={author.full_name} username={author.username} url={author.avatar_url} size={48} />
              <span className="absolute -bottom-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-dark">
                +
              </span>
            </Link>
          ) : null}

          <VideoReactionPanel video={video} />

          <div className="pointer-events-auto">
            <ShareMenu
              postId={video.id}
              videoId={video.id}
              onShareToWall={(caption) => toggleShare({ videoId: video.id, shared: true, caption })}
            />
          </div>

          <IconButton label="Cevaplar" count={0}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
              <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H7l-4 3 .5-4.5A8.5 8.5 0 1 1 21 11.5Z" />
            </svg>
          </IconButton>

          {author ? (
            <IconButton label="Mesaj at">
              <Link href={`/profil/${author.username}`} className="flex h-full w-full items-center justify-center" aria-label="Mesaj at">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                  <path d="M22 2 11 13" />
                  <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
                </svg>
              </Link>
            </IconButton>
          ) : null}

          <IconButton onClick={toggleMuted} label={muted ? 'Sesi aç' : 'Sesi kapat'}>
            {muted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                <path d="m23 9-6 6M17 9l6 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7M19 6a9 9 0 0 1 0 12" />
              </svg>
            )}
          </IconButton>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 animate-[spin_4s_linear_infinite] text-white/80">
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
