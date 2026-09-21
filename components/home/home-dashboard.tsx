"use client";

import Image from "next/image";
import { SnowRidge } from "@/components/site/snow-ridge";
import { useEffect, useState } from "react";
import { Link } from "@/lib/i18n/navigation";
import type {
  HomeCategoryCard,
  HomeEntryCard,
  HomePayload,
  HomeProjectCard,
  MottoDoc,
  SpecialBlogItem,
} from "@/lib/sanity/types";

export interface HomeLabels {
  heroTitle: [string, string];
  heroIntro: string;
  readNotes: string;
  meetMe: string;
  dateLocale: string;
  viewAll: string;
  refresh: string;
  noPosts: string;
  featured: string;
  entryKinds: Record<HomeEntryCard["kind"], string>;
  skills: string;
  ongoingProjects: string;
  completedProjects: string;
  ramblings: string;
  ramblingsTitleMode: "vertical" | "rotated";
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
  { id: "base-camp", altitude: "3200m" },
  { id: "technical-ridge", altitude: "4200m" },
  { id: "snowfield-traverse", altitude: "5100m" },
  { id: "night-camp", altitude: "6200m" },
] as const;

function postHref(post: SpecialBlogItem) {
  const category = post.category?.slug;
  const project = post.project?.slug;
  if (!category) return "/";
  if (project && post.collection?.slug)
    return `/${category}/${project}/${post.collection.slug}/${post.slug}`;
  if (project) return `/${category}/${project}/${post.slug}`;
  return `/${category}/${post.slug}`;
}

function formatDate(date: string | undefined, locale: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
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

function introOf(item: {
  intro?: string;
  description?: string;
  excerpt?: string;
}) {
  return item.intro || item.description || item.excerpt || "";
}

function excerptText(text: string | undefined, length = 120) {
  if (!text) return "";
  const trimmed = text.replace(/\s+/g, " ").trim();
  const excerpt = Array.from(trimmed).slice(0, length).join("");
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
    <header className="snowline-chapter-heading">
      <span className="snowline-chapter-index">0{index + 1}</span>
      <div>
        <span className="snowline-altitude">{chapter.altitude}</span>
        <h2 id={`${chapter.id}-title`}>{title}</h2>
        <p>{detail}</p>
      </div>
    </header>
  );
}

function RouteNavigation({
  activeChapter,
  labels,
}: {
  activeChapter: string;
  labels: HomeLabels;
}) {
  return (
    <nav className="snowline-route-nav" aria-label={labels.route}>
      <span className="snowline-route-title">{labels.route}</span>
      <ol>
        {chapters.map((chapter, index) => (
          <li
            key={chapter.id}
            className={activeChapter === chapter.id ? "is-active" : ""}
          >
            <a
              href={`#${chapter.id}`}
              aria-current={
                activeChapter === chapter.id ? "location" : undefined
              }
            >
              <span className="snowline-route-dot" aria-hidden="true" />
              <span className="snowline-route-copy">
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

function PostLogRow({
  post,
  labels,
  index,
}: {
  post: SpecialBlogItem;
  labels: HomeLabels;
  index: number;
}) {
  return (
    <Link href={postHref(post)} className="snowline-post-row">
      <span className="snowline-post-number">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="snowline-post-thumb">
        {post.coverImage?.url ? (
          <Image
            src={post.coverImage.url}
            alt={post.coverImage.alt || post.title}
            width={160}
            height={120}
            className="snowline-post-image"
            unoptimized
          />
        ) : (
          <span className="snowline-post-placeholder" aria-hidden="true">
            <SnowRidge />
          </span>
        )}
      </span>
      <span className="snowline-post-copy">
        <span className="snowline-post-meta">
          {post.category?.title || post.authorName || "iceaxing"}
          <time dateTime={post.publishedAt}>
            {formatDate(post.publishedAt, labels.dateLocale)}
          </time>
        </span>
        <strong>{post.title}</strong>
        {post.excerpt && (
          <span className="snowline-post-excerpt">{post.excerpt}</span>
        )}
      </span>
      <span className="snowline-link-arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

function SkillMarker({
  category,
  index,
}: {
  category: HomeCategoryCard;
  index: number;
}) {
  return (
    <Link href={`/${category.slug}`} className="snowline-skill-marker">
      <span>{String(index + 1).padStart(2, "0")}</span>
      <div>
        <h3>{category.title}</h3>
        {introOf(category) && <p>{introOf(category)}</p>}
      </div>
      <i aria-hidden="true" />
    </Link>
  );
}

function ProjectNote({
  project,
  labels,
  completed = false,
}: {
  project: HomeProjectCard;
  labels: HomeLabels;
  completed?: boolean;
}) {
  const progress = Math.max(1, Math.min(5, project.progress || 1));
  return (
    <Link
      href={
        project.category ? `/${project.category.slug}/${project.slug}` : "/"
      }
      className={`snowline-project-note ${completed ? "is-completed" : ""}`}
    >
      <span className="snowline-project-kicker">
        {project.category?.title || labels.project}
        {project.createdAt && (
          <time dateTime={project.createdAt}>
            {formatDate(project.createdAt, labels.dateLocale)}
          </time>
        )}
      </span>
      <h3>{project.title}</h3>
      {introOf(project) && <p>{introOf(project)}</p>}
      <span
        className="snowline-progress"
        aria-label={`${labels.progress} ${progress}/5`}
      >
        {Array.from({ length: 5 }, (_, index) => (
          <i key={index} className={index < progress ? "is-filled" : ""} />
        ))}
      </span>
    </Link>
  );
}

function LifeSign({
  category,
  index,
}: {
  category: HomeCategoryCard;
  index: number;
}) {
  return (
    <Link
      href={`/${category.slug}`}
      className={`snowline-life-sign snowline-life-sign-${(index % 3) + 1}`}
    >
      <span>{category.title}</span>
      <small>{introOf(category)}</small>
      <i aria-hidden="true" />
    </Link>
  );
}

function LifeJournalCard({
  post,
  labels,
  index,
}: {
  post: SpecialBlogItem;
  labels: HomeLabels;
  index: number;
}) {
  return (
    <Link
      href={postHref(post)}
      className={`snowline-life-card snowline-life-card-${(index % 5) + 1} ${post.coverImage?.url ? "" : "is-text-only"}`}
    >
      <span className="snowline-life-media">
        {post.coverImage?.url ? (
          <Image
            src={post.coverImage.url}
            alt={post.coverImage.alt || post.title}
            width={720}
            height={500}
            className="snowline-life-image"
            unoptimized
          />
        ) : (
          <span className="snowline-life-placeholder" aria-hidden="true" />
        )}
      </span>
      <span className="snowline-life-copy">
        <span>{post.category?.title || labels.life}</span>
        <strong>{post.title}</strong>
        <time dateTime={post.publishedAt}>
          {formatDate(post.publishedAt, labels.dateLocale)}
        </time>
      </span>
    </Link>
  );
}

function RamblingNote({
  post,
  labels,
  index,
}: {
  post: SpecialBlogItem;
  labels: HomeLabels;
  index: number;
}) {
  const tags =
    post.tags?.filter((tag) => tag !== "daily-ramblings").slice(0, 2) ?? [];
  return (
    <Link href={postHref(post)} className="snowline-rambling-note">
      <span className="snowline-note-index">
        FIELD NOTE / {String(index + 1).padStart(2, "0")}
      </span>
      <h3>{post.title}</h3>
      {(post.excerpt || post.bodyText) && (
        <p>{post.excerpt || excerptText(post.bodyText)}</p>
      )}
      <span className="snowline-note-foot">
        <time dateTime={post.publishedAt}>
          {formatDate(post.publishedAt, labels.dateLocale)}
        </time>
        <span>{tags.map((tag) => `#${tag}`).join(" ")}</span>
      </span>
    </Link>
  );
}

function CampEntry({
  entry,
  labels,
  index,
}: {
  entry: HomeEntryCard;
  labels: HomeLabels;
  index: number;
}) {
  return (
    <Link href={entry.href} className="snowline-camp-entry">
      <span className="snowline-entry-number">0{index + 1}</span>
      <span className="snowline-entry-kind">
        {labels.entryKinds[entry.kind]}
      </span>
      <h3>{entry.title}</h3>
      {entry.intro && <p>{entry.intro}</p>}
      <span className="snowline-link-arrow" aria-hidden="true">
        →
      </span>
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
  const [activeChapter, setActiveChapter] =
    useState<(typeof chapters)[number]["id"]>("base-camp");

  useEffect(() => {
    const observers = chapters.map((chapter) => {
      const target = document.getElementById(chapter.id);
      if (!target) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveChapter(chapter.id);
        },
        { rootMargin: "-30% 0px -55% 0px", threshold: 0 },
      );
      observer.observe(target);
      return observer;
    });
    return () => observers.forEach((observer) => observer?.disconnect());
  }, []);

  const specialPosts =
    specialSeed === 0
      ? payload.specialPosts.slice(0, 3)
      : pickRandom(payload.specialPosts, 3, specialSeed);
  const completedProjects =
    completedSeed === 0
      ? payload.completedProjects.slice(0, 3)
      : pickRandom(payload.completedProjects, 3, completedSeed);
  const lifeRecentPosts =
    lifeSeed === 0
      ? payload.lifeRecentPosts.slice(0, 3)
      : pickRandom(payload.lifeRecentPosts, 3, lifeSeed);

  return (
    <div className="snowline-home">
      <RouteNavigation activeChapter={activeChapter} labels={labels} />
      <section
        id="base-camp"
        className="snowline-hero"
        aria-labelledby="snowline-site-title"
      >
        <SnowRidge />
        <div className="snowline-hero-inner">
          <div className="snowline-hero-copy">
            <span className="snowline-eyebrow">
              ICEAXING / ABOVE THE SNOWLINE
            </span>
            <h1 id="snowline-site-title">
              {labels.heroTitle[0]}
              <br />
              <span>{labels.heroTitle[1]}</span>
            </h1>
            <p className="snowline-site-intro">
              {payload.siteIntro || labels.heroIntro}
            </p>
            <div className="snowline-hero-actions">
              <a href="#selected-notes" className="snowline-button">
                {labels.readNotes}
                <span aria-hidden="true">↗</span>
              </a>
              <Link href="/profile" className="snowline-text-link">
                {labels.meetMe}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            {motto?.text && (
              <figure className="snowline-motto">
                <blockquote>{motto.text}</blockquote>
                {motto.source && <figcaption>— {motto.source}</figcaption>}
              </figure>
            )}
          </div>
          <div className="snowline-hero-foot">
            <span>01 / {labels.chapterNames[0]}</span>
            <a href="#selected-notes">
              {labels.nextCamp} <span aria-hidden="true">↓</span>
            </a>
            <span>3,200 M</span>
          </div>
        </div>
      </section>

      <section
        id="selected-notes"
        className="snowline-section snowline-selected"
        aria-labelledby="selected-title"
      >
        <div className="snowline-section-bar">
          <div>
            <span className="snowline-eyebrow">01 / SELECTED NOTES</span>
            <h2 id="selected-title">{labels.featured}</h2>
          </div>
          <button
            type="button"
            className="snowline-icon-button"
            title={labels.refresh}
            aria-label={labels.refresh}
            onClick={() => setSpecialSeed((seed) => seed + 1)}
          >
            ↻
          </button>
        </div>
        <div className="snowline-post-list">
          {specialPosts.length ? (
            specialPosts.map((post, index) => (
              <PostLogRow
                key={post._id}
                post={post}
                labels={labels}
                index={index}
              />
            ))
          ) : (
            <p className="snowline-empty-note">{labels.noPosts}</p>
          )}
        </div>
      </section>

      <section
        id="technical-ridge"
        className="snowline-section snowline-technical"
        aria-labelledby="technical-ridge-title"
      >
        <ChapterHeading
          index={1}
          title={labels.chapterNames[1]}
          detail={labels.skills}
        />
        <div className="snowline-ridge-layout">
          <div className="snowline-project-route">
            <div className="snowline-subheading">
              <span className="snowline-eyebrow">IN THE MAKING</span>
              <h3>{labels.ongoingProjects}</h3>
            </div>
            <div className="snowline-project-stack">
              {payload.ongoingProjects.length ? (
                payload.ongoingProjects
                  .slice(0, 3)
                  .map((project) => (
                    <ProjectNote
                      key={project._id}
                      project={project}
                      labels={labels}
                    />
                  ))
              ) : (
                <p className="snowline-empty-note">{labels.noPosts}</p>
              )}
            </div>
          </div>
          <aside className="snowline-skill-route">
            <div className="snowline-subheading">
              <span className="snowline-eyebrow">EXPLORING</span>
              <h3>{labels.skills}</h3>
            </div>
            <div className="snowline-skill-list">
              {payload.skillCategories.length ? (
                payload.skillCategories.map((category, index) => (
                  <SkillMarker
                    key={category._id}
                    category={category}
                    index={index}
                  />
                ))
              ) : (
                <p className="snowline-empty-note">{labels.noPosts}</p>
              )}
            </div>
          </aside>
        </div>
        <div className="snowline-completed-heading">
          <h3>{labels.completedProjects}</h3>
          <button
            type="button"
            className="snowline-icon-button"
            title={labels.refresh}
            aria-label={labels.refresh}
            onClick={() => setCompletedSeed((seed) => seed + 1)}
          >
            ↻
          </button>
        </div>
        <div className="snowline-completed-grid">
          {completedProjects.length ? (
            completedProjects.map((project) => (
              <ProjectNote
                key={project._id}
                project={project}
                labels={labels}
                completed
              />
            ))
          ) : (
            <p className="snowline-empty-note">{labels.noPosts}</p>
          )}
        </div>
      </section>

      <section
        id="snowfield-traverse"
        className="snowline-section snowline-life"
        aria-labelledby="snowfield-traverse-title"
      >
        <ChapterHeading
          index={2}
          title={labels.chapterNames[2]}
          detail={labels.lifeRecent.replace(/\\n/g, " ")}
        />
        <div className="snowline-life-toolbar">
          <div className="snowline-sign-list">
            {payload.lifeCategories.map((category, index) => (
              <LifeSign key={category._id} category={category} index={index} />
            ))}
          </div>
          <button
            type="button"
            className="snowline-icon-button"
            title={labels.refresh}
            aria-label={labels.refresh}
            onClick={() => setLifeSeed((seed) => seed + 1)}
          >
            ↻
          </button>
        </div>
        <div className="snowline-life-grid">
          {lifeRecentPosts.length ? (
            lifeRecentPosts.map((post, index) => (
              <LifeJournalCard
                key={post._id}
                post={post}
                labels={labels}
                index={index}
              />
            ))
          ) : (
            <p className="snowline-empty-note">{labels.noPosts}</p>
          )}
        </div>
      </section>

      <section
        id="night-camp"
        className="snowline-section snowline-night"
        aria-labelledby="night-camp-title"
      >
        <ChapterHeading
          index={3}
          title={labels.chapterNames[3]}
          detail={labels.fieldNotes}
        />
        <div className="snowline-night-layout">
          <div>
            <div className="snowline-subheading">
              <h3>
                <Link href="/daily-ramblings">
                  {labels.ramblings} <span aria-hidden="true">↗</span>
                </Link>
              </h3>
            </div>
            <div className="snowline-note-list">
              {payload.ramblingPosts.length ? (
                payload.ramblingPosts
                  .slice(0, 3)
                  .map((post, index) => (
                    <RamblingNote
                      key={post._id}
                      post={post}
                      labels={labels}
                      index={index}
                    />
                  ))
              ) : (
                <p className="snowline-empty-note">{labels.noPosts}</p>
              )}
            </div>
          </div>
          <div className="snowline-entry-grid">
            {payload.entryCards.map((entry, index) => (
              <CampEntry
                key={entry._id}
                entry={entry}
                labels={labels}
                index={index}
              />
            ))}
          </div>
        </div>
        <div className="snowline-closing">
          <SnowRidge />
          <span>KEEP EXPLORING.</span>
          <a href="#base-camp" className="snowline-text-link">
            3,200 — 6,200 M <span aria-hidden="true">↑</span>
          </a>
        </div>
      </section>
    </div>
  );
}
