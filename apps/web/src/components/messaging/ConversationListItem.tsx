'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import type { Message } from '@stagein/shared'
import { formatRelativeTr } from '@/lib/format'
import { UserAvatar } from '@/components/UserAvatar'
import type { ConversationWithUnread } from '@/hooks/useMessaging'
import { getConversationDisplayName, isGroupConversation } from './utils'

function previewText(message?: Message): string {
  if (!message) return 'Henüz mesaj yok'
  if (message.content) return message.content
  if (message.audio_url) return '🎤 Sesli mesaj'
  return '…'
}

export function ConversationListItem({ conversation }: { conversation: ConversationWithUnread }) {
  const isGroup = isGroupConversation(conversation)
  const other = conversation.participants?.[0]
  const displayName = getConversationDisplayName(conversation)

  return (
    <Link
      href={`/mesajlar/${conversation.id}`}
      className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition-colors duration-150 hover:border-border hover:bg-card/60"
    >
      {isGroup ? (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Users className="h-5 w-5" strokeWidth={1.8} />
        </span>
      ) : (
        <UserAvatar name={other?.full_name} username={other?.username} url={other?.avatar_url} size={48} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-bold text-text">{displayName}</span>
          <span className="shrink-0 text-xs text-muted">{formatRelativeTr(conversation.last_message_at)}</span>
        </div>
        <p className={conversation.unread ? 'truncate text-sm font-semibold text-text' : 'truncate text-sm text-muted'}>
          {previewText(conversation.last_message)}
        </p>
      </div>
      {conversation.unread ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="Okunmadı" /> : null}
    </Link>
  )
}
