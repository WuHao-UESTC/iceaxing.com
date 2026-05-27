export const locales = ['zh', 'en', 'de'] as const;

export type AppLocale = (typeof locales)[number];

export function isAppLocale(locale: string): locale is AppLocale {
  return locales.includes(locale as AppLocale);
}

export function normalizeLocale(locale: string | undefined): AppLocale {
  return locale && isAppLocale(locale) ? locale : 'zh';
}

export function intlLocale(locale: string) {
  switch (normalizeLocale(locale)) {
    case 'de':
      return 'de-DE';
    case 'en':
      return 'en-US';
    default:
      return 'zh-CN';
  }
}

export function htmlLocale(locale: string) {
  return intlLocale(locale);
}

export function openGraphLocale(locale: string) {
  switch (normalizeLocale(locale)) {
    case 'de':
      return 'de_DE';
    case 'en':
      return 'en_US';
    default:
      return 'zh_CN';
  }
}
