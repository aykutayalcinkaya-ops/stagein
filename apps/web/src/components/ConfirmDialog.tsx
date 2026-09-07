'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, X } from 'lucide-react'
import { Button, cn } from './ui'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** `destructive` → silme/geri alınamaz eylemler için kırmızı vurgulu görünüm. */
  variant?: 'default' | 'destructive'
  onConfirm: () => void | Promise<void>
}

/**
 * Sitedeki tüm silme/geri-alınamaz onay akışları için ortak modal.
 * Radix `Dialog` + `motion` fade-in/scale-in ile açılır; Escape veya dış
 * tıklama ile (Radix'in varsayılan davranışı) kapanır.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Onayla',
  cancelLabel = 'Vazgeç',
  variant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  const isDestructive = variant === 'destructive'

  async function handleConfirm() {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={description ? undefined : undefined}>
              <motion.div
                className={cn(
                  'fixed left-1/2 top-1/2 z-[201] w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl'
                )}
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 4 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              >
                <Dialog.Close
                  aria-label="Kapat"
                  className="absolute right-4 top-4 flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-text"
                >
                  <X className="h-5 w-5" strokeWidth={1.8} />
                </Dialog.Close>

                <div className="flex items-start gap-3 pr-8">
                  {isDestructive ? (
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                      <AlertTriangle className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                  ) : null}
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-text">{title}</Dialog.Title>
                    {description ? (
                      <Dialog.Description className="mt-2 text-sm leading-relaxed text-text-secondary">
                        {description}
                      </Dialog.Description>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Dialog.Close asChild>
                    <Button variant="secondary" className="px-5 py-2.5 text-sm">
                      {cancelLabel}
                    </Button>
                  </Dialog.Close>
                  <Button
                    type="button"
                    variant={isDestructive ? 'destructive' : 'primary'}
                    className="px-5 py-2.5 text-sm"
                    onClick={handleConfirm}
                  >
                    {confirmLabel}
                  </Button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  )
}
