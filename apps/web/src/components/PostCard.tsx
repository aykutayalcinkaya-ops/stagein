'use client'

import Link from 'next/link'
import type { Post } from '@stagein/shared'
import { formatRelative } from '@/lib/site'
import { UserAvatar } from './UserAvatar'

export function PostCard({ post }: { post: Post }) {
  const author = post.user

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

      <footer className="mt-4 flex items-center gap-5 border-t border-border pt-3 text-sm text-muted">
        <span>{post.like_count} beğeni</span>
        <span>{post.comment_count} yorum</span>
      </footer>
    </article>
  )
}
