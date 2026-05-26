# iceaxing.com

Personal blog built with Next.js 16, React 19, Tailwind CSS, next-intl, and Sanity CMS.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run lint
npm run build
npm run start
```

## Project Notes

- App routes live under `app/`.
- Shared UI lives under `components/`.
- Sanity client, queries, and generated/handwritten types live under `lib/sanity/`.
- Shared CSS lives under `app/styles/` and is imported by `app/globals.css`.
- Static public assets live under `public/`.

The old pixel-art manor/game-engine direction has been retired. Do not add Phaser/Pixi/Three.js homepage scaffolding, manor placeholder APIs, or pixel-art placeholder assets unless the product direction changes again.
