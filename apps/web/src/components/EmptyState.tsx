'use client'

import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { Button, cn } from './ui'

export interface EmptyStateAction {
  label: string
  onClick: () => void
}

export interface EmptyStateProps {
  /** lucide-react ikonu (bileşen referansı, örn. `Inbox`, `SearchX`). */
  icon?: LucideIcon
  title: string
  description?: string
  action?: EmptyStateAction
  className?: string
}

/**
 * Sıfır öğe içeren tüm listeler için ortak "boş durum" bileşeni.
 *
 * Not: `apps/web/src/components/ui.tsx` içinde geriye dönük uyumluluk için
 * korunan farklı imzalı bir `EmptyState` (action: ReactNode) daha var —
 * 5 mevcut çağrı yeri (ör. `LinkButton href=...` ile) onu kullanıyor. Bu
 * dosyadaki `EmptyState`, action'ı `{ label, onClick }` şeklinde alan yeni
 * ve önerilen sürümdür; yeni kodda buradan import edin:
 * `import { EmptyState } from '@/components/EmptyState'`.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex flex-col items-center rounded-2xl border border-dashed border-border-strong bg-card/50 px-6 py-16 text-center',
        className
      )}
    >
      {Icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] text-text-secondary">
          <Icon className="h-7 w-7" strokeWidth={1.6} aria-hidden="true" />
        </div>
      ) : null}
      <p className="text-lg font-semibold text-text">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">{description}</p> : null}
      {action ? (
        <div className="mt-6">
          <Button variant="primary" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      ) : null}
    </motion.div>
  )
}
