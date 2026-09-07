'use client'

import Link from 'next/link'
import { MessageCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { useStartConversation } from '@/hooks/useMessaging'

interface StartConversationButtonProps {
  otherUserId: string
  label?: string
  variant?: 'button' | 'icon'
  className?: string
}

/**
 * Bu gece web'de "Uygulamadan mesaj at" / "İletişime geç" gibi kullanıcıyı
 * mobil uygulamaya yönlendiren linklerin yerine geçiyor (gravity.md madde 8:
 * %100 web uyumluluğu). Tek noktadan: konuşmayı oluşturur/bulur ve
 * /mesajlar/[id]'ye yönlendirir.
 */
export function StartConversationButton({ otherUserId, label = 'Mesaj At', variant = 'button', className }: StartConversationButtonProps) {
  const userId = useAuthStore((s) => s.userId)
  const { mutate: startConversation, isPending } = useStartConversation()

  if (!userId) {
    return variant === 'icon' ? (
      <Link
        href="/giris"
        aria-label="Mesaj atmak için giriş yap"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md"
      >
        <Send className="h-5 w-5" strokeWidth={1.8} />
      </Link>
    ) : (
      <Link href="/giris" className="text-sm font-semibold text-primary hover:text-primary-dim">
        Mesaj atmak için giriş yap
      </Link>
    )
  }

  if (userId === otherUserId) return null

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={() => startConversation(otherUserId)}
        disabled={isPending}
        aria-label={label}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all duration-180 hover:bg-white/15 active:scale-90 disabled:opacity-50"
      >
        <Send className="h-5 w-5" strokeWidth={1.8} />
      </button>
    )
  }

  return (
    <Button type="button" variant="primary" className={className} onClick={() => startConversation(otherUserId)} disabled={isPending}>
      <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
      {isPending ? 'Açılıyor…' : label}
    </Button>
  )
}
