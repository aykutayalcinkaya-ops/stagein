'use client';

import { useState, useRef } from 'react';

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
    return <div className="text-gray-500">Ses örneği bulunmamaktadır.</div>;
  }

  return (
    <div className="space-y-4">
      {samples.map((sample, idx) => (
        <div key={idx} className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => togglePlay(`sample-${idx}`, sample.url)}
              className="flex-shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center"
            >
              {playing === `sample-${idx}` ? '⏸' : '▶'}
            </button>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{sample.title}</h4>
              <p className="text-sm text-gray-500">{formatDuration(sample.duration)}</p>
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
