'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Post } from '@stagein/shared'
import { addPostShare, addVideoShare, hasUserSharedPost, hasUserSharedVideo, removePostShare, removeVideoShare } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

type WallCache = { pages: Post[][]; pageParams: number[] }

export function usePostShareStatus(postId: string, enabled: boolean = false) {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['post-share-status', postId, userId],
    queryFn: async () => {
      if (!userId) return false
      return hasUserSharedPost(postId, userId)
    },
    enabled: enabled && !!userId,
  })
}

export function useTogglePostShare() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: async ({ postId, shared, caption }: { postId: string; shared: boolean; caption?: string }) => {
      if (!userId) throw new Error('Giriş yapmalısın')
      if (shared) {
        await addPostShare(postId, userId, caption ?? null)
      } else {
        await removePostShare(postId, userId)
      }
    },
    onMutate: async ({ postId, shared }) => {
      const shareStatusKey = ['post-share-status', postId, userId]

      await queryClient.cancelQueries({ queryKey: ['wall'] })
      await queryClient.cancelQueries({ queryKey: shareStatusKey })

      const previousWall = queryClient.getQueryData<WallCache>(['wall'])
      const previousShareStatus = queryClient.getQueryData<boolean>(shareStatusKey)

      queryClient.setQueryData<WallCache>(['wall'], (current) => {
        if (!current) return current
        return {
          ...current,
          pages: current.pages.map((page) =>
            page.map((p) =>
              p.id === postId ? { ...p, share_count: Math.max(0, p.share_count + (shared ? 1 : -1)) } : p
            )
          ),
        }
      })
      queryClient.setQueryData(shareStatusKey, shared)

      return { previousWall, previousShareStatus, shareStatusKey }
    },
    onError: (_err, _variables, context) => {
      if (!context) return
      if (context.previousWall) {
        queryClient.setQueryData(['wall'], context.previousWall)
      }
      queryClient.setQueryData(context.shareStatusKey, context.previousShareStatus)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wall'] })
    },
  })
}

export function useVideoShareStatus(videoId: string, enabled: boolean = false) {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['video-share-status', videoId, userId],
    queryFn: async () => {
      if (!userId) return false
      return hasUserSharedVideo(videoId, userId)
    },
    enabled: enabled && !!userId,
  })
}

export function useToggleVideoShare() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: async ({ videoId, shared, caption }: { videoId: string; shared: boolean; caption?: string }) => {
      if (!userId) throw new Error('Giriş yapmalısın')
      if (shared) {
        await addVideoShare(videoId, userId, caption ?? null)
      } else {
        await removeVideoShare(videoId, userId)
      }
    },
    onMutate: async ({ videoId, shared }) => {
      queryClient.setQueryData(['video-share-status', videoId, userId], shared)
    },
    // 'feed' önbelleği bileşik anahtarla saklanıyor (bkz. useVideoToggleReaction) —
    // tam eşleşme aramak yerine tüm feed sorgularını yeniden çekiyoruz.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'], exact: false })
    },
  })
}
