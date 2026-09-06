'use client';

import { useState } from 'react';

interface OfferModalProps {
  itemId: string;
  currentPrice: number;
  itemTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, message?: string) => Promise<void>;
}

export function OfferModal({
  itemId,
  currentPrice,
  itemTitle,
  isOpen,
  onClose,
  onSubmit,
}: OfferModalProps) {
  const [offerAmount, setOfferAmount] = useState(Math.floor(currentPrice * 0.8));
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const discount = Math.round(((currentPrice - offerAmount) / currentPrice) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (offerAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(offerAmount, message || undefined);
      setOfferAmount(Math.floor(currentPrice * 0.8));
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Teklif gönderme hatası:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Teklif Ver</h2>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{itemTitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Listelenmiş Fiyat
            </label>
            <div className="text-2xl font-bold text-gray-900">
              ₺{currentPrice.toLocaleString('tr-TR')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teklifiniz (₺)
            </label>
            <input
              type="number"
              value={offerAmount}
              onChange={(e) => setOfferAmount(Number(e.target.value))}
              min={1}
              max={currentPrice}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
            />
            {discount > 0 && (
              <p className="text-sm text-green-600 mt-2">
                Liste fiyatından %{discount} indirim
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mesaj (İsteğe Bağlı)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Satıcıya bir mesaj yazabilirsiniz..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || offerAmount <= 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              {isSubmitting ? 'Gönderiliyor...' : 'Teklif Gönder'}
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
