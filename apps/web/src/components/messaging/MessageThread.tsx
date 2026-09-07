'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Ban, Flag, MoreHorizontal, Users } from 'lucide-react'
import { UserAvatar } from '@/components/UserAvatar'
import { Skeleton } from '@/components/Skeleton'
import { EmptyState } from '@/components/EmptyState'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/DropdownMenu'
import { useAuthStore } from '@/stores/authStore'
import {
  useConversationDetail,
  useConversationReads,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
  useSendVoiceMessage,
} from '@/hooks/useMessaging'
import { useBlockUser, useReportUser } from '@/hooks/useModeration'
import { useMessagingRealtime, useTypingIndicator } from '@/hooks/useRealtimeUpdates'
import { MessageBubble } from './MessageBubble'
import { MessageComposer } from './MessageComposer'
import { ReportUserDialog } from './ReportUserDialog'
import { getConversationDisplayName, isGroupConversation } from './utils'

export function MessageThread({ conversationId }: { conversationId: string }) {
  useMessagingRealtime(conversationId)
  const { typingUserIds, sendTyping } = useTypingIndicator(conversationId)
  const userId = useAuthStore((s) => s.userId)
  const { data: conversation, isLoading: isLoadingConversation } = useConversationDetail(conversationId)
  const { data: messages, isLoading: isLoadingMessages } = useMessages(conversationId)
  const { mutate: send, isPending: isSending } = useSendMessage(conversationId)
  const { mutate: sendVoice, isPending: isSendingVoice } = useSendVoiceMessage(conversationId)
  const { mutate: markRead } = useMarkConversationRead(conversationId)
  const { data: reads } = useConversationReads(conversationId)
  const { mutate: blockUser } = useBlockUser()
  const { mutate: reportUser } = useReportUser()
  const [reportOpen, setReportOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isGroup = conversation ? isGroupConversation(conversation) : false
  const other = conversation?.participants?.[0]
  const participantsById = new Map((conversation?.participants ?? []).map((p) => [p.id, p]))

  const lastOwnMessage = [...(messages ?? [])].reverse().find((m) => m.sender_id === userId)
  const otherReadAt = !isGroup && other ? reads?.[other.id] : undefined
  const isLastOwnSeen = !!(lastOwnMessage && otherReadAt && new Date(otherReadAt) >= new Date(lastOwnMessage.created_at))

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
        ) : conversation ? (
          isGroup ? (
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Users className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-sm font-bold text-text">{getConversationDisplayName(conversation)}</p>
                <p className="text-xs text-muted">{conversation.participant_ids.length} kişi</p>
              </div>
            </div>
          ) : other ? (
            <Link href={`/profil/${other.username}`} className="flex items-center gap-2.5">
              <UserAvatar name={other.full_name} username={other.username} url={other.avatar_url} size={36} />
              <span className="text-sm font-bold text-text">{other.full_name ?? other.username}</span>
            </Link>
          ) : null
        ) : null}

        {!isGroup && other ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Konuşma seçenekleri"
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-text"
              >
                <MoreHorizontal className="h-5 w-5" strokeWidth={1.8} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setReportOpen(true)}>
                <Flag className="h-4 w-4" strokeWidth={1.8} />
                Şikayet Et
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => blockUser(other.id)}>
                <Ban className="h-4 w-4" strokeWidth={1.8} />
                Engelle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            {messages.map((m) => {
              const isOwn = m.sender_id === userId
              const sender = isGroup && !isOwn ? participantsById.get(m.sender_id) : undefined
              return (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isOwn={isOwn}
                  seen={isLastOwnSeen && m.id === lastOwnMessage?.id}
                  senderName={sender ? sender.full_name ?? sender.username : undefined}
                />
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {typingUserIds.length > 0 ? <p className="px-4 pb-1 text-xs text-muted">yazıyor…</p> : null}

      <MessageComposer onSend={send} onSendVoice={sendVoice} onTyping={sendTyping} isSending={isSending || isSendingVoice} />

      {other ? (
        <ReportUserDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          onSubmit={(reason) => {
            reportUser({ reportedId: other.id, reason })
            setReportOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}
