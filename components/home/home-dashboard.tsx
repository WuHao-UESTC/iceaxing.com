"use client";

import Image from "next/image";
import { SubscribeDialog } from "@/components/subscribe/subscribe-dialog";
import { useState, type ReactNode, type MouseEvent } from "react";
import { ChapterLandscape } from "./chapter-landscape";
import { FeaturedStrip } from "./featured-strip";
import { chapters, useHomeJourney, type ChapterId } from "./use-home-journey";
import { formatDate, postHref } from "./home-utils";
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
  chapterIntros: [string, string, string];
  campLetter: string;
  campDirectory: string;
  readNotes: string;
  meetMe: string;
  previousArticles: string;
  nextArticles: string;
  previousChapter: string;
  nextChapter: string;
  backToTop: string;
  moreCategories: string;
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
    <header className="snowline-chapter-heading" data-reveal data-step="1">
      <span className="snowline-chapter-index">0{index + 1}</span>
      <div>
        <span className="snowline-altitude">{chapter.altitude}</span>
        <h2 id={`${chapter.id}-title`} tabIndex={-1}>
          {title}
        </h2>
        <p>{detail}</p>
      </div>
    </header>
  );
}

function chapterClick(
  event: MouseEvent<HTMLAnchorElement>,
  id: ChapterId | "selected-notes",
  navigate: (id: ChapterId | "selected-notes") => void,
) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(id);
}

function RouteNavigation({
  activeChapter,
  labels,
  navigate,
}: {
  activeChapter: string;
  labels: HomeLabels;
  navigate: (id: ChapterId | "selected-notes") => void;
}) {
  const active = chapters.findIndex((chapter) => chapter.id === activeChapter);
  return (
    <nav className="snowline-route-nav" aria-label={labels.route}>
      <button
        type="button"
        className="journey-mobile-control"
        disabled={active === 0}
        aria-label={labels.previousChapter}
        onClick={() => navigate(chapters[active - 1].id)}
      >
        ↑
      </button>
      <span className="journey-mobile-count">
        0{active + 1}
        <span> / 04</span>
      </span>
      <ol>
        {chapters.map((chapter, index) => (
          <li
            key={chapter.id}
            className={activeChapter === chapter.id ? "is-active" : ""}
          >
            <a
              href={`#${chapter.id}`}
              onClick={(event) => chapterClick(event, chapter.id, navigate)}
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
      <button
        type="button"
        className="journey-mobile-control"
        disabled={active === chapters.length - 1}
        aria-label={labels.nextChapter}
        onClick={() => navigate(chapters[active + 1].id)}
      >
        ↓
      </button>
    </nav>
  );
}

function PanelEnd({
  index,
  labels,
  navigate,
}: {
  index: number;
  labels: HomeLabels;
  navigate: (id: ChapterId | "selected-notes") => void;
}) {
  const next = chapters[(index + 1) % chapters.length];
  return (
    <div className="snowline-panel-foot" data-reveal data-step="6">
      <span>
        0{index + 1} / {labels.chapterNames[index]}
      </span>
      <a
        href={`#${next.id}`}
        onClick={(event) => chapterClick(event, next.id, navigate)}
      >
        {index === 3 ? labels.backToTop : labels.nextCamp}
        <span aria-hidden="true">{index === 3 ? "↑" : "↓"}</span>
      </a>
      <span>{chapters[index].altitude}</span>
    </div>
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
  step = 3,
}: {
  project: HomeProjectCard;
  labels: HomeLabels;
  completed?: boolean;
  step?: number;
}) {
  const progress = Math.max(1, Math.min(5, project.progress || 1));
  return (
    <Link
      href={
        project.category ? `/${project.category.slug}/${project.slug}` : "/"
      }
      className={`snowline-project-note ${completed ? "is-completed" : ""}`}
      data-reveal
      data-step={step}
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
      data-reveal
      data-step={2 + index * 0.7}
    >
      <span className="journey-map-number">0{index + 1} /</span>
      <h3>{category.title}</h3>
      <small>{introOf(category)}</small>
      <span className="journey-map-arrow" aria-hidden="true">
        ↗
      </span>
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
      data-reveal
      data-step={2.2 + index * 0.9}
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
    <Link
      href={postHref(post)}
      className="snowline-rambling-note"
      data-reveal
      data-step={2.2 + index * 0.9}
    >
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
    <Link
      href={entry.href}
      className="snowline-camp-entry"
      data-reveal
      data-step={4 + index * 0.4}
    >
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
  footer,
}: {
  payload: HomePayload;
  motto?: MottoDoc;
  labels: HomeLabels;
  footer: ReactNode;
}) {
  const [ongoingSeed, setOngoingSeed] = useState(0);
  const [completedSeed, setCompletedSeed] = useState(0);
  const [lifeSeed, setLifeSeed] = useState(0);
  const { viewportRef, activeChapter, navigate } = useHomeJourney(
    labels.dateLocale,
  );
  const specialPosts = payload.specialPosts.slice(0, 6);
  const ongoingProjects =
    ongoingSeed === 0
      ? payload.ongoingProjects.slice(0, 2)
      : pickRandom(payload.ongoingProjects, 2, ongoingSeed);
  const completedProjects =
    completedSeed === 0
      ? payload.completedProjects.slice(0, 3)
      : pickRandom(payload.completedProjects, 3, completedSeed);
  const lifeRecentPosts =
    lifeSeed === 0
      ? payload.lifeRecentPosts.slice(0, 3)
      : pickRandom(payload.lifeRecentPosts, 3, lifeSeed);

  return (
    <div ref={viewportRef} className="snowline-home" tabIndex={-1}>
      <RouteNavigation
        activeChapter={activeChapter}
        labels={labels}
        navigate={navigate}
      />
      <section
        id="base-camp"
        className="snowline-panel snowline-hero"
        aria-labelledby="snowline-site-title"
      >
        <ChapterLandscape scene="cover" />
        <div className="journey-panel-inner">
          <div className="journey-hero-main">
            <div className="snowline-hero-copy">
              <span className="snowline-eyebrow" data-reveal data-step="1">
                ICEAXING / ABOVE THE SNOWLINE
              </span>
              <h1
                id="snowline-site-title"
                tabIndex={-1}
                data-reveal
                data-step="1"
              >
                {labels.heroTitle[0]}
                <br />
                <span>{labels.heroTitle[1]}</span>
              </h1>
              <div data-reveal data-step="2">
                <p className="snowline-site-intro">
                  {payload.siteIntro || labels.heroIntro}
                </p>
                {motto?.text && (
                  <figure className="snowline-motto">
                    <blockquote>{motto.text}</blockquote>
                    {motto.source && <figcaption>— {motto.source}</figcaption>}
                  </figure>
                )}
              </div>
              <div className="snowline-hero-actions" data-reveal data-step="3">
                <a
                  href="#selected-notes"
                  onClick={(event) =>
                    chapterClick(event, "selected-notes", navigate)
                  }
                  className="snowline-button"
                >
                  {labels.readNotes}
                  <span aria-hidden="true">↗</span>
                </a>
                <Link href="/profile" className="snowline-text-link">
                  {labels.meetMe}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
          <FeaturedStrip posts={specialPosts} labels={labels} />
          <PanelEnd index={0} labels={labels} navigate={navigate} />
        </div>
      </section>

      <section
        id="technical-ridge"
        className="snowline-panel snowline-technical"
        aria-labelledby="technical-ridge-title"
      >
        <ChapterLandscape scene="ridge" />
        <div className="journey-panel-inner">
          <div className="journey-technical-grid">
            <aside className="snowline-skill-route">
              <ChapterHeading
                index={1}
                title={labels.chapterNames[1]}
                detail={labels.chapterIntros[0]}
              />
              <div className="snowline-skill-list" data-reveal data-step="2">
                <svg
                  className="journey-route-line"
                  viewBox="0 0 360 280"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M22 280C22 207 100 218 85 150S147 97 161 0" />
                </svg>
                {payload.skillCategories.length ? (
                  payload.skillCategories
                    .slice(0, 3)
                    .map((category, index) => (
                      <SkillMarker
                        key={category._id}
                        category={category}
                        index={index}
                      />
                    ))
                ) : (
                  <p className="snowline-empty-note">{labels.noPosts}</p>
                )}
                {payload.skillCategories.length > 3 && (
                  <details className="journey-more-categories">
                    <summary>
                      {labels.moreCategories} ({payload.skillCategories.length})
                    </summary>
                    {payload.skillCategories.slice(3).map((category, index) => (
                      <SkillMarker
                        key={category._id}
                        category={category}
                        index={index + 3}
                      />
                    ))}
                  </details>
                )}
              </div>
            </aside>
            <div className="snowline-project-route">
              <div className="snowline-subheading" data-reveal data-step="2">
                <div>
                  <span className="snowline-eyebrow">IN THE MAKING</span>
                  <h3>{labels.ongoingProjects}</h3>
                </div>
                {payload.ongoingProjects.length > 2 && (
                  <button
                    type="button"
                    className="snowline-icon-button"
                    aria-label={labels.refresh}
                    onClick={() => setOngoingSeed((seed) => seed + 1)}
                  >
                    ↻
                  </button>
                )}
              </div>
              <div className="snowline-project-stack">
                {ongoingProjects.length ? (
                  ongoingProjects.map((project, index) => (
                    <ProjectNote
                      key={project._id}
                      project={project}
                      labels={labels}
                      step={3 + index * 0.8}
                    />
                  ))
                ) : (
                  <p className="snowline-empty-note" data-reveal data-step="3">
                    {labels.noPosts}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="journey-footprints">
            <div
              className="snowline-completed-heading"
              data-reveal
              data-step="4.5"
            >
              <h3>{labels.completedProjects}</h3>
              {payload.completedProjects.length > 3 && (
                <button
                  type="button"
                  className="snowline-icon-button"
                  aria-label={labels.refresh}
                  onClick={() => setCompletedSeed((seed) => seed + 1)}
                >
                  ↻
                </button>
              )}
            </div>
            <div className="snowline-completed-grid">
              {completedProjects.length ? (
                completedProjects.map((project, index) => (
                  <ProjectNote
                    key={project._id}
                    project={project}
                    labels={labels}
                    completed
                    step={5 + index * 0.3}
                  />
                ))
              ) : (
                <p className="snowline-empty-note" data-reveal data-step="5">
                  {labels.noPosts}
                </p>
              )}
            </div>
          </div>
          <PanelEnd index={1} labels={labels} navigate={navigate} />
        </div>
      </section>

      <section
        id="snowfield-traverse"
        className="snowline-panel snowline-life"
        aria-labelledby="snowfield-traverse-title"
      >
        <ChapterLandscape scene="field" />
        <div className="journey-panel-inner">
          <div className="journey-life-header">
            <ChapterHeading
              index={2}
              title={labels.chapterNames[2]}
              detail={labels.chapterIntros[1]}
            />
          </div>
          <nav className="journey-life-map" aria-label={labels.chapterNames[2]}>
            <svg
              className="journey-map-line"
              viewBox="0 0 1100 260"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M-80 80C140 290 295 58 510 140S830 310 1180 28" />
            </svg>
            <div className="snowline-sign-list">
              {payload.lifeCategories.slice(0, 4).map((category, index) => (
                <LifeSign
                  key={category._id}
                  category={category}
                  index={index}
                />
              ))}
              {!payload.lifeCategories.length && (
                <p className="snowline-empty-note">{labels.noPosts}</p>
              )}
            </div>
            {payload.lifeCategories.length > 4 && (
              <details className="journey-more-categories">
                <summary>{labels.moreCategories}</summary>
                <div className="journey-map-extra">
                  {payload.lifeCategories.slice(4).map((category, index) => (
                    <LifeSign
                      key={category._id}
                      category={category}
                      index={index + 4}
                    />
                  ))}
                </div>
              </details>
            )}
          </nav>
          <div className="journey-recent-heading" data-reveal data-step="4">
            <h3>{labels.lifeRecent.replace(/\\n/g, " ")}</h3>
            {payload.lifeRecentPosts.length > 3 && (
              <button
                type="button"
                className="snowline-icon-button"
                aria-label={labels.refresh}
                onClick={() => setLifeSeed((seed) => seed + 1)}
              >
                ↻
              </button>
            )}
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
              <p
                className="snowline-empty-note journey-empty-landscape"
                data-reveal
                data-step="3"
              >
                {labels.noPosts}
              </p>
            )}
          </div>
          <PanelEnd index={2} labels={labels} navigate={navigate} />
        </div>
      </section>

      <section
        id="night-camp"
        className="snowline-panel snowline-night"
        aria-labelledby="night-camp-title"
      >
        <div className="journey-panel-inner">
          <ChapterHeading
            index={3}
            title={labels.chapterNames[3]}
            detail={labels.chapterIntros[2]}
          />
          <div className="snowline-night-layout">
            <div className="snowline-field-notes">
              <div className="snowline-subheading" data-reveal data-step="2">
                <h3>
                  <Link href="/daily-ramblings">{labels.ramblings} ↗</Link>
                </h3>
              </div>
              <div className="snowline-note-list">
                {payload.ramblingPosts.length ? (
                  payload.ramblingPosts
                    .slice(0, 2)
                    .map((post, index) => (
                      <RamblingNote
                        key={post._id}
                        post={post}
                        labels={labels}
                        index={index}
                      />
                    ))
                ) : (
                  <p className="snowline-empty-note" data-reveal data-step="3">
                    {labels.noPosts}
                  </p>
                )}
              </div>
            </div>
            <div className="journey-camp-trail" aria-hidden="true">
              <ChapterLandscape scene="camp" />
            </div>
            <nav
              className="journey-camp-directory"
              aria-labelledby="camp-directory-title"
            >
              <h3
                id="camp-directory-title"
                className="journey-directory-heading"
                data-reveal
                data-step="3"
              >
                {labels.campDirectory}
              </h3>
              <div className="snowline-entry-grid">
                {payload.entryCards.slice(0, 4).map((entry, index) => (
                  <CampEntry
                    key={entry._id}
                    entry={entry}
                    labels={labels}
                    index={index}
                  />
                ))}
              </div>
            </nav>
          </div>
          <div className="journey-camp-letter" data-reveal data-step="5.5">
            <p>{labels.campLetter}</p>
            <SubscribeDialog />
          </div>
          <div className="journey-camp-footer" data-reveal data-step="6">
            {footer}
          </div>
          <PanelEnd index={3} labels={labels} navigate={navigate} />
        </div>
      </section>
    </div>
  );
}
