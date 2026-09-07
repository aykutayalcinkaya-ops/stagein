'use client'

import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { Camera, Video as VideoIcon, X } from 'lucide-react'
import { useCreatePost } from '@/hooks/useWall'
import { useAuthStore } from '@/stores/authStore'
import { UserAvatar } from './UserAvatar'
import { Button, Card } from './ui'

export function PostComposer() {
  const profile = useAuthStore((s) => s.profile)
  const { mutate, isPending } = useCreatePost()
  const [body, setBody] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)

  if (!profile) return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!body.trim() && photoFiles.length === 0 && !videoFile) return
    mutate(
      { userId: profile!.id, body: body.trim() || null, photoFiles, videoFile },
      { onSuccess: () => { setBody(''); setPhotoFiles([]); setVideoFile(null) } }
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <UserAvatar name={profile.full_name} username={profile.username} url={profile.avatar_url} size={40} />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Aklından ne geçiyor?"
            rows={2}
            className="min-h-[44px] flex-1 resize-none bg-transparent text-[15px] text-text outline-none placeholder:text-muted"
          />
        </div>

        {photoFiles.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {photoFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPhotoFiles((files) => files.filter((_, i) => i !== index))}
                  aria-label="Fotoğrafı kaldır"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white transition-colors duration-150 hover:bg-black/90"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.4} />
                </motion.button>
              </div>
            ))}
          </div>
        ) : null}

        {videoFile ? (
          <div className="relative mt-3 h-28 w-full overflow-hidden rounded-lg border border-border bg-black">
            <video src={URL.createObjectURL(videoFile)} className="h-full w-full object-contain" muted />
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => setVideoFile(null)}
              aria-label="Videoyu kaldır"
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white transition-colors duration-150 hover:bg-black/90"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.4} />
            </motion.button>
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-4">
            <label className="flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors duration-150 hover:text-white">
              <Camera className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              Fotoğraf
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => setPhotoFiles((files) => [...files, ...Array.from(e.target.files ?? [])])}
              />
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors duration-150 hover:text-white">
              <VideoIcon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              Video
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <Button type="submit" disabled={isPending || (!body.trim() && photoFiles.length === 0 && !videoFile)}>
            {isPending ? 'Paylaşılıyor…' : 'Paylaş'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
