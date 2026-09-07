'use client'

import { useEffect } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { useAuthStore } from '@/stores/authStore'
import { showToast } from '@/stores/toastStore'

type SupabaseClient = ReturnType<typeof createClient>
type ChangePayload = RealtimePostgresChangesPayload<Record<string, unknown>>

const MAX_RETRIES = 3
const REALTIME_DISABLED_MESSAGE = 'Canlı güncellemeler devre dışı'

/**
 * Bir postgres_changes payload'unun beklenen alanları taşıyıp taşımadığını
 * doğrular. Bozuk/eksik bir payload'a körü körüne güvenip önbelleği geçersiz
 * kılmak yerine sessizce yok sayar.
 */
function isValidChangePayload(payload: ChangePayload, idField: string): boolean {
  if (payload.eventType === 'DELETE') {
    // DELETE olaylarında yalnızca replica identity alanları (genelde id) gelir.
    const old = payload.old as Record<string, unknown> | undefined
    return Boolean(old?.id)
  }
  const record = payload.new as Record<string, unknown> | undefined
  return Boolean(record?.id && record?.[idField] && record?.user_id)
}

/** Realtime payload'u geçerli olayın sahibinin, o an oturum açmış kullanıcı olup olmadığını söyler. */
function isFromSelf(payload: ChangePayload): boolean {
  const viewerId = useAuthStore.getState().userId
  if (!viewerId) return false
  const record = (payload.new ?? payload.old) as Record<string, unknown> | undefined
  return record?.user_id === viewerId
}

/**
 * Bir Supabase realtime kanalına abone olur. Bağlantı koparsa (CHANNEL_ERROR /
 * TIMED_OUT) üstel geri çekilmeyle (1s, 2s, 4s) en fazla MAX_RETRIES kez
 * yeniden dener. Tüm denemeler tükenirse kullanıcıya sessiz bir toast uyarısı
 * gösterir ve durur — gönderiler/videolar yine de normal sorgularla
 * (query cache) yüklenmeye devam eder, arayüz çökmez.
 */
function subscribeWithRetry(supabase: SupabaseClient, createChannel: () => RealtimeChannel) {
  let channel: RealtimeChannel | null = null
  let retryTimeout: ReturnType<typeof setTimeout> | null = null
  let retries = 0
  let cancelled = false
  let toastShown = false

  const connect = () => {
    if (cancelled) return
    channel = createChannel()
    channel.subscribe((status) => {
      if (cancelled) return

      if (status === 'SUBSCRIBED') {
        retries = 0
        return
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        if (channel) {
          supabase.removeChannel(channel)
          channel = null
        }

        if (retries < MAX_RETRIES) {
          const delay = 2 ** retries * 1000
          retries += 1
          retryTimeout = setTimeout(connect, delay)
        } else if (!toastShown) {
          toastShown = true
          showToast(REALTIME_DISABLED_MESSAGE, 'warning')
        }
      }
    })
  }

  connect()

  return () => {
    cancelled = true
    if (retryTimeout) clearTimeout(retryTimeout)
    if (channel) supabase.removeChannel(channel)
  }
}

function invalidate(queryClient: QueryClient, queryKey: unknown[]) {
  queryClient.invalidateQueries({ queryKey, exact: false })
}

export function useWallRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const supabase = createClient()

    // Post reaksiyon değişikliklerini dinle.
    const unsubscribeReactions = subscribeWithRetry(supabase, () =>
      supabase.channel('posts-reactions').on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_reactions' },
        (payload: ChangePayload) => {
          if (!isValidChangePayload(payload, 'post_id')) return
          if (isFromSelf(payload)) return
          invalidate(queryClient, ['wall'])
        }
      )
    )

    // Yeni gönderileri dinle.
    const unsubscribeNewPosts = subscribeWithRetry(supabase, () =>
      supabase.channel('new-posts').on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload: ChangePayload) => {
          if (!isValidChangePayload(payload, 'id')) return
          if (isFromSelf(payload)) return
          invalidate(queryClient, ['wall'])
        }
      )
    )

    // Paylaşım (share_count) değişikliklerini dinle.
    const unsubscribeShares = subscribeWithRetry(supabase, () =>
      supabase.channel('post-shares').on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_shares' },
        (payload: ChangePayload) => {
          if (!isValidChangePayload(payload, 'post_id')) return
          if (isFromSelf(payload)) return
          invalidate(queryClient, ['wall'])
        }
      )
    )

    return () => {
      unsubscribeReactions()
      unsubscribeNewPosts()
      unsubscribeShares()
    }
  }, [queryClient])
}

export function useVideoFeedRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const supabase = createClient()

    const unsubscribe = subscribeWithRetry(supabase, () =>
      supabase.channel('video-reactions').on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'video_reactions' },
        (payload: ChangePayload) => {
          if (!isValidChangePayload(payload, 'video_id')) return
          if (isFromSelf(payload)) return
          // 'feed' önbelleği ['feed', city, startVideoId] bileşik anahtarıyla
          // saklanıyor; exact: false, hangi şehir/başlangıç videosu olursa
          // olsun 'feed' önekiyle başlayan tüm sorguları yeniden çeker.
          invalidate(queryClient, ['feed'])
        }
      )
    )

    return unsubscribe
  }, [queryClient])
}

/**
 * Bir konuşmadaki yeni mesajları ve gelen kutusu listesini (son mesaj/sıra)
 * canlı günceller. `conversationId` verilirse yalnızca o konuşmaya postgres
 * `filter` ile abone olunur (açık konuşma ekranı); her durumda gelen kutusu
 * (['conversations']) da geçersiz kılınır — `messages` tablosunda `user_id`
 * değil `sender_id`/`conversation_id` olduğundan `isValidChangePayload`/
 * `isFromSelf` burada kullanılamıyor, kendi hafif doğrulaması var.
 */
export function useMessagingRealtime(conversationId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const supabase = createClient()

    const unsubscribe = subscribeWithRetry(supabase, () => {
      const channel = supabase.channel(conversationId ? `messages-${conversationId}` : 'messages-inbox')
      const filter = conversationId
        ? { event: 'INSERT' as const, schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }
        : { event: 'INSERT' as const, schema: 'public', table: 'messages' }
      return channel.on('postgres_changes', filter, (payload: ChangePayload) => {
        const record = payload.new as Record<string, unknown> | undefined
        if (!record?.id || !record?.conversation_id) return
        if (conversationId) invalidate(queryClient, ['messages', conversationId])
        invalidate(queryClient, ['conversations'])
      })
    })

    return unsubscribe
  }, [queryClient, conversationId])
}

/**
 * MANUAL TESTING CHECKLIST (Phase 9):
 *
 * Reactions Realtime:
 * [ ] Open Wall in Tab A + Tab B
 * [ ] Click emoji in Tab A → appears in Tab B without refresh (live count update)
 * [ ] Click different emoji → old emoji removed, new emoji shown (both tabs sync)
 *
 * New Posts Realtime:
 * [ ] User posts in Tab A → appears in Tab B's feed top within 2 seconds
 *
 * Share Count Realtime:
 * [ ] Share post in Tab A → share_count increments in Tab B (live)
 *
 * VideoFeed Reactions:
 * [ ] Add reaction to video in Tab A → Tab B shows updated count (live)
 *
 * Offline & Recovery:
 * [ ] Close browser DevTools network → disable internet
 * [ ] Try reacting → UI still updates optimistically (cache)
 * [ ] Re-enable network → changes sync (no error modal)
 * [ ] Subscription reconnects silently (no user notification needed)
 *
 * Error Handling:
 * [ ] Break Supabase key in .env → subscription fails silently (toast shown)
 * [ ] Posts still load (query fallback)
 * [ ] Realtime doesn't retry infinitely (logs error, stops after 3 retries)
 */
