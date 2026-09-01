import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchFeedVideos } from '@stagein/supabase'
import type { Video } from '@stagein/shared'
import { useAuthStore } from '@/stores/authStore'
import { useFeedStore } from '@/stores/feedStore'

const PAGE_SIZE = 10

/**
 * Sıralama (fikirson.md): önce kullanıcının şehri, sonra aynı enstrüman,
 * sonra popülerlik. Şehir filtresi sorguda, kalan iki kriter sayfa içinde uygulanır.
 */
function rank(videos: Video[], instruments: string[]) {
  if (instruments.length === 0) return videos
  const score = (v: Video) => (v.instruments.some((i) => instruments.includes(i)) ? 1 : 0)
  return [...videos].sort((a, b) => {
    const byInstrument = score(b) - score(a)
    if (byInstrument !== 0) return byInstrument
    return b.like_count + b.view_count - (a.like_count + a.view_count)
  })
}

export function useVideoFeed() {
  const profileCity = useAuthStore((s) => s.profile?.city ?? null)
  const instruments = useAuthStore((s) => s.musicianProfile?.instruments ?? [])
  const cityFilter = useFeedStore((s) => s.cityFilter)
  const city = cityFilter ?? profileCity ?? undefined

  const query = useInfiniteQuery({
    queryKey: ['feed', city ?? 'all'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchFeedVideos(city, pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
  })

  // Sıralama sayfa bazında yapılır; aksi halde yeni sayfa geldiğinde
  // izlenmekte olan videonun index'i kayar ve akış zıplar.
  const pages = query.data?.pages
  const videos = useMemo(
    () => (pages ? pages.flatMap((page) => rank(page, instruments)) : []),
    [pages, instruments]
  )

  return { ...query, videos }
}
