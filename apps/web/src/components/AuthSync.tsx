'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { fetchProfileBundle } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

/** Supabase oturumunu ve profil verisini Zustand store'una bağlar. Layout içinde bir kez render edilir. */
export function AuthSync() {
  const setSession = useAuthStore((s) => s.setSession)
  const setProfileData = useAuthStore((s) => s.setProfileData)
  const clear = useAuthStore((s) => s.clear)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null)
      return
    }

    const supabase = createClient()

    async function sync(userId: string | null) {
      setSession(userId)
      if (!userId) {
        clear()
        return
      }
      const bundle = await fetchProfileBundle(userId)
      setProfileData(bundle)
    }

    supabase.auth.getUser().then(({ data }) => sync(data.user?.id ?? null))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void sync(session?.user?.id ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [setSession, setProfileData, clear])

  return null
}
