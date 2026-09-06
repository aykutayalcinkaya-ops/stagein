'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { PostComment, PostCommentReply } from '@stagein/shared'
import { formatRelative } from '@/lib/site'
import { useAuthStore } from '@/stores/authStore'
import { useAddCommentReply, useCommentReplies, useDeleteCommentReply } from '@/hooks/useCommentReplies'
import { UserAvatar } from './UserAvatar'
import { cn } from './ui'

interface CommentThreadProps {
  comment: PostComment
  isPostOwner: boolean
  /** Rozet için: bu yorumun yazarı gönderi sahibiyle aynı mı — verilmezse rozet gösterilmez. */
  postUserId?: string
  onDelete?: (commentId: string) => void
  onReply?: (commentId: string, body: string) => void
  /** PostCard içinde satır içi görünüm — cevaplar varsayılan olarak kapalı başlar. */
  compact?: boolean
}

function ReplyRow({
  reply,
  isPostOwner,
  postUserId,
  onDelete,
}: {
  reply: PostCommentReply
  isPostOwner: boolean
  postUserId?: string
  onDelete?: () => void
}) {
  const userId = useAuthStore((s) => s.userId)
  const canDelete = !!userId && (userId === reply.user_id || isPostOwner)
  const isReplyByPostOwner = !!postUserId && reply.user_id === postUserId

  return (
    <div className="flex gap-2">
      {reply.user ? (
        <Link href={`/profil/${reply.user.username}`} className="shrink-0">
          <UserAvatar name={reply.user.full_name} username={reply.user.username} url={reply.user.avatar_url} size={22} />
        </Link>
      ) : (
        <UserAvatar size={22} />
      )}
      <div className="min-w-0 flex-1 rounded-lg bg-surface px-3 py-1.5 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-text">{reply.user?.full_name ?? reply.user?.username ?? 'Kullanıcı'}</span>
          {isReplyByPostOwner ? (
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#C6B7FF]">
              Gönderi Sahibi
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-text-secondary">{reply.body}</p>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted">
          <span>{formatRelative(reply.created_at)}</span>
          {canDelete && onDelete ? (
            <button type="button" onClick={onDelete} className="font-medium hover:text-accent">
              Sil
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function CommentThread({ comment, isPostOwner, postUserId, onDelete, onReply, compact }: CommentThreadProps) {
  const userId = useAuthStore((s) => s.userId)
  const [showReplies, setShowReplies] = useState(false)
  const [replyBody, setReplyBody] = useState('')

  const { data: fetchedReplies, isLoading: repliesLoading } = useCommentReplies(comment.id, showReplies)
  const { mutate: addReply, isPending: isReplying } = useAddCommentReply()
  const { mutate: removeReply } = useDeleteCommentReply()

  const replies = fetchedReplies ?? comment.replies ?? []
  const showSpinner = showReplies && repliesLoading && !comment.replies
  const author = comment.user
  const canDeleteComment = !!userId && (userId === comment.user_id || isPostOwner)
  const isCommentByPostOwner = !!postUserId && comment.user_id === postUserId

  function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault()
    const body = replyBody.trim()
    if (!body) return
    addReply(
      { commentId: comment.id, body },
      {
        onSuccess: () => {
          setReplyBody('')
          onReply?.(comment.id, body)
        },
      }
    )
  }

  return (
    <div className="flex gap-2">
      {author ? (
        <Link href={`/profil/${author.username}`} className="shrink-0">
          <UserAvatar name={author.full_name} username={author.username} url={author.avatar_url} size={compact ? 26 : 32} />
        </Link>
      ) : (
        <UserAvatar size={compact ? 26 : 32} />
      )}

      <div className="min-w-0 flex-1">
        <div className={cn('rounded-lg bg-surface px-3 py-2', compact ? 'text-xs' : 'text-sm')}>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-text">{author?.full_name ?? author?.username ?? 'Kullanıcı'}</span>
            {isCommentByPostOwner ? (
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#C6B7FF]">
                Gönderi Sahibi
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 whitespace-pre-wrap text-text-secondary">{comment.body}</p>
        </div>

        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted">
          <span>{formatRelative(comment.created_at)}</span>
          {userId ? (
            <button type="button" onClick={() => setShowReplies((v) => !v)} className="font-medium hover:text-white">
              {comment.reply_count > 0 ? `${comment.reply_count} cevap` : 'Cevapla'}
            </button>
          ) : comment.reply_count > 0 ? (
            <button type="button" onClick={() => setShowReplies((v) => !v)} className="font-medium hover:text-white">
              {comment.reply_count} cevap
            </button>
          ) : null}
          {canDeleteComment && onDelete ? (
            <button type="button" onClick={() => onDelete(comment.id)} className="font-medium hover:text-accent">
              Sil
            </button>
          ) : null}
        </div>

        {showReplies ? (
          <div className="mt-2 flex flex-col gap-2 border-l border-border pl-3">
            {showSpinner ? (
              <span className="flex items-center gap-2 text-[11px] text-muted">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 animate-spin text-muted">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="14 40" strokeLinecap="round" />
                </svg>
                Cevaplar yükleniyor…
              </span>
            ) : (
              replies.map((reply) => (
                <ReplyRow
                  key={reply.id}
                  reply={reply}
                  isPostOwner={isPostOwner}
                  postUserId={postUserId}
                  onDelete={() => removeReply({ replyId: reply.id, commentId: comment.id })}
                />
              ))
            )}

            {userId ? (
              <form onSubmit={handleReplySubmit} className="flex items-end gap-2">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Cevap yaz…"
                  rows={1}
                  className="flex-1 resize-none rounded-lg border border-border bg-transparent px-3 py-1.5 text-xs text-text outline-none placeholder:text-muted"
                />
                <button
                  type="submit"
                  disabled={isReplying || !replyBody.trim()}
                  className="text-xs font-semibold text-primary disabled:opacity-50"
                >
                  Gönder
                </button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
