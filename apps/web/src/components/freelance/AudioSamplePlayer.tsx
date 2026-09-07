'use client';

import { useRef, useState } from 'react';
import { Play, Pause, Music2 } from 'lucide-react';

interface AudioSample {
  title: string;
  url: string;
  duration: number;
}

export function AudioSamplePlayer({ samples }: { samples: AudioSample[] }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const togglePlay = (id: string) => {
    if (playing === id) {
      audioRefs.current[id]?.pause();
      setPlaying(null);
    } else {
      if (playing && audioRefs.current[playing]) {
        audioRefs.current[playing].pause();
      }
      audioRefs.current[id]?.play();
      setPlaying(id);
    }
  };

  const seek = (id: string, ratio: number) => {
    const el = audioRefs.current[id];
    if (!el || !el.duration) return;
    el.currentTime = ratio * el.duration;
    setProgress((prev) => ({ ...prev, [id]: ratio * 100 }));
  };

  if (!samples || samples.length === 0) {
    return <div className="text-text-secondary">Ses örneği bulunmamaktadır.</div>;
  }

  return (
    <div className="space-y-3">
      {samples.map((sample, idx) => {
        const id = `sample-${idx}`;
        const isPlaying = playing === id;
        const pct = progress[id] ?? 0;
        return (
          <div
            key={id}
            className="rounded-xl border border-border bg-surface p-4 transition-colors duration-180 hover:border-border-strong"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => togglePlay(id)}
                aria-label={isPlaying ? 'Duraklat' : 'Oynat'}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-all duration-180 hover:bg-primary-dim hover:shadow-[0_8px_20px_-8px_var(--color-primary)]"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" strokeWidth={1.8} fill="currentColor" />
                ) : (
                  <Play className="h-5 w-5 translate-x-0.5" strokeWidth={1.8} fill="currentColor" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <h4 className="flex items-center gap-1.5 truncate font-medium text-text">
                  <Music2 className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={1.8} aria-hidden="true" />
                  {sample.title}
                </h4>
                <button
                  type="button"
                  aria-label="Konuma atla"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    seek(id, Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
                  }}
                  className="group mt-2 block h-1.5 w-full cursor-pointer rounded-full bg-white/[0.08]"
                >
                  <span
                    className="block h-full rounded-full bg-primary transition-[width] duration-150 group-hover:bg-accent"
                    style={{ width: `${pct}%` }}
                  />
                </button>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-muted">{formatDuration(sample.duration)}</span>
            </div>
            <audio
              ref={(el) => {
                if (el) audioRefs.current[id] = el;
              }}
              src={sample.url}
              onTimeUpdate={(e) => {
                const el = e.currentTarget;
                if (el.duration) setProgress((prev) => ({ ...prev, [id]: (el.currentTime / el.duration) * 100 }));
              }}
              onEnded={() => {
                setPlaying(null);
                setProgress((prev) => ({ ...prev, [id]: 0 }));
              }}
              className="hidden"
            />
          </div>
        );
      })}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
