'use client'

import { useEffect, useRef, useState } from 'react'
import { Square, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'

interface VoiceRecorderProps {
  onCancel: () => void
  onSend: (blob: Blob) => void
  isSending: boolean
}

/**
 * Kayıt öncesi tarayıcıya mikrofon izni istemek yerine, kullanıcı gerçekten
 * "kaydet" butonuna basana kadar `getUserMedia` hiç çağrılmaz — UI/UX Pro Max
 * kuralı: izin gerekçesi olmadan / eylem tetiklenmeden izin istenmemeli.
 */
export function VoiceRecorder({ onCancel, onSend, isSending }: VoiceRecorderProps) {
  const [seconds, setSeconds] = useState(0)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function startRecording() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        setBlob(new Blob(chunksRef.current, { type: 'audio/webm' }))
        stream.getTracks().forEach((t) => t.stop())
      }
      recorder.start()
      recorderRef.current = recorder
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch {
      setError('Mikrofon erişimi reddedildi veya kullanılamıyor.')
    }
  }

  function stopRecording() {
    recorderRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
  }

  function discard() {
    setBlob(null)
    setSeconds(0)
    onCancel()
  }

  useEffect(() => {
    startRecording()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  const isRecording = !blob && !error

  if (error) {
    return (
      <div className="flex items-center gap-3 border-t border-border p-3 text-sm text-accent sm:p-4">
        {error}
        <Button type="button" variant="secondary" className="ml-auto px-3 py-1.5 text-xs" onClick={onCancel}>
          Kapat
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 border-t border-border p-3 sm:p-4">
      <button
        type="button"
        onClick={discard}
        aria-label="Vazgeç"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-text"
      >
        <Trash2 className="h-5 w-5" strokeWidth={1.8} />
      </button>

      <div className="flex flex-1 items-center gap-2">
        {isRecording ? (
          <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-accent" />
        ) : (
          <audio src={blob ? URL.createObjectURL(blob) : undefined} controls className="h-9 flex-1" />
        )}
        <span className="text-sm tabular-nums text-muted">{mm}:{ss}</span>
      </div>

      {isRecording ? (
        <button
          type="button"
          onClick={stopRecording}
          aria-label="Kaydı durdur"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-dark transition-transform duration-150 active:scale-90"
        >
          <Square className="h-4 w-4" fill="currentColor" />
        </button>
      ) : (
        <Button type="button" variant="primary" disabled={isSending} onClick={() => blob && onSend(blob)}>
          {isSending ? 'Gönderiliyor…' : 'Gönder'}
        </Button>
      )}
    </div>
  )
}
