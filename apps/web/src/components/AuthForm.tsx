'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { Button, cn } from './ui'

type Mode = 'login' | 'register'

const inputClass =
  'w-full rounded-lg border border-border bg-card px-4 py-3 text-white outline-none transition-colors duration-150 placeholder:text-muted focus:border-primary'

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
      <div className="mb-8 flex gap-2 rounded-lg border border-border p-1">
        {(['login', 'register'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-150',
              mode === m ? 'bg-primary text-white' : 'text-text-secondary hover:text-white'
            )}
          >
            {m === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">E-posta</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sen@ornek.com"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Şifre</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="En az 6 karakter"
            className={inputClass}
          />
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
