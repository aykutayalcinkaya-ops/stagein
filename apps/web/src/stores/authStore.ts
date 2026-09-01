import { create } from 'zustand'
import type { MusicianProfile, ProfileLink, User } from '@stagein/shared'

interface AuthState {
  /** Supabase auth kullanıcı id'si — oturum yoksa null */
  userId: string | null
  profile: User | null
  musicianProfile: MusicianProfile | null
  profileLinks: ProfileLink[]
  isLoading: boolean
  setSession: (userId: string | null) => void
  setProfileData: (data: { profile: User | null; musicianProfile: MusicianProfile | null; profileLinks: ProfileLink[] }) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  profile: null,
  musicianProfile: null,
  profileLinks: [],
  isLoading: true,
  setSession: (userId) => set({ userId, isLoading: false }),
  setProfileData: (data) => set(data),
  clear: () => set({ userId: null, profile: null, musicianProfile: null, profileLinks: [], isLoading: false }),
}))
