'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ReactionType, Video } from '@stagein/shared'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import {
  createVideoFromFile,
  createYoutubeVideo,
  toggleVideoLike,
  type CreateYoutubeVideoInput,
  type VideoMetadataInput,
} from '@/lib/api'
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
  const userId = useAuthStore((s) => s.userId)

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

      if (userId && rows.length > 0) {
        const realRowIds = rows.filter((v) => !v.id.startsWith('demo-')).map((v) => v.id)
        if (realRowIds.length > 0) {
          const { data: userReactions } = await supabase
            .from('video_reactions')
            .select('video_id, reaction_type')
            .eq('user_id', userId)
            .in('video_id', realRowIds)
          const reactionsMap = new Map(
            (userReactions ?? []).map((r) => [r.video_id as string, r.reaction_type as ReactionType])
          )
          rows = rows.map((v) => ({ ...v, my_reaction: reactionsMap.get(v.id) ?? null }))
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
                ? { ...v, liked_by_me: like }
                : v
            )
          ),
        }
      })
    },
  })
}

export function useUploadVideo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { userId: string; file: File; metadata: VideoMetadataInput }) =>
      createVideoFromFile(input.userId, input.file, input.metadata),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useCreateYoutubeVideo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateYoutubeVideoInput) => createYoutubeVideo(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}
