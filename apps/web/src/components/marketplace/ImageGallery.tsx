'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-200 rounded-lg w-full aspect-square flex items-center justify-center">
        <span className="text-gray-500">Resim bulunmamaktadır</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ana Resim */}
      <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden aspect-square">
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
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                selectedIndex === idx ? 'border-blue-600' : 'border-gray-200 hover:border-gray-300'
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
