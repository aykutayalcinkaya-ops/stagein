'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Heart } from 'lucide-react'
import type { ReactionType } from '@stagein/shared'
import { REACTION_EMOJIS, REACTION_LABELS } from '@stagein/shared'
import { cn } from './ui'

const REACTION_ORDER: ReactionType[] = ['like', 'love', 'wow', 'sad', 'angry', 'haha']

interface ReactionPickerProps {
  postId: string
  videoId?: string
  currentReaction: ReactionType | null
  isLoading?: boolean
  onSelect: (reaction: ReactionType) => void
  /**
   * Toplam reaksiyon sayısı — verilirse tetikleyici buton, Yorum/Paylaş
   * sayaçlarıyla aynı "ikon + sayı" düzenini kullanır (sayı > 0 ise sayıyı,
   * yoksa "Beğen" etiketini gösterir). Opsiyonel: vermeyen çağıranlarda
   * (ör. `FeedVideo.tsx`) görünüm hiç değişmez.
   */
  totalCount?: number
  /**
   * 'icon': tetikleyici, ebeveyninin (ör. Keşfet'teki 44×44 dairesel glass
   * chip) tamamını dolduran, dolgusuz, tek ikon/emoji gösteren bir düğmeye
   * dönüşür — sayaç ayrıca dışarıda (ör. IconButton'ın count metni ile aynı
   * stilde) gösterilmelidir. Varsayılan 'default': PostCard'daki pill/metin
   * düzeni.
   */
  variant?: 'default' | 'icon'
}

/**
 * Beğeni yerine gelen 6 emoji reaksiyon seçici. Tetikleyiciye tıklandığında
 * popover açılır; bir emoji seçilince kapanır. Aynı reaksiyona tekrar
 * tıklamak — kaldırma davranışı üst bileşende (onSelect çağrısına göre
 * mevcut reaksiyonla karşılaştırarak) yönetilir.
 */
export function ReactionPicker({
  postId,
  videoId,
  currentReaction,
  isLoading,
  onSelect,
  totalCount,
  variant = 'default',
}: ReactionPickerProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function handleSelect(reaction: ReactionType) {
    onSelect(reaction)
    setOpen(false)
  }

  const triggerEmoji = currentReaction ? REACTION_EMOJIS[currentReaction] : null
  const triggerLabel = currentReaction ? REACTION_LABELS[currentReaction] : 'Beğen'

  return (
    <div
      ref={rootRef}
      className={variant === 'icon' ? 'relative h-full w-full' : 'relative inline-block'}
      data-post-id={postId}
      data-video-id={videoId}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isLoading}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={triggerLabel}
        title={triggerLabel}
        className={cn(
          variant === 'icon'
            ? 'flex h-full w-full items-center justify-center text-white transition-transform duration-180 active:scale-90 disabled:opacity-50'
            : 'flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium transition-colors duration-150 disabled:opacity-50',
          variant === 'default' && (currentReaction ? 'text-accent' : 'text-muted hover:text-white')
        )}
      >
        {triggerEmoji ? (
          <span className={variant === 'icon' ? 'text-lg leading-none' : 'text-base leading-none'}>{triggerEmoji}</span>
        ) : (
          <Heart className={variant === 'icon' ? 'h-5 w-5' : 'h-4 w-4'} strokeWidth={1.8} />
        )}
        {variant === 'default' && totalCount !== undefined ? (totalCount > 0 ? totalCount : 'Beğen') : null}
      </button>

      <AnimatePresence>
        {open ? (
          <>
            {/* Mobil: tam ekran alttan gelen çubuk için karartma katmanı. */}
            <div className="fixed inset-0 z-40 hidden bg-black/50 max-sm:block" onClick={() => setOpen(false)} />
            <motion.div
              role="menu"
              initial={{ opacity: 0, scale: 0.9, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 6 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'absolute bottom-full left-0 z-50 mb-2 flex gap-1 rounded-full border border-border bg-card p-1.5 shadow-lg',
                'max-sm:fixed max-sm:inset-x-3 max-sm:bottom-3 max-sm:left-0 max-sm:mb-0 max-sm:justify-between max-sm:rounded-2xl max-sm:p-2'
              )}
            >
              {REACTION_ORDER.map((reaction) => (
                <button
                  key={reaction}
                  type="button"
                  role="menuitem"
                  title={REACTION_LABELS[reaction]}
                  aria-label={REACTION_LABELS[reaction]}
                  onClick={() => handleSelect(reaction)}
                  className={cn(
                    'group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-xl transition-transform duration-150 hover:scale-125 max-sm:h-11 max-sm:w-11 max-sm:flex-1',
                    currentReaction === reaction ? 'scale-110 border-accent bg-accent/10' : 'border-transparent'
                  )}
                >
                  <span className="transition-transform duration-150 group-hover:scale-110">
                    {REACTION_EMOJIS[reaction]}
                  </span>
                </button>
              ))}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
