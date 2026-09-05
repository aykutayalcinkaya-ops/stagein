import type { Post, ReactionType, Video } from '@stagein/shared'

function emptyReactions(like: number): Record<ReactionType, number> {
  return { like, love: 0, wow: 0, sad: 0, angry: 0, haha: 0 }
}

/**
 * Örnek Keşfet içeriği — canlı Supabase projesinde henüz gerçek video yokken
 * akışın boş görünmemesi için kullanılır. `useVideoFeed` gerçek veri boşsa buna düşer.
 * Prodüksiyon lansmanından önce kaldırılmalı / gerçek kullanıcı içeriğiyle değiştirilmeli.
 */
export const DEMO_VIDEOS: Video[] = [
  {
    id: 'demo-guitarist',
    user_id: 'demo-user-1',
    storage_path: 'demo/videos/guitarist.mp4',
    hls_url: '/demo/videos/guitarist.mp4',
    thumbnail_url: null,
    duration: 5,
    city: 'İstanbul',
    instruments: ['Gitar'],
    genres: ['Rock'],
    reactions: emptyReactions(128),
    share_count: 0,
    view_count: 2140,
    created_at: new Date().toISOString(),
    user: {
      id: 'demo-user-1',
      email: '',
      username: 'kaanguitar',
      full_name: 'Kaan Yıldız',
      avatar_url: '/demo/avatars/guitarist.png',
      city: 'İstanbul',
      bio: null,
      role: 'musician',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'demo-singer',
    user_id: 'demo-user-2',
    storage_path: 'demo/videos/singer.mp4',
    hls_url: '/demo/videos/singer.mp4',
    thumbnail_url: null,
    duration: 5,
    city: 'İzmir',
    instruments: ['Vokalist'],
    genres: ['Pop'],
    reactions: emptyReactions(342),
    share_count: 0,
    view_count: 5890,
    created_at: new Date().toISOString(),
    user: {
      id: 'demo-user-2',
      email: '',
      username: 'elifsings',
      full_name: 'Elif Demir',
      avatar_url: '/demo/avatars/singer.png',
      city: 'İzmir',
      bio: null,
      role: 'musician',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'demo-drummer',
    user_id: 'demo-user-3',
    storage_path: 'demo/videos/drummer.mp4',
    hls_url: '/demo/videos/drummer.mp4',
    thumbnail_url: null,
    duration: 5,
    city: 'Ankara',
    instruments: ['Davul'],
    genres: ['Metal'],
    reactions: emptyReactions(87),
    share_count: 0,
    view_count: 1430,
    created_at: new Date().toISOString(),
    user: {
      id: 'demo-user-3',
      email: '',
      username: 'burakdrums',
      full_name: 'Burak Şahin',
      avatar_url: '/demo/avatars/drummer.png',
      city: 'Ankara',
      bio: null,
      role: 'musician',
      created_at: new Date().toISOString(),
    },
  },
]

/**
 * Örnek duvar içeriği — canlı projede henüz gerçek gönderi yokken duvarın
 * boş görünmemesi için kullanılır. `useWall` gerçek veri boşsa buna düşer.
 */
export const DEMO_POSTS: Post[] = [
  {
    id: 'demo-post-1',
    user_id: 'demo-user-1',
    body: 'Yeni prova kaydı geldi, dinleyin 🎸',
    video_id: 'demo-guitarist',
    photo_urls: [],
    reactions: emptyReactions(24),
    share_count: 0,
    comment_count: 3,
    created_at: new Date().toISOString(),
    user: DEMO_VIDEOS[0].user,
    video: DEMO_VIDEOS[0],
    liked_by_me: false,
    my_reaction: null,
  },
  {
    id: 'demo-post-2',
    user_id: 'demo-user-2',
    body: 'Bu akşam stüdyoda çekilenler 📸',
    video_id: null,
    photo_urls: ['/demo/avatars/singer.png'],
    reactions: emptyReactions(12),
    share_count: 0,
    comment_count: 1,
    created_at: new Date(Date.now() - 3_600_000).toISOString(),
    user: DEMO_VIDEOS[1].user,
    liked_by_me: false,
    my_reaction: null,
  },
  {
    id: 'demo-post-3',
    user_id: 'demo-user-3',
    body: 'Yeni grup arkadaşı arıyorum, DM atın.',
    video_id: null,
    photo_urls: [],
    reactions: emptyReactions(5),
    share_count: 0,
    comment_count: 0,
    created_at: new Date(Date.now() - 7_200_000).toISOString(),
    user: DEMO_VIDEOS[2].user,
    liked_by_me: false,
    my_reaction: null,
  },
]
