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
import { BlogThemeWrapper } from '@/components/blog/blog-theme-wrapper';
import { GiscusComments } from '@/components/comments/giscus';
import { EmptyState } from '@/components/ui/empty-state';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: string; category: string; project: string; slug: string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, project, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  if (slug.length === 0 || slug.length > 2) return { title: t('notFound') };

  if (slug.length === 1) {
    const collections = await getCollectionsByProject(project);
    const collection = collections.find((c) => c.slug === slug[0]);
    if (collection) {
      return {
        title: collection.title,
        description: collection.description || `${collection.title} 合集`,
      };
    }

    const post = await getBlogPost(project, slug[0]);
    if (!post) return { title: t('notFound') };
    return {
      title: post.title,
      description: post.excerpt,
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: 'article',
        publishedTime: post.publishedAt,
      },
    };
  }

  const post = await getBlogPostWithCollection(project, slug[0], slug[1]);
  if (!post) return { title: t('notFound') };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
    },
  };
}

export default async function CatchAllPage({ params }: Props) {
  const { slug, category, project, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US');
  }

  // ═══ 两段路径：Collection + Blog 正文 ═══
  if (slug.length === 2) {
    const post = await getBlogPostWithCollection(project, slug[0], slug[1]);
    if (!post) notFound();

    return (
      <BlogThemeWrapper theme={post.theme ?? 'default'}>
        <article className="max-w-3xl mx-auto px-4 py-12">
          <nav className="text-sm text-zinc-400 mb-8">
            <Link href="/" className="hover:text-zinc-600">{t('home')}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${category}`} className="hover:text-zinc-600">{post.category?.title || category}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${category}/${project}`} className="hover:text-zinc-600">
              {post.project?.title || project}
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/${category}/${project}/${slug[0]}`} className="hover:text-zinc-600">
              {post.collection?.title || slug[0]}
            </Link>
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

          <div className="blog-body">
            <BlogBody content={post.body} />
          </div>

          {post.updatedAt && (
            <p className="text-sm text-zinc-400 mt-12 pt-6 border-t">
              {t('updatedAt')} {formatDate(post.updatedAt)}
            </p>
          )}
        </article>

        <div className="max-w-3xl mx-auto px-4 pb-12">
          <GiscusComments locale={locale} />
        </div>
      </BlogThemeWrapper>
    );
  }

  // ═══ 单段路径：Collection 列表 或 Blog 正文 ═══
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

    // → 无 Collection 的 Blog 正文
    const post = await getBlogPost(project, slug[0]);
    if (!post) notFound();

    return (
      <BlogThemeWrapper theme={post.theme ?? 'default'}>
        <article className="max-w-3xl mx-auto px-4 py-12">
          <nav className="text-sm text-zinc-400 mb-8">
            <Link href="/" className="hover:text-zinc-600">{t('home')}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${category}`} className="hover:text-zinc-600">{post.category?.title || category}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${category}/${project}`} className="hover:text-zinc-600">
              {post.project?.title || project}
            </Link>
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

          <div className="blog-body">
            <BlogBody content={post.body} />
          </div>

          {post.updatedAt && (
            <p className="text-sm text-zinc-400 mt-12 pt-6 border-t">
              {t('updatedAt')} {formatDate(post.updatedAt)}
            </p>
          )}
        </article>

        <div className="max-w-3xl mx-auto px-4 pb-12">
          <GiscusComments locale={locale} />
        </div>
      </BlogThemeWrapper>
    );
  }

  notFound();
}
