import type { LucideIcon } from 'lucide-react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Görsel/video eksikken kullanılan yer tutucu. Düz `bg-surface` dikdörtgeni
 * (özellikle büyük aspect-square alanlarda) neredeyse tamamen siyah bir boşluk
 * gibi görünüyordu — bunun yerine marka tonlarından hafif bir gradyan + ikon +
 * kısa Türkçe metin. Server component'lerden de güvenle kullanılabilir (bu
 * dosya 'use client' DEĞİL — sadece JSX döndüren, event handler'ı olmayan saf
 * bir bileşen; lucide-react ikonları da server-safe'tir).
 */
export function MediaPlaceholder({
  icon: Icon = ImageOff,
  label = 'Görsel yok',
  className,
}: {
  icon?: LucideIcon
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(ellipse_120%_100%_at_50%_0%,color-mix(in_oklab,var(--color-primary)_14%,transparent),transparent),linear-gradient(180deg,var(--color-surface),var(--color-card))]',
        className
      )}
    >
      <Icon className="h-7 w-7 text-muted" strokeWidth={1.5} />
      <span className="text-xs font-medium text-muted">{label}</span>
    </div>
  )
}
