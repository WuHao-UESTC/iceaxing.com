'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { useTransition } from 'react';
import { locales, type AppLocale } from '@/lib/i18n/locales';

const localeLabels: Record<AppLocale, string> = {
  zh: '中文',
  en: 'EN',
  de: 'DE',
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSwitch = (nextLocale: AppLocale) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <select
      value={locale}
      onChange={(event) => handleSwitch(event.target.value as AppLocale)}
      disabled={isPending}
      className="bg-transparent text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-60"
      aria-label="Switch language"
    >
      {locales.map((item) => (
        <option key={item} value={item}>
          {localeLabels[item]}
        </option>
      ))}
    </select>
  );
}
