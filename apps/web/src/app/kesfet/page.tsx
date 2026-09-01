import type { Metadata } from 'next'
import { VideoFeed } from '@/components/VideoFeed'

export const metadata: Metadata = {
  title: 'Keşfet',
  description: 'Şehrindeki müzisyenlerin performans videoları.',
  robots: { index: false },
}

interface PageProps {
  searchParams: Promise<{ v?: string }>
}

export default async function KesfetPage({ searchParams }: PageProps) {
  const { v } = await searchParams
  return <VideoFeed startVideoId={v} />
}
