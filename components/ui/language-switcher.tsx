'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { useTransition } from 'react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const nextLocale = locale === 'zh' ? 'en' : 'zh';

  const handleSwitch = () => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <button
      onClick={handleSwitch}
      disabled={isPending}
      className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-60"
      aria-label={nextLocale === 'zh' ? '切换到中文' : 'Switch to English'}
    >
      {nextLocale === 'zh' ? '中文' : 'EN'}
    </button>
  );
}
