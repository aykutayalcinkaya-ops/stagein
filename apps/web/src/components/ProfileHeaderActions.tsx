'use client'

import { Pencil, MessageCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { LinkButton } from './ui'

export function ProfileHeaderActions({ username }: { username: string }) {
  const myUsername = useAuthStore((s) => s.profile?.username)

  if (myUsername === username) {
    return (
      <LinkButton href="/ayarlar" variant="secondary">
        <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        Profili Düzenle
      </LinkButton>
    )
  }

  return (
    <LinkButton href="/giris">
      <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      Mesaj at
    </LinkButton>
  )
}
