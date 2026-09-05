import Link from 'next/link'
import type { ReactNode } from 'react'

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold tracking-tight transition-all duration-180 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50'

const variants = {
  primary:
    'bg-primary text-white shadow-[0_8px_24px_-8px_var(--color-primary)] hover:bg-primary-dim hover:shadow-[0_10px_28px_-6px_var(--color-primary)]',
  accent:
    'bg-accent text-dark shadow-[0_8px_24px_-8px_var(--color-accent)] hover:bg-accent-dim hover:shadow-[0_10px_28px_-6px_var(--color-accent)]',
  outline: 'border border-border-strong text-text hover:border-primary hover:bg-primary/5',
  ghost: 'text-text-secondary hover:text-white',
} as const

type Variant = keyof typeof variants

export function Button({
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={cn(buttonBase, variants[variant], className)} {...props} />
}

export function LinkButton({
  variant = 'primary',
  className,
  children,
  href,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  variant?: Variant
}) {
  return (
    <Link href={href} className={cn(buttonBase, variants[variant], className)} {...(props as any)}>
      {children}
    </Link>
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
