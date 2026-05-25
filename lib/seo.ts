import type { Metadata } from 'next';

export const SITE_NAME = 'iceaxing';
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://iceaxing.com';

export type Locale = 'zh' | 'en';

export function withLocalePath(locale: string, path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const cleanPath =
    normalizedPath !== '/' ? normalizedPath.replace(/\/$/, '') : normalizedPath;

  return locale === 'en' ? `/en${cleanPath === '/' ? '' : cleanPath}` : cleanPath;
}

export function absoluteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath === '/' ? '' : normalizedPath}`;
}

export function localizedUrl(locale: string, path = '/') {
  return absoluteUrl(withLocalePath(locale, path));
}

export function getStaticAlternates(locale: string, path = '/'): Metadata['alternates'] {
  return {
    canonical: localizedUrl(locale, path),
    languages: {
      zh: localizedUrl('zh', path),
      en: localizedUrl('en', path),
      'x-default': localizedUrl('zh', path),
    },
  };
}

export function getCanonicalByContentLanguage(language: string | undefined, path = '/') {
  return localizedUrl(language === 'en' ? 'en' : 'zh', path);
}

export function getDescriptionFallback(title: string, text?: string) {
  const cleaned = text?.replace(/\s+/g, ' ').trim();
  if (!cleaned) return title;
  return cleaned.length > 160 ? `${cleaned.slice(0, 157)}...` : cleaned;
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
