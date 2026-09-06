import type { ReactionType, ListingType } from './types'

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  band: 'Grup Üyesi / Gruba Katılma',
  session: 'Session / Sahne Müzisyeni',
  lesson: 'Müzik Dersi',
  venue: 'Mekan / Sahne',
}

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  wow: '😮',
  sad: '😢',
  angry: '😠',
  haha: '😂',
}

export const REACTION_LABELS: Record<ReactionType, string> = {
  like: 'Beğen',
  love: 'Seviyorum',
  wow: 'Çok güzel',
  sad: 'Üzücü',
  angry: 'Kızgın',
  haha: 'Komik',
}

export const CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya',
  'Adana', 'Konya', 'Gaziantep', 'Mersin', 'Eskişehir',
  'Kayseri', 'Trabzon', 'Samsun', 'Denizli', 'Diyarbakır'
] as const

export const INSTRUMENTS = [
  'Gitar', 'Bas Gitar', 'Davul', 'Klavye / Piyano', 'Keman',
  'Saksofon', 'Trompet', 'Vokalist', 'DJ / Prodüksiyon',
  'Bağlama / Saz', 'Ud', 'Flüt', 'Kontrbas', 'Cello', 'Diğer'
] as const

export const GENRES = [
  'Rock', 'Metal', 'Pop', 'Jazz', 'Blues', 'Klasik',
  'Elektronik', 'Hip-Hop / Rap', 'R&B / Soul', 'Folk / Akustik',
  'Türk Halk Müziği', 'Türk Sanat Müziği', 'Arabesk', 'Reggae', 'Diğer'
] as const

export const MAX_VIDEO_DURATION_SECONDS = 60
export const MAX_VIDEO_SIZE_MB = 100
export const MAX_AUDIO_NOTE_SECONDS = 60
export const LISTING_EXPIRY_DAYS = 30

// youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, m.youtube.com/watch?v=ID
export const YOUTUBE_URL_REGEX =
  /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/)|youtu\.be\/)([\w-]{11})(?:[&?#].*)?$/
