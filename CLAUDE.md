# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Astro on localhost:4321)
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run shadcn    # Run shadcn CLI to add/update components
npm run images    # Optimise source images (scripts/optimize-images.mjs)
npm run inspect   # Playwright layout check; needs `npm run preview` running
```

Requires Node >= 18.20.8 (Astro 5). No linting or unit-test scripts are configured;
`npx astro check` is the type check.

## Architecture

**Astro + React + Tailwind v4** portfolio deployed to GitHub Pages at
`https://alejandrejames.github.io/the-portfolio/` (base path `/the-portfolio/`).
Static output — there is no server at runtime.

### Page structure: one page, six tabs

`src/pages/index.astro` renders six sibling `<section>` panels inside `<main>`:
`#home`, `#about`, `#skills`, `#projects`, `#experience`, `#contact`.

Only one is visible at a time. `HeaderComponent` owns the tab state and toggles
the native `hidden` attribute on each section by id.

**Panels are deliberately NOT passed into a React tab component as slots.**
Astro's React adapter hands slot content to React as an opaque HTML string via
`dangerouslySetInnerHTML`, with `StaticHtml.shouldComponentUpdate` pinned to
`false`; a nested `<astro-island>` defers on its ancestor's `ssr` flag and waits
for an `astro:hydrate` event dispatched from DOM nodes the ancestor's own mount
then replaces. Keeping the panels as top-level siblings keeps island nesting
depth at 1, which is the only depth this codebase has ever exercised. If you
restructure the page, check `dist/index.html` still has no nested islands.

Consequences to keep in mind:

- **Never use `client:visible` inside a panel.** A hidden panel never
  intersects, so the island would never hydrate. Use `client:idle`.
- `useRevealed` (`src/hooks/`) has a 1200ms fallback precisely so reveals still
  fire in a hidden panel. `motion-primitives/in-view.tsx` has no such fallback.
- Tabs are driven by the location hash, which is what makes back/forward work
  and lets plain `<a href="#contact">` links switch tabs. Hashes that do not
  name a tab (the skip link's `#main`) are ignored rather than reset.
- Tab state starts at the default and is corrected from the hash in a *layout
  effect*. Seeding it during the first render leaves Radix's own markup stuck on
  the server-rendered default.
- Without JS every panel stays visible, so the page degrades to a plain scroll.
  The hiding CSS is gated on `html[data-tabs-ready]`.

### Theming: dual, light by default

Light ("standby") is the default; `.dark` is "combat mode". The palette is the
Destiny Gundam (ZGMF-X42S): armour white, Destiny blue, crimson, gold, sensor
green, and the prismatic Wings of Light.

Tailwind v4 compiles `@theme` keys into utilities at build time, so a
`--color-*` declared there **cannot** be redefined by `.dark`. All of it lives
in `src/styles/global.css`:

- `@theme` — structural tokens only (radius, breakpoint).
- `@theme inline` — every colour token, each pointing at a `--t-*` var.
  `inline` matters: it makes the utility body resolve to `var(--t-x)` directly
  instead of adding a `--color-x` hop.
- `:root` / `.dark` — the two palettes as plain `--t-*` declarations.

Token groups that do **not** flip with the page, and why:

- `--color-syn-*` and `--color-code-ink*` — terminal and editor surfaces stay
  dark in both themes (the developer identity of the site), so text on them is
  fixed. Using `--color-ink-*` on a code surface is a bug.
- `--color-on-brand` — labels on a brand-blue fill. Measured against
  `--color-brand-700`, so use that as the fill, not `--color-brand`.
- `--tint-white-*` — historical name; it means "a faint film lifting a surface
  off the page", and inverts to near-black on light.

`ThemeProvider.tsx` is a module-level store read via `useSyncExternalStore`,
not a context: each Astro island is its own React root, so a provider in one
island cannot reach another. The source of truth is `.dark` on `<html>`, set
before first paint by an inline script in `layout.astro`.

Contrast ratios in the token comments are measured, not estimated. Re-measure
if you change a surface.

### Data

Content lives in `src/assets/*.json`:

- `data.json` — nav (the tab list), user profile, hero, about and skills copy
- `projectlist.json` — project entries; integer ids reference `taglist.json`,
  `roles.json`, `techs.json`, `projectprovider.json`
- `experience.json`, `contact.json`

Components import these directly.

### Components

- `src/components/*/[Name]Component.astro` — panel shells; most use
  `common/astro/SectionShell.astro`, which supplies the tabpanel semantics.
  `#home` (`mainvisual/`) builds its own section.
- `src/components/*/*.tsx` — the interactive islands.
- `src/components/ui/` — shadcn/ui. `tabs.tsx` is used by both the page tab bar
  and the Skills category tabs; they are DOM siblings, not nested, so their
  roving tabindexes cannot trap each other. Keep them visually distinct.

### Path alias

`@/` maps to `src/`.
