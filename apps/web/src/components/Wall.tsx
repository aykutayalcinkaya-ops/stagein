'use client'

import { useEffect, useRef } from 'react'
import type { Post } from '@stagein/shared'
import { useWall } from '@/hooks/useWall'
import { useWallRealtime } from '@/hooks/useRealtimeUpdates'
import { PostCard } from './PostCard'
import { PostComposer } from './PostComposer'
import { EmptyState, Skeleton } from './ui'

function PostCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/80 p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  )
}

export function Wall({ initialPosts }: { initialPosts: Post[] }) {
  useWallRealtime()
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
      <PostComposer />
      {isLoading ? (
        <>
          {Array.from({ length: 3 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </>
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
