import { create } from 'zustand'

interface FeedPlaybackState {
  /** Kullanıcı oturumu boyunca akıştaki tüm videolar için hatırlanan ses tercihi. */
  muted: boolean
  /** Space tuşuyla anlık videoyu durdurma/oynatma. */
  paused: boolean
  toggleMuted: () => void
  setMuted: (muted: boolean) => void
  togglePaused: () => void
}

export const useFeedPlaybackStore = create<FeedPlaybackState>((set) => ({
  muted: true,
  paused: false,
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
  setMuted: (muted) => set({ muted }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
}))
