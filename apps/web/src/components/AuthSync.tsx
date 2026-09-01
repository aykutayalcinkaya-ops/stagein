'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { useAuthStore } from '@/stores/authStore'

/** Supabase oturumunu Zustand store'una bağlar. Layout içinde bir kez render edilir. */
export function AuthSync() {
  const setSession = useAuthStore((s) => s.setSession)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null)
      return
    }

    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => setSession(data.user?.id ?? null))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user?.id ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [setSession])

  return null
}
