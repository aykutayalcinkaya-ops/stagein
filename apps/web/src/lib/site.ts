export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://stagein.app'
export const APP_STORE_URL = 'https://apps.apple.com/app/stagein'
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.stagein'

export const LISTING_TYPE_LABELS: Record<string, string> = {
  band: 'Grup Arıyor',
  session: 'Session',
  lesson: 'Ders',
}

export const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  professional: 'Profesyonel',
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
}

export function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 60) return `${Math.max(minutes, 1)} dk önce`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} sa önce`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} gün önce`
  return formatDate(iso)
}

export function formatPrice(value: number | null) {
  if (value == null) return 'Fiyat belirtilmedi'
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value)
}
