'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { Button, cn } from '@/components/ui';

interface OfferModalProps {
  itemId: string;
  currentPrice: number;
  itemTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, message?: string) => Promise<void>;
}

const inputClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-text outline-none transition-colors duration-150 placeholder:text-muted focus:border-primary';

export function OfferModal({
  itemId: _itemId,
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

  return (
    <Dialog.Root open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <AnimatePresence>
        {isOpen ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                className={cn(
                  'fixed left-1/2 top-1/2 z-[201] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card shadow-2xl'
                )}
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 4 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              >
                <Dialog.Close
                  aria-label="Kapat"
                  className="absolute right-4 top-4 flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-text"
                >
                  <X className="h-5 w-5" strokeWidth={1.8} />
                </Dialog.Close>

                <div className="border-b border-border p-6 pr-12">
                  <Dialog.Title className="text-xl font-bold text-text">Teklif Ver</Dialog.Title>
                  <Dialog.Description className="mt-1 line-clamp-2 text-sm text-text-secondary">
                    {itemTitle}
                  </Dialog.Description>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text-secondary">Listelenmiş Fiyat</label>
                    <div className="text-2xl font-bold text-text">₺{currentPrice.toLocaleString('tr-TR')}</div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-text-secondary">Teklifiniz (₺)</label>
                    <input
                      type="number"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(Number(e.target.value))}
                      min={1}
                      max={currentPrice}
                      className={cn(inputClass, 'text-lg font-semibold')}
                    />
                    {discount > 0 && (
                      <p className="mt-2 text-sm text-green-400">Liste fiyatından %{discount} indirim</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-text-secondary">Mesaj (İsteğe Bağlı)</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Satıcıya bir mesaj yazabilirsiniz..."
                      rows={3}
                      className={inputClass}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" variant="primary" disabled={isSubmitting || offerAmount <= 0} className="flex-1">
                      {isSubmitting ? 'Gönderiliyor...' : 'Teklif Gönder'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                      İptal
                    </Button>
                  </div>
                </form>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
