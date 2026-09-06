'use client'

import { useEffect, useRef, useState } from 'react'
import { loadYoutubeIframeApi } from '@/lib/youtubeIframeApi'

interface YoutubePlayerInstance {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  mute: () => void
  unMute: () => void
  getDuration: () => number
  getCurrentTime: () => number
  destroy: () => void
}

const YT_STATE_ENDED = 0

interface UseYoutubePlayerOptions {
  muted: boolean
  shouldPlay: boolean
  onProgress?: (fraction: number) => void
}

/** Bir Keşfet kartındaki YouTube gömme oynatıcısını IFrame Player API ile yönetir. */
export function useYoutubePlayer(videoId: string, { muted, shouldPlay, onProgress }: UseYoutubePlayerOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YoutubePlayerInstance | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!videoId) return
    let cancelled = false
    let player: YoutubePlayerInstance | null = null

    loadYoutubeIframeApi().then((YT) => {
      if (cancelled || !containerRef.current) return
      player = new (YT.Player as new (el: HTMLElement, opts: unknown) => YoutubePlayerInstance)(containerRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          disablekb: 1,
          mute: 1,
        },
        events: {
          onReady: () => {
            if (cancelled) return
            playerRef.current = player
            setReady(true)
          },
          onStateChange: (e: { data: number }) => {
            // Tekli video "playlist" hilesi yerine bitişte manuel olarak başa sararak döngü sağlanır.
            if (e.data === YT_STATE_ENDED) {
              playerRef.current?.seekTo(0, true)
              playerRef.current?.playVideo()
            }
          },
        },
      })
    })

    return () => {
      cancelled = true
      setReady(false)
      playerRef.current = null
      try {
        player?.destroy()
      } catch {
        // player zaten yok edilmiş olabilir
      }
    }
  }, [videoId])

  useEffect(() => {
    if (!ready || !playerRef.current) return
    if (muted) {
      playerRef.current.mute()
    } else {
      playerRef.current.unMute()
      // Bazı tarayıcılar sesi açma sırasında oynatmayı otomatik durdurur; görünürken devam ettir.
      if (shouldPlay) playerRef.current.playVideo()
    }
  }, [ready, muted, shouldPlay])

  useEffect(() => {
    if (!ready || !playerRef.current) return
    if (shouldPlay) playerRef.current.playVideo()
    else playerRef.current.pauseVideo()
  }, [ready, shouldPlay])

  useEffect(() => {
    if (!ready || !shouldPlay || !onProgress) return
    const player = playerRef.current
    if (!player) return
    const interval = window.setInterval(() => {
      const duration = player.getDuration()
      const current = player.getCurrentTime()
      if (duration > 0) onProgress(current / duration)
    }, 250)
    return () => window.clearInterval(interval)
  }, [ready, shouldPlay, onProgress])

  return containerRef
}
