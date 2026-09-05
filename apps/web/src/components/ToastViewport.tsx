'use client'

import { useToastStore } from '@/stores/toastStore'
import { cn } from './ui'

const toneStyles = {
  info: 'border-border-strong bg-card text-text',
  warning: 'border-accent/40 bg-accent/10 text-accent',
  error: 'border-red-500/40 bg-red-500/10 text-red-400',
} as const

/** Uygulama genelinde gösterilen, kendi kendine kapanan uyarı/bilgi mesajları. */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts)
  const dismissToast = useToastStore((s) => s.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            'pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm',
            toneStyles[toast.tone]
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-xs text-muted hover:text-text"
              aria-label="Kapat"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
