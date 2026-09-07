'use client'

import { MessageCircle } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { Skeleton } from '@/components/Skeleton'
import { useConversations } from '@/hooks/useMessaging'
import { useMessagingRealtime } from '@/hooks/useRealtimeUpdates'
import { ConversationListItem } from './ConversationListItem'
import type { ConversationWithUnread } from '@/hooks/useMessaging'

export function ConversationList() {
  useMessagingRealtime()
  const { data, isLoading } = useConversations()
  const conversations = (data ?? []) as ConversationWithUnread[]

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2.5 w-48" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Henüz mesajın yok"
        description="Bir müzisyenin profiline git ve ona mesaj at — konuşmalarınız burada listelenir."
        action={{ label: 'Keşfet\'e git', onClick: () => { window.location.href = '/kesfet' } }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {conversations.map((c) => (
        <ConversationListItem key={c.id} conversation={c} />
      ))}
    </div>
  )
}
