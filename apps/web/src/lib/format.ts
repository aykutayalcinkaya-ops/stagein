/**
 * tr-TR tarih/saat biçimlendirme yardımcıları — tasarım sistemi standardı.
 *
 * Not: `apps/web/src/lib/site.ts` içinde de `formatDate`/`formatRelative`
 * adında benzer iki fonksiyon zaten var (uzun ay adıyla, ör. "14 Haziran
 * 2024" ve "dk/sa/gün önce"). Onlar geriye dönük uyumluluk için
 * dokunulmadan bırakıldı — mevcut çağrı yerleri hâlâ onları kullanıyor.
 * Bu dosyadaki `formatDateTr`/`formatRelativeTr`, gravity.md'nin istediği
 * kısaltılmış ay formatını ("14 Haz 2024") ve "az önce" eşiğini sağlayan,
 * yeni kodun tercih etmesi gereken sürümdür.
 */

function toDate(date: string | Date): Date {
  return typeof date === 'string' ? new Date(date) : date
}

/**
 * Kısa, mutlak tr-TR tarih biçimi. Örn: "14 Haz 2024".
 */
export function formatDateTr(date: string | Date): string {
  const target = toDate(date)
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(target)
}

/**
 * Göreli tr-TR tarih biçimi. Örn: "az önce", "3 sa önce", "2 gün önce".
 * ~30 günden eski tarihler için `formatDateTr`'a düşer (ör. "14 Haz 2024").
 */
export function formatRelativeTr(date: string | Date): string {
  const target = toDate(date)
  const diffMs = Date.now() - target.getTime()
  const minutes = Math.floor(diffMs / 60000)

  if (minutes < 1) return 'az önce'
  if (minutes < 60) return `${minutes} dk önce`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} sa önce`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} gün önce`

  return formatDateTr(target)
}
