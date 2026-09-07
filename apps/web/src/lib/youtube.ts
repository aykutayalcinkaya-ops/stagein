import { YOUTUBE_URL_REGEX } from '@stagein/shared'

/**
 * Geçerli bir YouTube linkinden ("youtube.com/watch?v=", "youtu.be/",
 * "youtube.com/shorts/", opsiyonel "www."/"m." alt alan adı, opsiyonel
 * protokol, ?si=/&list=/&t= gibi ek parametrelerle birlikte) 11 karakterlik
 * video ID'sini çıkarır; eşleşme yoksa veya girdi boşsa null döner (asla
 * fırlatmaz).
 */
export function extractYoutubeVideoId(url: string): string | null {
  if (!url) return null
  const match = url.trim().match(YOUTUBE_URL_REGEX)
  return match ? match[1] : null
}

/** Tek doğruluk kaynağı: `extractYoutubeVideoId` ile aynı ayrıştırma mantığını kullanır. */
export function isValidYoutubeUrl(url: string): boolean {
  return extractYoutubeVideoId(url) !== null
}

export function getYoutubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}
