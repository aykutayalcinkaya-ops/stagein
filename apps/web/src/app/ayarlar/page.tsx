'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, Camera, Check, ChevronDown, ChevronUp, LogOut, Plus, Trash2, X } from 'lucide-react'
import { CITIES, GENRES, INSTRUMENTS } from '@stagein/shared'
import type { ExperienceLevel } from '@stagein/shared'
import { createClient } from '@/lib/supabase/client'
import { deleteOwnAccount, replaceProfileLinks, uploadAvatar, upsertMusicianProfile, upsertUser } from '@/lib/api'
import { EXPERIENCE_LABELS } from '@/lib/site'
import { Button, Card, Chip, EmptyState, cn } from '@/components/ui'
import { UserAvatar } from '@/components/UserAvatar'
import { useAuthStore } from '@/stores/authStore'

const LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'professional']

type PickerKey = 'city' | 'instruments' | 'genres' | 'experience'

interface PickerOption {
  value: string
  label: string
}

export default function AyarlarPage() {
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const isLoading = useAuthStore((s) => s.isLoading)
  const profile = useAuthStore((s) => s.profile)
  const musicianProfile = useAuthStore((s) => s.musicianProfile)
  const setProfileData = useAuthStore((s) => s.setProfileData)
  const profileLinks = useAuthStore((s) => s.profileLinks)

  useEffect(() => {
    if (!isLoading && userId === null) router.replace('/giris')
  }, [isLoading, userId, router])

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

  const [links, setLinks] = useState(profileLinks.map((l) => ({ label: l.label, url: l.url })))
  const [newLabel, setNewLabel] = useState('')
  const [newUrl, setNewUrl] = useState('')

  const [activePicker, setActivePicker] = useState<PickerKey | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Profile data loads asynchronously (AuthSync's fetchProfileBundle), so the useState
  // initializers above run before it arrives on first mount. Sync the form once it's in.
  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? '')
    setBio(profile.bio ?? '')
    setCity(profile.city ?? null)
    setInstruments(musicianProfile?.instruments ?? [])
    setGenres(musicianProfile?.genres ?? [])
    setExperience(musicianProfile?.experience_level ?? 'beginner')
    setOpenToGig(musicianProfile?.is_open_to_gig ?? true)
    setLinks(profileLinks.map((l) => ({ label: l.label, url: l.url })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  function addLink() {
    if (!newLabel.trim() || !newUrl.trim()) return
    setLinks((current) => [...current, { label: newLabel.trim(), url: newUrl.trim() }])
    setNewLabel('')
    setNewUrl('')
  }

  function removeLink(index: number) {
    setLinks((current) => current.filter((_, i) => i !== index))
  }

  function moveLink(index: number, direction: -1 | 1) {
    setLinks((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  // ---------------------------------------------------------------------
  // Şehir / Enstrüman / Tarz / Seviye — çoklu seçim modalı
  // ---------------------------------------------------------------------

  const pickerConfig: Record<
    PickerKey,
    { title: string; options: PickerOption[]; selected: string[]; multiple: boolean; required: boolean }
  > = {
    city: {
      title: 'Şehir',
      options: CITIES.map((c) => ({ value: c, label: c })),
      selected: city ? [city] : [],
      multiple: false,
      required: false,
    },
    instruments: {
      title: 'Enstrüman',
      options: INSTRUMENTS.map((i) => ({ value: i, label: i })),
      selected: instruments,
      multiple: true,
      required: false,
    },
    genres: {
      title: 'Tarz',
      options: GENRES.map((g) => ({ value: g, label: g })),
      selected: genres,
      multiple: true,
      required: false,
    },
    experience: {
      title: 'Seviye',
      options: LEVELS.map((l) => ({ value: l, label: EXPERIENCE_LABELS[l] })),
      selected: [experience],
      multiple: false,
      required: true,
    },
  }

  function applyPicker(key: PickerKey, next: string[]) {
    if (key === 'city') setCity(next[0] ?? null)
    else if (key === 'instruments') setInstruments(next)
    else if (key === 'genres') setGenres(next)
    else if (key === 'experience') setExperience((next[0] as ExperienceLevel | undefined) ?? experience)
  }

  function removeFromField(key: Exclude<PickerKey, 'experience'>, value: string) {
    if (key === 'city') setCity((cur) => (cur === value ? null : cur))
    else if (key === 'instruments') setInstruments((cur) => cur.filter((v) => v !== value))
    else if (key === 'genres') setGenres((cur) => cur.filter((v) => v !== value))
  }

  if (userId && !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          title="Profilin yüklenemedi"
          description="Bir şeyler ters gitti. Sayfayı yenilemeyi dene; sorun devam ederse destek ile iletişime geç."
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
      await replaceProfileLinks(profile!.id, links)
      setProfileData({
        profile: { ...profile!, full_name: fullName.trim() || null, bio: bio.trim() || null, city, avatar_url: avatarUrl },
        musicianProfile: { user_id: profile!.id, instruments, genres, experience_level: experience, is_open_to_gig: openToGig },
        profileLinks: links.map((link, index) => ({
          id: `${profile!.id}-${index}`,
          user_id: profile!.id,
          label: link.label,
          url: link.url,
          position: index,
        })),
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

  function handleDeleteDialogChange(next: boolean) {
    setDeleteDialogOpen(next)
    if (!next) {
      setDeleteConfirmText('')
      setDeleteError(null)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText.trim() !== 'SİL') return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteOwnAccount()
      router.push('/')
    } catch {
      setDeleteError('Hesap silme işlemi şu anda kullanılamıyor, lütfen destek ile iletişime geçin.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">Ayarlar</h1>
      <p className="mt-2 text-sm text-text-secondary">Profilini ve hesap tercihlerini buradan yönet.</p>

      <div className="mt-8 flex flex-col items-center gap-3">
        <label className="group relative cursor-pointer">
          <UserAvatar
            url={avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar_url}
            name={fullName || profile.username}
            size={88}
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity duration-180 group-hover:opacity-100">
            <Camera className="h-6 w-6 text-white" strokeWidth={1.8} aria-hidden="true" />
          </span>
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

      <PickerField
        title="Şehir"
        values={city ? [{ value: city, label: city }] : []}
        onRemove={(value) => removeFromField('city', value)}
        onOpen={() => setActivePicker('city')}
        placeholder="Şehir seç"
      />

      <PickerField
        title="Enstrüman"
        values={instruments.map((i) => ({ value: i, label: i }))}
        onRemove={(value) => removeFromField('instruments', value)}
        onOpen={() => setActivePicker('instruments')}
        placeholder="Enstrüman ekle"
      />

      <PickerField
        title="Tarz"
        values={genres.map((g) => ({ value: g, label: g }))}
        onRemove={(value) => removeFromField('genres', value)}
        onOpen={() => setActivePicker('genres')}
        placeholder="Tarz ekle"
      />

      <PickerField
        title="Seviye"
        values={[{ value: experience, label: EXPERIENCE_LABELS[experience] }]}
        onRemove={() => {}}
        onOpen={() => setActivePicker('experience')}
        placeholder="Seviye seç"
        removable={false}
      />

      {activePicker ? (
        <FieldPickerModal
          open
          onOpenChange={(next) => {
            if (!next) setActivePicker(null)
          }}
          title={pickerConfig[activePicker].title}
          options={pickerConfig[activePicker].options}
          selected={pickerConfig[activePicker].selected}
          multiple={pickerConfig[activePicker].multiple}
          required={pickerConfig[activePicker].required}
          onApply={(next) => applyPicker(activePicker, next)}
        />
      ) : null}

      <div className="mt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Linkler</p>
        <div className="flex flex-col gap-2">
          {links.map((link, index) => (
            <div
              key={`${link.url}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 transition-colors duration-150 hover:border-border-strong"
            >
              <span className="flex-1 truncate text-sm">
                <span className="font-semibold text-text">{link.label}</span>{' '}
                <span className="text-muted">{link.url}</span>
              </span>
              <button
                type="button"
                onClick={() => moveLink(index, -1)}
                disabled={index === 0}
                aria-label="Yukarı taşı"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-white/[0.06] hover:text-text disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronUp className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => moveLink(index, 1)}
                disabled={index === links.length - 1}
                aria-label="Aşağı taşı"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-white/[0.06] hover:text-text disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronDown className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => removeLink(index)}
                aria-label="Linki sil"
                className="flex h-8 w-8 items-center justify-center rounded-full text-accent transition-colors duration-150 hover:bg-accent/10"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Etiket (örn. Instagram)"
            className="w-1/3 rounded-lg border border-border bg-card px-3 py-2 text-sm text-text outline-none transition-colors duration-150 placeholder:text-muted focus:border-primary"
          />
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://…"
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-text outline-none transition-colors duration-150 placeholder:text-muted focus:border-primary"
          />
          <button
            type="button"
            onClick={addLink}
            className="flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg px-3 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-primary/10"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
            Ekle
          </button>
        </div>
      </div>

      <label className="mt-6 flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors duration-150 hover:border-border-strong">
        <span className="text-sm font-semibold text-text">İşe açığım</span>
        <input type="checkbox" checked={openToGig} onChange={(e) => setOpenToGig(e.target.checked)} className="h-5 w-5 accent-primary" />
      </label>

      {error ? <p className="mt-4 text-sm text-accent">{error}</p> : null}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-accent transition-colors duration-150 hover:bg-accent/10"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Çıkış yap
        </button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
      </div>

      <Card className="mt-12 border-red-500/20 bg-red-500/5 hover:border-red-500/30">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <AlertTriangle className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-text">Tehlikeli Bölge</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Hesabını sildiğinde tüm gönderilerin, videoların, mesajların ve ilanların kalıcı olarak silinir. Bu
              işlem geri alınamaz.
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          className="mt-4 px-5 py-2.5 text-sm"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Hesabımı Sil
        </Button>
      </Card>

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        confirmText={deleteConfirmText}
        onConfirmTextChange={setDeleteConfirmText}
        loading={deleting}
        error={deleteError}
        onConfirm={handleDeleteAccount}
      />
    </div>
  )
}

function PickerField({
  title,
  values,
  onRemove,
  onOpen,
  placeholder,
  removable = true,
}: {
  title: string
  values: PickerOption[]
  onRemove: (value: string) => void
  onOpen: () => void
  placeholder: string
  removable?: boolean
}) {
  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={onOpen}
          className="text-sm font-semibold text-primary"
        >
          Düzenle
        </motion.button>
      </div>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((option) => (
            <Chip key={option.value} tone="primary" className="inline-flex items-center gap-1.5">
              {option.label}
              {removable ? (
                <button
                  type="button"
                  onClick={() => onRemove(option.value)}
                  aria-label={`${option.label} kaldır`}
                  className="rounded-full text-[#C6B7FF] hover:text-white"
                >
                  <X className="h-3 w-3" strokeWidth={2.4} />
                </button>
              ) : null}
            </Chip>
          ))}
        </div>
      ) : (
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onOpen}
          className="min-h-11 rounded-lg border border-dashed border-border-strong px-4 py-2.5 text-sm text-muted transition-colors hover:border-primary/60 hover:text-text"
        >
          {placeholder}
        </motion.button>
      )}
    </div>
  )
}

function FieldPickerModal({
  open,
  onOpenChange,
  title,
  options,
  selected,
  multiple,
  required,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  options: PickerOption[]
  selected: string[]
  multiple: boolean
  required: boolean
  onApply: (next: string[]) => void
}) {
  const [draft, setDraft] = useState<string[]>(selected)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) {
      setDraft(selected)
      setQuery('')
    }
    // Modal her açıldığında dışarıdaki mevcut seçime göre taslağı sıfırla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const filtered = options.filter((option) =>
    option.label.toLocaleLowerCase('tr-TR').includes(query.toLocaleLowerCase('tr-TR'))
  )

  function toggleOption(value: string) {
    if (multiple) {
      setDraft((cur) => (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]))
    } else {
      setDraft((cur) => {
        if (cur.includes(value)) return required ? cur : []
        return [value]
      })
    }
  }

  function removeChip(value: string) {
    if (required && draft.length <= 1) return
    setDraft((cur) => cur.filter((v) => v !== value))
  }

  function handleApply() {
    onApply(draft)
    onOpenChange(false)
  }

  function labelOf(value: string) {
    return options.find((o) => o.value === value)?.label ?? value
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                className="fixed left-1/2 top-1/2 z-[201] flex max-h-[80vh] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl"
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 4 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              >
                <Dialog.Close
                  aria-label="Kapat"
                  className="absolute right-4 top-4 flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-text"
                >
                  <X className="h-5 w-5" strokeWidth={1.8} />
                </Dialog.Close>

                <Dialog.Title className="pr-8 text-lg font-semibold text-text">{title}</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-text-secondary">
                  {multiple ? 'Birden fazla seçim yapabilirsin.' : 'Bir seçim yapabilirsin.'}
                </Dialog.Description>

                {draft.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {draft.map((value) => (
                      <span
                        key={value}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-[#C6B7FF] ring-1 ring-inset ring-primary/25"
                      >
                        {labelOf(value)}
                        <button
                          type="button"
                          onClick={() => removeChip(value)}
                          aria-label={`${labelOf(value)} kaldır`}
                          className="rounded-full hover:text-white disabled:opacity-40"
                          disabled={required && draft.length <= 1}
                        >
                          <X className="h-3 w-3" strokeWidth={2.4} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted">Henüz seçim yapılmadı.</p>
                )}

                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ara…"
                  className="mt-4 rounded-lg border border-border bg-white/[0.04] px-3 py-2 text-sm text-text outline-none placeholder:text-muted focus:border-primary"
                />

                <div className="mt-3 flex-1 overflow-y-auto rounded-lg border border-border">
                  {filtered.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted">Sonuç bulunamadı.</p>
                  ) : (
                    filtered.map((option) => {
                      const isSelected = draft.includes(option.value)
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleOption(option.value)}
                          className={cn(
                            'flex min-h-11 w-full items-center justify-between gap-3 border-b border-border px-4 py-2.5 text-left text-sm text-text transition-colors last:border-b-0 hover:bg-white/[0.05]',
                            isSelected && 'bg-primary/10'
                          )}
                        >
                          <span>{option.label}</span>
                          <span
                            className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center border border-border-strong',
                              multiple ? 'rounded' : 'rounded-full',
                              isSelected && 'border-primary bg-primary text-white'
                            )}
                          >
                            {isSelected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <Dialog.Close asChild>
                    <Button variant="secondary" className="px-5 py-2.5 text-sm">
                      Vazgeç
                    </Button>
                  </Dialog.Close>
                  <Button type="button" variant="primary" className="px-5 py-2.5 text-sm" onClick={handleApply}>
                    Uygula
                  </Button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  )
}

function DeleteAccountDialog({
  open,
  onOpenChange,
  confirmText,
  onConfirmTextChange,
  loading,
  error,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  confirmText: string
  onConfirmTextChange: (value: string) => void
  loading: boolean
  error: string | null
  onConfirm: () => void
}) {
  const canConfirm = confirmText.trim() === 'SİL' && !loading

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                className="fixed left-1/2 top-1/2 z-[201] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl"
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 4 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              >
                <Dialog.Close
                  aria-label="Kapat"
                  className="absolute right-4 top-4 flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-text"
                >
                  <X className="h-5 w-5" strokeWidth={1.8} />
                </Dialog.Close>

                <div className="flex items-start gap-3 pr-8">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                    <AlertTriangle className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-text">
                      Hesabını kalıcı olarak sil
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm leading-relaxed text-text-secondary">
                      Bu işlem geri alınamaz. Hesabını sildiğinde tüm gönderilerin, videoların, mesajların ve
                      ilanların kalıcı olarak silinir; hesabına ve verilerine bir daha erişemezsin.
                    </Dialog.Description>
                  </div>
                </div>

                <label className="mt-5 block text-sm text-text-secondary">
                  Onaylamak için aşağıya <span className="font-semibold text-text">SİL</span> yaz
                  <input
                    value={confirmText}
                    onChange={(e) => onConfirmTextChange(e.target.value)}
                    placeholder="SİL"
                    className="mt-2 w-full rounded-lg border border-border bg-white/[0.04] px-4 py-2.5 text-text outline-none placeholder:text-muted focus:border-red-500"
                  />
                </label>

                {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

                <div className="mt-6 flex justify-end gap-3">
                  <Dialog.Close asChild>
                    <Button variant="secondary" className="px-5 py-2.5 text-sm">
                      Vazgeç
                    </Button>
                  </Dialog.Close>
                  <Button
                    type="button"
                    variant="destructive"
                    className="px-5 py-2.5 text-sm"
                    disabled={!canConfirm}
                    onClick={onConfirm}
                  >
                    {loading ? 'Siliniyor…' : 'Hesabımı kalıcı olarak sil'}
                  </Button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  )
}
