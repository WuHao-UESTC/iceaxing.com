'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');

  useEffect(() => {
    console.error('[error-boundary]', error.digest, error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <h2 className="text-xl font-bold mb-2">{t('title')}</h2>
      <p className="text-zinc-500 mb-4">{t('description')}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm hover:bg-zinc-800 transition-colors"
      >
        {t('retry')}
      </button>
    </div>
  );
}
