'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from './ui'

const NAV = [
  { href: '/kesfet', label: 'Keşfet' },
  { href: '/ilanlar', label: 'İlanlar' },
  { href: '/pazar', label: 'Pazar' },
  { href: '/blog', label: 'Blog' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const userId = useAuthStore((s) => s.userId)
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-dark">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          Stage<span className="text-primary">In</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors duration-150',
                pathname.startsWith(item.href) ? 'text-white' : 'text-text-secondary hover:text-white'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={userId ? '/kesfet' : '/giris'}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-primary/90 active:scale-95"
          >
            {userId ? 'Uygulamaya Git' : 'Giriş Yap'}
          </Link>
        </div>

        <button
          type="button"
          aria-label="Menü"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span className="h-px w-5 bg-white" />
          <span className="h-px w-5 bg-white" />
        </button>
      </div>

      {open ? (
        <nav className="border-t border-border bg-dark px-4 py-4 md:hidden">
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
