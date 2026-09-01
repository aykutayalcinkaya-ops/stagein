import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMessages, sendMessage, subscribeToMessages } from '@stagein/supabase'
import type { ContextType, Message } from '@stagein/shared'
import { touchConversation } from '@/lib/api'

export function messagesKey(conversationId: string) {
  return ['messages', conversationId] as const
}

export function useMessages(conversationId: string, senderId: string | null) {
  const queryClient = useQueryClient()
  const key = messagesKey(conversationId)

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchMessages(conversationId),
    enabled: Boolean(conversationId),
  })

  useEffect(() => {
    if (!conversationId) return
    const channel = subscribeToMessages(conversationId, (incoming) => {
      queryClient.setQueryData<Message[]>(key, (current = []) =>
        current.some((m) => m.id === incoming.id) ? current : [...current, incoming]
      )
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    })
    return () => {
      void channel.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  const send = useMutation({
    mutationFn: async (input: {
      content?: string
      audioUrl?: string
      contextType?: ContextType
      contextId?: string | null
    }) => {
      if (!senderId) throw new Error('Oturum bulunamadı')
      const message = await sendMessage({
        conversation_id: conversationId,
        sender_id: senderId,
        content: input.content ?? null,
        audio_url: input.audioUrl ?? null,
        context_type: input.contextType ?? 'direct',
        context_id: input.contextId ?? null,
      })
      await touchConversation(conversationId)
      return message as Message
    },
    onSuccess: (message) => {
      queryClient.setQueryData<Message[]>(key, (current = []) =>
        current.some((m) => m.id === message.id) ? current : [...current, message]
      )
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  return { ...query, messages: query.data ?? [], send }
}
