'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { ConversationList } from '@/components/messaging/ConversationList'

export default function MesajlarPage() {
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    if (!isLoading && userId === null) router.replace('/giris')
  }, [isLoading, userId, router])

  if (!userId) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl uppercase tracking-tight">Mesajlar</h1>
      <div className="mt-6">
        <ConversationList />
      </div>
    </div>
  )
}
