@AGENTS.md

# iceaxing.com

## Project Overview

- Personal blog built with Next.js App Router, TypeScript, Tailwind CSS, next-intl, and Sanity CMS.
- The site is a content-first blog. Do not reintroduce the old pixel-art manor concept, game-engine homepage, Phaser/Pixi/Three.js roadmap, or related placeholder APIs/assets.
- Current content model: category -> project -> optional collection -> blog post, plus log, friends, profile, and subscription features.

## Tech Stack

| Area | Choice |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS plus dedicated CSS files under `app/styles/` |
| CMS | Sanity, Portable Text, custom blocks |
| i18n | next-intl |
| Comments | Giscus |
| Email | Resend and React Email |
| Feed/SEO | Route handlers for RSS, sitemap, robots, metadata, JSON-LD |

## Current Conventions

- Read the local Next.js docs in `node_modules/next/dist/docs/` before changing framework-specific APIs.
- Keep global and shared CSS in `app/styles/`, imported from `app/globals.css`.
- Do not put page-specific visual CSS inline in JSX unless a library requires it. React Email templates are the exception because email clients need inline styles.
- Keep Sanity queries in `lib/sanity/queries.ts`; do not call `client.fetch()` directly from components.
- Use `sanity-best-practices` guidance when editing Sanity schemas, GROQ, Studio, or Sanity-powered rendering.
- Preserve existing routing semantics and i18n paths when changing pages.

## Removed Direction

The project no longer targets:

- pixel-art visual identity,
- “manor/farm under construction” homepage,
- a future game-engine or interactive-game homepage,
- placeholder manor APIs/components/assets.

Treat any reappearance of those concepts as stale documentation or dead code unless the user explicitly asks to restore them.
