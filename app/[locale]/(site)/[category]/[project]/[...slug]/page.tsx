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
import { BlogThemeWrapper } from '@/components/blog/blog-theme-wrapper';
import { BlogStructuredData, PostArticle, getPostMetadata } from '@/components/blog/post-article';
import { EmptyState } from '@/components/ui/empty-state';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import {
  getCanonicalByContentLanguage,
  getStaticAlternates,
  localizedUrl,
} from '@/lib/seo';
import { intlLocale } from '@/lib/i18n/locales';

interface Props {
  params: Promise<{ locale: string; category: string; project: string; slug: string[] }>;
}

function postPath(category: string, project: string, slug: string[]) {
  return `/${category}/${project}/${slug.join('/')}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, category, project, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  if (slug.length === 0 || slug.length > 2) return { title: t('notFound') };

  if (slug.length === 1) {
    const collections = await getCollectionsByProject(project, locale);
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

    const post = await getBlogPost(project, slug[0], locale);
    if (!post) return { title: t('notFound') };
    return getPostMetadata(post, locale, path);
  }

  const path = postPath(category, project, slug);
  const post = await getBlogPostWithCollection(project, slug[0], slug[1], locale);
  if (!post) return { title: t('notFound') };
  return getPostMetadata(post, locale, path);
}

export default async function CatchAllPage({ params }: Props) {
  const { slug, category, project, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(intlLocale(locale));
  }

  if (slug.length === 2) {
    const post = await getBlogPostWithCollection(project, slug[0], slug[1], locale);
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
    const collections = await getCollectionsByProject(project, locale);
    const collection = collections.find((c) => c.slug === slug[0]);

    if (collection) {
      const [posts, cat, proj] = await Promise.all([
        getBlogPostsByCollection(project, collection.slug, locale),
        getCategoryBySlug(category, locale),
        getProjectBySlug(project, locale),
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

    const post = await getBlogPost(project, slug[0], locale);
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
