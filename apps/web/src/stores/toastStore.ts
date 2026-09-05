import { create } from 'zustand'

export type ToastTone = 'info' | 'warning' | 'error'

export interface ToastItem {
  id: string
  message: string
  tone: ToastTone
}

interface ToastState {
  toasts: ToastItem[]
  dismissToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

/**
 * Zustand hook'unun kullanılamadığı yerlerden (örn. React render döngüsü
 * dışındaki realtime abonelik geri çağrıları) toast göstermek için.
 */
export function showToast(message: string, tone: ToastTone = 'info', durationMs = 5000) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  useToastStore.setState((state) => ({ toasts: [...state.toasts, { id, message, tone }] }))
  setTimeout(() => {
    useToastStore.getState().dismissToast(id)
  }, durationMs)
}
