'use client'

import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, ElementRef } from 'react'
import * as RadixDropdownMenu from '@radix-ui/react-dropdown-menu'
import { motion } from 'motion/react'
import { cn } from './ui'

/**
 * `@radix-ui/react-dropdown-menu` üzerine ince bir `motion` sarmalayıcısı.
 * Post'un "···" menüsü (Düzenle / Sil / Bağlantıyı Kopyala / Şikayet Et) ve
 * benzeri her yerde kullanılmak üzere tasarlandı.
 *
 * Kullanım:
 * ```tsx
 * <DropdownMenu>
 *   <DropdownMenuTrigger asChild>
 *     <button aria-label="Daha fazla seçenek">···</button>
 *   </DropdownMenuTrigger>
 *   <DropdownMenuContent align="end">
 *     <DropdownMenuItem onSelect={onEdit}>Düzenle</DropdownMenuItem>
 *     <DropdownMenuItem variant="destructive" onSelect={onDelete}>Sil</DropdownMenuItem>
 *     <DropdownMenuSeparator />
 *     <DropdownMenuItem onSelect={onCopyLink}>Bağlantıyı Kopyala</DropdownMenuItem>
 *     <DropdownMenuItem onSelect={onReport}>Şikayet Et</DropdownMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 * ```
 *
 * Not: Giriş animasyonu `motion` ile yapılır (fade + scale). Radix, menü
 * kapanırken içeriği DOM'dan hemen kaldırdığı için (bu bileşen `forceMount`
 * kullanmıyor — API'yi "ince"/composable tutmak amacıyla) çıkış animasyonu
 * uygulanmıyor; yalnızca açılış animasyonu var. Çıkış animasyonu gerekiyorsa
 * `ConfirmDialog.tsx`'teki controlled-open + `AnimatePresence` deseni örnek
 * alınabilir.
 */
export const DropdownMenu = RadixDropdownMenu.Root
export const DropdownMenuTrigger = RadixDropdownMenu.Trigger
export const DropdownMenuGroup = RadixDropdownMenu.Group
export const DropdownMenuSub = RadixDropdownMenu.Sub
export const DropdownMenuSubTrigger = RadixDropdownMenu.SubTrigger

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Content>,
  ComponentPropsWithoutRef<typeof RadixDropdownMenu.Content>
>(function DropdownMenuContent({ className, sideOffset = 8, collisionPadding = 8, children, ...props }, ref) {
  return (
    <RadixDropdownMenu.Portal>
      <RadixDropdownMenu.Content
        ref={ref}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        asChild
        {...props}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'z-[150] min-w-[12rem] overflow-hidden rounded-xl border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur-md',
            className
          )}
        >
          {children}
        </motion.div>
      </RadixDropdownMenu.Content>
    </RadixDropdownMenu.Portal>
  )
})

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Item>,
  ComponentPropsWithoutRef<typeof RadixDropdownMenu.Item> & { variant?: 'default' | 'destructive' }
>(function DropdownMenuItem({ className, variant = 'default', ...props }, ref) {
  return (
    <RadixDropdownMenu.Item
      ref={ref}
      className={cn(
        'flex min-h-11 cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-text outline-none transition-colors data-[highlighted]:bg-white/[0.07] data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        variant === 'destructive' &&
          'text-red-400 data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-300',
        className
      )}
      {...props}
    />
  )
})

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Separator>,
  ComponentPropsWithoutRef<typeof RadixDropdownMenu.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <RadixDropdownMenu.Separator
      ref={ref}
      className={cn('my-1.5 h-px bg-border', className)}
      {...props}
    />
  )
})

export const DropdownMenuLabel = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Label>,
  ComponentPropsWithoutRef<typeof RadixDropdownMenu.Label>
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <RadixDropdownMenu.Label
      ref={ref}
      className={cn('px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted', className)}
      {...props}
    />
  )
})
