import { getHomeEntryGroups, getSpecialBlogsByCategory } from '@/lib/sanity/queries';
import { Link } from '@/lib/i18n/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import type {
  HomeCollectionEntry,
  HomeEntryGroup,
  HomeProjectEntry,
  SpecialBlogItem,
  SpecialCategorySection,
} from '@/lib/sanity/types';

function postHref(post: SpecialBlogItem) {
  const category = post.category?.slug;
  const project = post.project?.slug;
  if (!category || !project) return '/';
  if (post.collection?.slug) {
    return `/${category}/${project}/${post.collection.slug}/${post.slug}`;
  }
  return `/${category}/${project}/${post.slug}`;
}

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

function entryIntro(entry: { intro?: string; description?: string }) {
  return entry.intro || entry.description || '';
}

function HomeEntryPanel({
  groups,
  labels,
}: {
  groups: HomeEntryGroup[];
  labels: {
    title: string;
    subtitle: string;
    category: string;
    project: string;
    collection: string;
    log: string;
    about: string;
    friends: string;
    profile: string;
  };
}) {
  return (
    <section className="home-entry-panel" aria-labelledby="home-entry-title">
      <div className="home-entry-heading">
        <p>{labels.category} / {labels.project} / {labels.collection}</p>
        <h2 id="home-entry-title">{labels.title}</h2>
        <span>{labels.subtitle}</span>
      </div>

      <div className="home-entry-board">
        {groups.map((group, index) => {
          const projects = group.projects.slice(0, 3);
          const collections = group.projects.flatMap((project) =>
            project.collections.slice(0, 2).map((collection) => ({
              ...collection,
              projectSlug: project.slug,
            }))
          ).slice(0, 4);
          const variant = index % 4;

          return (
            <section
              key={group._id}
              className={`home-entry-section home-entry-section-${variant}`}
            >
              <Link href={`/${group.slug}`} className="home-entry-category-card">
                <span>{labels.category}</span>
                <strong>{group.title}</strong>
                {entryIntro(group) && <p>{entryIntro(group)}</p>}
              </Link>

              {projects.length > 0 && (
                <div className="home-entry-projects">
                  {projects.map((project: HomeProjectEntry) => (
                    <Link
                      key={project._id}
                      href={`/${group.slug}/${project.slug}`}
                      className="home-entry-card home-entry-card-quiet"
                    >
                      <span>{labels.project}</span>
                      <strong>{project.title}</strong>
                      {entryIntro(project) && <p>{entryIntro(project)}</p>}
                    </Link>
                  ))}
                </div>
              )}

              {collections.length > 0 && (
                <div className="home-entry-collections">
                  {collections.map((collection: HomeCollectionEntry & { projectSlug: string }) => (
                    <Link
                      key={collection._id}
                      href={`/${group.slug}/${collection.projectSlug}/${collection.slug}`}
                      className="home-entry-card home-entry-card-small"
                    >
                      <span>{labels.collection}</span>
                      <strong>{collection.title}</strong>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="home-entry-utilities">
        <Link href="/log">{labels.log}</Link>
        <Link href="/about">{labels.about}</Link>
        <Link href="/friends">{labels.friends}</Link>
        <Link href="/profile">{labels.profile}</Link>
      </div>
    </section>
  );
}

function FeaturedPost({
  post,
  locale,
}: {
  post: SpecialBlogItem;
  locale: string;
}) {
  return (
    <Link href={postHref(post)} className="home-featured group">
      <span className="home-kicker">{post.project?.title ?? 'Special'}</span>
      <h3>{post.title}</h3>
      {post.excerpt && <p>{post.excerpt}</p>}
      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
    </Link>
  );
}

function CategoryShowcase({
  section,
  index,
  locale,
  viewAllLabel,
}: {
  section: SpecialCategorySection;
  index: number;
  locale: string;
  viewAllLabel: string;
}) {
  const [lead, ...rest] = section.specialPosts;
  const variant = index % 3;

  return (
    <section className={`home-special-section home-special-section-${variant}`}>
      <div className="home-section-heading">
        <div>
          <p>Special / {String(index + 1).padStart(2, '0')}</p>
          <h2>{section.title}</h2>
        </div>
        <Link href={`/${section.slug}`} className="home-section-link">
          {viewAllLabel}
        </Link>
      </div>

      {variant === 0 && (
        <div className="home-layout-spotlight">
          {lead && <FeaturedPost post={lead} locale={locale} />}
          <div className="home-post-stack">
            {rest.slice(0, 3).map((post) => (
              <Link key={post._id} href={postHref(post)} className="home-post-row">
                <span>{post.project?.title}</span>
                <strong>{post.title}</strong>
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
              </Link>
            ))}
          </div>
        </div>
      )}

      {variant === 1 && (
        <div className="home-layout-mosaic">
          {section.specialPosts.slice(0, 4).map((post, postIndex) => (
            <Link
              key={post._id}
              href={postHref(post)}
              className={`home-mosaic-card home-mosaic-card-${postIndex}`}
            >
              <span>{post.project?.title}</span>
              <h3>{post.title}</h3>
              {post.excerpt && <p>{post.excerpt}</p>}
            </Link>
          ))}
        </div>
      )}

      {variant === 2 && (
        <div className="home-layout-orbit">
          {section.specialPosts.slice(0, 5).map((post, postIndex) => (
            <Link key={post._id} href={postHref(post)} className="home-orbit-item">
              <span>{String(postIndex + 1).padStart(2, '0')}</span>
              <div>
                <h3>{post.title}</h3>
                <p>{post.excerpt || post.project?.title}</p>
              </div>
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export async function StaticHomePage() {
  const [entryGroups, specialSections] = await Promise.all([
    getHomeEntryGroups(),
    getSpecialBlogsByCategory().catch(() => []),
  ]);
  const t = await getTranslations('home');
  const tn = await getTranslations('nav');
  const locale = await getLocale();
  const isZh = locale === 'zh';
  const eyebrow = isZh ? '深海夜幕下的蓝色档案' : 'Blue archive under a night sea';
  const viewAllLabel = isZh ? '查看全部' : 'View all';
  const emptySpecials = isZh
    ? '还没有 special 文章。请在 Sanity 中为想展示的 blog 添加 special 标签。'
    : 'No special posts yet. Add the special tag to featured blog posts in Sanity.';
  const entryLabels = {
    title: isZh ? '选择一条航线' : 'Choose a passage',
    subtitle: isZh
      ? '分类、项目与合集被收束在同一片星图里。'
      : 'Categories, projects, and collections arranged as one quiet star map.',
    category: isZh ? '分类' : 'Category',
    project: isZh ? '项目' : 'Project',
    collection: isZh ? '合集' : 'Collection',
    log: tn('log'),
    about: tn('about'),
    friends: tn('friends'),
    profile: tn('profile'),
  };

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-eyebrow">{eyebrow}</p>
          <h1>{t('title')}</h1>
          <p>{t('subtitle')}</p>
        </div>
      </section>

      <HomeEntryPanel groups={entryGroups} labels={entryLabels} />

      {specialSections.length > 0 ? (
        <div className="home-specials">
          {specialSections.map((section, index) => (
            <CategoryShowcase
              key={section._id}
              section={section}
              index={index}
              locale={locale}
              viewAllLabel={viewAllLabel}
            />
          ))}
        </div>
      ) : (
        <section className="home-empty-specials">
          <p>{emptySpecials}</p>
        </section>
      )}
    </div>
  );
}
