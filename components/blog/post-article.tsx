import type { Metadata } from 'next';
import { Link } from '@/lib/i18n/navigation';
import { BlogBody } from '@/components/blog/portable-text-renderer';
import { TableOfContents } from '@/components/blog/table-of-contents';
import { GiscusComments } from '@/components/comments/giscus';
import {
  SITE_NAME,
  getCanonicalByContentLanguage,
  getDescriptionFallback,
  jsonLd,
} from '@/lib/seo';
import type { BlogFull } from '@/lib/sanity/types';
import { htmlLocale, openGraphLocale, normalizeLocale } from '@/lib/i18n/locales';

export function getPostMetadata(post: BlogFull, locale: string, path: string): Metadata {
  const description = getDescriptionFallback(post.title, post.excerpt || post.bodyText);
  const canonical = getCanonicalByContentLanguage(post.language, path);
  const contentLocale = normalizeLocale(post.language);
  const localeMatchesContent = contentLocale === locale;

  return {
    title: post.title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      url: canonical,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      locale: openGraphLocale(contentLocale),
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary',
      title: post.title,
      description,
    },
    robots: localeMatchesContent
      ? undefined
      : {
          index: false,
          follow: true,
        },
  };
}

export function BlogStructuredData({
  post,
  canonical,
}: {
  post: BlogFull;
  canonical: string;
}) {
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: getDescriptionFallback(post.title, post.excerpt || post.bodyText),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    inLanguage: htmlLocale(post.language),
    author: {
      '@type': 'Person',
      name: SITE_NAME,
    },
    publisher: {
      '@type': 'Person',
      name: SITE_NAME,
    },
    mainEntityOfPage: canonical,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd) }}
    />
  );
}

export function PostArticle({
  post,
  category,
  project,
  collectionSlug,
  locale,
  formatDate,
  t,
}: {
  post: BlogFull;
  category: string;
  project?: string;
  collectionSlug?: string;
  locale: string;
  formatDate: (dateStr: string) => string;
  t: (key: string) => string;
}) {
  return (
    <>
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-12 lg:grid-cols-[minmax(0,48rem)_16rem]">
        <article className="min-w-0">
          <nav className="text-sm text-zinc-400 mb-8">
            <Link href="/" className="hover:text-zinc-600">{t('home')}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${category}`} className="hover:text-zinc-600">{post.category?.title || category}</Link>
            {project && (
              <>
                <span className="mx-2">/</span>
                <Link href={`/${category}/${project}`} className="hover:text-zinc-600">
                  {post.project?.title || project}
                </Link>
              </>
            )}
            {collectionSlug && project && (
              <>
                <span className="mx-2">/</span>
                <Link href={`/${category}/${project}/${collectionSlug}`} className="hover:text-zinc-600">
                  {post.collection?.title || collectionSlug}
                </Link>
              </>
            )}
          </nav>

          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-3">{post.title}</h1>
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
              {post.tags && post.tags.length > 0 && (
                <div className="flex gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-zinc-100 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          <div className="mb-8 lg:hidden">
            <TableOfContents content={post.body} locale={locale} />
          </div>

          <div className="blog-body">
            <BlogBody content={post.body} />
          </div>

          {post.updatedAt && (
            <p className="text-sm text-zinc-400 mt-12 pt-6 border-t">
              {t('updatedAt')} {formatDate(post.updatedAt)}
            </p>
          )}
        </article>

        <div className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents content={post.body} locale={locale} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-12">
        <GiscusComments locale={locale} />
      </div>
    </>
  );
}
