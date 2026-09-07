'use client'

import type { ReactNode } from 'react'
import { motion } from 'motion/react'

/**
 * Server component'lerin (page.tsx gibi) motion'ı doğrudan kullanamamasının
 * çözümü: `motion.section`'a property-access anında `createMotionComponent()`
 * çağrılıyor ve bu client-only bir fonksiyon — server'da import edilip
 * kullanılırsa "Attempted to call createMotionComponent() from the server"
 * hatasıyla patlıyor. Bu ince client wrapper, animasyonu bir client boundary
 * arkasına alıyor; server component sadece <FadeInSection> JSX'ini render eder.
 */
export function FadeInSection({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  )
}
