'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link2, Repeat2, Send, Share2 } from 'lucide-react'
import { SITE_URL } from '@/lib/site'
import { cn } from './ui'

interface ShareMenuProps {
  postId: string
  videoId?: string
  onShareToWall?: (caption?: string) => void
  onSendMessage?: () => void
  /** Toplam paylaşım sayısı. Verilirse `text` varyantında "Paylaş" yerine, `icon` varyantında ikonun altında gösterilir. */
  shareCount?: number
  /**
   * `text` (varsayılan): ikon + "Paylaş"/sayı metin butonu — Anasayfa/PostCard'ta kullanılır.
   * `icon`: Keşfet tam ekran video aksiyon çubuğundaki diğer dairesel
   * `backdrop-blur-md` ikon butonlarıyla (Cevaplar/Ses/Mesaj) görsel tutarlılık
   * için yalnızca ikon içeren dairesel bir buton — sayaç, ikonun altında ayrı
   * bir etiket olarak gösterilir (bkz. `FeedVideo.tsx`'teki `IconButton`).
   */
  variant?: 'text' | 'icon'
}

type Panel = 'menu' | 'caption'

/**
 * Paylaşım menüsü: duvara paylaş, mesaj olarak gönder, bağlantı kopyala.
 * Masaüstünde açılır menü, mobilde tam ekran panel olarak gösterilir.
 */
export function ShareMenu({ postId, videoId, onShareToWall, onSendMessage, shareCount, variant = 'text' }: ShareMenuProps) {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<Panel>('menu')
  const [caption, setCaption] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) close()
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  function close() {
    setOpen(false)
    setPanel('menu')
    setCaption('')
  }

  async function handleCopyLink() {
    const url = videoId ? `${SITE_URL}/kesfet?v=${videoId}` : `${SITE_URL}/post/${postId}`
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = url
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setToast('Bağlantı kopyalandı')
    } catch {
      setToast('Bağlantı kopyalanamadı')
    }
    close()
  }

  function handleShareToWall() {
    onShareToWall?.(caption.trim() || undefined)
    setToast('Duvarında paylaşıldı')
    close()
  }

  function handleSendMessage() {
    onSendMessage?.()
    close()
  }

  return (
    <div
      ref={rootRef}
      className={cn('relative inline-block', variant === 'icon' && 'flex flex-col items-center gap-1 text-white')}
      data-post-id={postId}
      data-video-id={videoId}
    >
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label="Paylaş"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all duration-180 hover:bg-white/15 active:scale-90"
        >
          <Share2 className="h-5 w-5" strokeWidth={1.8} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="true"
          aria-expanded={open}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-muted transition-colors duration-150 hover:text-white"
        >
          <Share2 className="h-4 w-4" strokeWidth={1.8} />
          {shareCount && shareCount > 0 ? shareCount : 'Paylaş'}
        </button>
      )}

      {variant === 'icon' && shareCount !== undefined ? (
        <span className="text-xs font-semibold [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">{shareCount}</span>
      ) : null}

      <AnimatePresence>
        {open ? (
          <>
            <div className="fixed inset-0 z-40 hidden bg-black/60 max-sm:block" onClick={close} />
            <motion.div
              role="menu"
              initial={{ opacity: 0, scale: 0.95, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 6 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'absolute bottom-full right-0 z-50 mb-2 w-64 rounded-2xl border border-border bg-card p-2 shadow-lg',
                'max-sm:fixed max-sm:inset-x-3 max-sm:bottom-3 max-sm:right-0 max-sm:mb-0 max-sm:w-auto max-sm:rounded-2xl max-sm:p-3'
              )}
            >
              {panel === 'menu' ? (
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => setPanel('caption')}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-text transition-colors duration-150 hover:bg-white/5"
                  >
                    <Repeat2 className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                    Duvarıma Paylaş
                  </button>
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-text transition-colors duration-150 hover:bg-white/5"
                  >
                    <Send className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                    Mesaj Olarak Gönder
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-text transition-colors duration-150 hover:bg-white/5"
                  >
                    <Link2 className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                    Bağlantıyı Kopyala
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 p-1">
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Bir açıklama ekle (opsiyonel)…"
                    rows={3}
                    autoFocus
                    className="resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text outline-none transition-colors duration-150 placeholder:text-muted focus:border-primary"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPanel('menu')}
                      className="rounded-full px-3 py-1.5 text-xs font-medium text-muted transition-colors duration-150 hover:text-white"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      onClick={handleShareToWall}
                      className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-primary-dim"
                    >
                      Paylaş
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center">
          <span className="rounded-full bg-dark/90 px-4 py-2 text-xs font-medium text-white shadow-lg">{toast}</span>
        </div>
      ) : null}
    </div>
  )
}
