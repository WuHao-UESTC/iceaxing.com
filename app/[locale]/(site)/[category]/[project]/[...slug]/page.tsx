import { notFound } from 'next/navigation';
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
import {
  CollectionHero,
  ListingBreadcrumb,
  PostList,
} from '@/components/site/listing-cards';

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
              { label: proj?.title || project, href: `/${category}/${project}` },
              { label: collection.title },
            ]}
          />
          <CollectionHero collection={collection} labels={labels} />

          {posts.length === 0 ? (
            <EmptyState message={t('emptyCollections')} />
          ) : (
            <section className="listing-section listing-section-narrow">
              <div className="listing-section-head">
                <h2>{t('posts')}</h2>
                <span>{posts.length}</span>
              </div>
              <PostList posts={posts} category={category} project={project} labels={labels} compact />
            </section>
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
