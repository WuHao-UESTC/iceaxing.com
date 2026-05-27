import { notFound } from 'next/navigation';
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
import {
  CollectionList,
  ListingBreadcrumb,
  PostList,
  ProjectHero,
} from '@/components/site/listing-cards';

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

  const [posts, collections] = await Promise.all([
    getBlogPostsByProject(project, locale),
    getCollectionsByProject(project, locale),
  ]);
  const labels = {
    locale,
    home: t('home'),
    posts: t('posts'),
    collections: t('collections'),
    postCountUnit: t('postCountUnit'),
  };

  return (
    <div className="listing-page">
      <ListingBreadcrumb
        items={[
          { label: t('home'), href: '/' },
          { label: cat?.title || category, href: `/${category}` },
          { label: proj.title },
        ]}
      />
      <ProjectHero project={proj} labels={labels} />

      <div className="listing-stack listing-project-stack">
        {collections.length > 0 && (
          <section className="listing-section">
            <div className="listing-section-head">
              <h2>{t('collections')}</h2>
              <span>{collections.length}</span>
            </div>
            <CollectionList collections={collections} category={category} project={project} labels={labels} />
          </section>
        )}

        <section className="listing-section listing-section-narrow">
          <div className="listing-section-head">
            <h2>{t('posts')}</h2>
            <span>{posts.length}</span>
          </div>
          {posts.length === 0 ? (
            <EmptyState message={t('emptyPosts')} />
          ) : (
            <PostList posts={posts} category={category} project={project} labels={labels} compact />
          )}
        </section>
      </div>
    </div>
  );
}
