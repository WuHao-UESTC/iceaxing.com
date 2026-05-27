'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/lib/i18n/navigation';
import type {
  HomeCategoryCard,
  HomeEntryCard,
  HomePayload,
  HomeProjectCard,
  MottoDoc,
  SpecialBlogItem,
} from '@/lib/sanity/types';

export interface HomeLabels {
  dateLocale: string;
  viewAll: string;
  refresh: string;
  noPosts: string;
  featured: string;
  postsOnDate: string;
  calendar: string;
  previousMonth: string;
  nextMonth: string;
  weekDays: string[];
  entryKinds: Record<HomeEntryCard['kind'], string>;
  skills: string;
  ongoingProjects: string;
  completedProjects: string;
  ramblings: string;
  life: string;
  lifeRecent: string;
  project: string;
  progress: string;
}

function postHref(post: SpecialBlogItem) {
  const category = post.category?.slug;
  const project = post.project?.slug;
  if (!category) return '/';
  if (project && post.collection?.slug) {
    return `/${category}/${project}/${post.collection.slug}/${post.slug}`;
  }
  if (project) return `/${category}/${project}/${post.slug}`;
  return `/${category}/${post.slug}`;
}

function formatDate(date: string | undefined, locale: string) {
  if (!date) return '';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
}

function dateKey(date: string) {
  return date.slice(0, 10);
}

function pickRandom<T>(items: T[], count: number, salt: number) {
  return [...items]
    .map((item, index) => {
      const seed = Math.sin((index + 1) * 9301 + salt * 49297) * 233280;
      return { item, order: seed - Math.floor(seed) };
    })
    .sort((a, b) => a.order - b.order)
    .slice(0, count)
    .map(({ item }) => item);
}

function introOf(item: { intro?: string; description?: string; excerpt?: string }) {
  return item.intro || item.description || item.excerpt || '';
}

function excerptText(text: string | undefined, length = 100) {
  if (!text) return '';
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  return `${Array.from(trimmed).slice(0, length).join('')}……`;
}

function Cover({ image, title }: { image?: { url?: string; alt?: string }; title: string }) {
  if (!image?.url) return <span className="home-cover-placeholder" aria-hidden="true" />;
  return (
    <Image
      src={image.url}
      alt={image.alt || title}
      width={800}
      height={450}
      className="home-cover-image"
      unoptimized
    />
  );
}

function SectionTitle({
  title,
  href,
  labels,
  action,
}: {
  title: string;
  href?: string;
  labels: HomeLabels;
  action?: ReactNode;
}) {
  return (
    <div className="home-grid-heading">
      <h2>{title}</h2>
      <div className="home-heading-actions">
        {action}
        {href && (
          <Link href={href} className="home-view-link">
            {labels.viewAll}
          </Link>
        )}
      </div>
    </div>
  );
}

function ArticleCard({
  post,
  labels,
  compact = false,
}: {
  post: SpecialBlogItem;
  labels: HomeLabels;
  compact?: boolean;
}) {
  return (
    <Link href={postHref(post)} className={`home-article-card ${compact ? 'is-compact' : ''}`}>
      <div className="home-card-media">
        <Cover image={post.coverImage} title={post.title} />
      </div>
      <div className="home-card-copy">
        <div className="home-card-meta">
          <span>{post.authorName || 'iceaxing'}</span>
          {post.category?.title && <span>{post.category.title}</span>}
          {post.project?.title && <span>{post.project.title}</span>}
        </div>
        <h3>{post.title}</h3>
        {post.excerpt && <p>{post.excerpt}</p>}
        <div className="home-card-foot">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, labels.dateLocale)}</time>
          {post.tags?.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}
        </div>
      </div>
    </Link>
  );
}

function RamblingItem({ post, labels }: { post: SpecialBlogItem; labels: HomeLabels }) {
  const tags = post.tags?.filter((tag) => tag !== 'daily-ramblings').slice(0, 3) ?? [];
  const bodyPreview = excerptText(post.bodyText);

  return (
    <Link href={postHref(post)} className="home-rambling-item">
      {tags.length > 0 && (
        <div className="home-rambling-tags">
          {tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      )}
      <div className="home-rambling-line">
        <h3>{post.title}</h3>
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, labels.dateLocale)}</time>
      </div>
      {post.excerpt && <p>{post.excerpt}</p>}
      {bodyPreview && <div className="home-rambling-body">{bodyPreview}</div>}
    </Link>
  );
}

function MiniCalendar({
  posts,
  selectedDate,
  onSelectDate,
  labels,
}: {
  posts: SpecialBlogItem[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  labels: HomeLabels;
}) {
  const postDates = useMemo(() => new Set(posts.map((post) => dateKey(post.publishedAt))), [posts]);
  const base = selectedDate ? new Date(selectedDate) : new Date();
  const [monthCursor, setMonthCursor] = useState(
    new Date(base.getFullYear(), base.getMonth(), 1),
  );

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }),
  ];

  return (
    <section className="home-calendar" aria-labelledby="home-calendar-title">
      <div className="home-calendar-head">
        <h2 id="home-calendar-title">{labels.calendar}</h2>
        <div className="home-calendar-controls">
          <button
            type="button"
            aria-label={labels.previousMonth}
            onClick={() => setMonthCursor(new Date(year, month - 1, 1))}
          >
            &lsaquo;
          </button>
          <button
            type="button"
            aria-label={labels.nextMonth}
            onClick={() => setMonthCursor(new Date(year, month + 1, 1))}
          >
            &rsaquo;
          </button>
        </div>
      </div>
      <strong className="home-calendar-month">
        {year}.{String(month + 1).padStart(2, '0')}
      </strong>
      <div className="home-calendar-week" aria-hidden="true">
        {labels.weekDays.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="home-calendar-days">
        {cells.map((cell, index) => {
          if (!cell) return <span key={`empty-${index}`} />;
          const hasPost = postDates.has(cell);
          const active = selectedDate === cell;
          return (
            <button
              key={cell}
              type="button"
              className={`${hasPost ? 'has-post' : ''} ${active ? 'is-active' : ''}`}
              onClick={() => onSelectDate(active ? null : cell)}
              aria-pressed={active}
            >
              {Number(cell.slice(-2))}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EntryCard({ entry, labels }: { entry: HomeEntryCard; labels: HomeLabels }) {
  return (
    <Link href={entry.href} className={`home-entry-tile is-${entry.kind}`}>
      <span>{labels.entryKinds[entry.kind]}</span>
      <h3>{entry.title}</h3>
      {entry.intro && <p>{entry.intro}</p>}
    </Link>
  );
}

function CategoryCard({
  category,
  labels,
  variant = 'list',
}: {
  category: HomeCategoryCard;
  labels: HomeLabels;
  variant?: 'list' | 'photo';
}) {
  return (
    <Link href={`/${category.slug}`} className={`home-taxonomy-card home-taxonomy-card-${variant}`}>
      <Cover image={category.coverImage} title={category.title} />
      <div>
        <h3>{category.title}</h3>
        {introOf(category) && <p>{introOf(category)}</p>}
        {category.createdAt && (
          <time dateTime={category.createdAt}>{formatDate(category.createdAt, labels.dateLocale)}</time>
        )}
      </div>
    </Link>
  );
}

function ProjectCard({ project, labels }: { project: HomeProjectCard; labels: HomeLabels }) {
  const progress = Math.max(1, Math.min(5, project.progress || 1));
  return (
    <Link href={project.category ? `/${project.category.slug}/${project.slug}` : '/'} className="home-project-card">
      <div>
        <span>{project.category?.title || labels.project}</span>
        <h3>{project.title}</h3>
        {introOf(project) && <p>{introOf(project)}</p>}
      </div>
      <div className="home-project-bottom">
        {project.createdAt && (
          <time dateTime={project.createdAt}>{formatDate(project.createdAt, labels.dateLocale)}</time>
        )}
        <span className="home-progress" aria-label={`${labels.progress} ${progress}/5`}>
          {Array.from({ length: 5 }, (_, index) => (
            <i key={index} className={index < progress ? 'is-filled' : ''} />
          ))}
        </span>
      </div>
    </Link>
  );
}

function LifeRecentCard({ post, labels }: { post: SpecialBlogItem; labels: HomeLabels }) {
  return (
    <Link href={postHref(post)} className="home-life-post-card">
      {post.coverImage?.url && (
        <Image
          src={post.coverImage.url}
          alt={post.coverImage.alt || post.title}
          width={640}
          height={420}
          className="home-life-post-bg"
          unoptimized
        />
      )}
      <div className="home-life-post-copy">
        <span>{post.category?.title || labels.life}</span>
        <h3>{post.title}</h3>
        {post.excerpt && <p>{post.excerpt}</p>}
      </div>
      <div className="home-life-post-bottom">
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, labels.dateLocale)}</time>
        <span className="home-life-post-mark" aria-hidden="true" />
      </div>
    </Link>
  );
}

export function HomeDashboard({
  payload,
  motto,
  labels,
}: {
  payload: HomePayload;
  motto?: MottoDoc;
  labels: HomeLabels;
}) {
  const [specialSeed, setSpecialSeed] = useState(0);
  const [completedSeed, setCompletedSeed] = useState(0);
  const [lifeSeed, setLifeSeed] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeMotto, setActiveMotto] = useState<MottoDoc | undefined>(motto);

  useEffect(() => {
    if (payload.mottos.length === 0) return;
    const timer = window.setTimeout(() => {
      setActiveMotto(payload.mottos[Math.floor(Math.random() * payload.mottos.length)]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [payload.mottos]);

  const datePosts = selectedDate
    ? payload.calendarPosts.filter((post) => dateKey(post.publishedAt) === selectedDate).slice(0, 5)
    : [];
  const specialPosts = selectedDate
    ? datePosts
    : (specialSeed === 0
      ? payload.specialPosts.slice(0, 5)
      : pickRandom(payload.specialPosts, 5, specialSeed));
  const completedProjects = completedSeed === 0
    ? payload.completedProjects.slice(0, 3)
    : pickRandom(payload.completedProjects, 3, completedSeed);
  const lifeRecentPosts = lifeSeed === 0
    ? payload.lifeRecentPosts.slice(0, 5)
    : pickRandom(payload.lifeRecentPosts, 5, lifeSeed);

  return (
    <div className="home-page">
      <section className="home-masthead">
        <div>
          <h1>iceaxing</h1>
          {payload.siteIntro && <p className="home-site-intro">{payload.siteIntro}</p>}
        </div>
        {activeMotto?.text && (
          <figure>
            <blockquote>{activeMotto.text}</blockquote>
            {activeMotto.source && <figcaption>{activeMotto.source}</figcaption>}
          </figure>
        )}
      </section>

      <div className="home-top-grid">
        <section className="home-feature-zone" aria-labelledby="home-special-title">
          <SectionTitle
            title={selectedDate ? `${selectedDate} : ${labels.postsOnDate}` : labels.featured}
            labels={labels}
            action={(
              <button
                type="button"
                className="home-refresh"
                onClick={() => {
                  setSelectedDate(null);
                  setSpecialSeed((seed) => seed + 1);
                }}
              >
                {labels.refresh}
              </button>
            )}
          />
          <div className="home-feature-list">
            {specialPosts.length > 0 ? (
              specialPosts.map((post) => <ArticleCard key={post._id} post={post} labels={labels} />)
            ) : (
              <p className="home-empty-note">{labels.noPosts}</p>
            )}
          </div>
        </section>

        <MiniCalendar
          posts={payload.calendarPosts}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          labels={labels}
        />
      </div>

      <section className="home-entry-strip" aria-label="Entry links">
        <div className="home-entry-strip-grid">
          {payload.entryCards.map((entry) => <EntryCard key={entry._id} entry={entry} labels={labels} />)}
        </div>
      </section>

      <div className="home-mid-grid">
        <section className="home-skills" aria-labelledby="home-skills-title">
          <SectionTitle title={labels.skills} labels={labels} />
          <div className="home-taxonomy-list">
            {payload.skillCategories.map((category) => (
              <CategoryCard key={category._id} category={category} labels={labels} />
            ))}
          </div>
        </section>

        <div className="home-project-column">
          <section className="home-projects" aria-labelledby="home-ongoing-title">
            <SectionTitle title={labels.ongoingProjects} labels={labels} />
            <div className="home-project-list">
              {payload.ongoingProjects.slice(0, 5).map((project) => (
                <ProjectCard key={project._id} project={project} labels={labels} />
              ))}
            </div>
          </section>

          <section className="home-projects" aria-labelledby="home-completed-title">
            <SectionTitle
              title={labels.completedProjects}
              labels={labels}
              action={(
                <button
                  type="button"
                  className="home-refresh"
                  onClick={() => setCompletedSeed((seed) => seed + 1)}
                >
                  {labels.refresh}
                </button>
              )}
            />
            <div className="home-project-list">
              {completedProjects.map((project) => (
                <ProjectCard key={project._id} project={project} labels={labels} />
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="home-ramblings" aria-labelledby="home-ramblings-title">
        <SectionTitle title={labels.ramblings} href="/daily-ramblings" labels={labels} />
        <div className="home-rambling-grid">
          {payload.ramblingPosts.slice(0, 3).map((post) => (
            <RamblingItem key={post._id} post={post} labels={labels} />
          ))}
        </div>
      </section>

      <div className="home-life-row">
        <section className="home-life" aria-labelledby="home-life-title">
          <SectionTitle title={labels.life} labels={labels} />
          <div className="home-life-grid">
            {payload.lifeCategories.map((category) => (
              <CategoryCard key={category._id} category={category} labels={labels} variant="photo" />
            ))}
          </div>
        </section>

        <section className="home-life-recent" aria-labelledby="home-life-recent-title">
          <SectionTitle
            title={labels.lifeRecent}
            labels={labels}
            action={(
              <button
                type="button"
                className="home-refresh"
                onClick={() => setLifeSeed((seed) => seed + 1)}
              >
                {labels.refresh}
              </button>
            )}
          />
          <div className="home-life-post-list">
            {lifeRecentPosts.map((post) => (
              <LifeRecentCard key={post._id} post={post} labels={labels} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
