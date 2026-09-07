'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { Flag, ImageOff, Link2, MessageCircle, MoreHorizontal, Pencil, Play, Trash2, Video } from 'lucide-react'
import type { Post, PostReportReason, ReactionType } from '@stagein/shared'
import { REACTION_EMOJIS } from '@stagein/shared'
import { formatRelative, sortedReactionEntries, sumReactions, SITE_URL } from '@/lib/site'
import { useAuthStore } from '@/stores/authStore'
import { useAddComment, useDeleteComment, useDeletePost, useReportPost, useUpdatePost } from '@/hooks/useWall'
import { useTogglePostReaction } from '@/hooks/usePostReactions'
import { useTogglePostShare } from '@/hooks/usePostShares'
import { useVideoSource } from '@/hooks/useVideoSource'
import { getPostComments } from '@/lib/api'
import { MediaPlaceholder } from './MediaPlaceholder'
import { UserAvatar } from './UserAvatar'
import { ReactionPicker } from './ReactionPicker'
import { CommentThread } from './CommentThread'
import { ShareMenu } from './ShareMenu'
import { ConfirmDialog } from './ConfirmDialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './DropdownMenu'
import { Button } from './ui'

const REPORT_REASONS: { value: PostReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Taciz veya zorbalık' },
  { value: 'inappropriate', label: 'Uygunsuz içerik' },
  { value: 'other', label: 'Diğer' },
]

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
      className="group relative mt-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-black"
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
      ) : (
        <MediaPlaceholder icon={Video} label="Video yükleniyor" className="absolute inset-0" />
      )}
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-dark shadow-lg transition-transform duration-180 group-hover:scale-105">
        <Play className="ml-1 h-6 w-6" fill="currentColor" strokeWidth={0} />
      </span>
    </Link>
  )
}

/** Tek bir gönderi fotoğrafı — yüklenemezse (kırık/kaldırılmış URL) düz siyah
 * kutu yerine markalı `MediaPlaceholder` gösterir. */
function PostPhoto({ url }: { url: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <MediaPlaceholder icon={ImageOff} label="Görsel yüklenemedi" className="aspect-square w-full" />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" loading="lazy" className="aspect-square w-full object-cover" onError={() => setFailed(true)} />
  )
}

/** Şikayet nedeni seçici — `ConfirmDialog`'un düz metin açıklamasına sığmayan tek özel akış (radyo listesi) için ayrı, aynı görsel dilde bir modal. */
function ReportPostDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (reason: PostReportReason) => void
  isSubmitting: boolean
}) {
  const [reason, setReason] = useState<PostReportReason>('spam')

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                className="fixed left-1/2 top-1/2 z-[201] w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl"
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 4 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              >
                <Dialog.Title className="text-lg font-semibold text-text">Gönderiyi şikayet et</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-relaxed text-text-secondary">
                  Bu gönderiyi neden şikayet ediyorsun? Ekibimiz en kısa sürede inceleyecek.
                </Dialog.Description>

                <div className="mt-4 flex flex-col gap-1">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.value}
                      className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text transition-colors hover:bg-white/[0.06]"
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="h-4 w-4 accent-primary"
                      />
                      {r.label}
                    </label>
                  ))}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Dialog.Close asChild>
                    <Button variant="secondary" className="px-5 py-2.5 text-sm">
                      Vazgeç
                    </Button>
                  </Dialog.Close>
                  <Button
                    type="button"
                    variant="destructive"
                    className="px-5 py-2.5 text-sm"
                    disabled={isSubmitting}
                    onClick={() => onSubmit(reason)}
                  >
                    Gönder
                  </Button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
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
  const { mutate: saveEdit, isPending: isSaving } = useUpdatePost()
  const { mutate: submitReport, isPending: isReporting } = useReportPost()
  const isOwner = userId === post.user_id

  const [isEditing, setIsEditing] = useState(false)
  const [editBody, setEditBody] = useState(post.body ?? '')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  function handleReactionSelect(reaction: ReactionType) {
    const add = reaction !== post.my_reaction
    toggleReaction({ postId: post.id, reactionType: reaction, add, oldReaction: post.my_reaction })
  }

  function handleStartEdit() {
    setEditBody(post.body ?? '')
    setIsEditing(true)
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setEditBody(post.body ?? '')
  }

  function handleSaveEdit() {
    const trimmed = editBody.trim()
    if (!trimmed || trimmed === (post.body ?? '')) {
      setIsEditing(false)
      return
    }
    saveEdit(
      { postId: post.id, body: trimmed },
      {
        onSuccess: () => setIsEditing(false),
        onError: () => setToast('Gönderi güncellenemedi, tekrar dene.'),
      }
    )
  }

  async function handleCopyLink() {
    const url = `${SITE_URL}/post/${post.id}`
    try {
      await navigator.clipboard.writeText(url)
      setToast('Bağlantı kopyalandı')
    } catch {
      setToast('Bağlantı kopyalanamadı')
    }
  }

  function handleReportSubmit(reason: PostReportReason) {
    if (!userId) return
    submitReport(
      { postId: post.id, userId, reason },
      {
        onSuccess: () => {
          setReportOpen(false)
          setToast('Şikayetin alındı, ekibimiz inceleyecek.')
        },
        onError: () => {
          setReportOpen(false)
          setToast('Şikayet gönderilemedi, tekrar dene.')
        },
      }
    )
  }

  const reactionEntries = sortedReactionEntries(post.reactions)
  const totalReactions = sumReactions(post.reactions)

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border bg-card/80 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_16px_32px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md transition-colors duration-180 hover:border-border-strong sm:p-6"
    >
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Gönderi seçenekleri"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-text"
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={1.8} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner ? (
              <DropdownMenuItem onSelect={handleStartEdit}>
                <Pencil className="h-4 w-4" strokeWidth={1.8} />
                Düzenle
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onSelect={handleCopyLink}>
              <Link2 className="h-4 w-4" strokeWidth={1.8} />
              Bağlantıyı Kopyala
            </DropdownMenuItem>
            {isOwner ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                  Sil
                </DropdownMenuItem>
              </>
            ) : userId ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setReportOpen(true)}>
                  <Flag className="h-4 w-4" strokeWidth={1.8} />
                  Şikayet Et
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {isEditing ? (
        <div className="mt-4 flex flex-col gap-2">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={3}
            autoFocus
            className="resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-[15px] leading-relaxed text-text outline-none transition-colors duration-150 placeholder:text-muted focus:border-primary"
          />
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" className="px-4 py-1.5 text-xs" onClick={handleCancelEdit}>
              Vazgeç
            </Button>
            <Button
              type="button"
              variant="primary"
              className="px-4 py-1.5 text-xs"
              disabled={isSaving || !editBody.trim()}
              onClick={handleSaveEdit}
            >
              Kaydet
            </Button>
          </div>
        </div>
      ) : post.body ? (
        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-text-secondary">{post.body}</p>
      ) : null}

      {post.photo_urls.length > 0 ? (
        <div
          className={`mt-4 grid gap-1.5 overflow-hidden rounded-xl ${
            post.photo_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}
        >
          {post.photo_urls.map((url) => (
            <PostPhoto key={url} url={url} />
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
        </div>
      ) : null}

      <footer className="mt-3 flex items-center gap-5 border-t border-border pt-3 text-sm">
        {userId ? (
          <ReactionPicker
            postId={post.id}
            currentReaction={post.my_reaction ?? null}
            isLoading={isReacting}
            onSelect={handleReactionSelect}
            totalCount={totalReactions}
          />
        ) : (
          <Link href="/giris" className="flex items-center gap-1.5 text-muted transition-colors duration-150 hover:text-white">
            Beğen
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCommentsOpen((v) => !v)}
          className="flex items-center gap-1.5 text-muted transition-colors duration-150 hover:text-white"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
          {post.comment_count > 0 ? post.comment_count : 'Yorum'}
        </button>
        <ShareMenu
          postId={post.id}
          videoId={post.video?.id}
          shareCount={post.share_count}
          onShareToWall={(caption) => toggleShare({ postId: post.id, shared: true, caption })}
        />
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
                className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text outline-none transition-colors duration-150 placeholder:text-muted focus:border-primary"
              />
              <button
                type="submit"
                disabled={isCommenting || !commentBody.trim()}
                className="text-sm font-semibold text-primary transition-colors duration-150 hover:text-primary-dim disabled:opacity-50"
              >
                Gönder
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Gönderiyi sil"
        description="Bu gönderiyi silmek istediğine emin misin? Bu işlem geri alınamaz."
        confirmLabel="Sil"
        variant="destructive"
        onConfirm={() => removePost(post.id)}
      />

      <ReportPostDialog open={reportOpen} onOpenChange={setReportOpen} onSubmit={handleReportSubmit} isSubmitting={isReporting} />

      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center">
          <span className="rounded-full bg-dark/90 px-4 py-2 text-xs font-medium text-white shadow-lg">{toast}</span>
        </div>
      ) : null}
    </motion.article>
  )
}
