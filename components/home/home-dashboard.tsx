'use client';

import Image from 'next/image';
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
  ramblingsTitleMode: 'vertical' | 'rotated';
  life: string;
  lifeRecent: string;
  project: string;
  progress: string;
  route: string;
  dispatch: string;
  nextCamp: string;
  fieldNotes: string;
  chapterNames: [string, string, string, string];
}

const chapters = [
  { id: 'base-camp', altitude: '3200m' },
  { id: 'technical-ridge', altitude: '4200m' },
  { id: 'snowfield-traverse', altitude: '5100m' },
  { id: 'night-camp', altitude: '6200m' },
] as const;

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

function excerptText(text: string | undefined, length = 120) {
  if (!text) return '';
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  const excerpt = Array.from(trimmed).slice(0, length).join('');
  return excerpt.length < trimmed.length ? `${excerpt}...` : excerpt;
}

function ChapterHeading({
  index,
  title,
  detail,
}: {
  index: number;
  title: string;
  detail: string;
}) {
  const chapter = chapters[index];
  return (
    <header className="mountain-chapter-heading">
      <span className="mountain-chapter-index">0{index + 1}</span>
      <div>
        <span className="mountain-altitude">{chapter.altitude}</span>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
    </header>
  );
}

function RouteNavigation({ activeChapter, labels }: { activeChapter: string; labels: HomeLabels }) {
  return (
    <nav className="mountain-route-nav" aria-label={labels.route}>
      <span className="mountain-route-title">{labels.route}</span>
      <ol>
        {chapters.map((chapter, index) => (
          <li key={chapter.id} className={activeChapter === chapter.id ? 'is-active' : ''}>
            <a href={`#${chapter.id}`} aria-current={activeChapter === chapter.id ? 'location' : undefined}>
              <span className="mountain-route-dot" aria-hidden="true" />
              <span className="mountain-route-copy">
                <b>{chapter.altitude}</b>
                <small>{labels.chapterNames[index]}</small>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function PostLogRow({ post, labels, index }: { post: SpecialBlogItem; labels: HomeLabels; index: number }) {
  return (
    <Link href={postHref(post)} className="mountain-post-row">
      <span className="mountain-post-number">{String(index + 1).padStart(2, '0')}</span>
      <span className="mountain-post-thumb">
        {post.coverImage?.url ? (
          <Image
            src={post.coverImage.url}
            alt={post.coverImage.alt || post.title}
            width={160}
            height={120}
            className="mountain-post-image"
            unoptimized
          />
        ) : (
          <span className="mountain-post-placeholder" aria-hidden="true" />
        )}
      </span>
      <span className="mountain-post-copy">
        <span className="mountain-post-meta">
          {post.category?.title || post.authorName || 'iceaxing'}
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, labels.dateLocale)}</time>
        </span>
        <strong>{post.title}</strong>
        {post.excerpt && <span className="mountain-post-excerpt">{post.excerpt}</span>}
      </span>
      <span className="mountain-link-arrow" aria-hidden="true">↗</span>
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
  const [monthCursor, setMonthCursor] = useState(new Date(base.getFullYear(), base.getMonth(), 1));

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
    <section className="mountain-calendar" aria-labelledby="mountain-calendar-title">
      <div className="mountain-calendar-head">
        <div>
          <span>{labels.fieldNotes}</span>
          <h3 id="mountain-calendar-title">{labels.calendar}</h3>
        </div>
        <div className="mountain-calendar-controls">
          <button
            type="button"
            title={labels.previousMonth}
            aria-label={labels.previousMonth}
            onClick={() => setMonthCursor(new Date(year, month - 1, 1))}
          >
            ‹
          </button>
          <strong>{year}.{String(month + 1).padStart(2, '0')}</strong>
          <button
            type="button"
            title={labels.nextMonth}
            aria-label={labels.nextMonth}
            onClick={() => setMonthCursor(new Date(year, month + 1, 1))}
          >
            ›
          </button>
        </div>
      </div>
      <div className="mountain-calendar-week" aria-hidden="true">
        {labels.weekDays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
      </div>
      <div className="mountain-calendar-days">
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

function SkillMarker({ category, index }: { category: HomeCategoryCard; index: number }) {
  return (
    <Link href={`/${category.slug}`} className="mountain-skill-marker">
      <span>{String(index + 1).padStart(2, '0')}</span>
      <div>
        <h3>{category.title}</h3>
        {introOf(category) && <p>{introOf(category)}</p>}
      </div>
      <i aria-hidden="true" />
    </Link>
  );
}

function ProjectNote({ project, labels, completed = false }: {
  project: HomeProjectCard;
  labels: HomeLabels;
  completed?: boolean;
}) {
  const progress = Math.max(1, Math.min(5, project.progress || 1));
  return (
    <Link
      href={project.category ? `/${project.category.slug}/${project.slug}` : '/'}
      className={`mountain-project-note ${completed ? 'is-completed' : ''}`}
    >
      <span className="mountain-project-kicker">
        {project.category?.title || labels.project}
        {project.createdAt && <time dateTime={project.createdAt}>{formatDate(project.createdAt, labels.dateLocale)}</time>}
      </span>
      <h3>{project.title}</h3>
      {introOf(project) && <p>{introOf(project)}</p>}
      <span className="mountain-progress" aria-label={`${labels.progress} ${progress}/5`}>
        {Array.from({ length: 5 }, (_, index) => (
          <i key={index} className={index < progress ? 'is-filled' : ''} />
        ))}
      </span>
    </Link>
  );
}

function LifeSign({ category, index }: { category: HomeCategoryCard; index: number }) {
  return (
    <Link href={`/${category.slug}`} className={`mountain-life-sign mountain-life-sign-${(index % 3) + 1}`}>
      <span>{category.title}</span>
      <small>{introOf(category)}</small>
      <i aria-hidden="true" />
    </Link>
  );
}

function LifeJournalCard({ post, labels, index }: {
  post: SpecialBlogItem;
  labels: HomeLabels;
  index: number;
}) {
  return (
    <Link href={postHref(post)} className={`mountain-life-card mountain-life-card-${(index % 3) + 1}`}>
      <span className="mountain-life-media">
        {post.coverImage?.url ? (
          <Image
            src={post.coverImage.url}
            alt={post.coverImage.alt || post.title}
            width={720}
            height={500}
            className="mountain-life-image"
            unoptimized
          />
        ) : (
          <span className="mountain-life-placeholder" aria-hidden="true" />
        )}
      </span>
      <span className="mountain-life-copy">
        <span>{post.category?.title || labels.life}</span>
        <strong>{post.title}</strong>
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, labels.dateLocale)}</time>
      </span>
    </Link>
  );
}

function RamblingNote({ post, labels, index }: { post: SpecialBlogItem; labels: HomeLabels; index: number }) {
  const tags = post.tags?.filter((tag) => tag !== 'daily-ramblings').slice(0, 2) ?? [];
  return (
    <Link href={postHref(post)} className="mountain-rambling-note">
      <span className="mountain-note-index">FIELD NOTE / {String(index + 1).padStart(2, '0')}</span>
      <h3>{post.title}</h3>
      {post.excerpt && <p>{post.excerpt}</p>}
      {!post.excerpt && post.bodyText && <p>{excerptText(post.bodyText)}</p>}
      <span className="mountain-note-foot">
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, labels.dateLocale)}</time>
        <span>{tags.map((tag) => `#${tag}`).join(' ')}</span>
      </span>
    </Link>
  );
}

function CampEntry({ entry, labels, index }: {
  entry: HomeEntryCard;
  labels: HomeLabels;
  index: number;
}) {
  return (
    <Link href={entry.href} className="mountain-camp-entry">
      <span className="mountain-entry-number">0{index + 1}</span>
      <span className="mountain-entry-kind">{labels.entryKinds[entry.kind]}</span>
      <h3>{entry.title}</h3>
      {entry.intro && <p>{entry.intro}</p>}
      <span className="mountain-link-arrow" aria-hidden="true">↗</span>
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
  const [activeChapter, setActiveChapter] = useState<(typeof chapters)[number]['id']>('base-camp');

  useEffect(() => {
    if (payload.mottos.length === 0) return;
    const timer = window.setTimeout(() => {
      setActiveMotto(payload.mottos[Math.floor(Math.random() * payload.mottos.length)]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [payload.mottos]);

  useEffect(() => {
    const observers = chapters.map((chapter) => {
      const target = document.getElementById(chapter.id);
      if (!target) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveChapter(chapter.id);
        },
        { rootMargin: '-30% 0px -55% 0px', threshold: 0 },
      );
      observer.observe(target);
      return observer;
    });
    return () => observers.forEach((observer) => observer?.disconnect());
  }, []);

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
    <main className="mountain-home">
      <RouteNavigation activeChapter={activeChapter} labels={labels} />

      <section id="base-camp" className="mountain-chapter mountain-base-camp" aria-labelledby="mountain-site-title">
        <div className="mountain-photo-credit" aria-hidden="true">N 46° / BASE ROUTE</div>
        <div className="mountain-base-layout">
          <div className="mountain-hero-copy">
            <span className="mountain-hero-altitude">3200m / {labels.chapterNames[0]}</span>
            <h1 id="mountain-site-title">iceaxing</h1>
            {payload.siteIntro && <p className="mountain-site-intro">{payload.siteIntro}</p>}
            {activeMotto?.text && (
              <figure className="mountain-motto">
                <blockquote>{activeMotto.text}</blockquote>
                {activeMotto.source && <figcaption>{activeMotto.source}</figcaption>}
              </figure>
            )}
            <a href="#technical-ridge" className="mountain-next-link">
              <span>{labels.nextCamp}</span>
              <i aria-hidden="true">↓</i>
            </a>
          </div>

          <div className="mountain-dispatch-panel">
            <div className="mountain-section-bar">
              <div>
                <span>{labels.dispatch}</span>
                <h2>{selectedDate ? `${selectedDate} / ${labels.postsOnDate}` : labels.featured}</h2>
              </div>
              <button
                type="button"
                className="mountain-icon-button"
                title={labels.refresh}
                aria-label={labels.refresh}
                onClick={() => {
                  setSelectedDate(null);
                  setSpecialSeed((seed) => seed + 1);
                }}
              >
                ↻
              </button>
            </div>
            <div className="mountain-post-list">
              {specialPosts.length > 0 ? (
                specialPosts.map((post, index) => (
                  <PostLogRow key={post._id} post={post} labels={labels} index={index} />
                ))
              ) : (
                <p className="mountain-empty-note">{labels.noPosts}</p>
              )}
            </div>
          </div>
        </div>

        <MiniCalendar
          posts={payload.calendarPosts}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          labels={labels}
        />
      </section>

      <section id="technical-ridge" className="mountain-chapter mountain-technical-ridge" aria-labelledby="technical-ridge-title">
        <div className="mountain-chapter-inner">
          <ChapterHeading
            index={1}
            title={labels.chapterNames[1]}
            detail={`${labels.skills} / ${labels.ongoingProjects} / ${labels.completedProjects}`}
          />

          <div className="mountain-ridge-layout">
            <section className="mountain-skill-route" aria-labelledby="technical-ridge-title">
              <div className="mountain-route-line" aria-hidden="true" />
              <div className="mountain-subheading">
                <span>BASE / 01</span>
                <h3 id="technical-ridge-title">{labels.skills}</h3>
              </div>
              <div className="mountain-skill-list">
                {payload.skillCategories.map((category, index) => (
                  <SkillMarker key={category._id} category={category} index={index} />
                ))}
              </div>
            </section>

            <section className="mountain-project-route" aria-labelledby="ongoing-projects-title">
              <div className="mountain-subheading">
                <span>ASCENT / 02</span>
                <h3 id="ongoing-projects-title">{labels.ongoingProjects}</h3>
              </div>
              <div className="mountain-project-stack">
                {payload.ongoingProjects.slice(0, 5).map((project) => (
                  <ProjectNote key={project._id} project={project} labels={labels} />
                ))}
              </div>
            </section>

            <section className="mountain-summit-log" aria-labelledby="completed-projects-title">
              <div className="mountain-subheading">
                <span>SUMMIT / 03</span>
                <h3 id="completed-projects-title">{labels.completedProjects}</h3>
                <button
                  type="button"
                  className="mountain-icon-button"
                  title={labels.refresh}
                  aria-label={labels.refresh}
                  onClick={() => setCompletedSeed((seed) => seed + 1)}
                >
                  ↻
                </button>
              </div>
              <div className="mountain-completed-grid">
                {completedProjects.map((project) => (
                  <ProjectNote key={project._id} project={project} labels={labels} completed />
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>

      <section id="snowfield-traverse" className="mountain-chapter mountain-snowfield" aria-labelledby="snowfield-title">
        <div className="mountain-chapter-inner">
          <ChapterHeading
            index={2}
            title={labels.chapterNames[2]}
            detail={`${labels.life} / ${labels.lifeRecent}`}
          />

          <div className="mountain-snowfield-layout">
            <section className="mountain-life-signs" aria-labelledby="snowfield-title">
              <div className="mountain-subheading">
                <span>TRAIL MARKERS</span>
                <h3 id="snowfield-title">{labels.life}</h3>
              </div>
              <div className="mountain-sign-list">
                {payload.lifeCategories.map((category, index) => (
                  <LifeSign key={category._id} category={category} index={index} />
                ))}
              </div>
            </section>

            <section className="mountain-life-journal" aria-labelledby="life-journal-title">
              <div className="mountain-section-bar">
                <div>
                  <span>VISUAL JOURNAL</span>
                  <h3 id="life-journal-title">{labels.lifeRecent}</h3>
                </div>
                <button
                  type="button"
                  className="mountain-icon-button"
                  title={labels.refresh}
                  aria-label={labels.refresh}
                  onClick={() => setLifeSeed((seed) => seed + 1)}
                >
                  ↻
                </button>
              </div>
              <div className="mountain-life-grid">
                {lifeRecentPosts.map((post, index) => (
                  <LifeJournalCard key={post._id} post={post} labels={labels} index={index} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>

      <section id="night-camp" className="mountain-chapter mountain-night-camp" aria-labelledby="night-camp-title">
        <div className="mountain-stars" aria-hidden="true" />
        <div className="mountain-chapter-inner">
          <ChapterHeading
            index={3}
            title={labels.chapterNames[3]}
            detail={`${labels.ramblings} / ${payload.entryCards.map((entry) => labels.entryKinds[entry.kind]).join(' / ')}`}
          />

          <div className="mountain-night-layout">
            <section className="mountain-field-notes" aria-labelledby="night-camp-title">
              <div className="mountain-subheading">
                <span>{labels.fieldNotes}</span>
                <h3 id="night-camp-title">
                  <Link href="/daily-ramblings">{labels.ramblings}</Link>
                </h3>
              </div>
              <div className="mountain-note-list">
                {payload.ramblingPosts.slice(0, 3).map((post, index) => (
                  <RamblingNote key={post._id} post={post} labels={labels} index={index} />
                ))}
              </div>
            </section>

            <section className="mountain-camp-map" aria-label="Camp destinations">
              <span className="mountain-camp-light" aria-hidden="true" />
              <div className="mountain-entry-grid">
                {payload.entryCards.map((entry, index) => (
                  <CampEntry key={entry._id} entry={entry} labels={labels} index={index} />
                ))}
              </div>
            </section>
          </div>
        </div>

        <footer className="mountain-home-footer">
          <span>iceaxing</span>
          <span>3200m → 6200m</span>
          <a href="#base-camp">↑ TOP</a>
        </footer>
      </section>
    </main>
  );
}
