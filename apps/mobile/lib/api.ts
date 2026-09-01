import * as FileSystem from 'expo-file-system'
import { supabase } from '@stagein/supabase'
import type {
  Conversation,
  ExperienceLevel,
  Listing,
  Message,
  MusicianProfile,
  User,
  Video,
} from '@stagein/shared'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

/** Storage'daki public bucket dosyası için tam URL */
export function publicUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

/** Videonun oynatılabilir kaynağı: HLS hazırsa onu, değilse ham dosyayı kullan */
export function videoSource(video: Video) {
  return video.hls_url ?? publicUrl('videos', video.storage_path)
}

// ---------------------------------------------------------------- profiller

export async function fetchUser(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data as User | null
}

export async function fetchMusicianProfile(userId: string): Promise<MusicianProfile | null> {
  const { data, error } = await supabase
    .from('musician_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data as MusicianProfile | null
}

export async function fetchUserVideos(userId: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Video[]
}

export async function isUsernameAvailable(username: string) {
  const { data, error } = await supabase.from('users').select('id').eq('username', username).maybeSingle()
  if (error) throw error
  return data === null
}

export async function upsertUser(user: Partial<User> & { id: string }) {
  const { data, error } = await supabase.from('users').upsert(user).select().single()
  if (error) throw error
  return data as User
}

export async function upsertMusicianProfile(profile: {
  user_id: string
  instruments: string[]
  genres: string[]
  experience_level: ExperienceLevel
  is_open_to_gig?: boolean
}) {
  const { data, error } = await supabase.from('musician_profiles').upsert(profile).select().single()
  if (error) throw error
  return data as MusicianProfile
}

// ----------------------------------------------------------------- ilanlar

export async function fetchListing(id: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from('listings')
    .select('*, user:users(id, username, full_name, avatar_url, city)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as Listing | null
}

export async function fetchMyListings(userId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Listing[]
}

export async function closeListing(id: string) {
  const { error } = await supabase.from('listings').update({ status: 'closed' }).eq('id', id)
  if (error) throw error
}

// ------------------------------------------------------------- konuşmalar

/** Sohbet listesi için karşı tarafların profillerini ve son mesajları tek turda getirir */
export async function hydrateConversations(
  conversations: Conversation[],
  currentUserId: string
): Promise<Conversation[]> {
  if (conversations.length === 0) return []

  const otherIds = Array.from(
    new Set(conversations.flatMap((c) => c.participant_ids.filter((id) => id !== currentUserId)))
  )
  const conversationIds = conversations.map((c) => c.id)

  const [usersResult, messagesResult] = await Promise.all([
    supabase.from('users').select('id, username, full_name, avatar_url, city').in('id', otherIds),
    supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false }),
  ])
  if (usersResult.error) throw usersResult.error
  if (messagesResult.error) throw messagesResult.error

  const userMap = new Map((usersResult.data ?? []).map((u) => [u.id as string, u as unknown as User]))
  const lastMessage = new Map<string, Message>()
  for (const raw of messagesResult.data ?? []) {
    const message = raw as unknown as Message
    if (!lastMessage.has(message.conversation_id)) lastMessage.set(message.conversation_id, message)
  }

  return conversations.map((c) => ({
    ...c,
    participants: c.participant_ids
      .filter((id) => id !== currentUserId)
      .map((id) => userMap.get(id))
      .filter((u): u is User => Boolean(u)),
    last_message: lastMessage.get(c.id),
  }))
}

export async function fetchConversation(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase.from('conversations').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Conversation | null
}

/** İki kullanıcı arasında sohbet bul, yoksa oluştur */
export async function getOrCreateConversation(currentUserId: string, otherUserId: string) {
  const { data: existing, error } = await supabase
    .from('conversations')
    .select('*')
    .contains('participant_ids', [currentUserId, otherUserId])
    .limit(1)
  if (error) throw error
  if (existing && existing.length > 0) return existing[0] as Conversation

  const { data, error: insertError } = await supabase
    .from('conversations')
    .insert({ participant_ids: [currentUserId, otherUserId] })
    .select()
    .single()
  if (insertError) throw insertError
  return data as Conversation
}

export async function touchConversation(conversationId: string) {
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)
}

// -------------------------------------------------------------- yüklemeler

function extensionOf(uri: string, fallback: string) {
  const match = /\.([a-zA-Z0-9]+)(?:\?|$)/.exec(uri)
  return match ? match[1].toLowerCase() : fallback
}

/**
 * Dosyayı Storage REST ucuna yükler. supabase-js ilerleme bildirmediği için
 * expo-file-system'in upload task'ı kullanılıyor — yükleme çubuğu bunu gerektiriyor.
 */
async function uploadFile(options: {
  bucket: string
  path: string
  uri: string
  contentType: string
  onProgress?: (ratio: number) => void
}) {
  const { bucket, path, uri, contentType, onProgress } = options
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new Error('Oturum bulunamadı')

  const task = FileSystem.createUploadTask(
    `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`,
    uri,
    {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
    },
    ({ totalBytesSent, totalBytesExpectedToSend }) => {
      if (totalBytesExpectedToSend > 0) onProgress?.(totalBytesSent / totalBytesExpectedToSend)
    }
  )

  const result = await task.uploadAsync()
  if (!result || result.status >= 300) {
    throw new Error(`Yükleme başarısız (${result?.status ?? 'bilinmiyor'})`)
  }
  return path
}

export async function uploadVideoFile(options: {
  userId: string
  uri: string
  metadata: { city: string | null; instruments: string[]; genres: string[]; duration: number | null }
  onProgress?: (ratio: number) => void
}) {
  const { userId, uri, metadata, onProgress } = options
  const path = `${userId}/${Date.now()}.${extensionOf(uri, 'mp4')}`

  await uploadFile({ bucket: 'videos', path, uri, contentType: 'video/mp4', onProgress })

  const { data, error } = await supabase
    .from('videos')
    .insert({ ...metadata, user_id: userId, storage_path: path })
    .select()
    .single()
  if (error) throw error

  // HLS dönüşümü + thumbnail: supabase/functions/process-video
  void supabase.functions
    .invoke('process-video', { body: { video_id: (data as Video).id, storage_path: path } })
    .catch((err) => console.warn('[StageIn] process-video tetiklenemedi', err))

  return data as Video
}

export async function uploadAvatar(userId: string, uri: string) {
  const path = `${userId}/${Date.now()}.${extensionOf(uri, 'jpg')}`
  await uploadFile({ bucket: 'avatars', path, uri, contentType: 'image/jpeg' })
  return publicUrl('avatars', path)
}

export async function uploadAudioNote(userId: string, uri: string) {
  const path = `${userId}/${Date.now()}.${extensionOf(uri, 'm4a')}`
  await uploadFile({ bucket: 'audio-notes', path, uri, contentType: 'audio/m4a' })
  return publicUrl('audio-notes', path)
}
