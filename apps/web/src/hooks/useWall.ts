'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import type { Post } from '@stagein/shared'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { useAuthStore } from '@/stores/authStore'
import { DEMO_POSTS } from '@/lib/demoContent'

const PAGE_SIZE = 10
const POST_SELECT =
  'id, user_id, body, video_id, photo_urls, like_count, comment_count, created_at, user:users(id, username, full_name, avatar_url, city), video:videos(*)'

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

  const { data: likes } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', viewerId)
    .in(
      'post_id',
      posts.map((p) => p.id)
    )
  const likedIds = new Set((likes ?? []).map((row) => row.post_id as string))
  return posts.map((p) => ({ ...p, liked_by_me: likedIds.has(p.id) }))
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
