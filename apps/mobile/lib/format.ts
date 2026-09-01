export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return 'şimdi'
  if (diff < hour) return `${Math.floor(diff / minute)} dk`
  if (diff < day) return `${Math.floor(diff / hour)} sa`
  if (diff < 7 * day) return `${Math.floor(diff / day)} gün`
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

export function formatCount(n: number) {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}B`
  return `${(n / 1_000_000).toFixed(1)}M`
}

export const LISTING_TYPE_LABELS = {
  band: 'Grup Arıyor',
  session: 'Session',
  lesson: 'Ders',
} as const

export const EXPERIENCE_LABELS = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  professional: 'Profesyonel',
} as const
