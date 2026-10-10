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

Generated audits, reviews and reports (UI/UX, QA, security, privacy) go in
`docs/reports-audits/` as `YYYY-mm-dd_[type]-report.md`. That directory is
gitignored; never write a report to the repo root or commit one.

## Architecture

**Astro + React + Tailwind v4** portfolio deployed to GitHub Pages at
`https://the-coder-james.github.io/the-portfolio/` (base path `/the-portfolio/`).
Static output — there is no server at runtime.

### Page structure: one scrolling page

`src/pages/index.astro` renders four sibling `<section>`s inside `<main>`:
`#home`, `#about`, `#projects`, `#contact`. The page is one scrolling document,
and **the page is the only vertical scroller**: every section is at least one
screen tall (`--section-h`, `100svh`), centres its content in that, and grows
with its content when it is taller. Nothing in a section is clipped or scrolled
inside a box of its own (`tests/e2e/layout.spec.ts` checks every state at a
dozen sizes). Contact's minimum is shorter by the footer (`--footer-h`), so the
last screen is Contact plus the footer.

- **About** always runs past a screen: three numbered sub-sections, one after
  another (see below).
- **Projects on PC is a deck** (see below): one screen of scroll per slide, the
  frame stuck to the screen while the page scrolls through it. On phones,
  without JS, and before hydration it is an ordinary block.

**SP (phone) is 767px and below** (`SP_QUERY` in `src/hooks/useMediaQuery.ts`).
Its complement is Tailwind's `md:` (min-width 768px). Never use `sm:` for the
phone/PC split: sm is 640px, which is still phone-width here.

`HeaderComponent` is a nav of plain `<a href="#section">` links. The browser
does the scrolling (smooth via `html{scroll-behavior}`), the history entry and
the focus start point; the hero CTAs and `FlowLink.astro` work the same way.
The header adds:

- a scroll-spy (an IntersectionObserver on a zero-height band at mid-screen)
  that marks the current section with `aria-current`. It never writes the
  hash;
- `--nav-h` / `--footer-h`, measured at runtime;
- canonicalising the legacy `#skills` / `#experience` to `#about` (replaceState),
  and going to the section on every later section hash change. Back/forward
  otherwise restore whatever position the browser saved, which on a phone was
  part way through a smooth scroll.

Layout rules that are easy to break:

- Sections align to the very top of the screen and pad themselves clear of the
  floating nav, so `html` has **no scroll-padding** (that lands every section a
  nav-height low). Focusable controls carry `scroll-margin-top` instead, which
  keeps Shift+Tab from parking one behind the nav (SC 2.4.11).
- Sections are `overflow-x: clip` and nothing else: decoration past a side
  edge is cut, nothing is cut top or bottom. Never `overflow: hidden` on a
  section: it makes a scroll container, which breaks the sticky Projects frame
  and every `view()` timeline inside.
- On PC, `html` has `scroll-snap-type: y proximity` with stops at Home and
  Contact only. About is deliberately no stop (a pull back to its top while
  reading would fight the reader), nor is the deck, which steps itself. Phones
  scroll freely.

**About is three sub-sections** — Profile, Arsenal, Journey, numbered as
"STEP 01-03" with an `h3`, a lede and a rule — laid out in full, one after
another: the former `#skills` and `#experience` sections. There are no tabs
anywhere in it. Arsenal prints all three skill categories as cards
(`SkillsCategories`), and Journey prints every stage on a vertical pipeline
(`TimelineList`) whose track fills as it scrolls past. If you add content to
one sub-section, check the other two do not already say it: the merge removed
a skills marquee, a bio that narrated the career arc, and stats and tags that
restated the Journey and Arsenal.

**Sections are deliberately NOT passed into a React component as slots.**
Astro's React adapter hands slot content to React as an opaque HTML string via
`dangerouslySetInnerHTML`, with `StaticHtml.shouldComponentUpdate` pinned to
`false`; a nested `<astro-island>` defers on its ancestor's `ssr` flag and waits
for an `astro:hydrate` event dispatched from DOM nodes the ancestor's own mount
then replaces. Keeping the sections and sub-sections as plain Astro markup keeps
island nesting depth at 1, which is the only depth this codebase has ever
exercised. If you restructure the page, check `dist/index.html` still has no
nested islands.

Consequences to keep in mind:

- **Never use `client:visible`.** Islands must be hydrated before the reader
  reaches them: the deck and the reveals measure and animate on arrival. Use
  `client:idle` below the fold.
- `useRevealed` (`src/hooks/`) fires once, when an element scrolls into view.
  It has no timer fallback: one would play the below-the-fold reveals where
  nobody sees them. The end state never depends on it; reduced motion and no-JS
  pin `[data-reveal]` visible.
- Without JS the nav anchors still work, Projects shows every card in a plain
  grid, and the `<noscript>` style in `layout.astro` removes the pre-render veil
  and loader and pins every `[data-reveal]` node visible (reveals are
  server-rendered at opacity 0). Tag any new reveal's animated node
  `data-reveal`, or it stays invisible there and under reduced motion.

### Scroll choreography

Each section carries a CSS view timeline (`--section`); the About sub-sections
(`--sub`) and Journey stages (`--stage`) carry their own. Content scrubs
against them — reversing the scroll reverses the motion. Home only leaves (the
copy lags and recedes, the config card tilts away, the floaters drift at their
own `--drift`); About's heading slides in from the margin, each sub-section's
title follows and its body rises as it arrives, the Journey track fills, and
the code sample drifts behind Profile; the Projects frame is raised like a
sheet lifted off the desk; Contact's columns close in from either side. The
hero's registration marks are pinned to the screen with the grid and fade as
the hero leaves. All of it lives in `global.css` under "Section scroll
choreography".

- Entrances run over `entry` ranges and exits over `exit` ranges, so they hold
  for a section of any height, and each keyframe set has one explicit end: the
  other is the element's resting style. Anything measured at rest is never
  mid-animation; tests rely on it.
- Keyframes use plain `from` / `to`, never timeline-range selectors
  (`entry 0% {...}`): esbuild's CSS minifier warns on those.
- It is gated on `prefers-reduced-motion: no-preference` and
  `@supports (animation-timeline: view())`. Without support the sections are
  still and the item reveals still play.

### Projects: the deck and the filter

On PC, `ProjectsGrid` turns `#projects` into a deck: it sets `data-deck` and
`--slides` on the section (one screen of height per slide), the
`.projects-frame` sticks, and the scroll position names the slide. **One wheel
or swipe gesture turns exactly one slide**: while the deck fills the screen,
wheel and touch scrolling are intercepted (non-passive listeners) and turned
into an instant scroll to the next slide's position. A step waits until the
current slide has fully assembled *and* the gesture has ended (no wheel event
for `GESTURE_GAP_MS`), so a trackpad's momentum tail never turns a second
slide; a sudden jump in delta inside the tail counts as a fresh swipe. At
either end a new outward gesture is left native and scrolls on into About or
Contact; scrolling in from either side is clamped onto the nearest slide.
Keyboard and scrollbar scrolling are never intercepted. The deck has no snap
points: they would fight the steps. Each slide
holds six cards — three across and two down in grid view, two across and three
down in list view — and a stage too short for two rows of a card's text drops a
row rather than cutting cards off. On a slide change the leaving cards scale
to 0 within half a second and go `inert`; each arriving card waits a random
0.50-1.00s (`ENTER_MIN` / `ENTER_MAX`), then scales from 0 to 100%. A change
within 700ms of the previous one (`FAST_GAP_MS`) is the reader scrolling
through (scrollbar, keys, a pager jump), not stopping, so it swaps at once
instead. A card's full description
(with its role and via line) is a Radix tooltip over the card: hover or focus
on a pointer device, tap-and-hold on a touch screen (`held` in `ProjectCard`,
450ms without drifting), where the card also prints "Tap and hold to see
description". A held popup stays up after the finger lifts and closes on the
next tap, a scroll or Escape. The card's "No public link" button keeps its
pointer and focus events from the card's trigger, so its reason tooltip is
never closed by the description's. A pager of
dots goes to a slide, and a new filter returns the deck to its first slide. Phones keep a
swipe rail (grid) or a list that grows a batch of 8 at a time.

`FilterSelect.tsx` is a custom multi-select box: a button dressed as the old
closed select, opening a Radix Popover (portal, placement, outside-click
dismissal) with an ARIA listbox (`aria-multiselectable`, aria-activedescendant,
arrow/Home/End/Space/Enter/type-ahead, Escape or Tab closes and returns focus to
the box). Values within one box are alternatives (OR); boxes narrow each other
(AND). Each option counts what choosing it would show against the search and the
*other* boxes. Applied values show as removable chips.

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
- The banner sits at the bottom of the screen; the footer is at the end of the
  document, not pinned, so there is nothing below it to clear.

### Data

Content lives in `src/assets/*.json`:

- `data.json` — nav (the section list), `seo` (title, description, keywords, OG
  image), user profile, hero, about copy (including `about.sections`, the
  sub-section labels and ledes), skills copy, and `flow` (the forward step out
  of each section)
- `projectlist.json` — project entries; integer ids reference `taglist.json`,
  `roles.json`, `techs.json`, `projectprovider.json`
- `experience.json`, `contact.json`

Components import these directly.

### Components

- `src/components/*/[Name]Component.astro` — section shells; most use
  `common/astro/SectionShell.astro`, which supplies the one-screen frame, the
  `aria-labelledby` heading and the `.section-stage` / `.section-head` hooks
  the scroll choreography drives. `#home` (`mainvisual/`) builds its own
  section.
- `src/components/*/*.tsx` — the interactive islands.
- `src/components/ui/` — shadcn/ui primitives (badge, button, input, label,
  textarea, tooltip). There are no tablists on the page any more.

### Path alias

`@/` maps to `src/`.
