# Atharv Mittal — the meadow portfolio

[atharv109.github.io](https://atharv109.github.io/) — a portfolio rendered as
one big editor window: a file-tree sidebar you walk with vim keys, line-numbered
buffers with `~` gutters, ASCII rain that hatches the AM monogram into existence
on the home page, draggable popup windows, and seven trophies to find. The old
security terminal lives on at [`/shell/`](https://atharv109.github.io/shell/) as
a vanilla web component.

## Stack

Astro 5 static site (no UI framework), TypeScript, hand-written CSS on a 19px
line grid, one font (Iosevka Term NF subset, weight 400). Content is Markdown
collections in `src/content/`; behaviour is vanilla custom elements and rAF
scripts — no React, no animation libraries.

## Local development

```bash
npm install
npm run dev        # astro dev on :4321
```

```bash
npm run build      # static build into dist/
npm run preview    # serve dist/
npm run test       # vitest unit tests
npm run test:e2e   # playwright e2e (builds first, then previews)
```

## Structure

- `src/pages/` — routes (home, projects, archive, about, contact, resume, shell, 404)
- `src/content/` — Markdown: featured projects, archive builds, about/contact/resume
- `src/scripts/` — the behaviour: ASCII engine (`ascii/`), text wave, popups,
  trophies, moth, contact boids, terminal (`terminal/`)
- `src/styles/` — design tokens + editor chrome CSS
- `public/` — fonts, favicon set, social image, robots/llms/manifest
- `scripts/` — build-time tools (font subsetting, glyph outline, raster icons)

## Deploy

Push to `main` runs `.github/workflows/deploy.yml`, which builds `dist/` and
publishes it with the official GitHub Pages actions.

## Contact

- [GitHub](https://github.com/atharv109)
- [LinkedIn](https://www.linkedin.com/in/atharv-mittal/)
- [atharvm2005@gmail.com](mailto:atharvm2005@gmail.com)