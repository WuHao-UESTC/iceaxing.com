import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';
import type { BlogListItem, CategoryDoc, CollectionDoc, ProjectDoc } from '@/lib/sanity/types';

type LocaleLabels = {
  locale: string;
  home: string;
  posts: string;
  collections: string;
  postCountUnit: string;
};

function formatDate(date: string | undefined, locale: string) {
  if (!date) return '';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
}

function introOf(item: { intro?: string; description?: string; excerpt?: string; bodyText?: string }) {
  return item.intro || item.description || item.excerpt || item.bodyText || '';
}

function postHref(category: string, project: string | undefined, post: BlogListItem) {
  if (project && post.collection?.slug) return `/${category}/${project}/${post.collection.slug}/${post.slug}`;
  if (project) return `/${category}/${project}/${post.slug}`;
  return `/${category}/${post.slug}`;
}

function statusText(status: ProjectDoc['status'], locale: string) {
  if (locale === 'zh') {
    if (status === 'completed') return '已完成';
    if (status === 'ongoing') return '进行中';
    return '计划中';
  }
  if (locale === 'de') {
    if (status === 'completed') return 'Abgeschlossen';
    if (status === 'ongoing') return 'Laufend';
    return 'Geplant';
  }
  if (status === 'completed') return 'Completed';
  if (status === 'ongoing') return 'Ongoing';
  return 'Planned';
}

function CoverImage({
  image,
  title,
  className = '',
}: {
  image?: { url?: string; alt?: string };
  title: string;
  className?: string;
}) {
  if (!image?.url) return <span className={`listing-cover-placeholder ${className}`} aria-hidden="true" />;
  return (
    <Image
      src={image.url}
      alt={image.alt || title}
      width={900}
      height={600}
      className={className}
      unoptimized
    />
  );
}

export function ListingBreadcrumb({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav className="listing-breadcrumb" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="listing-breadcrumb-item">
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function CategoryHero({ category }: { category: CategoryDoc }) {
  const intro = category.description || category.intro;
  return (
    <header className="listing-hero listing-hero-category">
      <div className="listing-hero-copy">
        <span className="listing-kicker">Category</span>
        <h1>{category.title}</h1>
        {intro && <p>{intro}</p>}
        {category.tags && category.tags.length > 0 && (
          <div className="listing-tags">
            {category.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className="listing-hero-media">
        <CoverImage image={category.coverImage} title={category.title} className="listing-hero-image" />
      </div>
    </header>
  );
}

export function ProjectHero({
  project,
  labels,
}: {
  project: ProjectDoc;
  labels: LocaleLabels;
}) {
  const progress = Math.max(1, Math.min(5, project.progress ?? 1));
  return (
    <header className="listing-hero listing-hero-project">
      <div className="listing-hero-copy">
        <span className="listing-kicker">{project.category?.title || 'Project'}</span>
        <h1>{project.title}</h1>
        {(project.description || project.intro) && <p>{project.description || project.intro}</p>}
        <div className="listing-hero-meta">
          <span>{statusText(project.status, labels.locale)}</span>
          <span>
            {project.postCount ?? 0} {labels.postCountUnit}
          </span>
          <span>
            {project.collectionCount ?? 0} {labels.collections}
          </span>
        </div>
      </div>
      <div className="listing-project-meter" aria-label={`${progress}/5`}>
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className={index < progress ? 'is-filled' : ''} />
        ))}
      </div>
      <div className="listing-hero-media">
        <CoverImage image={project.coverImage} title={project.title} className="listing-hero-image" />
      </div>
    </header>
  );
}

export function CollectionHero({
  collection,
  labels,
}: {
  collection: CollectionDoc;
  labels: LocaleLabels;
}) {
  return (
    <header className="listing-hero listing-hero-collection">
      <div className="listing-hero-copy">
        <span className="listing-kicker">{labels.collections}</span>
        <h1>{collection.title}</h1>
        {(collection.description || collection.intro) && <p>{collection.description || collection.intro}</p>}
        <div className="listing-hero-meta">
          <span>
            {collection.postCount} {labels.postCountUnit}
          </span>
          {collection.createdAt && <span>{formatDate(collection.createdAt, labels.locale)}</span>}
        </div>
        {collection.tags && collection.tags.length > 0 && (
          <div className="listing-tags">
            {collection.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className="listing-hero-media">
        <CoverImage image={collection.coverImage} title={collection.title} className="listing-hero-image" />
      </div>
    </header>
  );
}

export function ProjectEntryCard({
  project,
  href,
  labels,
}: {
  project: ProjectDoc;
  href: string;
  labels: LocaleLabels;
}) {
  const progress = Math.max(1, Math.min(5, project.progress ?? 1));
  const intro = introOf(project);

  return (
    <Link href={href} className="listing-project-card">
      <div className="listing-project-card-media">
        <CoverImage image={project.coverImage} title={project.title} className="listing-card-image" />
      </div>
      <div className="listing-project-card-copy">
        <div className="listing-card-topline">
          <span>{statusText(project.status, labels.locale)}</span>
          {project.createdAt && <time dateTime={project.createdAt}>{formatDate(project.createdAt, labels.locale)}</time>}
        </div>
        <h2>{project.title}</h2>
        {intro && <p>{intro}</p>}
        {project.tags && project.tags.length > 0 && (
          <div className="listing-tags">
            {project.tags.slice(0, 5).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
        <div className="listing-project-foot">
          <span>
            {project.postCount ?? 0} {labels.postCountUnit}
          </span>
          <span>
            {project.collectionCount ?? 0} {labels.collections}
          </span>
          <span className="listing-mini-meter">
            {Array.from({ length: 5 }, (_, index) => (
              <i key={index} className={index < progress ? 'is-filled' : ''} />
            ))}
          </span>
        </div>
      </div>
      <div className="listing-project-previews">
        {project.latestCollections && project.latestCollections.length > 0 && (
          <div>
            <strong>{labels.collections}</strong>
            {project.latestCollections.map((collection) => (
              <span key={collection._id}>{collection.title}</span>
            ))}
          </div>
        )}
        {project.latestPosts && project.latestPosts.length > 0 && (
          <div>
            <strong>{labels.posts}</strong>
            {project.latestPosts.map((post) => (
              <span key={post._id}>{post.title}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function CollectionEntryCard({
  collection,
  href,
  labels,
}: {
  collection: CollectionDoc;
  href: string;
  labels: LocaleLabels;
}) {
  return (
    <Link href={href} className="listing-collection-card">
      <div className="listing-collection-index">
        <CoverImage image={collection.coverImage} title={collection.title} className="listing-collection-image" />
      </div>
      <div className="listing-collection-copy">
        <div className="listing-card-topline">
          <span>
            {collection.postCount} {labels.postCountUnit}
          </span>
          {collection.createdAt && <time dateTime={collection.createdAt}>{formatDate(collection.createdAt, labels.locale)}</time>}
        </div>
        <h2>{collection.title}</h2>
        {(collection.description || collection.intro) && <p>{collection.description || collection.intro}</p>}
        {collection.tags && collection.tags.length > 0 && (
          <div className="listing-tags">
            {collection.tags.slice(0, 4).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
      {collection.latestPosts && collection.latestPosts.length > 0 && (
        <div className="listing-collection-latest">
          {collection.latestPosts.map((post) => (
            <span key={post._id}>{post.title}</span>
          ))}
        </div>
      )}
    </Link>
  );
}

export function PostEntryLink({
  post,
  href,
  labels,
  compact = false,
  rambling = false,
}: {
  post: BlogListItem;
  href: string;
  labels: LocaleLabels;
  compact?: boolean;
  rambling?: boolean;
}) {
  const tags = post.tags?.filter((tag) => tag !== 'daily-ramblings') ?? [];

  return (
    <Link href={href} className={`listing-post-link ${compact ? 'is-compact' : ''} ${rambling ? 'is-rambling' : ''}`}>
      {!rambling && (
        <div className="listing-post-thumb">
          <CoverImage image={post.coverImage} title={post.title} className="listing-post-image" />
        </div>
      )}
      <div className="listing-post-copy">
        <div className="listing-card-topline">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, labels.locale)}</time>
          {post.collection?.title && <span>{post.collection.title}</span>}
        </div>
        <h2>{post.title}</h2>
        {(post.excerpt || post.bodyText) && <p>{post.excerpt || post.bodyText}</p>}
        {tags.length > 0 && (
          <div className="listing-tags">
            {tags.slice(0, 4).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function ProjectGrid({
  projects,
  category,
  labels,
}: {
  projects: ProjectDoc[];
  category: string;
  labels: LocaleLabels;
}) {
  return (
    <div className="listing-project-grid">
      {projects.map((project) => (
        <ProjectEntryCard key={project._id} project={project} href={`/${category}/${project.slug}`} labels={labels} />
      ))}
    </div>
  );
}

export function CollectionList({
  collections,
  category,
  project,
  labels,
}: {
  collections: CollectionDoc[];
  category: string;
  project: string;
  labels: LocaleLabels;
}) {
  return (
    <div className="listing-collection-list">
      {collections.map((collection) => (
        <CollectionEntryCard
          key={collection._id}
          collection={collection}
          href={`/${category}/${project}/${collection.slug}`}
          labels={labels}
        />
      ))}
    </div>
  );
}

export function PostList({
  posts,
  category,
  project,
  labels,
  compact,
  rambling,
}: {
  posts: BlogListItem[];
  category: string;
  project?: string;
  labels: LocaleLabels;
  compact?: boolean;
  rambling?: boolean;
}) {
  return (
    <div className={`${compact ? 'listing-post-list is-compact' : 'listing-post-list'} ${rambling ? 'is-rambling-list' : ''}`}>
      {posts.map((post) => (
        <PostEntryLink
          key={post._id}
          post={post}
          href={postHref(category, project, post)}
          labels={labels}
          compact={compact}
          rambling={rambling}
        />
      ))}
    </div>
  );
}
