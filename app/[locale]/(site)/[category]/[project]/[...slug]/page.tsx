import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/navigation';
import {
  getBlogPost,
  getBlogPostWithCollection,
  getBlogPostsByCollection,
  getCollectionsByProject,
  getCategoryBySlug,
  getProjectBySlug,
} from '@/lib/sanity/queries';
import { BlogBody } from '@/components/blog/portable-text-renderer';
import { TableOfContents } from '@/components/blog/table-of-contents';
import { BlogThemeWrapper } from '@/components/blog/blog-theme-wrapper';
import { GiscusComments } from '@/components/comments/giscus';
import { EmptyState } from '@/components/ui/empty-state';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import {
  SITE_NAME,
  getCanonicalByContentLanguage,
  getDescriptionFallback,
  getStaticAlternates,
  jsonLd,
  localizedUrl,
} from '@/lib/seo';
import type { BlogFull } from '@/lib/sanity/types';

interface Props {
  params: Promise<{ locale: string; category: string; project: string; slug: string[] }>;
}

function postPath(category: string, project: string, slug: string[]) {
  return `/${category}/${project}/${slug.join('/')}`;
}

function postMetadata(post: BlogFull, locale: string, path: string): Metadata {
  const description = getDescriptionFallback(post.title, post.excerpt || post.bodyText);
  const canonical = getCanonicalByContentLanguage(post.language, path);
  const contentLocale = post.language === 'en' ? 'en' : 'zh';
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
      locale: contentLocale === 'en' ? 'en_US' : 'zh_CN',
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

function BlogStructuredData({
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
    inLanguage: post.language === 'en' ? 'en-US' : 'zh-CN',
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

function PostArticle({
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
  project: string;
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
            <span className="mx-2">/</span>
            <Link href={`/${category}/${project}`} className="hover:text-zinc-600">
              {post.project?.title || project}
            </Link>
            {collectionSlug && (
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, category, project, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  if (slug.length === 0 || slug.length > 2) return { title: t('notFound') };

  if (slug.length === 1) {
    const collections = await getCollectionsByProject(project);
    const collection = collections.find((c) => c.slug === slug[0]);
    const path = postPath(category, project, slug);

    if (collection) {
      const description = collection.description || `${collection.title} collection`;
      return {
        title: collection.title,
        description,
        alternates: getStaticAlternates(locale, path),
        openGraph: {
          title: collection.title,
          description,
          url: localizedUrl(locale, path),
        },
      };
    }

    const post = await getBlogPost(project, slug[0]);
    if (!post) return { title: t('notFound') };
    return postMetadata(post, locale, path);
  }

  const path = postPath(category, project, slug);
  const post = await getBlogPostWithCollection(project, slug[0], slug[1]);
  if (!post) return { title: t('notFound') };
  return postMetadata(post, locale, path);
}

export default async function CatchAllPage({ params }: Props) {
  const { slug, category, project, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US');
  }

  if (slug.length === 2) {
    const post = await getBlogPostWithCollection(project, slug[0], slug[1]);
    if (!post) notFound();
    const canonical = getCanonicalByContentLanguage(post.language, postPath(category, project, slug));

    return (
      <BlogThemeWrapper theme={post.theme ?? 'default'}>
        <BlogStructuredData post={post} canonical={canonical} />
        <PostArticle
          post={post}
          category={category}
          project={project}
          collectionSlug={slug[0]}
          locale={locale}
          formatDate={formatDate}
          t={t}
        />
      </BlogThemeWrapper>
    );
  }

  if (slug.length === 1) {
    const collections = await getCollectionsByProject(project);
    const collection = collections.find((c) => c.slug === slug[0]);

    if (collection) {
      const [posts, cat, proj] = await Promise.all([
        getBlogPostsByCollection(project, collection.slug),
        getCategoryBySlug(category),
        getProjectBySlug(project),
      ]);

      return (
        <div className="max-w-3xl mx-auto px-4 py-12">
          <nav className="text-sm text-zinc-400 mb-8">
            <Link href="/" className="hover:text-zinc-600">{t('home')}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${category}`} className="hover:text-zinc-600">{cat?.title || category}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${category}/${project}`} className="hover:text-zinc-600">{proj?.title || project}</Link>
          </nav>

          <h1 className="text-3xl font-bold mb-2">{collection.title}</h1>
          {collection.description && (
            <p className="text-zinc-500 mb-8">{collection.description}</p>
          )}

          {posts.length === 0 ? (
            <EmptyState message={t('emptyCollections')} />
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  href={`/${category}/${project}/${collection.slug}/${post.slug}`}
                  className="block p-4 border rounded-lg hover:border-zinc-400 transition-colors"
                >
                  <h2 className="font-medium mb-1">{post.title}</h2>
                  {post.excerpt && (
                    <p className="text-sm text-zinc-500 line-clamp-2">{post.excerpt}</p>
                  )}
                  <time className="text-xs text-zinc-400" dateTime={post.publishedAt}>
                    {formatDate(post.publishedAt)}
                  </time>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    const post = await getBlogPost(project, slug[0]);
    if (!post) notFound();
    const canonical = getCanonicalByContentLanguage(post.language, postPath(category, project, slug));

    return (
      <BlogThemeWrapper theme={post.theme ?? 'default'}>
        <BlogStructuredData post={post} canonical={canonical} />
        <PostArticle
          post={post}
          category={category}
          project={project}
          locale={locale}
          formatDate={formatDate}
          t={t}
        />
      </BlogThemeWrapper>
    );
  }

  notFound();
}
