"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "@/lib/i18n/navigation";
import type { SpecialBlogItem } from "@/lib/sanity/types";
import type { HomeLabels } from "./home-dashboard";
import { formatDate, postHref } from "./home-utils";

export function FeaturedStrip({
  posts,
  labels,
}: {
  posts: SpecialBlogItem[];
  labels: HomeLabels;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () =>
      setEdges({
        start: track.scrollLeft < 2,
        end: track.scrollWidth - track.clientWidth - track.scrollLeft < 2,
      });
    const resize = new ResizeObserver(update);
    resize.observe(track);
    for (const child of track.children) resize.observe(child);
    track.addEventListener("scroll", update, { passive: true });
    const frame = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      track.removeEventListener("scroll", update);
    };
  }, [posts]);

  function scroll(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const width =
      (track.firstElementChild as HTMLElement | null)?.offsetWidth ??
      track.clientWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const perPage = Math.max(1, Math.floor(track.clientWidth / (width + gap)));
    track.scrollBy({
      left: direction * (width + gap) * perPage,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const links = Array.from(
      event.currentTarget.querySelectorAll<HTMLAnchorElement>("a"),
    );
    const current = links.indexOf(document.activeElement as HTMLAnchorElement);
    const index =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? links.length - 1
          : Math.max(
              0,
              Math.min(
                links.length - 1,
                current + (event.key === "ArrowRight" ? 1 : -1),
              ),
            );
    links[index]?.focus({ preventScroll: true });
  }

  return (
    <section
      id="selected-notes"
      className="snowline-featured"
      aria-labelledby="selected-title"
      tabIndex={-1}
    >
      <div className="snowline-featured-heading" data-reveal data-step="4">
        <h2 id="selected-title">
          {labels.featured}
          <span aria-hidden="true"> / SELECTED NOTES</span>
        </h2>
        {posts.length > 1 && (
          <div className="snowline-strip-controls">
            <button
              type="button"
              onClick={() => scroll(-1)}
              disabled={edges.start}
              aria-label={labels.previousArticles}
              aria-controls="selected-track"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              disabled={edges.end}
              aria-label={labels.nextArticles}
              aria-controls="selected-track"
            >
              →
            </button>
          </div>
        )}
      </div>
      <div
        ref={trackRef}
        id="selected-track"
        className="snowline-featured-track"
        onKeyDown={handleKeys}
      >
        {posts.length ? (
          posts.map((post, index) => (
            <Link
              href={postHref(post)}
              key={post._id}
              className="snowline-featured-card"
              data-reveal
              data-step={4.5 + index * 0.7}
              onFocus={(event) => {
                const track = trackRef.current;
                if (!track) return;
                const card = event.currentTarget;
                const left = card.offsetLeft;
                if (
                  left < track.scrollLeft ||
                  left + card.offsetWidth > track.scrollLeft + track.clientWidth
                )
                  track.scrollTo({ left, behavior: "instant" });
              }}
            >
              <span className="snowline-featured-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              {post.coverImage?.url && (
                <Image
                  src={post.coverImage.url}
                  alt=""
                  width={112}
                  height={84}
                  sizes="112px"
                  priority={index === 0}
                  placeholder={post.coverImage.lqip ? "blur" : "empty"}
                  blurDataURL={post.coverImage.lqip}
                  className="snowline-featured-image"
                />
              )}
              <span className="snowline-featured-copy">
                <strong>{post.title}</strong>
                <span>
                  {post.category?.title}
                  <time dateTime={post.publishedAt}>
                    {formatDate(post.publishedAt, labels.dateLocale)}
                  </time>
                </span>
              </span>
              <span className="snowline-featured-arrow" aria-hidden="true">
                ↗
              </span>
            </Link>
          ))
        ) : (
          <p className="snowline-empty-note" data-reveal data-step="5">
            {labels.noPosts}
          </p>
        )}
      </div>
    </section>
  );
}
