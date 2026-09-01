import type { Metadata } from 'next'
import { VideoFeed } from '@/components/VideoFeed'

export const metadata: Metadata = {
  title: 'Keşfet',
  description: 'Şehrindeki müzisyenlerin performans videoları.',
  robots: { index: false },
}

export default function KesfetPage() {
  return <VideoFeed />
}
