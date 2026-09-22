"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const chapters = [
  { id: "base-camp", altitude: "3200m" },
  { id: "technical-ridge", altitude: "4200m" },
  { id: "snowfield-traverse", altitude: "5100m" },
  { id: "night-camp", altitude: "6200m" },
] as const;
export type ChapterId = (typeof chapters)[number]["id"];

export function useHomeJourney(locale: string) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<(id: ChapterId | "selected-notes") => void>(
    () => {},
  );
  const [activeChapter, setActiveChapter] = useState<ChapterId>("base-camp");
  const navigate = useCallback(
    (id: ChapterId | "selected-notes") => navigationRef.current(id),
    [],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const panels = Array.from(
      viewport.querySelectorAll<HTMLElement>(".snowline-panel"),
    );
    const header = document.querySelector<HTMLElement>(".site-header");
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const storageKey = `snowline-journey:${locale}`;
    const seen = new Set<string>();
    const animations = new Map<HTMLElement, Animation[]>();
    let current: HTMLElement | undefined;
    let frame = 0;
    let geometryFrame = 0;
    let travelFrame = 0;
    let travelling = false;
    let returningLandscape: Animation | undefined;
    let settleTimer = 0;
    let suppressFocusReveal = false;
    let saved: { chapter?: string; offset?: number; seen?: string[] } = {};
    try {
      saved = JSON.parse(sessionStorage.getItem(storageKey) || "{}") || {};
      if (Array.isArray(saved.seen)) saved.seen.forEach((id) => seen.add(id));
    } catch {
      /* Storage is optional; native scrolling remains available. */
    }

    function persist() {
      if (!current) return;
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            chapter: current.id,
            offset: Math.max(
              0,
              (viewport!.scrollTop - current.offsetTop) / current.offsetHeight,
            ),
            seen: Array.from(seen),
          }),
        );
      } catch {
        /* Private browsing may disable storage. */
      }
    }

    function reveal(panel: HTMLElement, animated: boolean) {
      if (seen.has(panel.id)) return;
      seen.add(panel.id);
      panel.dataset.visited = "true";
      for (const animation of animations.get(panel) || []) {
        if (animated && !motion.matches) animation.play();
        else animation.cancel();
      }
    }

    // WAAPI keeps the server-rendered baseline visible: no JS, no hidden content.
    for (const panel of panels) {
      if (seen.has(panel.id) || motion.matches) continue;
      const group: Animation[] = [];
      for (const element of panel.querySelectorAll<HTMLElement>(
        "[data-reveal]",
      )) {
        if (typeof element.animate !== "function") continue;
        const landscape = element.dataset.reveal === "landscape";
        const restingOpacity = Number(getComputedStyle(element).opacity);
        const animation = element.animate(
          [
            {
              opacity: landscape ? restingOpacity * 0.45 : 0,
              filter: `blur(${landscape ? 6 : 2}px)`,
              transform: `translateY(${landscape ? 16 : 12}px)`,
            },
            {
              opacity: restingOpacity,
              filter: "blur(0px)",
              transform: "translateY(0)",
            },
          ],
          {
            duration: landscape ? 1000 : 520,
            delay: Math.min(Number(element.dataset.step || 0) * 100, 600),
            easing: "cubic-bezier(.22,1,.36,1)",
            fill: "both",
          },
        );
        animation.pause();
        animation.currentTime = 0;
        animation.onfinish = () => animation.cancel();
        group.push(animation);
      }
      const line = panel.querySelector<SVGPathElement>(".landscape-line");
      if (line?.animate) {
        const drawing = line.animate(
          [
            { strokeDasharray: "1", strokeDashoffset: "1" },
            { strokeDasharray: "1", strokeDashoffset: "0" },
          ],
          { duration: 700, easing: "ease-out", fill: "both" },
        );
        drawing.pause();
        drawing.currentTime = 0;
        drawing.onfinish = () => drawing.cancel();
        group.push(drawing);
      }
      animations.set(panel, group);
    }

    function settle() {
      const panel = current;
      if (!panel || travelling) return;
      const visible =
        Math.min(
          viewport!.scrollTop + viewport!.clientHeight,
          panel.offsetTop + panel.offsetHeight,
        ) - Math.max(viewport!.scrollTop, panel.offsetTop);
      if (
        visible >=
        Math.min(viewport!.clientHeight, panel.offsetHeight) * 0.6
      ) {
        reveal(panel, true);
        // Preserve Next's history state while keeping native deep links useful.
        if (location.hash !== `#${panel.id}`)
          history.replaceState(history.state, "", `#${panel.id}`);
        persist();
      }
    }

    function update() {
      const marker = viewport!.scrollTop + viewport!.clientHeight * 0.45;
      const panel =
        panels.find(
          (node) =>
            node.offsetTop <= marker &&
            node.offsetTop + node.offsetHeight > marker,
        ) || panels[0];
      if (panel !== current) {
        if (current && seen.has(current.id))
          animations.get(current)?.forEach((animation) => animation.cancel());
        returningLandscape?.cancel();
        if (seen.has(panel.id) && !motion.matches) {
          returningLandscape = panel
            .querySelector(".journey-landscape")
            ?.animate([{ filter: "blur(6px)" }, { filter: "blur(0px)" }], {
              duration: 850,
              easing: "cubic-bezier(.22,1,.36,1)",
            });
        }
        current = panel;
        setActiveChapter(panel.id as ChapterId);
      }
      // Reveal on approach so the landscape resolves while the chapter arrives.
      const visible =
        Math.min(
          viewport!.scrollTop + viewport!.clientHeight,
          panel.offsetTop + panel.offsetHeight,
        ) - Math.max(viewport!.scrollTop, panel.offsetTop);
      if (visible >= Math.min(viewport!.clientHeight, panel.offsetHeight) * 0.6)
        reveal(panel, true);
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 140);
    }
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    }

    function geometry() {
      if (header)
        viewport!.style.setProperty(
          "--home-header-height",
          `${header.offsetHeight}px`,
        );
      viewport!.dataset.overflowing = String(
        panels.some((panel) => panel.offsetHeight > viewport!.clientHeight + 3),
      );
      onScroll();
    }
    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(geometryFrame);
      geometryFrame = requestAnimationFrame(geometry);
    });
    resize.observe(viewport);
    panels.forEach((panel) => resize.observe(panel));
    if (header) resize.observe(header);
    geometry();

    const hash = location.hash.slice(1);
    const initial =
      panels.find((panel) => panel.id === hash) ||
      (hash === "selected-notes"
        ? panels[0]
        : panels.find((panel) => panel.id === saved.chapter));
    if (initial) {
      const offset =
        saved.chapter === initial.id && Number.isFinite(saved.offset)
          ? Math.min(1, Math.max(0, saved.offset || 0)) * initial.offsetHeight
          : 0;
      viewport.scrollTo({
        top: initial.offsetTop + offset,
        behavior: "instant",
      });
    }

    function cancelTravel() {
      cancelAnimationFrame(travelFrame);
      travelling = false;
      viewport!.style.removeProperty("scroll-snap-type");
    }
    function travel(top: number) {
      cancelTravel();
      if (motion.matches || Math.abs(top - viewport!.scrollTop) < 2) {
        viewport!.scrollTo({ top, behavior: "instant" });
        return;
      }
      const from = viewport!.scrollTop;
      const start = performance.now();
      const duration = Math.min(
        1100,
        850 + (Math.abs(top - from) / viewport!.clientHeight) * 70,
      );
      travelling = true;
      viewport!.style.scrollSnapType = "none";
      function tick(now: number) {
        if (document.querySelector('[role="dialog"], #mobile-site-menu')) {
          cancelTravel();
          return;
        }
        const t = Math.min(1, (now - start) / duration);
        const eased = t * t * t * (t * (t * 6 - 15) + 10);
        viewport!.scrollTo({
          top: from + (top - from) * eased,
          behavior: "instant",
        });
        if (t < 1) travelFrame = requestAnimationFrame(tick);
        else {
          cancelTravel();
          onScroll();
        }
      }
      travelFrame = requestAnimationFrame(tick);
    }
    function interruptTravel(event: Event) {
      if (
        event instanceof KeyboardEvent &&
        ![
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End",
          "Tab",
          " ",
        ].includes(event.key)
      )
        return;
      if (travelling) cancelTravel();
    }

    navigationRef.current = (id) => {
      const target = document.getElementById(id);
      const panel = target?.closest<HTMLElement>(".snowline-panel");
      if (!target || !panel) return;
      travel(panel.offsetTop);
      history.replaceState(history.state, "", `#${id}`);
      const focus =
        id === "selected-notes"
          ? target
          : panel.querySelector<HTMLElement>("h1, h2");
      suppressFocusReveal = true;
      focus?.focus({ preventScroll: true });
      suppressFocusReveal = false;
      if (id === "selected-notes") reveal(panel, false);
      onScroll();
    };

    function onHashChange() {
      const id = location.hash.slice(1);
      if (
        id === "selected-notes" ||
        chapters.some((chapter) => chapter.id === id)
      )
        navigationRef.current(id as ChapterId | "selected-notes");
    }
    function onFocus(event: FocusEvent) {
      if (suppressFocusReveal) return;
      const panel = (event.target as HTMLElement).closest<HTMLElement>(
        ".snowline-panel",
      );
      if (panel) {
        reveal(panel, false);
        animations.get(panel)?.forEach((animation) => animation.cancel());
      }
    }
    function onMotionChange() {
      cancelTravel();
      returningLandscape?.cancel();
      if (motion.matches)
        panels.forEach((panel) => {
          animations.get(panel)?.forEach((animation) => animation.cancel());
          seen.add(panel.id);
        });
    }
    viewport.addEventListener("scroll", onScroll, { passive: true });
    viewport.addEventListener("wheel", interruptTravel, { passive: true });
    viewport.addEventListener("touchstart", interruptTravel, { passive: true });
    viewport.addEventListener("pointerdown", interruptTravel, {
      passive: true,
    });
    window.addEventListener("keydown", interruptTravel);
    viewport.addEventListener("focusin", onFocus);
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("pagehide", persist);
    motion.addEventListener("change", onMotionChange);
    onScroll();
    return () => {
      persist();
      cancelTravel();
      returningLandscape?.cancel();
      viewport.removeEventListener("wheel", interruptTravel);
      viewport.removeEventListener("touchstart", interruptTravel);
      viewport.removeEventListener("pointerdown", interruptTravel);
      window.removeEventListener("keydown", interruptTravel);
      resize.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(geometryFrame);
      window.clearTimeout(settleTimer);
      animations.forEach((group) =>
        group.forEach((animation) => animation.cancel()),
      );
      viewport.removeEventListener("scroll", onScroll);
      viewport.removeEventListener("focusin", onFocus);
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("pagehide", persist);
      motion.removeEventListener("change", onMotionChange);
    };
  }, [locale]);

  return { viewportRef, activeChapter, navigate };
}
