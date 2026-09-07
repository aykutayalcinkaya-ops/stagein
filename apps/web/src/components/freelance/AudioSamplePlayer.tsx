'use client';

import { useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioSample {
  title: string;
  url: string;
  duration: number;
}

export function AudioSamplePlayer({ samples }: { samples: AudioSample[] }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const togglePlay = (id: string, url: string) => {
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

  if (!samples || samples.length === 0) {
    return <div className="text-text-secondary">Ses örneği bulunmamaktadır.</div>;
  }

  return (
    <div className="space-y-4">
      {samples.map((sample, idx) => (
        <div key={idx} className="rounded-lg bg-surface p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => togglePlay(`sample-${idx}`, sample.url)}
              aria-label={playing === `sample-${idx}` ? 'Duraklat' : 'Oynat'}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-dim"
            >
              {playing === `sample-${idx}` ? (
                <Pause className="h-5 w-5" strokeWidth={1.8} fill="currentColor" />
              ) : (
                <Play className="h-5 w-5" strokeWidth={1.8} fill="currentColor" />
              )}
            </button>
            <div className="flex-1">
              <h4 className="font-medium text-text">{sample.title}</h4>
              <p className="text-sm text-muted">{formatDuration(sample.duration)}</p>
            </div>
          </div>
          <audio
            ref={(el) => {
              if (el) audioRefs.current[`sample-${idx}`] = el;
            }}
            src={sample.url}
            onEnded={() => setPlaying(null)}
            className="hidden"
          />
        </div>
      ))}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
