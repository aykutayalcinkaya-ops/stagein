'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PostReportReason } from '@stagein/shared'
import { blockUser, isUserBlocked, reportUser, unblockUser } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { showToast } from '@/stores/toastStore'

export function useIsBlocked(otherUserId: string | undefined) {
  const userId = useAuthStore((s) => s.userId)
  return useQuery({
    queryKey: ['is-blocked', userId, otherUserId],
    queryFn: () => isUserBlocked(userId!, otherUserId!),
    enabled: !!userId && !!otherUserId,
  })
}

export function useBlockUser() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: (blockedId: string) => {
      if (!userId) throw new Error('Giriş yapmalısın')
      return blockUser(userId, blockedId)
    },
    onSuccess: () => {
      showToast('Kullanıcı engellendi', 'info')
      queryClient.invalidateQueries({ queryKey: ['is-blocked'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: () => showToast('Engelleme başarısız, tekrar dene.', 'error'),
  })
}

export function useUnblockUser() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: (blockedId: string) => {
      if (!userId) throw new Error('Giriş yapmalısın')
      return unblockUser(userId, blockedId)
    },
    onSuccess: () => {
      showToast('Engel kaldırıldı', 'info')
      queryClient.invalidateQueries({ queryKey: ['is-blocked'] })
    },
  })
}

export function useReportUser() {
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: (input: { reportedId: string; reason: PostReportReason }) => {
      if (!userId) throw new Error('Giriş yapmalısın')
      return reportUser({ reporterId: userId, reportedId: input.reportedId, reason: input.reason })
    },
    onSuccess: () => showToast('Şikayetin alındı, ekibimiz inceleyecek.', 'info'),
    onError: () => showToast('Şikayet gönderilemedi, tekrar dene.', 'error'),
  })
}
