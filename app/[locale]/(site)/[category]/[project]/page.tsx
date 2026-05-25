import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/navigation';
import { getProjectBySlug, getBlogPostsByProject, getCollectionsByProject, getCategoryBySlug } from '@/lib/sanity/queries';
import { EmptyState } from '@/components/ui/empty-state';
import { getTranslations } from 'next-intl/server';
import { getStaticAlternates, localizedUrl } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string; category: string; project: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { category, project, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const proj = await getProjectBySlug(project);
  if (!proj) return { title: t('notFound') };
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
    getProjectBySlug(project),
    getCategoryBySlug(category),
  ]);
  if (!proj) notFound();

  const posts = await getBlogPostsByProject(project);
  const collections = await getCollectionsByProject(project);

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
                  {new Date(post.publishedAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}
                </time>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
