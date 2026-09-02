'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { UserAvatar } from './UserAvatar'
import { cn } from './ui'

const NAV = [
  { href: '/kesfet', label: 'Keşfet' },
  { href: '/ilanlar', label: 'İlanlar' },
  { href: '/pazar', label: 'Pazar' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const userId = useAuthStore((s) => s.userId)
  const profile = useAuthStore((s) => s.profile)
  const [open, setOpen] = useState(false)

  /** Keşfet tam ekran/immersive akış — kendi üst çubuğunu taşıyor. */
  if (pathname.startsWith('/kesfet')) return null

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-dark/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl uppercase tracking-wide">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-accent" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Stage<span className="text-primary">In</span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] p-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-180',
                pathname.startsWith(item.href)
                  ? 'bg-white/[0.08] text-white'
                  : 'text-text-secondary hover:text-white'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {profile ? (
            <>
              <Link href={`/profil/${profile.username}`} aria-label="Profilim">
                <UserAvatar name={profile.full_name} username={profile.username} url={profile.avatar_url} size={36} />
              </Link>
              <Link
                href="/ayarlar"
                aria-label="Ayarlar"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-text-secondary hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </Link>
            </>
          ) : (
            <Link
              href="/giris"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_var(--color-primary)] transition-all duration-180 ease-out hover:bg-primary-dim active:scale-[0.97]"
            >
              Giriş Yap
            </Link>
          )}
        </div>

        <button
          type="button"
          aria-label="Menü"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span className={cn('h-px w-5 bg-white transition-transform duration-180', open && 'translate-y-[3px] rotate-45')} />
          <span className={cn('h-px w-5 bg-white transition-transform duration-180', open && '-translate-y-[3px] -rotate-45')} />
        </button>
      </div>

      {open ? (
        <nav className="border-t border-white/[0.06] bg-dark px-4 py-4 md:hidden">
          <ul className="flex flex-col gap-4">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setOpen(false)} className="text-base font-medium text-text-secondary">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={userId ? '/kesfet' : '/giris'} onClick={() => setOpen(false)} className="text-base font-semibold text-primary">
                {userId ? 'Uygulamaya Git' : 'Giriş Yap'}
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
