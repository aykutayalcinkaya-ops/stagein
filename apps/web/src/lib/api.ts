'use client'

import type { MusicianProfile, ProfileLink, User } from '@stagein/shared'
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
