'use client'

import { useState, type KeyboardEvent } from 'react'
import { Mic, Send } from 'lucide-react'
import { VoiceRecorder } from './VoiceRecorder'

interface MessageComposerProps {
  onSend: (content: string) => void
  onSendVoice: (blob: Blob) => void
  isSending: boolean
  onTyping?: () => void
}

export function MessageComposer({ onSend, onSendVoice, isSending, onTyping }: MessageComposerProps) {
  const [value, setValue] = useState('')
  const [isRecording, setIsRecording] = useState(false)

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || isSending) return
    onSend(trimmed)
    setValue('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  if (isRecording) {
    return (
      <VoiceRecorder
        isSending={isSending}
        onCancel={() => setIsRecording(false)}
        onSend={(blob) => {
          onSendVoice(blob)
          setIsRecording(false)
        }}
      />
    )
  }

  return (
    <div className="flex items-end gap-2 border-t border-border p-3 sm:p-4">
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          onTyping?.()
        }}
        onKeyDown={handleKeyDown}
        placeholder="Mesaj yaz…"
        rows={1}
        className="max-h-32 flex-1 resize-none rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text outline-none transition-colors duration-150 placeholder:text-muted focus:border-primary"
      />
      {value.trim() ? (
        <button
          type="button"
          onClick={submit}
          disabled={isSending}
          aria-label="Gönder"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors duration-150 hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-5 w-5" strokeWidth={1.8} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsRecording(true)}
          aria-label="Sesli mesaj kaydet"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card text-text-secondary transition-colors duration-150 hover:bg-white/[0.06] hover:text-text"
        >
          <Mic className="h-5 w-5" strokeWidth={1.8} />
        </button>
      )}
    </div>
  )
}
