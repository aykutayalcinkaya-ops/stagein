'use client'

import { useState, type FormEvent } from 'react'
import { useCreatePost } from '@/hooks/useWall'
import { useAuthStore } from '@/stores/authStore'
import { UserAvatar } from './UserAvatar'
import { Button } from './ui'

export function PostComposer() {
  const profile = useAuthStore((s) => s.profile)
  const { mutate, isPending } = useCreatePost()
  const [body, setBody] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])

  if (!profile) return null

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!body.trim() && photoFiles.length === 0) return
    mutate(
      { userId: profile!.id, body: body.trim() || null, photoFiles },
      { onSuccess: () => { setBody(''); setPhotoFiles([]) } }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5">
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
              <button
                type="button"
                onClick={() => setPhotoFiles((files) => files.filter((_, i) => i !== index))}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <label className="cursor-pointer text-sm font-medium text-text-secondary hover:text-white">
          📷 Fotoğraf
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => setPhotoFiles((files) => [...files, ...Array.from(e.target.files ?? [])])}
          />
        </label>
        <Button type="submit" disabled={isPending || (!body.trim() && photoFiles.length === 0)}>
          {isPending ? 'Paylaşılıyor…' : 'Paylaş'}
        </Button>
      </div>
    </form>
  )
}
