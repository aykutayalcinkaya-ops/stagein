import type { Metadata } from 'next'
import { Wall } from '@/components/Wall'
import { getPosts, getViewerId } from '@/lib/data'

export const metadata: Metadata = {
  title: 'StageIn — Müzisyenlerin Platformu',
  description: 'Şehrindeki müzisyenlerin paylaştığı gönderiler, videolar ve duyurular.',
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const viewerId = await getViewerId()
  const initialPosts = await getPosts(20, viewerId ?? undefined)
  return <Wall initialPosts={initialPosts} />
}
