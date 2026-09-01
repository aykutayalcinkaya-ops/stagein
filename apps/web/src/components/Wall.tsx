'use client'

import { useEffect, useRef } from 'react'
import type { Post } from '@stagein/shared'
import { useWall } from '@/hooks/useWall'
import { PostCard } from './PostCard'
import { EmptyState } from './ui'

export function Wall({ initialPosts }: { initialPosts: Post[] }) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useWall(initialPosts)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage()
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const posts = data?.pages.flat() ?? []

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      {isLoading ? (
        <p className="py-16 text-center text-sm text-muted">Duvar yükleniyor…</p>
      ) : isError ? (
        <EmptyState title="Duvar yüklenemedi" description="Bağlantını kontrol edip tekrar dene." />
      ) : posts.length === 0 ? (
        <EmptyState title="Henüz gönderi yok" description="İlk gönderiyi sen paylaş." />
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          <div ref={sentinelRef} className="h-px w-full" />
          {isFetchingNextPage ? <p className="py-4 text-center text-xs text-muted">Yükleniyor…</p> : null}
        </>
      )}
    </div>
  )
}
