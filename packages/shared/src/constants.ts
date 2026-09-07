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

export const MARKETPLACE_CATEGORIES = [
  { id: 'electric-guitar', name: 'Elektro Gitar' },
  { id: 'acoustic-guitar', name: 'Akustik & Klasik Gitar' },
  { id: 'bass-guitar', name: 'Bas Gitar' },
  { id: 'amps-cabs', name: 'Amfiler & Kabinler' },
  { id: 'pedals', name: 'Efekt Pedalları & Prosesörler' },
  { id: 'keyboards', name: 'Tuşlular & Synthesizer' },
  { id: 'drums', name: 'Davul & Perküsyon' },
  { id: 'studio', name: 'Stüdyo & Kayıt Ekipmanları' },
  { id: 'strings-wind', name: 'Yaylılar & Üflemeliler' },
  { id: 'dj-stage', name: 'DJ & Sahne Ekipmanları' },
] as const

export const CONDITION_LABELS: Record<string, string> = {
  brand_new: 'Sıfır Ayarında',
  like_new: 'Sıfır Gibi',
  very_good: 'Çok İyi',
  good: 'İyi',
  needs_repair: 'Bakım Gerekli',
}

export const FREELANCE_CATEGORIES = [
  { id: 'mix-mastering', name: 'Mix & Mastering' },
  { id: 'beat-production', name: 'Müzik Prodüksiyonu & Beste' },
  { id: 'session-musician', name: 'Enstrüman & Session Kayıt' },
  { id: 'voiceover', name: 'Seslendirme & Dublaj' },
  { id: 'songwriting', name: 'Şarkı Sözü & Beste' },
  { id: 'audio-editing', name: 'Ses Düzenleme & Restorasyon' },
  { id: 'lessons', name: 'Müzik Dersi & Danışmanlık' },
] as const

export const FREELANCE_ORDER_STATUS_LABELS: Record<string, string> = {
  requirements_pending: 'Gereksinimler Bekleniyor',
  in_progress: 'İşlem Devam Ediyor',
  delivered: 'Teslim Edildi',
  revision_requested: 'Revizyon İstenmiş',
  completed: 'Tamamlandı',
  cancelled: 'İptal Edilmiş',
  disputed: 'Uyuşmazlık',
}

// youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, m.youtube.com/watch?v=ID
// - protokol (https://) opsiyonel: kullanıcı adres çubuğundan "https://" olmadan yapıştırabilir.
// - "i" bayrağı: alan adı büyük/küçük harf duyarsız (YouTube.com, HTTPS://... da geçerli); video ID'si zaten
//   [\w-] karakter sınıfıyla her iki harf durumunu da kapsıyor, bu yüzden ID eşleşmesini bozmaz.
// - sondaki [/&?#].* grubu: ?si=, &list=, &t=, #fragment ve sondaki "/" (paylaşım linklerinde görülen) hepsini yutar.
export const YOUTUBE_URL_REGEX =
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/)|youtu\.be\/)([\w-]{11})(?:[/&?#].*)?$/i
