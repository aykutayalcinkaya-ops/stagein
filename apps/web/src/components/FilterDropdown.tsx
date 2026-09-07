'use client'

import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from './ui'

export interface FilterDropdownProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
  /** `true` (varsayılan): çoklu seçim, checkbox listesi. `false`: tekli seçim, radio davranışı. */
  multiple?: boolean
  className?: string
}

/**
 * Sitedeki açık hap/etiket yığınlarının (Şehir, Enstrüman, Tarz, Seviye vb.)
 * yerini alan tek, yeniden kullanılabilir filtre bileşeni (gravity.md madde 5).
 *
 * Tetikleyici buton seçim sayısını (çoklu) veya tek seçili değeri (tekli)
 * rozet olarak gösterir; Radix `Popover` paneli checkbox/radio listesiyle
 * açılır, dış tıklama/Escape ile kapanır (Radix varsayılanı), `motion` ile
 * fade+scale animasyonu vardır.
 */
export function FilterDropdown({
  label,
  options,
  selected,
  onChange,
  multiple = true,
  className,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false)

  function toggle(option: string) {
    if (multiple) {
      onChange(selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option])
      return
    }
    // Tekli seçim: aynı öğeye tekrar tıklamak seçimi kaldırır ("Tümü"ne döner).
    onChange(selected.includes(option) ? [] : [option])
    setOpen(false)
  }

  const badgeLabel =
    selected.length === 0
      ? null
      : multiple
        ? String(selected.length)
        : selected[0]

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          className={cn(
            'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors duration-150',
            selected.length > 0
              ? 'border-primary bg-primary/10 text-white'
              : 'border-border bg-card text-text-secondary hover:border-border-strong hover:text-white',
            className
          )}
        >
          <span className={multiple ? '' : 'max-w-[9rem] truncate'}>{label}</span>
          {badgeLabel ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
              {badgeLabel}
            </span>
          ) : null}
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 transition-transform duration-200', open && 'rotate-180')}
            strokeWidth={2}
            aria-hidden="true"
          />
        </motion.button>
      </Popover.Trigger>

      <AnimatePresence>
        {open ? (
          <Popover.Portal forceMount>
            <Popover.Content asChild sideOffset={8} align="start" collisionPadding={8} forceMount>
              <motion.div
                role={multiple ? 'group' : 'radiogroup'}
                aria-label={label}
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="z-[150] max-h-80 w-64 overflow-y-auto rounded-xl border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur-md"
              >
                {options.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-muted">Seçenek yok</p>
                ) : (
                  options.map((option) => {
                    const isSelected = selected.includes(option)
                    return (
                      <button
                        key={option}
                        type="button"
                        role={multiple ? 'checkbox' : 'radio'}
                        aria-checked={isSelected}
                        onClick={() => toggle(option)}
                        className={cn(
                          'flex min-h-11 w-full cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium outline-none transition-colors',
                          isSelected ? 'text-white' : 'text-text-secondary hover:bg-white/[0.07] hover:text-white',
                          isSelected && 'bg-primary/15'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-[18px] w-[18px] shrink-0 items-center justify-center border text-white transition-colors',
                            multiple ? 'rounded-[4px]' : 'rounded-full',
                            isSelected ? 'border-primary bg-primary' : 'border-border-strong bg-transparent'
                          )}
                        >
                          {isSelected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                        </span>
                        <span className="truncate">{option}</span>
                      </button>
                    )
                  })
                )}
              </motion.div>
            </Popover.Content>
          </Popover.Portal>
        ) : null}
      </AnimatePresence>
    </Popover.Root>
  )
}
