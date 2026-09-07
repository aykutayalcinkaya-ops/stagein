'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { MessageThread } from '@/components/messaging/MessageThread'

export default function MesajDetayPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const userId = useAuthStore((s) => s.userId)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    if (!isLoading && userId === null) router.replace('/giris')
  }, [isLoading, userId, router])

  if (!userId) return null

  return <MessageThread conversationId={params.id} />
}
