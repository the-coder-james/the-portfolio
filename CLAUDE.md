# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Astro on localhost:4321)
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run shadcn    # Run shadcn CLI to add/update components
npm run images    # Optimise source images (scripts/optimize-images.mjs)
npm run og        # Regenerate public/og-image.png (Blueprint hero); needs `npm run preview`
                  # (OG_URL=http://localhost:<port>/the-portfolio/ if not on :4321)

npm test               # Everything below, in order (~5 min)
npm run check:types    # astro check, fails on warnings
npm run test:static    # Vitest: palette contrast (flat + textured), source invariants
npm run test:unit      # Vitest: ConsentStore and ThemeProvider
npm run test:dist      # Builds dist/ and dist-e2e/, then checks both builds
npm run test:e2e       # Builds dist-e2e/ (test GTM ID), then Playwright on :4410
npm run check:contrast # Contrast report for src/styles/global.css
npm run check:source   # Source invariants + advisory unused-code report
```

Requires Node >= 18.20.8 (Astro 5). There is no linter. Tests: Vitest (`tests/static`,
`tests/unit`, `tests/dist`) and Playwright (`tests/e2e`, against `astro preview` of
`dist-e2e/` on port 4410). Mark a known, unfixed defect as `test.fail` /
`it.fails` with its ID, so fixing it flips the test; none are open now.

## Architecture

**Astro + React + Tailwind v4** portfolio deployed to GitHub Pages at
`https://the-coder-james.github.io/the-portfolio/` (base path `/the-portfolio/`).
Static output — there is no server at runtime.

### Page structure: tabs on desktop, one scroll on mobile

`src/pages/index.astro` renders four sibling `<section>` panels inside `<main>`:
`#home`, `#about`, `#projects`, `#contact`.

**Above 640px** only one is visible at a time. `HeaderComponent` owns the tab
state and toggles the native `hidden` attribute on each section by id.

**At 640px and below** the page becomes one scrolling document: `HeaderComponent`
sets `data-scroll-mode` on `<html>`, stops hiding panels (and actively clears
`hidden`, or a panel left over from a resize would stay invisible), the nav
pills scroll to their panel instead of switching, and an IntersectionObserver
moves the active pill to whatever section is on screen. `AboutTabs` drops its
sub-tab bar there and each pane labels itself instead.

Two things that mode has to fight:

- `html { scroll-behavior: smooth }` turns every scroll correction into an
  animation. Entering scroll mode roughly doubles the document while the browser
  is still resolving the landing `#hash` against the old layout, so a plain
  `/#home` load drifted ~1200px over about 900ms. The mount effect suspends
  `scroll-behavior`, reasserts the position across several frames, then hands it
  back. An explicit `/#home` is the slow case and needs the longest hold.
- Tailwind's `sm:` is `min-width: 640px`, exactly the width scroll mode still
  treats as mobile. A `sm:` layout variant on a wide row overflows there; use
  `md:` for anything that must not fire while the page is phone-width.

The flow is `home -> about -> projects -> contact`, carried by `FlowLink.astro`:
a plain `<a href="#panel">`, which switches tabs on desktop (via `hashchange`)
and scrolls on mobile without knowing which mode it is in.

**About is itself three sub-tabs** — Profile, Arsenal, Journey — which is where
the former `#skills` and `#experience` panels went. `AboutTabs` toggles
`#about-profile` / `#about-arsenal` / `#about-journey` by `hidden`, exactly the
way the header toggles panels, and for the same reason: each sub-panel contains
islands of its own, so passing them in as slots would nest those islands. Old
`#skills` and `#experience` links resolve to `#about` via `MERGED_TABS` in
`HeaderComponent` and the hash is canonicalised, so nothing dead-ends.

The merge also removed duplicated content: the skills marquee (`SkillsStrip`)
re-listed every badge the category tabs already showed, the bio narrated the
career arc the Journey pipeline draws stage by stage, two stats restated two of
those stages, and the timeline tags repeated the arsenal's technologies. If you
add content to one sub-tab, check the other two do not already say it.

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
  fire in a hidden panel. A bare IntersectionObserver reveal has no such
  fallback and would leave content invisible there.
- Tabs are driven by the location hash, which is what makes back/forward work
  and lets plain `<a href="#contact">` links switch tabs. Hashes that do not
  name a tab (the skip link's `#main`) are ignored rather than reset.
- Tab state starts at the default and is corrected from the hash in a *layout
  effect*. Seeding it during the first render leaves Radix's own markup stuck on
  the server-rendered default.
- Without JS every panel stays visible, so the page degrades to a plain scroll.
  The hiding CSS is gated on `html[data-tabs-ready]`, and a `<noscript>` style
  in `layout.astro` removes the pre-render veil and loader and pins every
  `[data-reveal]` node visible (reveals are server-rendered at opacity 0). Tag
  any new reveal's animated node `data-reveal`, or it stays invisible there and
  under reduced motion.

### Theming: the Gunpla manual, Manual by default

The site prints like a mobile-suit instruction manual. Manual (light, the
default) is the printed sheet: off-white stock, ink line art, and Destiny blue,
crimson and gold reduced to flat spot inks. `.dark` is Blueprint, its cyanotype
twin: Prussian-blue paper with white linework, where the spot blue turns pale
cyan because blue type cannot sit on blue. The stored theme values are still
`light` / `dark`, so visitors' earlier choices carry over.

Tailwind's class detection is scoped to `src/` (`@import "tailwindcss"
source("..")`); unscoped, it scanned `tests/`, `scripts/` and this file and
shipped utilities nothing uses, `.backdrop-filter` among them.

Tailwind v4 compiles `@theme` keys into utilities at build time, so a
`--color-*` declared there **cannot** be redefined by `.dark`. All of it lives
in `src/styles/global.css`:

- `@theme` — structural tokens that are the same in both themes: radius,
  breakpoint, and the three font tokens.
- `@theme inline` — every colour token, each pointing at a `--t-*` var.
  `inline` matters: it makes the utility body resolve to `var(--t-x)` directly
  instead of adding a `--color-x` hop.
- `:root` / `.dark` — the two palettes as plain `--t-*` declarations.

Tokens whose rules are easy to break:

- `--color-code-ink*` and `--color-syn-*` — measured against each theme's own
  `--t-surface-code`: the listing prints a shade off the sheet in Manual and on
  a deeper panel in Blueprint. Using `--color-ink-*` on a code surface is a bug.
- `--color-on-brand` — the label on a brand fill (`-700`, its `-900` hover, or
  `brand`). It flips: paper white on Manual's deep blue, navy on Blueprint's
  pale cyan. Never hardcode white on a brand fill; on Blueprint it is ~1.6:1.
- `--color-brand-300` — decorative only; it fails 3:1 on the Manual stock.
  Focus outlines use `--color-ring`, read text `--color-brand-text`.
- `--tint-white-*` — historical name; it means "a faint film lifting a surface
  off the page", and inverts to the ink on Manual.

**No glass, no glow.** A printed sheet has neither, so depth is a hard offset
in ink (`--shadow-print-sm` / `--shadow-print` / `--shadow-print-lg`, zero
blur), surfaces are opaque sheets edged in `--color-card-border`, and accent
type is one flat spot ink. Don't bring back backdrop-filter, blurred or
coloured glows, or gradient text. The classes were renamed when their effect
died: `.sheet-surface` (the nav), `.tab-pill`, `.card-lift`, `.spot-text`.

The page itself is drafting stock: `.site-backdrop` draws a 24px grid with a
heavier rule every 120px under a fibre grain, and `.dot-grid` prints
registration marks on the major crossings. It is all gradients and data-URI
SVG, so it themes itself and needs no file under the base path.

`ThemeProvider.tsx` is a module-level store read via `useSyncExternalStore`,
not a context: each Astro island is its own React root, so a provider in one
island cannot reach another. The source of truth is `.dark` on `<html>`, set
before first paint by an inline script in `layout.astro`. `ThemeToggle` keeps
one accessible name ("Blueprint mode") and reports the state through
`aria-pressed`; only its tooltip names the action.

Contrast ratios in the token comments are measured, not estimated, against the
surface each token actually sits on. Re-measure if you change a surface.

### Type: self-hosted, never from Google's CDN

Barlow Condensed is the display face (h1–h3; h1/h2 set uppercase), IBM Plex
Sans the body, IBM Plex Mono the code and labels. Use the tokens — `font-sans`
/ `font-display` / `font-mono`, or `var(--font-*)` inline — never a family name.

The faces are self-hosted through Fontsource, imported in `layout.astro`, with
the body and hero faces preloaded. **Never load fonts from fonts.googleapis.com**:
the request hands the visitor's IP to Google before the consent banner has been
answered, which is exactly what the GTM gate below exists to prevent. Only the
weights in use are imported (400–700, no italics); add a weight file if you
need one rather than switching to a CDN.

### Analytics: GTM behind a consent gate

Off unless `PUBLIC_GTM_ID` is set. Without it the loader and the banner both
no-op, so local dev and any build lacking the variable ship no analytics at
all. Production reads it from the `PUBLIC_GTM_ID`
repository secret, passed to `yarn build` in the deploy workflow.

**GTM is injected from `ConsentStore.ts` after the visitor accepts — never from
a tag in the HTML.** Loading it in the head and asking afterwards is not
consent; it is a notice shown after the data has already gone. That includes
GTM's usual `<noscript>` iframe: without script the banner never renders, so
that visitor can never consent. The store is a
module-level `useSyncExternalStore`, same as `ThemeProvider` and for the same
reason (each island is its own React root).

- `grant()` writes localStorage and injects the loader; `deny()` writes and
  injects nothing. `initConsent()` re-injects on later visits for someone who
  already accepted, so they are not asked twice.
- Consent can be withdrawn as easily as given (GDPR Art. 7(3)): once a choice
  exists, the footer's "Cookie settings" (`ConsentSettingsButton`) reopens the
  banner. Declining after a grant clears the `_ga*` / `_gcl*` cookies and
  reloads, since a running GTM cannot be unloaded.
- `trackEvent()` is a no-op without consent — events are dropped, not queued,
  or a later grant would leak what a declining visitor did.
- The only custom event is `contact_submit` from `ContactForm`, carrying
  `has_email` and no field values. Pageviews cannot tell you whether anyone
  tried to make contact, which is the one thing worth knowing here.
- Accept and Decline share a size and shape; only the fill differs. A banner
  that makes declining harder is not valid consent under GDPR.
- The banner clears the footer via `--footer-h`, except in scroll mode where the
  footer sits at the end of the document rather than pinned.

### Data

Content lives in `src/assets/*.json`:

- `data.json` — nav (the tab list), `seo` (title, description, keywords, OG
  image), user profile, hero, about copy (including `about.tabs`, the sub-tab
  labels), skills copy, and `flow` (the forward step out of each section)
- `projectlist.json` — project entries; integer ids reference `taglist.json`,
  `roles.json`, `techs.json`, `projectprovider.json`
- `experience.json`, `contact.json`

Components import these directly.

### Components

- `src/components/*/[Name]Component.astro` — panel shells; most use
  `common/astro/SectionShell.astro`, which supplies the tabpanel semantics.
  `#home` (`mainvisual/`) builds its own section.
- `src/components/*/*.tsx` — the interactive islands.
- `src/components/ui/` — shadcn/ui. `tabs.tsx` drives three tablists: the page
  tab bar, the About sub-tabs, and the Skills category tabs inside Arsenal. All
  three are DOM siblings rather than nested, so their roving tabindexes cannot
  trap each other. Keep them visually distinct — the page bar is a floating
  paper tab strip, the About sub-tabs an inline segmented control, the Skills
  tabs filled pills.

### Path alias

`@/` maps to `src/`.
