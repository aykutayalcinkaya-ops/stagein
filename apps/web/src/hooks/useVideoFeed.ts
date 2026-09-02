'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Video } from '@stagein/shared'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { toggleVideoLike } from '@/lib/api'
import { DEMO_VIDEOS } from '@/lib/demoContent'
import { useAuthStore } from '@/stores/authStore'

const PAGE_SIZE = 10

async function fetchStartVideo(id: string): Promise<Video | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('videos')
    .select('*, user:users(id, username, full_name, avatar_url, city)')
    .eq('id', id)
    .maybeSingle()
  if (error) return null
  return (data as Video) ?? null
}

export function useVideoFeed(city?: string, startVideoId?: string) {
  return useInfiniteQuery({
    queryKey: ['feed', city ?? 'all', startVideoId ?? 'none'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!isSupabaseConfigured) return pageParam === 0 ? DEMO_VIDEOS : []
      const supabase = createClient()

      let query = supabase
        .from('videos')
        .select('*, user:users(id, username, full_name, avatar_url, city)')
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1)

      if (city) query = query.eq('city', city)

      const { data, error } = await query
      if (error) throw error
      let rows = (data ?? []) as Video[]

      // Henüz gerçek içerik yoksa (yeni proje) örnek videolarla akışı doldur.
      if (rows.length === 0 && pageParam === 0) {
        rows = city ? DEMO_VIDEOS.filter((v) => v.city === city) : DEMO_VIDEOS
      }

      if (pageParam === 0 && startVideoId) {
        const startVideo = startVideoId.startsWith('demo-')
          ? DEMO_VIDEOS.find((v) => v.id === startVideoId) ?? null
          : await fetchStartVideo(startVideoId)
        if (startVideo) {
          rows = [startVideo, ...rows.filter((v) => v.id !== startVideo.id)]
        }
      }

      return rows
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.reduce((sum, p) => sum + p.length, 0),
  })
}

export function useToggleVideoLike() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: async ({ videoId, like }: { videoId: string; like: boolean }) => {
      if (!userId) throw new Error('Login required')
      await toggleVideoLike(videoId, userId, like)
    },
    onMutate: async ({ videoId, like }) => {
      queryClient.setQueryData<{ pages: Video[][]; pageParams: number[] }>(['feed'], (current) => {
        if (!current) return current
        return {
          ...current,
          pages: current.pages.map((page) =>
            page.map((v) =>
              v.id === videoId
                ? { ...v, liked_by_me: like, like_count: Math.max(0, (v.like_count ?? 0) + (like ? 1 : -1)) }
                : v
            )
          ),
        }
      })
    },
  })
}
