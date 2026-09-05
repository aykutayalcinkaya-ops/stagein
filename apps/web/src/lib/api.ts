'use client'

import type {
  ExperienceLevel,
  MusicianProfile,
  Post,
  PostComment,
  PostCommentReply,
  PostShare,
  ProfileLink,
  ReactionType,
  User,
  VideoShare,
} from '@stagein/shared'
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

export async function togglePostLike(postId: string, userId: string, like: boolean): Promise<void> {
  const supabase = createClient()
  if (like) {
    const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
    if (error) throw error
  } else {
    const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
    if (error) throw error
  }
}

export async function addComment(postId: string, userId: string, body: string): Promise<PostComment> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, user_id: userId, body })
    .select(`*, user:users(${USER_SELECT})`)
    .single()
  if (error) throw error
  return data as PostComment
}

export async function getPostComments(postId: string): Promise<PostComment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('post_comments')
    .select(`*, user:users(${USER_SELECT})`)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as PostComment[]
}

export async function deletePost(postId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error
}

export async function deletePostComment(commentId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('post_comments').delete().eq('id', commentId)
  if (error) throw error
}

export async function toggleVideoLike(videoId: string, userId: string, like: boolean): Promise<void> {
  const supabase = createClient()
  if (like) {
    const { error } = await supabase.from('video_likes').insert({ video_id: videoId, user_id: userId })
    if (error) throw error
  } else {
    const { error } = await supabase.from('video_likes').delete().eq('video_id', videoId).eq('user_id', userId)
    if (error) throw error
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient()
  const path = `${userId}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw error
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

export async function upsertUser(input: {
  id: string
  full_name: string | null
  bio: string | null
  city: string | null
  avatar_url: string | null
}): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('users').update(input).eq('id', input.id)
  if (error) throw error
}

export async function upsertMusicianProfile(input: {
  user_id: string
  instruments: string[]
  genres: string[]
  experience_level: ExperienceLevel
  is_open_to_gig: boolean
}): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('musician_profiles').upsert(input)
  if (error) throw error
}

export async function replaceProfileLinks(userId: string, links: { label: string; url: string }[]): Promise<void> {
  const supabase = createClient()
  const { error: deleteError } = await supabase.from('profile_links').delete().eq('user_id', userId)
  if (deleteError) throw deleteError
  if (links.length === 0) return
  const rows = links.map((link, index) => ({ user_id: userId, label: link.label, url: link.url, position: index }))
  const { error: insertError } = await supabase.from('profile_links').insert(rows)
  if (insertError) throw insertError
}

// ---------------------------------------------------------------------------
// Post reactions
// ---------------------------------------------------------------------------

export async function addPostReaction(postId: string, userId: string, reactionType: ReactionType): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('post_reactions')
    .insert({ post_id: postId, user_id: userId, reaction_type: reactionType })
  if (error) throw error
}

export async function removePostReaction(postId: string, userId: string, reactionType: ReactionType): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('post_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('reaction_type', reactionType)
  if (error) throw error
}

export async function getPostUserReaction(postId: string, userId: string): Promise<ReactionType | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('post_reactions')
    .select('reaction_type')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data?.reaction_type as ReactionType) ?? null
}

// ---------------------------------------------------------------------------
// Video reactions
// ---------------------------------------------------------------------------

export async function addVideoReaction(videoId: string, userId: string, reactionType: ReactionType): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('video_reactions')
    .insert({ video_id: videoId, user_id: userId, reaction_type: reactionType })
  if (error) throw error
}

export async function removeVideoReaction(videoId: string, userId: string, reactionType: ReactionType): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('video_reactions')
    .delete()
    .eq('video_id', videoId)
    .eq('user_id', userId)
    .eq('reaction_type', reactionType)
  if (error) throw error
}

export async function getVideoUserReaction(videoId: string, userId: string): Promise<ReactionType | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('video_reactions')
    .select('reaction_type')
    .eq('video_id', videoId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data?.reaction_type as ReactionType) ?? null
}

// ---------------------------------------------------------------------------
// Comment replies
// ---------------------------------------------------------------------------

export async function addCommentReply(commentId: string, userId: string, body: string): Promise<PostCommentReply> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('post_comment_replies')
    .insert({ comment_id: commentId, user_id: userId, body })
    .select(`*, user:users(${USER_SELECT})`)
    .single()
  if (error) throw error
  return data as PostCommentReply
}

export async function getCommentReplies(commentId: string): Promise<PostCommentReply[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('post_comment_replies')
    .select(`*, user:users(${USER_SELECT})`)
    .eq('comment_id', commentId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as PostCommentReply[]
}

export async function deleteCommentReply(replyId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('post_comment_replies').delete().eq('id', replyId)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Post shares
// ---------------------------------------------------------------------------

export async function addPostShare(postId: string, userId: string, caption: string | null = null): Promise<PostShare> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('post_shares')
    .insert({ post_id: postId, user_id: userId, shared_to_wall: true, caption })
    .select(`*, user:users(${USER_SELECT})`)
    .single()
  if (error) throw error
  return data as PostShare
}

export async function removePostShare(postId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('post_shares').delete().eq('post_id', postId).eq('user_id', userId)
  if (error) throw error
}

export async function hasUserSharedPost(postId: string, userId: string): Promise<boolean> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('post_shares')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return !!data
}

// ---------------------------------------------------------------------------
// Video shares
// ---------------------------------------------------------------------------

export async function addVideoShare(videoId: string, userId: string, caption: string | null = null): Promise<VideoShare> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('video_shares')
    .insert({ video_id: videoId, user_id: userId, shared_to_wall: true, caption })
    .select(`*, user:users(${USER_SELECT})`)
    .single()
  if (error) throw error
  return data as VideoShare
}

export async function removeVideoShare(videoId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('video_shares').delete().eq('video_id', videoId).eq('user_id', userId)
  if (error) throw error
}

export async function hasUserSharedVideo(videoId: string, userId: string): Promise<boolean> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('video_shares')
    .select('id')
    .eq('video_id', videoId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return !!data
}
