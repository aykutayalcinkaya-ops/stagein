import { create } from 'zustand'

interface FeedState {
  /** Ekranda görünen videonun index'i — sadece o oynar */
  activeIndex: number
  /** Görünen videonun id'si; izlenme sayacı bir kez artsın diye takip ediliyor */
  viewedIds: Set<string>
  muted: boolean
  cityFilter: string | null
  setActiveIndex: (index: number) => void
  markViewed: (videoId: string) => boolean
  toggleMuted: () => void
  setCityFilter: (city: string | null) => void
}

export const useFeedStore = create<FeedState>((set, get) => ({
  activeIndex: 0,
  viewedIds: new Set<string>(),
  muted: false,
  cityFilter: null,

  setActiveIndex: (index) => set({ activeIndex: index }),

  markViewed: (videoId) => {
    const { viewedIds } = get()
    if (viewedIds.has(videoId)) return false
    viewedIds.add(videoId)
    return true
  },

  toggleMuted: () => set((s) => ({ muted: !s.muted })),
  setCityFilter: (city) => set({ cityFilter: city, activeIndex: 0 }),
}))
