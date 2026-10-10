# the-portfolio

This is the personal portfolio of James, a full stack developer who works with PHP, React and Node.js.

**Live:** https://the-coder-james.github.io/the-portfolio/

The site is styled like a mobile-suit instruction manual and has two themes:
- **Manual** (light, the default): off-white paper, ink line art and flat spot colours.
- **Blueprint** (dark): its cyanotype twin.

## Stack

- [Astro](https://astro.build) 5, with static output and [React](https://react.dev) 19 islands
- [Tailwind CSS](https://tailwindcss.com) v4, [shadcn/ui](https://ui.shadcn.com) and [Motion](https://motion.dev)
- Barlow Condensed, IBM Plex Sans and IBM Plex Mono, self-hosted through [Fontsource](https://fontsource.org)
- [Vitest](https://vitest.dev) and [Playwright](https://playwright.dev) for tests
- GitHub Pages for hosting, deployed by GitHub Actions

## Features

- **Layout:**
  - One scrolling page of four sections, each at least one screen tall and growing with its content. The drafting-paper background stays fixed while the content scrolls over it.
  - About is three numbered sub-sections (Profile, Arsenal, Journey), all shown in full.
  - Each section has its own scroll-linked animation, and its content reveals as it arrives.
  - The phone layout applies at 767px wide and below.
  - The nav links are plain anchors with a scroll-spy, so back, forward and shared `#section` links all work.
- **Projects:**
  - On PC, a deck of six-card slides that the page's scroll moves through. Cards scale out, and the next slide's scale in at random offsets.
  - On phones, a swipe rail.
  - Search, plus tag, role and provider filters that each take more than one value.
- **Themes:** the theme is set before first paint and follows the OS preference until you pick one.
- **Analytics:**
  - Google Tag Manager loads only after the visitor accepts the cookie banner.
  - Consent can be withdrawn at any time from **Cookie settings** in the footer.
- **Accessibility:**
  - Without JavaScript, the page still reads, and the nav links still work.
  - Reduced-motion settings are respected.
  - Contrast ratios are measured and tested in both themes.

## Getting started

You need Node 20, the version pinned in `.nvmrc`.

```bash
nvm use
yarn install
yarn dev        # http://localhost:4321/the-portfolio/
```

| Command | What it does |
| :-- | :-- |
| `yarn dev` | Start the dev server |
| `yarn build` | Build the production site into `dist/` |
| `yarn preview` | Serve the production build locally |
| `yarn images` | Optimise the source images into `public/optimized/` |
| `yarn og` | Regenerate the share image (`public/og-image.png`). Needs `yarn preview` running |
| `yarn shadcn` | Add or update shadcn/ui components |

## Tests

```bash
npx playwright install chromium   # once
yarn test                         # about 5 minutes
```

`yarn test` runs these in order:
- `astro check` for types;
- Vitest checks on palette contrast and source rules;
- unit tests for the consent and theme stores;
- checks on the built output;
- Playwright on a desktop and a phone viewport.

Each step can also be run on its own:

| Command | Runs |
| :-- | :-- |
| `yarn check:types` | `astro check` only |
| `yarn test:static` | The Vitest contrast and source-rule checks |
| `yarn test:unit` | The unit tests for the consent and theme stores |
| `yarn test:dist` | The build-output checks (builds first) |
| `yarn test:e2e` | Playwright only (builds first) |

## Content

All text and data live in `src/assets/*.json`:

| File | What it holds |
| :-- | :-- |
| `data.json` | The profile, the copy, the navigation and the SEO metadata |
| `projectlist.json` | The project entries |
| `experience.json` | The career timeline |
| `contact.json` | The contact details |

Edit those files to change the content. No component needs to change.

## Deployment

Every push to `main` runs `.github/workflows/static.yml`, which builds the site with `yarn build` and publishes it to GitHub Pages.

Analytics are optional. They are on only when the `PUBLIC_GTM_ID` repository secret holds a Tag Manager container ID. Without it, the build ships no analytics code at all.

## Project structure

```text
src/
├── assets/        content (JSON)
├── components/    Astro panel shells and React islands, grouped by section
│   └── ui/        shadcn/ui primitives
├── hooks/
├── layout/        the page shell: theme script, fonts, analytics consent
├── pages/         index.astro and 404.astro
└── styles/        global.css: theme tokens for both palettes
scripts/           image optimisation, share image, contrast and source checks
tests/             static, unit, dist (Vitest) and e2e (Playwright)
```
