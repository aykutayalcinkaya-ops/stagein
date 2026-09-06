'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Post, ReactionType } from '@stagein/shared'
import { REACTION_EMOJIS } from '@stagein/shared'
import { formatRelative, sortedReactionEntries, sumReactions } from '@/lib/site'
import { useAuthStore } from '@/stores/authStore'
import { useAddComment, useDeleteComment, useDeletePost } from '@/hooks/useWall'
import { useTogglePostReaction } from '@/hooks/usePostReactions'
import { useTogglePostShare } from '@/hooks/usePostShares'
import { useVideoSource } from '@/hooks/useVideoSource'
import { getPostComments } from '@/lib/api'
import { UserAvatar } from './UserAvatar'
import { ReactionPicker } from './ReactionPicker'
import { CommentThread } from './CommentThread'
import { ShareMenu } from './ShareMenu'
import { cn } from './ui'

function AutoplayPostVideo({ videoId, thumbnailUrl, video }: { videoId: string; thumbnailUrl: string | null; video: NonNullable<Post['video']> }) {
  const containerRef = useRef<HTMLAnchorElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const src = useVideoSource(video)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const el = videoRef.current
        if (!el) return
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) void el.play().catch(() => {})
        else el.pause()
      },
      { threshold: [0, 0.5, 1] }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [src])

  return (
    <Link
      ref={containerRef}
      href={`/kesfet?v=${videoId}`}
      className="relative mt-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-black"
    >
      {src ? (
        <video
          ref={videoRef}
          src={src}
          poster={thumbnailUrl ?? undefined}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
          loop
          preload="metadata"
        />
      ) : thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
      ) : null}
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-dark">
        <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </Link>
  )
}

export function PostCard({ post }: { post: Post }) {
  const author = post.user
  const userId = useAuthStore((s) => s.userId)
  const { mutate: toggleReaction, isPending: isReacting } = useTogglePostReaction()
  const { mutate: toggleShare } = useTogglePostShare()
  const [commentsOpen, setCommentsOpen] = useState(false)
  const { data: comments } = useQuery({
    queryKey: ['post-comments', post.id],
    queryFn: () => getPostComments(post.id),
    enabled: commentsOpen,
  })
  const { mutate: addPostComment, isPending: isCommenting } = useAddComment()
  const { mutate: removeComment } = useDeleteComment()
  const [commentBody, setCommentBody] = useState('')
  const { mutate: removePost } = useDeletePost()
  const isOwner = userId === post.user_id

  function handleReactionSelect(reaction: ReactionType) {
    const add = reaction !== post.my_reaction
    toggleReaction({ postId: post.id, reactionType: reaction, add, oldReaction: post.my_reaction })
  }

  const reactionEntries = sortedReactionEntries(post.reactions)
  const totalReactions = sumReactions(post.reactions)

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <header className="flex items-center justify-between gap-3">
        {author ? (
          <Link href={`/profil/${author.username}`} className="flex items-center gap-3">
            <UserAvatar name={author.full_name} username={author.username} url={author.avatar_url} size={44} />
            <span>
              <span className="block text-sm font-bold text-text">{author.full_name ?? author.username}</span>
              <span className="block text-xs text-muted">{formatRelative(post.created_at)}</span>
            </span>
          </Link>
        ) : null}
        {isOwner ? (
          <button
            type="button"
            onClick={() => { if (window.confirm('Bu gönderiyi silmek istediğine emin misin?')) removePost(post.id) }}
            className="text-xs font-medium text-muted hover:text-accent"
          >
            Sil
          </button>
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
        <AutoplayPostVideo videoId={post.video.id} thumbnailUrl={post.video.thumbnail_url} video={post.video} />
      ) : null}

      {reactionEntries.length > 0 ? (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          {reactionEntries.map(([reaction, count]) => (
            <span key={reaction} className="flex items-center gap-1">
              <span>{REACTION_EMOJIS[reaction]}</span>
              <span>{count}</span>
            </span>
          ))}
          {totalReactions > 0 ? <span className="text-muted">· {totalReactions} reaksiyon</span> : null}
        </div>
      ) : null}

      <footer className="mt-3 flex items-center gap-5 border-t border-border pt-3 text-sm">
        {userId ? (
          <ReactionPicker
            postId={post.id}
            currentReaction={post.my_reaction ?? null}
            isLoading={isReacting}
            onSelect={handleReactionSelect}
          />
        ) : (
          <Link href="/giris" className="flex items-center gap-1.5 text-muted hover:text-white">
            Beğen
          </Link>
        )}
        <button type="button" onClick={() => setCommentsOpen((v) => !v)} className="text-muted hover:text-white">
          {post.comment_count} yorum
        </button>
        <span className="flex items-center gap-1.5">
          <ShareMenu
            postId={post.id}
            videoId={post.video?.id}
            onShareToWall={(caption) => toggleShare({ postId: post.id, shared: true, caption })}
          />
          {post.share_count > 0 ? <span className="text-muted">{post.share_count}</span> : null}
        </span>
      </footer>

      {commentsOpen ? (
        <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
          {(comments ?? []).map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              postId={post.id}
              isPostOwner={isOwner}
              postUserId={post.user_id}
              compact
              onDelete={(commentId) => removeComment({ commentId, postId: post.id })}
            />
          ))}

          {userId ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!commentBody.trim()) return
                addPostComment(
                  { postId: post.id, userId, body: commentBody.trim() },
                  { onSuccess: () => setCommentBody('') }
                )
              }}
            >
              <input
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Yorum yaz…"
                className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text outline-none placeholder:text-muted"
              />
              <button type="submit" disabled={isCommenting || !commentBody.trim()} className="text-sm font-semibold text-primary disabled:opacity-50">
                Gönder
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
