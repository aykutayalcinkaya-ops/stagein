'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Post, PostComment, PostReportReason, ReactionType } from '@stagein/shared'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { useAuthStore } from '@/stores/authStore'
import { DEMO_POSTS } from '@/lib/demoContent'
import {
  addComment,
  createPost,
  deletePost,
  deletePostComment,
  reportPost,
  updatePost,
  type CreatePostInput,
} from '@/lib/api'

const PAGE_SIZE = 10
const POST_SELECT = `
  id, user_id, body, video_id, photo_urls, reactions, comment_count,
  share_count, created_at, user:users(*), video:videos(*)
`

async function fetchPostsPage(pageParam: number, viewerId: string | null): Promise<Post[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .order('created_at', { ascending: false })
    .range(pageParam, pageParam + PAGE_SIZE - 1)
  if (error) throw error
  const posts = (data ?? []) as unknown as Post[]

  if (!viewerId || posts.length === 0) return posts

  const { data: userReactions, error: reactionsError } = await supabase
    .from('post_reactions')
    .select('post_id, reaction_type')
    .eq('user_id', viewerId)
    .in(
      'post_id',
      posts.map((p) => p.id)
    )
  const reactionsMap = new Map(
    !reactionsError && userReactions ? (userReactions as Array<{post_id: string; reaction_type: ReactionType}>).map((r) => [r.post_id, r.reaction_type]) : []
  )

  return posts.map((p) => ({ ...p, my_reaction: reactionsMap.get(p.id) ?? null }))
}

export function useWall(initialPosts: Post[] = []) {
  const userId = useAuthStore((s) => s.userId)

  return useInfiniteQuery({
    queryKey: ['wall'],
    initialPageParam: 0,
    initialData: initialPosts.length ? { pages: [initialPosts], pageParams: [0] } : undefined,
    queryFn: async ({ pageParam }) => {
      if (!isSupabaseConfigured) return pageParam === 0 ? DEMO_POSTS : []
      const rows = await fetchPostsPage(pageParam, userId)
      if (rows.length === 0 && pageParam === 0) return DEMO_POSTS
      return rows
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.reduce((sum, p) => sum + p.length, 0),
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePostInput) => createPost(input),
    onSuccess: (post) => {
      queryClient.setQueryData<{ pages: Post[][]; pageParams: number[] }>(['wall'], (current) => {
        if (!current) return { pages: [[post]], pageParams: [0] }
        return { ...current, pages: [[post, ...current.pages[0]], ...current.pages.slice(1)] }
      })
    },
  })
}

export function useAddComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { postId: string; userId: string; body: string }) =>
      addComment(input.postId, input.userId, input.body),
    onSuccess: (comment, variables) => {
      queryClient.setQueryData<{ pages: Post[][]; pageParams: number[] }>(['wall'], (current) => {
        if (!current) return current
        return {
          ...current,
          pages: current.pages.map((page) =>
            page.map((p) => (p.id === variables.postId ? { ...p, comment_count: p.comment_count + 1 } : p))
          ),
        }
      })
      queryClient.setQueryData<PostComment[]>(['post-comments', variables.postId], (current) =>
        current ? [...current, comment] : [comment]
      )
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { commentId: string; postId: string }) => deletePostComment(input.commentId),
    onSuccess: (_data, { commentId, postId }) => {
      queryClient.setQueryData<{ pages: Post[][]; pageParams: number[] }>(['wall'], (current) => {
        if (!current) return current
        return {
          ...current,
          pages: current.pages.map((page) =>
            page.map((p) => (p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p))
          ),
        }
      })
      queryClient.setQueryData<PostComment[]>(['post-comments', postId], (current) =>
        current ? current.filter((c) => c.id !== commentId) : current
      )
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: (_data, postId) => {
      queryClient.setQueryData<{ pages: Post[][]; pageParams: number[] }>(['wall'], (current) => {
        if (!current) return current
        return { ...current, pages: current.pages.map((page) => page.filter((p) => p.id !== postId)) }
      })
    },
  })
}

/** Gönderi metnini düzenler ("Düzenle" — post 3-nokta menüsü). */
export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, body }: { postId: string; body: string }) => updatePost(postId, body),
    onSuccess: (updated) => {
      queryClient.setQueryData<{ pages: Post[][]; pageParams: number[] }>(['wall'], (current) => {
        if (!current) return current
        return {
          ...current,
          pages: current.pages.map((page) =>
            page.map((p) => (p.id === updated.id ? { ...p, body: updated.body, updated_at: updated.updated_at } : p))
          ),
        }
      })
    },
  })
}

/**
 * Bir gönderiyi şikayet eder ("Şikayet Et" — post 3-nokta menüsü). Gerçek
 * backend: bkz. `reportPost` (`@/lib/api`) ve `029_post_updates_and_reports.sql`.
 */
export function useReportPost() {
  return useMutation({
    mutationFn: ({ postId, userId, reason }: { postId: string; userId: string; reason: PostReportReason }) =>
      reportPost(postId, userId, reason),
  })
}
