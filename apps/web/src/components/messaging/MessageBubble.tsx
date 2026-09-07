'use client'

import type { Message } from '@stagein/shared'
import { formatRelativeTr } from '@/lib/format'

export function MessageBubble({
  message,
  isOwn,
  seen,
  senderName,
}: {
  message: Message
  isOwn: boolean
  seen?: boolean
  /** Grup sohbetlerinde, kendi mesajın olmayan balonların üstünde gönderen adı gösterilir. */
  senderName?: string
}) {
  return (
    <div className={isOwn ? 'flex flex-col items-end' : 'flex flex-col items-start'}>
      {senderName ? <span className="mb-0.5 ml-1 text-[11px] font-medium text-muted">{senderName}</span> : null}
      <div
        className={
          isOwn
            ? 'max-w-[75%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-white'
            : 'max-w-[75%] rounded-2xl rounded-bl-md border border-border bg-card px-4 py-2.5 text-sm text-text'
        }
      >
        {message.content ? <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p> : null}
        {message.audio_url ? <audio src={message.audio_url} controls className="h-9 w-56 max-w-full" /> : null}
        <span className={isOwn ? 'mt-1 block text-[11px] text-white/70' : 'mt-1 block text-[11px] text-muted'}>
          {formatRelativeTr(message.created_at)}
        </span>
      </div>
      {isOwn && seen ? <span className="mt-0.5 text-[11px] text-muted">Görüldü</span> : null}
    </div>
  )
}
