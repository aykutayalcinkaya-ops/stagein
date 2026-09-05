'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PostCommentReply } from '@stagein/shared'
import { addCommentReply, deleteCommentReply, getCommentReplies } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

export function useCommentReplies(commentId: string, enabled: boolean = false) {
  return useQuery({
    queryKey: ['comment-replies', commentId],
    queryFn: () => getCommentReplies(commentId),
    enabled,
  })
}

export function useAddCommentReply() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) => {
      if (!userId) throw new Error('Giriş yapmalısın')
      return addCommentReply(commentId, userId, body)
    },
    onMutate: async ({ commentId, body }) => {
      if (!userId) throw new Error('Giriş yapmalısın')

      const queryKey = ['comment-replies', commentId]
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<PostCommentReply[]>(queryKey)

      const optimisticId = `optimistic-${Date.now()}`
      const optimisticReply: PostCommentReply = {
        id: optimisticId,
        comment_id: commentId,
        user_id: userId,
        body,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<PostCommentReply[]>(queryKey, (current) => [
        ...(current ?? []),
        optimisticReply,
      ])

      return { previous, optimisticId }
    },
    onError: (_err, { commentId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['comment-replies', commentId], context.previous)
      }
    },
    onSuccess: (reply, { commentId }, context) => {
      queryClient.setQueryData<PostCommentReply[]>(['comment-replies', commentId], (current) =>
        (current ?? []).map((r) => (r.id === context?.optimisticId ? reply : r))
      )
    },
  })
}

export function useDeleteCommentReply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ replyId }: { replyId: string; commentId: string }) => deleteCommentReply(replyId),
    onSuccess: (_data, { replyId, commentId }) => {
      queryClient.setQueryData<PostCommentReply[]>(['comment-replies', commentId], (current) =>
        (current ?? []).filter((r) => r.id !== replyId)
      )
    },
  })
}
