import type { DocumentBadgeComponent } from 'sanity';

interface DocData {
  title?: string;
  titleEn?: string;
  titleDe?: string;
  body?: unknown[];
  bodyEn?: unknown[];
  bodyDe?: unknown[];
}

function hasContent(data: DocData | null, locale: 'en' | 'de'): boolean {
  if (!data) return false;
  if (locale === 'en') return Boolean(data.titleEn || (data.bodyEn && data.bodyEn.length > 0));
  return Boolean(data.titleDe || (data.bodyDe && data.bodyDe.length > 0));
}

function translationProgress(data: DocData | null): { en: boolean; de: boolean; total: number } {
  const en = hasContent(data, 'en');
  const de = hasContent(data, 'de');
  const complete = [true, en, de].filter(Boolean).length; // zh is always true
  return { en, de, total: complete };
}

export const translateZhBadge: DocumentBadgeComponent = (props) => {
  return {
    label: '中文',
    color: 'primary',
    title: '中文 (主语言)',
  };
};

export const translateEnBadge: DocumentBadgeComponent = (props) => {
  const data = (props.draft || props.published) as DocData | null;
  const en = hasContent(data, 'en');
  return {
    label: en ? 'EN' : 'EN ✗',
    color: en ? 'success' : 'danger',
    title: en ? 'English content complete' : 'English content missing',
  };
};

export const translateDeBadge: DocumentBadgeComponent = (props) => {
  const data = (props.draft || props.published) as DocData | null;
  const de = hasContent(data, 'de');
  return {
    label: de ? 'DE' : 'DE ✗',
    color: de ? 'success' : 'danger',
    title: de ? 'German content complete' : 'German content missing',
  };
};

export const translateProgressBadge: DocumentBadgeComponent = (props) => {
  const data = (props.draft || props.published) as DocData | null;
  const progress = translationProgress(data);
  return {
    label: `${progress.total}/3`,
    color: progress.total === 3 ? 'success' : progress.total >= 2 ? 'warning' : 'danger',
    title: `Translated ${progress.total}/3 locales`,
  };
};
