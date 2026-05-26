# Project Notes

This document replaces the original phase tutorial, which described an early pixel-art manor concept and a future game-engine homepage. That direction has been retired.

## Current Direction

iceaxing.com is a content-first personal blog:

- category and project pages organize writing,
- optional collections group related posts,
- article pages render Portable Text and custom blocks,
- log, about, friends, profile, search, RSS, sitemap, and subscriptions support the site around the writing.

## Styling

- Use Tailwind utilities for normal component layout.
- Put shared CSS in `app/styles/` and import it from `app/globals.css`.
- Avoid inline visual styles in app components.
- React Email templates may keep inline `style` props, but style objects should be centralized in `lib/email/templates/styles.ts`.

## Explicitly Removed

Do not use these retired concepts as implementation guidance:

- pixel-art visual system,
- “manor under construction” homepage,
- Phaser/Pixi/Three.js homepage roadmap,
- `components/manor` placeholders,
- `/api/manor/config`,
- pixelated placeholder image assets.

## Verification

Before finishing changes, run:

```bash
npm run lint
npm run build
```
