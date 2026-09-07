'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { ArrowLeft, X, type LucideIcon } from 'lucide-react'
import { cn } from './ui'

/**
 * Tam ekran/immersive görünümlerde (Keşfet video akışı, Video Ekle sayfası)
 * kullanılan cam efektli geri/kapat butonu. `router.back()` çağırır, böylece
 * gerçek tarayıcı geri tuşuyla aynı geçmiş girdisini kullanır — history'yi
 * `replace` ile bozmaz.
 */
export function BackButton({
  className,
  icon: Icon = ArrowLeft,
  label = 'Geri',
}: {
  className?: string
  icon?: LucideIcon
  label?: string
}) {
  const router = useRouter()

  return (
    <motion.button
      type="button"
      onClick={() => router.back()}
      aria-label={label}
      title={label}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors duration-180 hover:bg-white/20',
        className
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={1.8} />
    </motion.button>
  )
}

export { X as CloseIcon }
