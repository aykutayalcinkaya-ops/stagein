import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all duration-150 ease-out active:scale-95 disabled:pointer-events-none disabled:opacity-50'

const variants = {
  primary: 'bg-primary text-white hover:bg-primary/90',
  accent: 'bg-accent text-dark hover:bg-accent/90',
  outline: 'border border-border text-text hover:border-primary hover:text-white',
  ghost: 'text-text-secondary hover:text-white',
} as const

type Variant = keyof typeof variants

export function Button({
  variant = 'primary',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: Variant }) {
  return <button className={cn(buttonBase, variants[variant], className)} {...props} />
}

export function LinkButton({
  variant = 'primary',
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(buttonBase, variants[variant], className)} {...props} />
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-xl border border-border bg-card p-4', className)}>{children}</div>
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
    default: 'bg-border text-text-secondary',
    primary: 'bg-primary/15 text-[#B9A6FF]',
    accent: 'bg-accent/15 text-accent',
  } as const
  return (
    <span className={cn('rounded-full px-3 py-1 text-xs font-medium', tones[tone], className)}>{children}</span>
  )
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{children}</h2>
      {sub ? <p className="mt-3 max-w-2xl text-base text-text-secondary">{sub}</p> : null}
    </div>
  )
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}
