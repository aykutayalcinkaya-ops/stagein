'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Post, ReactionType } from '@stagein/shared'
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
      if (add) {
        if (oldReaction && oldReaction !== reactionType) {
          await removePostReaction(postId, userId, oldReaction)
        }
        await addPostReaction(postId, userId, reactionType)
      } else {
        await removePostReaction(postId, userId, reactionType)
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
  })
}

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
      if (add) {
        if (oldReaction && oldReaction !== reactionType) {
          await removeVideoReaction(videoId, userId, oldReaction)
        }
        await addVideoReaction(videoId, userId, reactionType)
      } else {
        await removeVideoReaction(videoId, userId, reactionType)
      }
    },
    // 'feed' önbelleği şehir/başlangıç videosuna göre bileşik bir anahtarla
    // saklanıyor (['feed', city, startVideoId]); setQueryData(['feed'], ...) tam
    // anahtar eşleşmesi aradığından gerçek girdiye asla dokunmaz. Bunun yerine
    // invalidateQueries kullanıyoruz — varsayılan olarak önek eşleşmesi yapar,
    // yani ['feed', ...] ile başlayan tüm sorguları (hangi şehir/başlangıç
    // videosu olursa olsun) yeniden çeker.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'], exact: false })
    },
  })
}
