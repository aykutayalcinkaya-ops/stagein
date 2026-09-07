'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'motion/react'
import { Lock, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { Button, cn } from './ui'

type Mode = 'login' | 'register'

const inputClass =
  'w-full rounded-lg border border-border bg-card py-3 pl-11 pr-4 text-white outline-none transition-colors duration-150 placeholder:text-muted focus:border-primary'

export function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/kesfet'

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)

    if (!isSupabaseConfigured) {
      setError('Supabase yapılandırılmamış. .env.local dosyasını doldur.')
      return
    }

    setPending(true)
    const supabase = createClient()

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push(next)
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${next}` },
        })
        if (error) throw error
        setNotice('Kayıt alındı. E-postana gönderilen bağlantıyla hesabını doğrula.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir şeyler ters gitti.')
    } finally {
      setPending(false)
    }
  }

  async function handleGoogle() {
    if (!isSupabaseConfigured) {
      setError('Supabase yapılandırılmamış. .env.local dosyasını doldur.')
      return
    }
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-center font-display text-2xl uppercase tracking-tight">
        {mode === 'login' ? 'Tekrar hoş geldin' : 'Aramıza katıl'}
      </h1>
      <p className="mt-2 text-center text-sm text-text-secondary">
        {mode === 'login' ? 'Sahnedeki yerine devam et.' : 'Şehrindeki müzisyenlerle bugün tanış.'}
      </p>

      <div className="relative mt-6 mb-8 flex gap-1 rounded-lg border border-border bg-white/[0.02] p-1">
        {(['login', 'register'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'relative z-10 flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-150',
              mode === m ? 'text-white' : 'text-text-secondary hover:text-white'
            )}
          >
            {mode === m ? (
              <motion.span
                layoutId="auth-mode-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 -z-10 rounded-md bg-primary"
              />
            ) : null}
            {m === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">E-posta</span>
          <span className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.8} aria-hidden="true" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sen@ornek.com"
              className={inputClass}
            />
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Şifre</span>
          <span className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.8} aria-hidden="true" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 6 karakter"
              className={inputClass}
            />
          </span>
        </label>

        {error ? <p className="text-sm text-accent">{error}</p> : null}
        {notice ? <p className="text-sm text-text-secondary">{notice}</p> : null}

        <Button type="submit" disabled={pending}>
          {pending ? 'Bekle…' : mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted">veya</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button variant="outline" className="w-full" onClick={handleGoogle} type="button">
        Google ile devam et
      </Button>

      <p className="mt-6 text-xs text-muted">
        Devam ederek Kullanım Koşulları ve Gizlilik Politikası&apos;nı kabul etmiş olursun.
      </p>
    </div>
  )
}
