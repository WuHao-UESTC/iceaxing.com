import { notFound } from 'next/navigation';
import { Link } from '@/lib/i18n/navigation';
import {
  getCategoryBySlug,
  getDirectBlogPostsByCategory,
  getProjectsByCategory,
} from '@/lib/sanity/queries';
import { EmptyState } from '@/components/ui/empty-state';
import { getTranslations } from 'next-intl/server';
import { getStaticAlternates, localizedUrl } from '@/lib/seo';
import { intlLocale } from '@/lib/i18n/locales';

interface Props {
  params: Promise<{ locale: string; category: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { category, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const cat = await getCategoryBySlug(category, locale);
  if (!cat) return { title: t('notFound') };
  return {
    title: cat.title,
    description: cat.description || `${cat.title}`,
    alternates: getStaticAlternates(locale, `/${category}`),
    openGraph: {
      title: cat.title,
      description: cat.description || `${cat.title}`,
      url: localizedUrl(locale, `/${category}`),
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const cat = await getCategoryBySlug(category, locale);
  if (!cat) notFound();

  const [projects, directPosts] = await Promise.all([
    getProjectsByCategory(category, locale),
    getDirectBlogPostsByCategory(category, locale),
  ]);
  const hasContent = projects.length > 0 || directPosts.length > 0;

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(intlLocale(locale));
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:px-10">
      <nav className="text-sm text-zinc-400 mb-8">
        <Link href="/" className="hover:text-zinc-600">{t('home')}</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-700">{cat.title}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">{cat.title}</h1>
      {cat.description && (
        <p className="max-w-2xl text-zinc-500 mb-10">{cat.description}</p>
      )}

      {!hasContent ? (
        <EmptyState message={t('emptyProjects')} />
      ) : (
        <div className="space-y-14">
          {projects.length > 0 && (
            <section>
              <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-zinc-200/70 pb-3 dark:border-white/10">
                <h2 className="text-base font-semibold tracking-wide">
                  {locale === 'zh' ? '项目' : locale === 'de' ? 'Projekte' : 'Projects'}
                </h2>
                <span className="text-xs uppercase tracking-[0.28em] text-zinc-400">
                  {projects.length}
                </span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project, index) => (
                  <Link
                    key={project._id}
                    href={`/${category}/${project.slug}`}
                    className={[
                      'group block border border-zinc-200/80 bg-white/40 p-5 transition-colors hover:border-blue-500/70 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-blue-300/70',
                      index % 3 === 0 ? 'sm:translate-y-4' : '',
                      index % 3 === 1 ? 'lg:translate-y-10' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <span className="mb-5 block text-[0.65rem] uppercase tracking-[0.26em] text-blue-600 dark:text-blue-300">
                      Project
                    </span>
                    <h3 className="mb-2 text-base font-semibold transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-200">
                      {project.title}
                    </h3>
                    {project.description && (
                      <p className="line-clamp-3 text-sm leading-6 text-zinc-500">
                        {project.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {directPosts.length > 0 && (
            <section className="max-w-3xl">
              <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-zinc-200/70 pb-3 dark:border-white/10">
                <h2 className="text-base font-semibold tracking-wide">{t('posts')}</h2>
                <span className="text-xs uppercase tracking-[0.28em] text-zinc-400">
                  {directPosts.length}
                </span>
              </div>
              <div className="divide-y divide-zinc-200/80 border-y border-zinc-200/80 dark:divide-white/10 dark:border-white/10">
                {directPosts.map((post) => (
                  <Link
                    key={post._id}
                    href={`/${category}/${post.slug}`}
                    className="group grid gap-3 py-5 transition-colors sm:grid-cols-[8rem_minmax(0,1fr)]"
                  >
                    <time className="text-xs text-zinc-400" dateTime={post.publishedAt}>
                      {formatDate(post.publishedAt)}
                    </time>
                    <div>
                      <h3 className="text-base font-medium transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-200">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
