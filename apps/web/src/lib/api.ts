'use client'

import type { MusicianProfile, Post, ProfileLink, User } from '@stagein/shared'
import { createClient } from './supabase/client'

export const USER_SELECT = 'id, username, full_name, avatar_url, city, role, bio, email, created_at'

export interface ProfileBundle {
  profile: User | null
  musicianProfile: MusicianProfile | null
  profileLinks: ProfileLink[]
}

export async function fetchProfileBundle(userId: string): Promise<ProfileBundle> {
  const supabase = createClient()
  const [{ data: profile }, { data: musicianProfile }, { data: profileLinks }] = await Promise.all([
    supabase.from('users').select(USER_SELECT).eq('id', userId).maybeSingle(),
    supabase.from('musician_profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('profile_links').select('*').eq('user_id', userId).order('position', { ascending: true }),
  ])

  return {
    profile: (profile as User) ?? null,
    musicianProfile: (musicianProfile as MusicianProfile) ?? null,
    profileLinks: (profileLinks as ProfileLink[]) ?? [],
  }
}

export async function uploadPostPhoto(userId: string, file: File): Promise<string> {
  const supabase = createClient()
  const path = `${userId}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('post-photos').upload(path, file)
  if (error) throw error
  return supabase.storage.from('post-photos').getPublicUrl(path).data.publicUrl
}

const POST_SELECT = `*, user:users(${USER_SELECT}), video:videos(*)`

export async function createVideoFromFile(userId: string, file: File): Promise<{ id: string; path: string }> {
  const supabase = createClient()
  const path = `${userId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('videos').upload(path, file)
  if (uploadError) throw uploadError

  const { data, error } = await supabase.from('videos').insert({ user_id: userId, storage_path: path }).select('id').single()
  if (error) throw error
  return { id: (data as { id: string }).id, path }
}

export interface CreatePostInput {
  userId: string
  body: string | null
  photoFiles: File[]
  videoFile: File | null
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const supabase = createClient()
  const photoUrls = await Promise.all(input.photoFiles.map((file) => uploadPostPhoto(input.userId, file)))
  const video = input.videoFile ? await createVideoFromFile(input.userId, input.videoFile) : null

  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({ user_id: input.userId, body: input.body, photo_urls: photoUrls, video_id: video?.id ?? null })
      .select(POST_SELECT)
      .single()
    if (error) throw error
    return { ...(data as Post), liked_by_me: false }
  } catch (postError) {
    if (video) {
      try {
        await supabase.from('videos').delete().eq('id', video.id)
        await supabase.storage.from('videos').remove([video.path])
      } catch {
        // Best-effort cleanup only — surfacing the original insert error takes priority.
      }
    }
    throw postError
  }
}
