import { notFound } from 'next/navigation';
import {
  getCategoryBySlug,
  getDirectBlogPostsByCategory,
  getProjectsByCategory,
} from '@/lib/sanity/queries';
import { EmptyState } from '@/components/ui/empty-state';
import { getTranslations } from 'next-intl/server';
import { getStaticAlternates, localizedUrl } from '@/lib/seo';
import {
  CategoryHero,
  ListingBreadcrumb,
  PostList,
  ProjectGrid,
} from '@/components/site/listing-cards';

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
  const isDailyRamblings = category === 'daily-ramblings' || cat.tags?.includes('daily-ramblings');
  const labels = {
    locale,
    home: t('home'),
    posts: t('posts'),
    collections: t('collections'),
    postCountUnit: t('postCountUnit'),
  };

  return (
    <div className="listing-page">
      <ListingBreadcrumb items={[{ label: t('home'), href: '/' }, { label: cat.title }]} />
      <CategoryHero category={cat} />

      {!hasContent ? (
        <EmptyState message={t('emptyProjects')} />
      ) : (
        <div className="listing-stack">
          {projects.length > 0 && (
            <section className="listing-section">
              <div className="listing-section-head">
                <h2>{locale === 'zh' ? '项目' : locale === 'de' ? 'Projekte' : 'Projects'}</h2>
                <span>{projects.length}</span>
              </div>
              <ProjectGrid projects={projects} category={category} labels={labels} />
            </section>
          )}

          {directPosts.length > 0 && (
            <section className="listing-section listing-section-narrow">
              <div className="listing-section-head">
                <h2>{t('posts')}</h2>
                <span>{directPosts.length}</span>
              </div>
              <PostList posts={directPosts} category={category} labels={labels} compact rambling={isDailyRamblings} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
