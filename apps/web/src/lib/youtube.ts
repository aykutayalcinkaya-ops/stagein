import { YOUTUBE_URL_REGEX } from '@stagein/shared'

/** Geçerli bir YouTube linkinden 11 karakterlik video ID'sini çıkarır, değilse null döner. */
export function extractYoutubeVideoId(url: string): string | null {
  const match = url.trim().match(YOUTUBE_URL_REGEX)
  return match ? match[1] : null
}

export function isValidYoutubeUrl(url: string): boolean {
  return extractYoutubeVideoId(url) !== null
}

export function getYoutubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}
