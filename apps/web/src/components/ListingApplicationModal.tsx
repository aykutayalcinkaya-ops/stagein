'use client';

import { useState } from 'react';

interface ListingApplicationModalProps {
  listingId: string;
  listingTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string, videoId?: string) => Promise<void>;
}

export function ListingApplicationModal({
  listingId,
  listingTitle,
  isOpen,
  onClose,
  onSubmit,
}: ListingApplicationModalProps) {
  const [message, setMessage] = useState('');
  const [videoId, setVideoId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(message, videoId || undefined);
      setMessage('');
      setVideoId('');
      onClose();
    } catch (error) {
      console.error('Başvuru gönderme hatası:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">İlana Başvur</h2>
          <p className="text-sm text-gray-600 mt-1">{listingTitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mesajınız
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Neden bu ilana başvurmak istediğinizi kısaca anlatın..."
              rows={4}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Portfolyo Videosu (İsteğe Bağlı)
            </label>
            <select
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Video Seçme --</option>
              <option value="video-1">Örnek Video 1</option>
              <option value="video-2">Örnek Video 2</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              {isSubmitting ? 'Gönderiliyor...' : 'Başvuru Gönder'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2 px-4 rounded-lg transition"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
