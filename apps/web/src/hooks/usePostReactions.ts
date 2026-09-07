'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Post, ReactionType, Video } from '@stagein/shared'
import { addPostReaction, addVideoReaction, removePostReaction, removeVideoReaction } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

type WallCache = { pages: Post[][]; pageParams: number[] }

export function useTogglePostReaction() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: async ({
      postId,
      reactionType,
      add,
      oldReaction,
    }: {
      postId: string
      reactionType: ReactionType
      add: boolean
      /** Kullanıcının bu posta önceden verdiği reaksiyon — tip değiştirirken eskisi önce kaldırılır. */
      oldReaction?: ReactionType | null
    }) => {
      if (!userId) throw new Error('Giriş yapmalısın')
      try {
        if (add) {
          if (oldReaction && oldReaction !== reactionType) {
            await removePostReaction(postId, userId, oldReaction)
          }
          await addPostReaction(postId, userId, reactionType)
        } else {
          await removePostReaction(postId, userId, reactionType)
        }
      } catch {
        // Silently fail if reactions table doesn't exist (migrations not run)
        // Optimistic update will be rolled back in onError
      }
    },
    onMutate: async ({ postId, reactionType, add, oldReaction }) => {
      await queryClient.cancelQueries({ queryKey: ['wall'] })
      const previous = queryClient.getQueryData<WallCache>(['wall'])

      queryClient.setQueryData<WallCache>(['wall'], (current) => {
        if (!current) return current
        return {
          ...current,
          pages: current.pages.map((page) =>
            page.map((p) => {
              if (p.id !== postId) return p
              const previousReaction = oldReaction ?? p.my_reaction ?? null
              const newReactions = { ...p.reactions }
              if (add) {
                newReactions[reactionType] = (newReactions[reactionType] ?? 0) + 1
                // Farklı bir reaksiyona geçiliyorsa öncekini geri al.
                if (previousReaction && previousReaction !== reactionType) {
                  newReactions[previousReaction] = Math.max(0, (newReactions[previousReaction] ?? 0) - 1)
                }
              } else {
                newReactions[reactionType] = Math.max(0, (newReactions[reactionType] ?? 0) - 1)
              }
              return {
                ...p,
                reactions: newReactions,
                my_reaction: add ? reactionType : null,
              }
            })
          ),
        }
      })

      return { previous }
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['wall'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wall'] })
    },
  })
}

type FeedCache = { pages: Video[][]; pageParams: number[] }

export function useVideoToggleReaction() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: async ({
      videoId,
      reactionType,
      add,
      oldReaction,
    }: {
      videoId: string
      reactionType: ReactionType
      add: boolean
      /** Kullanıcının bu videoya önceden verdiği reaksiyon — tip değiştirirken eskisi önce kaldırılır. */
      oldReaction?: ReactionType | null
    }) => {
      if (!userId) throw new Error('Giriş yapmalısın')
      try {
        if (add) {
          if (oldReaction && oldReaction !== reactionType) {
            await removeVideoReaction(videoId, userId, oldReaction)
          }
          await addVideoReaction(videoId, userId, reactionType)
        } else {
          await removeVideoReaction(videoId, userId, reactionType)
        }
      } catch {
        // Reactions tablosu henüz yoksa (migration çalışmamış) sessizce yut —
        // iyimser güncelleme onError'da geri alınır.
      }
    },
    // 'feed' önbelleği şehir/başlangıç videosuna göre bileşik bir anahtarla
    // saklanıyor (['feed', city, startVideoId]); setQueryData(['feed'], ...) tam
    // anahtar eşleşmesi aradığından gerçek girdiye asla dokunmaz. setQueriesData
    // + exact:false ile önek eşleşen TÜM 'feed' sorgularını (hangi şehir/başlangıç
    // videosu olursa olsun) aynı anda, anında günceller — demo içerikte de
    // (invalidateQueries yalnızca ağdan yeniden çeker, demo veriyi hiç güncellemez).
    onMutate: async ({ videoId, reactionType, add, oldReaction }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'], exact: false })
      const previous = queryClient.getQueriesData<FeedCache>({ queryKey: ['feed'], exact: false })

      queryClient.setQueriesData<FeedCache>({ queryKey: ['feed'], exact: false }, (current) => {
        if (!current) return current
        return {
          ...current,
          pages: current.pages.map((page) =>
            page.map((v) => {
              if (v.id !== videoId) return v
              const previousReaction = oldReaction ?? v.my_reaction ?? null
              const newReactions = { ...v.reactions }
              if (add) {
                newReactions[reactionType] = (newReactions[reactionType] ?? 0) + 1
                if (previousReaction && previousReaction !== reactionType) {
                  newReactions[previousReaction] = Math.max(0, (newReactions[previousReaction] ?? 0) - 1)
                }
              } else {
                newReactions[reactionType] = Math.max(0, (newReactions[reactionType] ?? 0) - 1)
              }
              return {
                ...v,
                reactions: newReactions,
                my_reaction: add ? reactionType : null,
              }
            })
          ),
        }
      })

      return { previous }
    },
    onError: (_err, _variables, context) => {
      context?.previous?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSettled: () => {
      // Demo veri gerçek bir ağ isteği yapmadığından invalidate ile üzerine
      // yazılmaz; gerçek Supabase verisi içinse en güncel durumu garantiler.
      queryClient.invalidateQueries({ queryKey: ['feed'], exact: false })
    },
  })
}
