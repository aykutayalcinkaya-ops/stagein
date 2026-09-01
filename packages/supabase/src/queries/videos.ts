import { supabase } from '../client'
import type { Video } from '@stagein/shared'

export async function fetchFeedVideos(city?: string, offset = 0, limit = 10): Promise<Video[]> {
  let query = supabase
    .from('videos')
    .select('*, user:users(id, username, full_name, avatar_url, city)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (city) query = query.eq('city', city)
  const { data, error } = await query
  if (error) throw error
  return data as Video[]
}

export async function uploadVideo(file: Blob, userId: string, metadata: Partial<Video>) {
  const path = `${userId}/${Date.now()}.mp4`
  const { error: uploadError } = await supabase.storage.from('videos').upload(path, file)
  if (uploadError) throw uploadError
  const { data, error } = await supabase.from('videos').insert({ ...metadata, user_id: userId, storage_path: path }).select().single()
  if (error) throw error
  return data
}

export async function incrementViewCount(videoId: string) {
  await supabase.rpc('increment_view_count', { video_id: videoId })
}
