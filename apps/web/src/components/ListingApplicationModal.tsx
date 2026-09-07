'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui';

interface ListingApplicationModalProps {
  listingId: string;
  listingTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string, videoId?: string) => Promise<void>;
  /** Kullanıcının portfolyo videoları — verilmezse video seçimi gösterilmez. */
  videos?: { id: string; title: string }[];
}

export function ListingApplicationModal({
  listingId: _listingId,
  listingTitle,
  isOpen,
  onClose,
  onSubmit,
  videos = [],
}: ListingApplicationModalProps) {
  const [message, setMessage] = useState('');
  const [videoId, setVideoId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(message, videoId || undefined);
      setMessage('');
      setVideoId('');
      onClose();
    } catch (error) {
      console.error('Başvuru gönderme hatası:', error);
      setSubmitError('Başvurun gönderilemedi. İnternet bağlantını kontrol edip tekrar dene.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
                className="fixed left-1/2 top-1/2 z-[201] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl"
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

                <Dialog.Title className="pr-8 text-xl font-bold text-text">İlana Başvur</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-text-secondary">{listingTitle}</Dialog.Description>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text-secondary">
                      Mesajınız
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Neden bu ilana başvurmak istediğinizi kısaca anlatın..."
                      rows={4}
                      required
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text transition-colors duration-150 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {videos.length > 0 ? (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-secondary">
                        Portfolyo Videosu (İsteğe Bağlı)
                      </label>
                      <select
                        value={videoId}
                        onChange={(e) => setVideoId(e.target.value)}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Video seçme</option>
                        {videos.map((video) => (
                          <option key={video.id} value={video.id}>
                            {video.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  {submitError ? <p className="text-sm text-red-400">{submitError}</p> : null}

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? (
                        'Gönderiliyor…'
                      ) : (
                        <>
                          <Send className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                          Başvuru Gönder
                        </>
                      )}
                    </Button>
                    <Dialog.Close asChild>
                      <Button type="button" variant="secondary" className="flex-1">
                        İptal
                      </Button>
                    </Dialog.Close>
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
