import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '@stagein/supabase'
import type { MusicianProfile, User } from '@stagein/shared'
import { fetchMusicianProfile, fetchUser } from '@/lib/api'

const SESSION_KEY = 'stagein.session'

type AuthStatus = 'loading' | 'authenticated' | 'guest'

interface AuthState {
  status: AuthStatus
  session: Session | null
  profile: User | null
  musicianProfile: MusicianProfile | null
  /** Profil satırı yoksa onboarding tamamlanmamış demektir */
  needsOnboarding: boolean
  initialize: () => Promise<void>
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

/**
 * @stagein/supabase istemcisi web/native ortak olduğu için oturumu AsyncStorage'a
 * kendimiz yazıyoruz; uygulama açılışında setSession ile geri yüklüyoruz.
 */
async function persistSession(session: Session | null) {
  if (session) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else await AsyncStorage.removeItem(SESSION_KEY)
}

async function restoreSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const stored = JSON.parse(raw) as Session
    const { data, error } = await supabase.auth.setSession({
      access_token: stored.access_token,
      refresh_token: stored.refresh_token,
    })
    if (error) throw error
    return data.session
  } catch {
    await AsyncStorage.removeItem(SESSION_KEY)
    return null
  }
}

let subscribed = false

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  session: null,
  profile: null,
  musicianProfile: null,
  needsOnboarding: false,

  initialize: async () => {
    if (!subscribed) {
      subscribed = true
      supabase.auth.onAuthStateChange((_event, session) => {
        void persistSession(session)
        set({ session, status: session ? 'authenticated' : 'guest' })
        if (session) void get().refreshProfile()
        else set({ profile: null, musicianProfile: null, needsOnboarding: false })
      })
    }

    const session = (await supabase.auth.getSession()).data.session ?? (await restoreSession())
    set({ session, status: session ? 'authenticated' : 'guest' })
    if (session) await get().refreshProfile()
  },

  refreshProfile: async () => {
    const userId = get().session?.user.id
    if (!userId) return
    try {
      const [profile, musicianProfile] = await Promise.all([
        fetchUser(userId),
        fetchMusicianProfile(userId),
      ])
      set({ profile, musicianProfile, needsOnboarding: profile === null })
    } catch (error) {
      console.warn('[StageIn] profil yüklenemedi', error)
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    await persistSession(null)
    set({ session: null, profile: null, musicianProfile: null, status: 'guest', needsOnboarding: false })
  },
}))

/** Oturum açmış kullanıcının id'si — misafirse null */
export function useCurrentUserId() {
  return useAuthStore((s) => s.session?.user.id ?? null)
}
