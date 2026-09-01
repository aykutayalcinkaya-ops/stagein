'use client'

import Link from 'next/link'
import type { Post } from '@stagein/shared'
import { formatRelative } from '@/lib/site'
import { useAuthStore } from '@/stores/authStore'
import { useTogglePostLike } from '@/hooks/useWall'
import { UserAvatar } from './UserAvatar'
import { cn } from './ui'

export function PostCard({ post }: { post: Post }) {
  const author = post.user
  const userId = useAuthStore((s) => s.userId)
  const { mutate: toggleLike } = useTogglePostLike()

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <header className="flex items-center gap-3">
        {author ? (
          <Link href={`/profil/${author.username}`} className="flex items-center gap-3">
            <UserAvatar name={author.full_name} username={author.username} url={author.avatar_url} size={44} />
            <span>
              <span className="block text-sm font-bold text-text">{author.full_name ?? author.username}</span>
              <span className="block text-xs text-muted">{formatRelative(post.created_at)}</span>
            </span>
          </Link>
        ) : null}
      </header>

      {post.body ? (
        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-text-secondary">{post.body}</p>
      ) : null}

      {post.photo_urls.length > 0 ? (
        <div
          className={`mt-4 grid gap-1.5 overflow-hidden rounded-xl ${
            post.photo_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}
        >
          {post.photo_urls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" className="aspect-square w-full object-cover" />
          ))}
        </div>
      ) : null}

      {post.video ? (
        <Link
          href={`/kesfet?v=${post.video.id}`}
          className="relative mt-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-black"
        >
          {post.video.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.video.thumbnail_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
          ) : null}
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-dark">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </Link>
      ) : null}

      <footer className="mt-4 flex items-center gap-5 border-t border-border pt-3 text-sm">
        {userId ? (
          <button
            type="button"
            onClick={() => toggleLike({ postId: post.id, like: !post.liked_by_me })}
            className={cn('flex items-center gap-1.5 font-medium', post.liked_by_me ? 'text-accent' : 'text-muted hover:text-white')}
          >
            <svg
              viewBox="0 0 24 24"
              fill={post.liked_by_me ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={post.liked_by_me ? 0 : 1.8}
              className="h-4 w-4"
            >
              <path d="M12 21s-6.7-4.3-9.3-8.1C.8 10 1.4 6.4 4.4 4.8c2.1-1.1 4.6-.6 6.1 1.2.4.5.7.9 1.5.9.8 0 1.1-.4 1.5-.9 1.5-1.8 4-2.3 6.1-1.2 3 1.6 3.6 5.2 1.7 8.1C18.7 16.7 12 21 12 21Z" />
            </svg>
            {post.like_count} beğeni
          </button>
        ) : (
          <Link href="/giris" className="flex items-center gap-1.5 text-muted hover:text-white">
            {post.like_count} beğeni
          </Link>
        )}
        <span className="text-muted">{post.comment_count} yorum</span>
      </footer>
    </article>
  )
}
