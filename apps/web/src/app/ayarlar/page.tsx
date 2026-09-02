'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CITIES, GENRES, INSTRUMENTS } from '@stagein/shared'
import type { ExperienceLevel } from '@stagein/shared'
import { createClient } from '@/lib/supabase/client'
import { uploadAvatar, upsertMusicianProfile, upsertUser } from '@/lib/api'
import { EXPERIENCE_LABELS } from '@/lib/site'
import { Button, Chip, EmptyState } from '@/components/ui'
import { UserAvatar } from '@/components/UserAvatar'
import { useAuthStore } from '@/stores/authStore'

const LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'professional']

export default function AyarlarPage() {
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const profile = useAuthStore((s) => s.profile)
  const musicianProfile = useAuthStore((s) => s.musicianProfile)
  const setProfileData = useAuthStore((s) => s.setProfileData)
  const profileLinks = useAuthStore((s) => s.profileLinks)

  useEffect(() => {
    if (userId === null) router.replace('/giris')
  }, [userId, router])

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [city, setCity] = useState<string | null>(profile?.city ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [instruments, setInstruments] = useState<string[]>(musicianProfile?.instruments ?? [])
  const [genres, setGenres] = useState<string[]>(musicianProfile?.genres ?? [])
  const [experience, setExperience] = useState<ExperienceLevel>(musicianProfile?.experience_level ?? 'beginner')
  const [openToGig, setOpenToGig] = useState(musicianProfile?.is_open_to_gig ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(list: string[], setList: (next: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  if (userId && !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          title="Hesabın henüz tamamlanmamış"
          description="Profilini tamamlamak için StageIn mobil uygulamasını kullan."
        />
      </div>
    )
  }

  if (!profile) return null

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const avatarUrl = avatarFile ? await uploadAvatar(profile!.id, avatarFile) : profile!.avatar_url
      await upsertUser({
        id: profile!.id,
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        city,
        avatar_url: avatarUrl,
      })
      await upsertMusicianProfile({
        user_id: profile!.id,
        instruments,
        genres,
        experience_level: experience,
        is_open_to_gig: openToGig,
      })
      setProfileData({
        profile: { ...profile!, full_name: fullName.trim() || null, bio: bio.trim() || null, city, avatar_url: avatarUrl },
        musicianProfile: { user_id: profile!.id, instruments, genres, experience_level: experience, is_open_to_gig: openToGig },
        profileLinks,
      })
      router.push(`/profil/${profile!.username}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.push('/')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight">Ayarlar</h1>

      <div className="mt-8 flex flex-col items-center gap-3">
        <label className="cursor-pointer">
          <UserAvatar
            url={avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar_url}
            name={fullName || profile.username}
            size={88}
          />
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
        </label>
        <span className="text-sm font-semibold text-primary">Fotoğrafı değiştir</span>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ad Soyad"
          className="rounded-lg border border-border bg-card px-4 py-3 text-text outline-none placeholder:text-muted focus:border-primary"
        />
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Kendinden bahset — ne çalıyorsun, nerede çaldın?"
          rows={4}
          className="rounded-lg border border-border bg-card px-4 py-3 text-text outline-none placeholder:text-muted focus:border-primary"
        />
      </div>

      <Section title="Şehir">
        {CITIES.map((option) => (
          <Chip key={option} tone={city === option ? 'primary' : 'default'} className="cursor-pointer">
            <button type="button" onClick={() => setCity(city === option ? null : option)}>
              {option}
            </button>
          </Chip>
        ))}
      </Section>

      <Section title="Enstrüman">
        {INSTRUMENTS.map((option) => (
          <Chip key={option} tone={instruments.includes(option) ? 'primary' : 'default'} className="cursor-pointer">
            <button type="button" onClick={() => toggle(instruments, setInstruments, option)}>
              {option}
            </button>
          </Chip>
        ))}
      </Section>

      <Section title="Tarz">
        {GENRES.map((option) => (
          <Chip key={option} tone={genres.includes(option) ? 'primary' : 'default'} className="cursor-pointer">
            <button type="button" onClick={() => toggle(genres, setGenres, option)}>
              {option}
            </button>
          </Chip>
        ))}
      </Section>

      <Section title="Seviye">
        {LEVELS.map((option) => (
          <Chip key={option} tone={experience === option ? 'primary' : 'default'} className="cursor-pointer">
            <button type="button" onClick={() => setExperience(option)}>
              {EXPERIENCE_LABELS[option]}
            </button>
          </Chip>
        ))}
      </Section>

      <label className="mt-6 flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <span className="text-sm font-semibold text-text">İşe açığım</span>
        <input type="checkbox" checked={openToGig} onChange={(e) => setOpenToGig(e.target.checked)} className="h-5 w-5" />
      </label>

      {error ? <p className="mt-4 text-sm text-accent">{error}</p> : null}

      <div className="mt-8 flex items-center justify-between">
        <button type="button" onClick={handleSignOut} className="text-sm font-semibold text-accent">
          Çıkış yap
        </button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}
