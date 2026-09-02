'use client'

import { useAuthStore } from '@/stores/authStore'
import { LinkButton } from './ui'

export function ProfileHeaderActions({ username }: { username: string }) {
  const myUsername = useAuthStore((s) => s.profile?.username)

  if (myUsername === username) {
    return <LinkButton href="/ayarlar">Profili Düzenle</LinkButton>
  }

  return <LinkButton href="/giris">Mesaj at</LinkButton>
}
