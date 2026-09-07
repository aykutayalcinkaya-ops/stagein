'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { UserAvatar } from '@/components/UserAvatar'
import { Skeleton } from '@/components/Skeleton'
import { EmptyState } from '@/components/EmptyState'
import { useAuthStore } from '@/stores/authStore'
import { useConversationDetail, useMarkConversationRead, useMessages, useSendMessage } from '@/hooks/useMessaging'
import { useMessagingRealtime } from '@/hooks/useRealtimeUpdates'
import { MessageBubble } from './MessageBubble'
import { MessageComposer } from './MessageComposer'

export function MessageThread({ conversationId }: { conversationId: string }) {
  useMessagingRealtime(conversationId)
  const userId = useAuthStore((s) => s.userId)
  const { data: conversation, isLoading: isLoadingConversation } = useConversationDetail(conversationId)
  const { data: messages, isLoading: isLoadingMessages } = useMessages(conversationId)
  const { mutate: send, isPending: isSending } = useSendMessage(conversationId)
  const { mutate: markRead } = useMarkConversationRead(conversationId)
  const bottomRef = useRef<HTMLDivElement>(null)
  const other = conversation?.participants?.[0]

  useEffect(() => {
    markRead()
    // Yalnızca konuşma açıldığında bir kez okundu işaretlensin — messages
    // değiştikçe tekrar tetiklenmesin diye bağımlılık listesi boş bırakıldı.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  return (
    <div className="flex h-[calc(100dvh-64px)] flex-col">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link
          href="/mesajlar"
          aria-label="Geri"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-text"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </Link>
        {isLoadingConversation ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : other ? (
          <Link href={`/profil/${other.username}`} className="flex items-center gap-2.5">
            <UserAvatar name={other.full_name} username={other.username} url={other.avatar_url} size={36} />
            <span className="text-sm font-bold text-text">{other.full_name ?? other.username}</span>
          </Link>
        ) : null}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoadingMessages ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className={i % 2 === 0 ? 'ml-auto h-9 w-40 rounded-2xl' : 'h-9 w-48 rounded-2xl'} />
            ))}
          </div>
        ) : !messages || messages.length === 0 ? (
          <EmptyState title="Henüz mesaj yok" description="İlk mesajı sen gönder." />
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} isOwn={m.sender_id === userId} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <MessageComposer onSend={send} isSending={isSending} />
    </div>
  )
}
