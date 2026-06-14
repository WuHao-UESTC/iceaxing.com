import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/navigation';
import { getLogBySlug } from '@/lib/sanity/queries';
import { BlogBody } from '@/components/blog/portable-text-renderer';
import { GiscusComments } from '@/components/comments/giscus';
import { getTranslations } from 'next-intl/server';
import { getStaticAlternates, jsonLd, localizedUrl } from '@/lib/seo';
import { intlLocale } from '@/lib/i18n/locales';

export const revalidate = 60;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const log = await getLogBySlug(slug);
  if (!log) return { title: t('notFound') };
  const description = log.description || `${log.title} - ${t('log')}`;
  return {
    title: log.title,
    description,
    alternates: getStaticAlternates(locale, `/log/${slug}`),
    openGraph: {
      title: log.title,
      description,
      type: 'article',
      url: localizedUrl(locale, `/log/${slug}`),
      publishedTime: log.date,
    },
  };
}

export default async function LogDetailPage({ params }: Props) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const tl = await getTranslations({ locale, namespace: 'log' });
  const log = await getLogBySlug(slug);
  if (!log) notFound();

  const categoryLabels: Record<string, string> = {
    content: tl('categoryContent'),
    site: tl('categorySite'),
    other: tl('categoryOther'),
  };
  const logJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: log.title,
    description: log.description || log.title,
    datePublished: log.date,
    dateModified: log.date,
    author: {
      '@type': 'Person',
      name: 'iceaxing',
    },
    mainEntityOfPage: localizedUrl(locale, `/log/${slug}`),
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(logJsonLd) }}
      />
      <nav className="text-sm text-zinc-400 mb-8">
        <Link href="/" className="hover:text-zinc-600">{t('home')}</Link>
        <span className="mx-2">/</span>
        <Link href="/log" className="hover:text-zinc-600">{t('log')}</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-700">{log.title}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{log.title}</h1>
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <time dateTime={log.date}>
            {new Date(log.date).toLocaleDateString(intlLocale(locale))}
          </time>
          <span className="px-2 py-0.5 bg-zinc-100 rounded text-xs">
            {categoryLabels[log.category] || log.category}
          </span>
        </div>
      </header>

      <div className="prose prose-zinc">
        <BlogBody content={log.body} />
      </div>

      <GiscusComments locale={locale} />

      <Link href="/log" className="text-sm text-[var(--color-blue-soft)] hover:text-[var(--color-sand)] mt-8 inline-block">
        {t('backToLog')}
      </Link>
    </div>
  );
}
