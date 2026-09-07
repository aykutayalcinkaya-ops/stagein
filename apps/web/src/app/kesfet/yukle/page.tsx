'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Film } from 'lucide-react'
import { CITIES, GENRES, INSTRUMENTS, MAX_VIDEO_DURATION_SECONDS, MAX_VIDEO_SIZE_MB } from '@stagein/shared'
import { useCreateYoutubeVideo, useUploadVideo } from '@/hooks/useVideoFeed'
import { useAuthStore } from '@/stores/authStore'
import { isValidYoutubeUrl, extractYoutubeVideoId, getYoutubeThumbnail } from '@/lib/youtube'
import { Button, Card } from '@/components/ui'
import { FilterDropdown } from '@/components/FilterDropdown'
import { BackButton } from '@/components/BackButton'

type Tab = 'dosya' | 'youtube'

const sectionLabelClass = 'mb-3 block text-sm font-bold text-text'

/**
 * `videos.video_source`/`youtube_url` sütunlarını ekleyen migration 024 henüz
 * prod veritabanına push edilmedi (DB şifresi ortamda yok — ayrı olarak
 * kullanıcıya bildirildi). Bu yüzden YouTube ekleme isteği prod'da
 * "column videos.video_source does not exist" (Postgres 42703) veya
 * `storage_path` NOT NULL ihlali (23502) ile başarısız oluyor. Kullanıcıya
 * "linkin geçersiz" izlenimi veren genel bir hata yerine, bunun geçici bir
 * bakım durumu olduğunu söyleyen dürüst bir mesaj gösteriyoruz. Dosya yükleme
 * yolu bu sütunlara bağlı değil (var olan `storage_path`/`video_source`
 * alanları zaten dolduruluyor) — o yüzden onun hata mesajına dokunmuyoruz.
 */
function isSchemaMissingError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const code = 'code' in err ? String((err as { code?: unknown }).code) : ''
  const message = 'message' in err ? String((err as { message?: unknown }).message) : ''
  return code === '42703' || code === '23502' || /video_source|storage_path/i.test(message)
}

export default function VideoYuklePage() {
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    if (!isLoading && userId === null) router.replace('/giris')
  }, [isLoading, userId, router])

  const [tab, setTab] = useState<Tab>('dosya')

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const previewRef = useRef<HTMLVideoElement>(null)

  const [youtubeUrl, setYoutubeUrl] = useState('')
  const youtubeId = isValidYoutubeUrl(youtubeUrl) ? extractYoutubeVideoId(youtubeUrl) : null

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState<string | null>(null)
  const [instruments, setInstruments] = useState<string[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { mutateAsync: uploadVideo, isPending: isUploading } = useUploadVideo()
  const { mutateAsync: uploadYoutubeVideo, isPending: isSubmittingYoutube } = useCreateYoutubeVideo()
  const isSubmitting = isUploading || isSubmittingYoutube

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFileError(null)
    setFile(null)
    if (!selected) return

    if (selected.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      setFileError(`Video en fazla ${MAX_VIDEO_SIZE_MB}MB olabilir.`)
      return
    }

    const probe = document.createElement('video')
    probe.preload = 'metadata'
    probe.onloadedmetadata = () => {
      URL.revokeObjectURL(probe.src)
      if (probe.duration > MAX_VIDEO_DURATION_SECONDS) {
        setFileError(`Video en fazla ${MAX_VIDEO_DURATION_SECONDS} saniye olabilir.`)
        return
      }
      if (probe.videoWidth > 0 && probe.videoHeight > 0 && probe.videoWidth > probe.videoHeight) {
        setFileError('Video dikey (portre) formatta olmalı.')
        return
      }
      setFile(selected)
    }
    probe.src = URL.createObjectURL(selected)
  }

  if (!userId) return null

  const metadata = {
    title: title.trim() || null,
    description: description.trim() || null,
    city,
    instruments,
    genres,
  }

  async function handleSubmit() {
    setSubmitError(null)

    if (tab === 'dosya') {
      if (!file) {
        setSubmitError('Lütfen dikey bir video dosyası seç.')
        return
      }
      try {
        const result = await uploadVideo({ userId: userId!, file, metadata })
        router.push(`/kesfet?v=${result.id}`)
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Video yüklenemedi')
      }
      return
    }

    if (!youtubeId) {
      setSubmitError('Geçerli bir YouTube linki gir.')
      return
    }
    try {
      const result = await uploadYoutubeVideo({ userId: userId!, youtubeUrl, ...metadata })
      router.push(`/kesfet?v=${result.id}`)
    } catch (err) {
      setSubmitError(
        isSchemaMissingError(err)
          ? 'YouTube ile video ekleme şu anda bakımda — yakında tekrar aktif olacak. Bu arada dosya yükleyerek paylaşabilirsin.'
          : err instanceof Error
            ? err.message
            : 'Video yüklenemedi'
      )
    }
  }

  const canSubmit = tab === 'dosya' ? !!file && !fileError : !!youtubeId

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-4">
        <BackButton />
      </div>

      <h1 className="font-display text-3xl uppercase tracking-tight">Video Ekle</h1>
      <p className="mt-2 text-sm text-muted">Dikey performans videonu Keşfet akışına ekle.</p>

      <div className="mt-6 flex gap-1 rounded-full border border-border bg-card p-1">
        {(['dosya', 'youtube'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
              tab === t ? 'bg-primary text-white' : 'text-text-secondary hover:text-white'
            }`}
          >
            {t === 'dosya' ? 'Dosya Yükle' : 'YouTube Linki Ekle'}
          </button>
        ))}
      </div>

      {tab === 'dosya' ? (
        <div className="mt-6">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-strong bg-card px-6 py-10 text-center transition-colors duration-150 hover:border-primary">
            <Film className="h-8 w-8 text-muted" strokeWidth={1.6} />
            <span className="mt-3 text-sm font-semibold text-text">
              {file ? file.name : 'Dikey MP4/WebM seç (maks. 60sn, 100MB)'}
            </span>
            <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
          </label>

          {fileError ? <p className="mt-3 text-sm text-accent">{fileError}</p> : null}

          {file && !fileError ? (
            <div className="relative mx-auto mt-4 aspect-[9/16] w-48 overflow-hidden rounded-xl border border-border bg-black">
              <video ref={previewRef} src={URL.createObjectURL(file)} className="h-full w-full object-contain" controls muted />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-6">
          <input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/shorts/… veya https://youtu.be/…"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-text outline-none placeholder:text-muted focus:border-primary"
          />
          {youtubeUrl && !youtubeId ? <p className="mt-2 text-sm text-accent">Geçerli bir YouTube linki değil.</p> : null}

          {youtubeId ? (
            <div className="relative mx-auto mt-4 aspect-[9/16] w-48 overflow-hidden rounded-xl border border-border bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getYoutubeThumbnail(youtubeId)} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Başlık"
          className="rounded-lg border border-border bg-card px-4 py-3 text-text outline-none placeholder:text-muted focus:border-primary"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Açıklama"
          rows={3}
          className="rounded-lg border border-border bg-card px-4 py-3 text-text outline-none placeholder:text-muted focus:border-primary"
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className={sectionLabelClass}>Şehir</p>
          <FilterDropdown
            label="Şehir seç"
            options={[...CITIES]}
            selected={city ? [city] : []}
            onChange={(next) => setCity(next[0] ?? null)}
            multiple={false}
            className="w-full justify-between"
          />
        </Card>

        <Card className="p-4">
          <p className={sectionLabelClass}>Enstrüman</p>
          <FilterDropdown
            label="Enstrüman seç"
            options={[...INSTRUMENTS]}
            selected={instruments}
            onChange={setInstruments}
            multiple
            className="w-full justify-between"
          />
        </Card>

        <Card className="p-4">
          <p className={sectionLabelClass}>Tarz</p>
          <FilterDropdown
            label="Tarz seç"
            options={[...GENRES]}
            selected={genres}
            onChange={setGenres}
            multiple
            className="w-full justify-between"
          />
        </Card>
      </div>

      {submitError ? <p className="mt-4 text-sm text-accent">{submitError}</p> : null}

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? 'Yükleniyor…' : 'Paylaş'}
        </Button>
      </div>
    </div>
  )
}
