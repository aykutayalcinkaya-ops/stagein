import { create } from 'zustand'
import type { User } from '@stagein/shared'

interface AuthState {
  /** Supabase auth kullanıcı id'si — oturum yoksa null */
  userId: string | null
  profile: User | null
  isLoading: boolean
  setSession: (userId: string | null, profile?: User | null) => void
  setProfile: (profile: User | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  profile: null,
  isLoading: true,
  setSession: (userId, profile = null) => set({ userId, profile, isLoading: false }),
  setProfile: (profile) => set({ profile }),
  clear: () => set({ userId: null, profile: null, isLoading: false }),
}))
