'use client'

import type { Message } from '@stagein/shared'
import { formatRelativeTr } from '@/lib/format'

export function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={isOwn ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          isOwn
            ? 'max-w-[75%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-white'
            : 'max-w-[75%] rounded-2xl rounded-bl-md border border-border bg-card px-4 py-2.5 text-sm text-text'
        }
      >
        {message.content ? <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p> : null}
        <span className={isOwn ? 'mt-1 block text-[11px] text-white/70' : 'mt-1 block text-[11px] text-muted'}>
          {formatRelativeTr(message.created_at)}
        </span>
      </div>
    </div>
  )
}
