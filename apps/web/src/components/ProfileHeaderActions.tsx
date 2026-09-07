'use client'

import { Pencil } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { LinkButton } from './ui'
import { StartConversationButton } from './messaging/StartConversationButton'

export function ProfileHeaderActions({ userId, username }: { userId: string; username: string }) {
  const myUsername = useAuthStore((s) => s.profile?.username)

  if (myUsername === username) {
    return (
      <LinkButton href="/ayarlar" variant="secondary">
        <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        Profili Düzenle
      </LinkButton>
    )
  }

  return <StartConversationButton otherUserId={userId} label="Mesaj At" />
}
