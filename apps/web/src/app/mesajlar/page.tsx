'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SquarePen } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { ConversationList } from '@/components/messaging/ConversationList'
import { NewConversationModal } from '@/components/messaging/NewConversationModal'

export default function MesajlarPage() {
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const isLoading = useAuthStore((s) => s.isLoading)
  const [isNewOpen, setIsNewOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && userId === null) router.replace('/giris')
  }, [isLoading, userId, router])

  if (!userId) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl uppercase tracking-tight">Mesajlar</h1>
        <button
          type="button"
          onClick={() => setIsNewOpen(true)}
          aria-label="Yeni sohbet"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white transition-colors duration-150 hover:bg-primary-dim"
        >
          <SquarePen className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>
      <div className="mt-6">
        <ConversationList />
      </div>
      <NewConversationModal open={isNewOpen} onOpenChange={setIsNewOpen} />
    </div>
  )
}
