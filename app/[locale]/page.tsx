import { StaticHomePage } from '@/components/home/static-homepage';
import { getTranslations } from 'next-intl/server';
import { SITE_NAME, SITE_URL, getStaticAlternates, jsonLd, localizedUrl } from '@/lib/seo';
import { htmlLocale, openGraphLocale } from '@/lib/i18n/locales';

export const revalidate = 60;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: getStaticAlternates(locale),
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: localizedUrl(locale),
      locale: openGraphLocale(locale),
    },
    twitter: {
      card: 'summary',
      title: t('metaTitle'),
      description: t('metaDescription'),
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: localizedUrl(locale),
    description: t('metaDescription'),
    inLanguage: htmlLocale(locale),
    publisher: {
      '@type': 'Person',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(websiteJsonLd) }}
      />
      <StaticHomePage />
    </>
  );
}
