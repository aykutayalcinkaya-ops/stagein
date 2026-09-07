'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Search, X } from 'lucide-react'
import type { User } from '@stagein/shared'
import { Button } from '@/components/ui'
import { UserAvatar } from '@/components/UserAvatar'
import { useCreateGroupConversation, useSearchUsers, useStartConversation } from '@/hooks/useMessaging'

export function NewConversationModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<User[]>([])
  const [groupTitle, setGroupTitle] = useState('')
  const { data: results, isLoading } = useSearchUsers(query)
  const { mutate: startConversation, isPending: isStarting } = useStartConversation()
  const { mutate: createGroup, isPending: isCreatingGroup } = useCreateGroupConversation()
  const isGroup = selected.length > 1
  const isPending = isStarting || isCreatingGroup

  function toggleUser(user: User) {
    setSelected((prev) => (prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]))
  }

  function handleStart() {
    if (selected.length === 0) return
    if (selected.length === 1) {
      startConversation(selected[0].id)
    } else {
      createGroup({ participantIds: selected.map((u) => u.id), title: groupTitle.trim() || null })
    }
    onOpenChange(false)
    setSelected([])
    setQuery('')
    setGroupTitle('')
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
            <Dialog.Content asChild forceMount>
              <motion.div
                className="fixed left-1/2 top-1/2 z-[201] flex max-h-[80vh] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border bg-card shadow-2xl"
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 4 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              >
                <div className="flex items-center justify-between border-b border-border p-4">
                  <Dialog.Title className="text-lg font-semibold text-text">Yeni Sohbet</Dialog.Title>
                  <Dialog.Close aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-white/[0.06] hover:text-text">
                    <X className="h-5 w-5" strokeWidth={1.8} />
                  </Dialog.Close>
                </div>

                <div className="p-4">
                  {selected.length > 0 ? (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {selected.map((u) => (
                        <span key={u.id} className="flex items-center gap-1.5 rounded-full bg-primary/15 py-1 pl-1 pr-2.5 text-xs font-medium text-primary">
                          <UserAvatar name={u.full_name} username={u.username} url={u.avatar_url} size={20} />
                          {u.full_name ?? u.username}
                          <button type="button" onClick={() => toggleUser(u)} aria-label={`${u.username} çıkar`}>
                            <X className="h-3 w-3" strokeWidth={2} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {isGroup ? (
                    <input
                      value={groupTitle}
                      onChange={(e) => setGroupTitle(e.target.value)}
                      placeholder="Grup adı (opsiyonel)"
                      className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none placeholder:text-muted focus:border-primary"
                    />
                  ) : null}

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.8} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Kullanıcı ara…"
                      className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-text outline-none placeholder:text-muted focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-2">
                  {isLoading ? (
                    <p className="px-2 py-4 text-center text-sm text-muted">Aranıyor…</p>
                  ) : query.trim().length < 2 ? (
                    <p className="px-2 py-4 text-center text-sm text-muted">Aramak için en az 2 karakter yaz.</p>
                  ) : !results || results.length === 0 ? (
                    <p className="px-2 py-4 text-center text-sm text-muted">Kullanıcı bulunamadı.</p>
                  ) : (
                    results.map((u) => {
                      const isSelected = selected.some((s) => s.id === u.id)
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleUser(u)}
                          className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
                        >
                          <UserAvatar name={u.full_name} username={u.username} url={u.avatar_url} size={40} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-text">{u.full_name ?? u.username}</span>
                            <span className="block truncate text-xs text-muted">@{u.username}</span>
                          </span>
                          <span
                            className={
                              isSelected
                                ? 'flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white'
                                : 'h-5 w-5 rounded-full border border-border-strong'
                            }
                          >
                            {isSelected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>

                <div className="border-t border-border p-4">
                  <Button type="button" variant="primary" className="w-full" disabled={selected.length === 0 || isPending} onClick={handleStart}>
                    {isPending ? 'Açılıyor…' : isGroup ? `Grup Oluştur (${selected.length})` : 'Sohbet Başlat'}
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
