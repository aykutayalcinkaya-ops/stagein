import { cn } from './ui'

interface Props {
  name?: string | null
  username?: string | null
  url?: string | null
  size?: number
  className?: string
}

/** Avatar; görsel yoksa baş harf fallback. Rozet ayrı bileşen (VerifiedBadge). */
export function UserAvatar({ name, username, url, size = 40, className }: Props) {
  const label = (name || username || '?').trim()
  const initial = label.charAt(0).toLocaleUpperCase('tr-TR')

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface font-bold text-text-secondary',
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  )
}

export function VerifiedBadge({ type }: { type: 'blue' | 'grey' }) {
  return (
    <span
      title={type === 'blue' ? 'Doğrulanmış sanatçı' : 'Doğrulanmış işletme'}
      className={cn(
        'inline-block h-3 w-3 rounded-full border',
        type === 'blue' ? 'border-primary bg-primary' : 'border-muted bg-muted'
      )}
    />
  )
}
