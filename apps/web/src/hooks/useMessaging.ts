'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Conversation, Message } from '@stagein/shared'
import {
  createGroupConversation,
  getConversation,
  getConversationReads,
  getOrCreateConversation,
  listConversations,
  listMessages,
  markConversationRead,
  searchUsers,
  sendMessage,
  uploadVoiceMessage,
} from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

export type ConversationWithUnread = Conversation & { unread: boolean }

export function useConversations() {
  const userId = useAuthStore((s) => s.userId)
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: () => listConversations(userId!),
    enabled: !!userId,
  })
}

export function useUnreadConversationCount() {
  const { data } = useConversations()
  const conversations = (data ?? []) as ConversationWithUnread[]
  return conversations.filter((c) => c.unread).length
}

export function useConversationDetail(conversationId: string) {
  const userId = useAuthStore((s) => s.userId)
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId, userId!),
    enabled: !!userId && !!conversationId,
  })
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => listMessages(conversationId),
    enabled: !!conversationId,
  })
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: (content: string) => {
      if (!userId) throw new Error('Giriş yapmalısın')
      return sendMessage({ conversationId, senderId: userId, content })
    },
    onMutate: async (content) => {
      if (!userId) return
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] })
      const previous = queryClient.getQueryData<Message[]>(['messages', conversationId])
      const optimistic: Message = {
        id: `optimistic-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: userId,
        content,
        audio_url: null,
        context_type: 'direct',
        context_id: null,
        created_at: new Date().toISOString(),
      }
      queryClient.setQueryData<Message[]>(['messages', conversationId], (current) => [...(current ?? []), optimistic])
      return { previous }
    },
    onError: (_err, _content, context) => {
      if (context?.previous) queryClient.setQueryData(['messages', conversationId], context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/** Konuşmadaki her katılımcının en son okuma zamanı — userId -> ISO tarih. "Görüldü" göstergesi için. */
export function useConversationReads(conversationId: string) {
  return useQuery({
    queryKey: ['conversation-reads', conversationId],
    queryFn: () => getConversationReads(conversationId),
    enabled: !!conversationId,
    refetchInterval: 5000,
  })
}

export function useSendVoiceMessage(conversationId: string) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: async (blob: Blob) => {
      if (!userId) throw new Error('Giriş yapmalısın')
      const audioUrl = await uploadVoiceMessage(userId, blob)
      return sendMessage({ conversationId, senderId: userId, audioUrl })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useSearchUsers(query: string) {
  const userId = useAuthStore((s) => s.userId)
  return useQuery({
    queryKey: ['search-users', query],
    queryFn: () => searchUsers(query, userId ? [userId] : []),
    enabled: query.trim().length >= 2,
  })
}

export function useCreateGroupConversation() {
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: ({ participantIds, title }: { participantIds: string[]; title: string | null }) => {
      if (!userId) throw new Error('Giriş yapmalısın')
      return createGroupConversation([userId, ...participantIds], title)
    },
    onSuccess: (conversation) => {
      router.push(`/mesajlar/${conversation.id}`)
    },
  })
}

export function useStartConversation() {
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: (otherUserId: string) => {
      if (!userId) throw new Error('Giriş yapmalısın')
      return getOrCreateConversation(userId, otherUserId)
    },
    onSuccess: (conversation) => {
      router.push(`/mesajlar/${conversation.id}`)
    },
  })
}

export function useMarkConversationRead(conversationId: string) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('Giriş yapmalısın')
      return markConversationRead(conversationId, userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
