'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MediaPlaceholder } from '@/components/MediaPlaceholder';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square overflow-hidden rounded-lg">
        <MediaPlaceholder label="Bu ilan için henüz görsel eklenmemiş" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ana Resim */}
      <div className="relative w-full bg-surface rounded-lg overflow-hidden aspect-square">
        <Image
          src={images[selectedIndex]}
          alt={`${title} - Resim ${selectedIndex + 1}`}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Thumbnail'ler */}
      {images.length > 1 && (
        <div className="grid grid-cols-6 gap-2">
          {images.map((image, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative aspect-square min-h-11 min-w-11 rounded-lg overflow-hidden border-2 transition ${
                selectedIndex === idx ? 'border-primary' : 'border-border hover:border-border-strong'
              }`}
            >
              <Image
                src={image}
                alt={`Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
