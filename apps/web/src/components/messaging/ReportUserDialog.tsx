'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import type { PostReportReason } from '@stagein/shared'
import { Button } from '@/components/ui'

const REPORT_REASONS: { value: PostReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Taciz veya zorbalık' },
  { value: 'inappropriate', label: 'Uygunsuz içerik' },
  { value: 'other', label: 'Diğer' },
]

export function ReportUserDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (reason: PostReportReason) => void
}) {
  const [reason, setReason] = useState<PostReportReason>('spam')

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
            <Dialog.Content asChild forceMount>
              <motion.div
                className="fixed left-1/2 top-1/2 z-[201] w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl"
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 4 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              >
                <Dialog.Title className="text-lg font-semibold text-text">Kullanıcıyı şikayet et</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-relaxed text-text-secondary">
                  Bu kişiyi neden şikayet ediyorsun? Ekibimiz en kısa sürede inceleyecek.
                </Dialog.Description>

                <div className="mt-4 flex flex-col gap-1">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.value}
                      className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text transition-colors hover:bg-white/[0.06]"
                    >
                      <input
                        type="radio"
                        name="user-report-reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="h-4 w-4 accent-primary"
                      />
                      {r.label}
                    </label>
                  ))}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Dialog.Close asChild>
                    <Button variant="secondary" className="px-5 py-2.5 text-sm">
                      Vazgeç
                    </Button>
                  </Dialog.Close>
                  <Button type="button" variant="destructive" className="px-5 py-2.5 text-sm" onClick={() => onSubmit(reason)}>
                    Gönder
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
