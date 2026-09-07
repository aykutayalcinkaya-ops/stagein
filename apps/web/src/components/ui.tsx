'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

// cn artık lib/cn.ts'de yaşıyor çünkü bu dosya 'use client' — server component'ler
// (ör. UserAvatar.tsx) plain fonksiyon olarak cn() çağıramaz, sadece JSX olarak
// buradaki bileşenleri render edebilirler. Mevcut client import'ları bozmamak
// için burada yeniden export ediliyor.
export { cn }

const buttonBase =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold tracking-tight transition-all duration-180 ease-out disabled:pointer-events-none disabled:opacity-50'

/**
 * Semantik buton renk hiyerarşisi (UI/UX Pro Max):
 * - `primary`   → ana marka rengi, en önemli tekil eylem (CTA)
 * - `secondary` → nötr/outline, ikincil eylemler
 * - `destructive` → kırmızı, silme/şikayet gibi geri alınamaz eylemler
 * - `accent`    → vurgulanan/öne çıkan çağrılar (ör. "Şimdi Katıl")
 * - `outline`/`ghost` → geriye dönük uyumluluk için korunuyor (mevcut
 *   çağrı yerleri: AuthForm.tsx, hakkimizda/page.tsx, not-found.tsx)
 */
const variants = {
  primary:
    'bg-primary text-white shadow-[0_8px_24px_-8px_var(--color-primary)] hover:bg-primary-dim hover:shadow-[0_10px_28px_-6px_var(--color-primary)]',
  secondary:
    'border border-border-strong bg-white/[0.04] text-text hover:border-primary/60 hover:bg-white/[0.08]',
  destructive:
    'bg-red-600 text-white shadow-[0_8px_24px_-8px_rgba(220,38,38,0.55)] hover:bg-red-500 hover:shadow-[0_10px_28px_-6px_rgba(220,38,38,0.65)]',
  accent:
    'bg-accent text-dark shadow-[0_8px_24px_-8px_var(--color-accent)] hover:bg-accent-dim hover:shadow-[0_10px_28px_-6px_var(--color-accent)]',
  outline: 'border border-border-strong text-text hover:border-primary hover:bg-primary/5',
  ghost: 'text-text-secondary hover:text-white',
} as const

type Variant = keyof typeof variants

type NativeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
>

type NativeAnchorProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
>

const MotionLink = motion.create(Link)

export function Button({
  variant = 'primary',
  className,
  ...props
}: NativeButtonProps & { variant?: Variant }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={cn(buttonBase, variants[variant], className)}
      {...props}
    />
  )
}

export function LinkButton({
  variant = 'primary',
  className,
  children,
  href,
  ...props
}: NativeAnchorProps & {
  href: string
  variant?: Variant
}) {
  return (
    <MotionLink
      href={href}
      whileTap={{ scale: 0.96 }}
      className={cn(buttonBase, variants[variant], className)}
      {...props}
    >
      {children}
    </MotionLink>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm transition-colors duration-180 hover:border-border-strong',
        className
      )}
    >
      {children}
    </div>
  )
}

export function Chip({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode
  tone?: 'default' | 'primary' | 'accent'
  className?: string
}) {
  const tones = {
    default: 'bg-white/[0.06] text-text-secondary ring-1 ring-inset ring-white/[0.08]',
    primary: 'bg-primary/15 text-[#C6B7FF] ring-1 ring-inset ring-primary/25',
    accent: 'bg-accent/15 text-accent ring-1 ring-inset ring-accent/25',
  } as const
  return (
    <span className={cn('rounded-full px-3 py-1 text-xs font-medium', tones[tone], className)}>{children}</span>
  )
}

export function SectionTitle({ children, sub, kicker }: { children: ReactNode; sub?: string; kicker?: string }) {
  return (
    <div className="mb-10">
      {kicker ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-accent">{kicker}</p>
      ) : null}
      <h2 className="font-display text-4xl uppercase leading-[0.95] tracking-tight sm:text-5xl">{children}</h2>
      {sub ? <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">{sub}</p> : null}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-white/[0.06]', className)} />
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong bg-card/50 px-6 py-16 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}
