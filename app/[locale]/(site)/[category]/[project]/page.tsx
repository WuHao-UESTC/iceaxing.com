import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/navigation';
import {
  getProjectBySlug,
  getBlogPostsByProject,
  getCollectionsByProject,
  getCategoryBySlug,
  getDirectBlogPostByCategory,
} from '@/lib/sanity/queries';
import { EmptyState } from '@/components/ui/empty-state';
import { getTranslations } from 'next-intl/server';
import { BlogThemeWrapper } from '@/components/blog/blog-theme-wrapper';
import { BlogStructuredData, PostArticle, getPostMetadata } from '@/components/blog/post-article';
import { getCanonicalByContentLanguage, getStaticAlternates, localizedUrl } from '@/lib/seo';
import { intlLocale } from '@/lib/i18n/locales';

interface Props {
  params: Promise<{ locale: string; category: string; project: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { category, project, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const proj = await getProjectBySlug(project, locale);
  if (!proj) {
    const post = await getDirectBlogPostByCategory(category, project, locale);
    if (!post) return { title: t('notFound') };
    return getPostMetadata(post, locale, `/${category}/${project}`);
  }
  const description = proj.description || proj.title;
  const path = `/${category}/${project}`;
  return {
    title: proj.title,
    description,
    alternates: getStaticAlternates(locale, path),
    openGraph: {
      title: proj.title,
      description,
      url: localizedUrl(locale, path),
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { category, project, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  const [proj, cat] = await Promise.all([
    getProjectBySlug(project, locale),
    getCategoryBySlug(category, locale),
  ]);
  if (!proj) {
    const post = await getDirectBlogPostByCategory(category, project, locale);
    if (!post) notFound();

    function formatDate(dateStr: string) {
      return new Date(dateStr).toLocaleDateString(intlLocale(locale));
    }

    const path = `/${category}/${project}`;
    const canonical = getCanonicalByContentLanguage(post.language, path);

    return (
      <BlogThemeWrapper theme={post.theme ?? 'default'}>
        <BlogStructuredData post={post} canonical={canonical} />
        <PostArticle
          post={post}
          category={category}
          locale={locale}
          formatDate={formatDate}
          t={t}
        />
      </BlogThemeWrapper>
    );
  }

  const posts = await getBlogPostsByProject(project, locale);
  const collections = await getCollectionsByProject(project, locale);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <nav className="text-sm text-zinc-400 mb-8">
        <Link href="/" className="hover:text-zinc-600">{t('home')}</Link>
        <span className="mx-2">/</span>
        <Link href={`/${category}`} className="hover:text-zinc-600">
          {cat?.title || category}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-700">{proj.title}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">{proj.title}</h1>
      {proj.description && (
        <p className="text-zinc-500 mb-8">{proj.description}</p>
      )}

      {collections.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">{t('collections')}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {collections.map((col) => (
              <Link
                key={col._id}
                href={`/${category}/${project}/${col.slug}`}
                className="block p-4 border rounded-lg hover:border-zinc-400 transition-colors"
              >
                <h3 className="font-medium">{col.title}</h3>
                {col.description && (
                  <p className="text-sm text-zinc-500">{col.description}</p>
                )}
                <span className="text-xs text-zinc-400">{col.postCount} {t('postCountUnit')}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">{t('posts')}</h2>
        {posts.length === 0 ? (
          <EmptyState message={t('emptyPosts')} />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link
                key={post._id}
                href={`/${category}/${project}/${post.slug}`}
                className="block p-4 border rounded-lg hover:border-zinc-400 transition-colors"
              >
                <h3 className="font-medium mb-1">{post.title}</h3>
                {post.excerpt && (
                  <p className="text-sm text-zinc-500 line-clamp-2">{post.excerpt}</p>
                )}
                <time className="text-xs text-zinc-400" dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString(intlLocale(locale))}
                </time>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
