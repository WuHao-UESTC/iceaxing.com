'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { SubscribeForm } from './subscribe-form';

export function SubscribeDialog() {
  const t = useTranslations('subscribe');
  const tn = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openRef.current) {
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [close]);

  useEffect(() => {
    if (open) {
      // Focus the close button on open so keyboard users can navigate from it
      closeRef.current?.focus();
    }
  }, [open]);

  const headingId = 'subscribe-dialog-heading';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 bg-zinc-900 text-white text-sm rounded-full
                   hover:bg-zinc-700 transition-colors font-medium"
        aria-label={tn('subscribe')}
      >
        {tn('subscribe')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50" onClick={close}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-md
                        bg-white rounded-xl shadow-2xl border p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id={headingId} className="font-semibold text-lg">{t('title')}</h2>
              <button
                ref={closeRef}
                onClick={close}
                className="text-zinc-400 hover:text-zinc-600 text-xl leading-none"
                aria-label={t('close')}
              >
                ✕
              </button>
            </div>
            <SubscribeForm showHeading={false} />
          </div>
        </div>
      )}
    </>
  );
}
