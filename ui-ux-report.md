# UI/UX Audit — the-portfolio (`refactor/ui`)

**Date:** 2026-09-12
**Commit at audit:** `4ea2697` (branch `refactor/ui`)
**Method:** static read of source + live inspection of the running production preview
(`http://localhost:4321/the-portfolio/`) driven by Playwright 1.62.1 — 6 panels x 2 themes
x 6 viewports (390x844, 768x1024, 1280x720, 1280x900, 1440x900, 1920x1080), plus keyboard
traversal, `prefers-reduced-motion: reduce` emulation, and pixel screenshots.

**Read-only:** no source file was modified. Two temporary harness scripts were written to the
project root to satisfy `playwright` module resolution and were deleted; `git status` is clean.

---

## 1. Prioritised summary

| Rank | ID | Severity | One-line |
|---|---|---|---|
| 1 | `A11Y-001` | **critical** | Contact form input text is `text-slate-200` on a white card in light theme — typed text is effectively invisible (~1.2:1). |
| 2 | `A11Y-002` | **high** | Deep links (`/#contact`) place the skip link and entire nav *last* in the keyboard tab order. |
| 3 | `A11Y-003` | **high** | Timeline rail changes the displayed entry on `focus` and on `hover`, so keyboard traversal and an accidental mouse pass both destroy the user's selection with no way back. |
| 4 | `A11Y-004` | **high** | Light-theme skill badges and several mono labels use `--color-brand-300`/`-400` as body text on pale surfaces — 2.43:1–3.68:1 against a 4.5:1 requirement. |
| 5 | `UX-001` | **medium** | Panels that scroll internally have no visual affordance; the CSS comment claims a bottom fade that does not exist. |
| 6 | `UX-002` | **medium** | Skills panel overflows its own viewport at every desktop size, clipping the bottom strip mid-row. |
| 7 | `UX-003` | **medium** | Mobile timeline rail scrolls horizontally with the selected item off-screen and year labels cut mid-word. |
| 8 | `A11Y-005` | **medium** | Dark-theme primary CTA gradient ends at 3.03:1 behind white label text. |
| 9 | `UX-004` | **low** | Experience panel leaves ~40% vertical dead space; heading is orphaned from its content. |
| 10 | `UX-005` | **low** | Contact form has no client-side validation feedback, and success state is irreversible with no send target. |
| 11 | `POLISH-001..004` | **subjective** | Density/rhythm observations — see §5. |

### Verified as healthy (no action)

These were explicitly tested and **pass** — listed so a downstream agent does not "fix" them:

- **No page-level scroll anywhere.** 72 panel/theme/viewport combinations checked; `scrollHeight` never exceeded `clientHeight`. The 100vh constraint holds.
- **No horizontal page overflow** at any tested width.
- **No target below 24x24 CSS px** — WCAG 2.2 SC 2.5.8 passes across all panels, nav and footer.
- **Hidden panels are genuinely inert.** `[hidden] { display: none !important }` resolves; focusable children inside inactive panels have zero client rect and are unreachable by Tab. No "focus disappears into a hidden panel" bug.
- **`role`/`aria-labelledby`/`aria-hidden`/`tabindex="-1"` are correct on all six tabpanels**, matching the ARIA APG Tabs pattern.
- **Theme toggle causes zero layout shift** — element rects were byte-identical before/after toggling.
- **`prefers-reduced-motion: reduce` is honoured thoroughly**: zero infinite CSS animations remain running, the particle canvas renders nothing, the marquee falls back to a wrapped static row, and the loading-screen flicker loop is suppressed.
- **Heading structure is valid**: exactly one `<h1>`, each panel has one `<h2>`, project/timeline cards use `<h3>`. The hero `<h1>` exposes a clean accessible name via `.sr-only` with `aria-hidden` per-character spans — the doubled `textContent` is an artefact of naive extraction, **not** a defect.
- **JS payload is small**: ~13 KB across 39 module requests. 20 islands is a lot of *requests* but not a lot of *bytes*.

---

## 2. Scope

**Reviewed (source):**
`src/pages/index.astro`, `src/layout/layout.astro`, `src/styles/global.css`,
`src/components/common/astro/SectionShell.astro`, `src/components/common/tsx/{HeaderComponent,LoadingScreen,ThemeToggle}.tsx`,
`src/components/mainvisual/{MainvisualComponent.astro,TypingHeadline.tsx}`,
`src/components/about/AboutComponent.astro`, `src/components/skills/{SkillsComponent.astro,SkillsTabs.tsx,SkillsStrip.tsx}`,
`src/components/projects/{ProjectsComponent.astro,ProjectsGrid.tsx}`,
`src/components/experience/{ExperienceComponent.astro,TimelineList.tsx}`,
`src/components/contact/{ContactComponent.astro,ContactForm.tsx}`,
`src/components/footer/FooterComponent.astro`, `src/components/ui/tabs.tsx`, `src/hooks/useReducedMotion.ts`.

**Not covered / could not verify:**
- Real screen-reader output (NVDA/JAWS/VoiceOver). All ARIA findings are from markup + Playwright, not assistive-tech transcripts.
- Real touch devices — touch ergonomics inferred from emulated viewports and measured hit areas only.
- `ProjectCard.tsx` internals, `motion-primitives/*`, `AboutCodeBlock/AboutImage/AboutStats`, `ContactCard(List)`, `SkillsMindset` were read only where a finding required it.
- Printing, forced-colors/Windows High Contrast, and `zoom to 400%` (SC 1.4.10 reflow) were **not** tested.
- Contact form has no backend; submission behaviour beyond the optimistic success state is untestable.

---

## 3. Findings

| ID | Sev | Category | Location | Issue | Why it matters | Fix |
|---|---|---|---|---|---|---|
| A11Y-001 | critical | Contrast | `src/components/contact/ContactForm.tsx:11-16` | `fieldClass` hardcodes `text-slate-200` + `placeholder:text-slate-600`. In light theme the card is `--color-card-surface: #ffffff`, so typed text renders `oklch(0.929 …)` ≈ `#e2e8f0` on white ≈ **1.2:1**. Verified by screenshot: "Hello Test" is unreadable. | WCAG 2.2 SC 1.4.3 requires 4.5:1 for normal text. Users cannot read what they type into the site's only conversion surface. | Replace the hardcoded slate literals with theme tokens: `text-[var(--color-ink-muted)]` and `placeholder:text-[var(--color-ink-faint)]`. |
| A11Y-002 | high | Focus order | `src/layout/layout.astro:41` + `src/components/common/tsx/HeaderComponent.tsx:100-105` | On load of `/#contact`, the first `Tab` lands on the Github link *inside* `#contact`; the skip link and nav come after all panel content. Sequential focus navigation starts at the hash target. | WCAG 2.2 SC 2.4.3 (Focus Order) — a keyboard user deep-linked to a panel must tab through the whole panel before reaching navigation. The skip link is rendered useless exactly when it is most needed. | On mount, after canonicalising the hash, reset the sequential-focus start point: `history.replaceState(null,'',hash)` then `document.body.focus()` / set focus to the skip link's container, or call `document.getElementById('main')?.focus()` so traversal restarts from the document top. |
| A11Y-003 | high | Interaction / focus | `src/components/experience/TimelineList.tsx:77-79` | The rail button wires `onClick`, **`onFocus`** and **`onMouseEnter`** all to `setActive(i)`. Verified: tabbing to the first rail item changed the detail from "Present & Beyond" to "The Spark"; hovering item 3 changed it to "Going Professional" and it **did not revert** on mouse-out. All 6 buttons have `tabIndex 0`. | Contradicts the component's own docstring ("Selection is explicit rather than hover-only, so it holds still while you read"). Focus-driven mutation is a WCAG 3.2.1 (On Focus) concern: moving focus changes content unexpectedly. A user reading entry 6 loses it by merely passing the mouse over the rail. | Drop `onFocus` and `onMouseEnter`; keep `onClick` (plus `onKeyDown` for Arrow keys). If a hover preview is wanted, make it non-destructive (a separate preview state that reverts on leave). Consider `role="tablist"`/`role="tab"` with roving tabindex so the rail is one tab stop, not six. |
| A11Y-004 | high | Contrast | `src/components/skills/SkillsTabs.tsx:63`, `SkillsStrip.tsx:55,66`; `src/components/projects/ProjectsGrid.tsx:242,252`; `global.css:169-170` | Light theme uses `--color-brand-300` (`#60a5fa`) and `--brand-400` (`#3b82f6`) as **body-size** text on white/`#f8fafc`. Measured: skill badges **2.43:1** (13.1px) and **2.54:1** (11.2px); `// technologies I work with` **2.54:1**; filter chip `all` **2.43:1**; experience tag badges **3.68:1** (9.6–9.9px). The token comments already say `-300` is "decorative only" and `-400` is "large text / UI only" — the components ignore this. | SC 1.4.3 requires 4.5:1; none of these qualify as large text (all < 18.66px). Dark theme is fine (`-300` = `#93c5fd` at 11.4:1) — this is a light-theme-only regression. | In light theme, use `--color-brand-700` (6.9:1) or `--color-brand` (5.2:1) for badge/chip label text. Simplest systemic fix: introduce a `--color-brand-text` token that resolves to `#1d4ed8` in `:root` and `#93c5fd` in `.dark`, and point these components at it. |
| A11Y-005 | medium | Contrast | `src/components/mainvisual/MainvisualComponent.astro:94` | Primary CTA fill is `linear-gradient(135deg, var(--color-brand-700), var(--color-brand))` with `--color-on-brand: #f8fafc`. In **dark** theme the stops resolve to `#2563eb → #3b82f6`; the light end gives **3.03:1** against the label. Light theme is fine (`#1d4ed8 → #2563eb`, ≥ 4.9:1). | SC 1.4.3 — the gradient's lighter half fails for 14.4px/500 text. The `--t-on-brand` comment measures only against `--brand-700`, missing the gradient's other stop. | In dark theme, darken the gradient end (e.g. `--brand-900 → --brand-700`) or darken `--t-on-brand`. Note this is genuinely distinct from `--color-primary-foreground`, per the project's stated constraint — fix the *gradient stop*, not the token's purpose. |
| UX-001 | medium | Discoverability | `src/styles/global.css:983-991` | `.panel-scroll` has `overflow-y: auto` but no fade, shadow or scrollbar-gutter cue. The comment above it says *"Padding keeps the last row clear of the fade at the bottom"* — **no such fade rule exists** anywhere in the file. Measured internal scroll on `#about`, `#skills`, `#projects`, `#contact` across viewports. | A region that scrolls but does not look scrollable violates the affordance/visibility-of-system-status heuristic. Because the page itself never scrolls, a user whose wheel is over the wrong element perceives the site as frozen. Content below the fold is silently lost. | Add a bottom mask to `.panel-scroll` mirroring the existing `.edge-fade-x` pattern, applied only when actually overflowing: `mask-image: linear-gradient(to bottom, #000 calc(100% - 2rem), transparent)`. Gate it off under `prefers-reduced-motion`? No — it is static, so no gate needed. Also consider `scrollbar-gutter: stable`. |
| UX-002 | medium | Layout | `src/components/skills/SkillsComponent.astro:21-34`, `SkillsStrip.tsx:63` | The skills content region measures 596px against 588px available at **1280x900 and 1440x900**, and 873 vs 721 at 768x1024. Screenshot confirms the `// technologies I work with` strip is sliced horizontally mid-badge at the panel edge, in both themes. Meanwhile the left column has a large empty block below the badge card. | The strip is the panel's visual footer; clipping it mid-row reads as a rendering bug rather than a scroll region. The simultaneous dead space makes the overflow look gratuitous. | Reduce `mb-8` on `SkillsTabs.tsx:83` and the `p-6` on line 101, or let the two-column grid consume the free vertical space (`items-stretch` + `h-full`) so the strip fits. Target: content ≤ available height at ≥1280x900. |
| UX-003 | medium | Responsive | `src/components/experience/TimelineList.tsx:60,40-50` | At 390px the rail is a horizontal `overflow-x-auto` strip. Screenshot shows "2015 / 2017 / 2019" visible with **"2021" cut mid-label** at the right edge, and the *selected* entry ("Now", index 5) scrolled out of view — despite the `scrollIntoView` effect, because the effect's guard runs before layout settles. The `.timeline-rail` scrollbar is 4px and effectively invisible. | Users cannot tell more entries exist; the highlighted detail card does not correspond to any visible rail item, breaking the master-detail mental model. | Apply the same `edge-fade-x` mask to the horizontal rail so cut items read as "more this way", and re-run the `scrollIntoView` after a `requestAnimationFrame` (or use `useLayoutEffect`) so the initial selection is actually brought into view. |
| UX-004 | low | Layout | `src/components/experience/ExperienceComponent.astro:7-14`, `TimelineList.tsx:57` | The timeline root uses `m-auto … justify-center`, centring the whole block in the flex region. At 1440x900 this leaves ~150px of blank space between the `<h2>` and the rail, and ~240px below. The heading floats detached at the top-left while content sits mid-panel. | Weakens the heading/content relationship (proximity) and makes the panel feel unfinished next to the dense Projects panel. Not a defect — the panel fits and nothing is lost. | Change `m-auto` to `mt-0 mx-auto` (or `content-start`) so the block sits under its heading, as About/Skills/Projects already do. |
| UX-005 | low | Interaction / content | `src/components/contact/ContactForm.tsx:24-27,31-55` | `handleSubmit` only calls `setSubmitted(true)` — there is no network request, so the "status: 200 OK — message delivered" copy asserts a delivery that never happened. The success state is terminal: no "send another" affordance, and a re-render is the only way back. Validation is browser-native `required` only. | Misleading microcopy (the message is *not* delivered). Users who mistype an address get no recovery path. `role="status"` is correctly present, so the announcement itself is fine. | Either wire a real endpoint (Formspree/Web3Forms) or change the copy to reflect reality and surface the mailto fallback. Add a "Send another message" button that resets `submitted`. |

### Subjective polish (explicitly *not* defects)

| ID | Observation |
|---|---|
| POLISH-001 | Hero at 390px drops the terminal card entirely (`lg:` grid). The developer-identity signal — the site's strongest differentiator — is absent for mobile visitors. Consider a condensed 4-line variant rather than hiding it. |
| POLISH-002 | Six top-level tabs is at the upper bound for a portfolio; About/Skills could merge, shortening the nav pill and easing the 768px crowding. Purely a structural opinion. |
| POLISH-003 | Footer repeats the `<james/>` logo already in the fixed nav, ~60px above it, in a layout where both are always visible simultaneously. Redundant in a non-scrolling page. |
| POLISH-004 | "Vibe coded with ... and way too much coffee" sits adjacent to "Available for hire" / "Open to opportunities". Tone is fine for a personal site but slightly undercuts the hiring signal. Author's call. |

---

## 4. Before / after sketches for critical + high items

### A11Y-001 — contact field colours

```diff
// src/components/contact/ContactForm.tsx:11
  const fieldClass =
    "bg-[var(--tint-white-03)] border-[var(--tint-white-08)] " +
-   "text-slate-200 placeholder:text-slate-600 rounded-[10px] " +
+   "text-[var(--color-ink-muted)] placeholder:text-[var(--color-ink-faint)] rounded-[10px] " +
    "focus-visible:border-[var(--tint-brand-50)] focus-visible:bg-[var(--tint-brand-05)] " +
```
`--color-ink-muted` is `#1e293b` (13.6:1) in light and `#e2e8f0` in dark — correct in both.

### A11Y-002 — restore focus order on deep link

```diff
// src/components/common/tsx/HeaderComponent.tsx:100
   useEffect(() => {
     if (!tabFromHash(window.location.hash)) {
       history.replaceState(null, "", `#${DEFAULT_TAB}`);
     }
+    // A hash in the URL makes the browser start sequential focus navigation at
+    // that element, which pushes the skip link and nav to the END of the tab
+    // order. Reset the starting point to the document top.
+    if (document.activeElement === document.body) {
+      document.body.focus?.();
+    }
   }, []);
```
A more robust variant: focus `#main` (already `tabindex="-1"`) without scrolling — `document.getElementById('main')?.focus({ preventScroll: true })` — which makes the *next* Tab land on the skip link.

### A11Y-003 — timeline selection should be explicit only

```diff
// src/components/experience/TimelineList.tsx:75
   <button
     type="button"
     onClick={() => setActive(i)}
-    onFocus={() => setActive(i)}
-    onMouseEnter={() => setActive(i)}
     aria-current={selected ? "true" : undefined}
     className="timeline-rail-item relative w-full text-left rounded-lg px-2.5 py-2 transition-colors"
   >
```
This alone fixes the defect. The component docstring already describes this as the intended behaviour.

### A11Y-004 — a light-safe brand text token

```diff
/* src/styles/global.css — add alongside the existing ramp */
:root {
+  --t-brand-text: #1d4ed8;   /* 6.9:1 on --t-surface-base — safe for body-size labels */
}
.dark {
+  --t-brand-text: #93c5fd;   /* 11.4:1 on --t-surface-base */
}

@theme inline {
+  --color-brand-text: var(--t-brand-text);
}
```
```diff
// src/components/skills/SkillsTabs.tsx:63
- style={{ padding: "9px 16px", fontSize: "0.82rem", color: "var(--color-brand-300)" }}
+ style={{ padding: "9px 16px", fontSize: "0.82rem", color: "var(--color-brand-text)" }}
```
Apply the same swap at `SkillsStrip.tsx:55,66`, `ProjectsGrid.tsx:242,252`, and the experience tag badges in `TimelineList.tsx:157,208`.

---

## 5. Machine-readable findings

```json
{
  "A11Y-001": {
    "id": "A11Y-001",
    "severity": "critical",
    "category": "accessibility/contrast",
    "file": "src/components/contact/ContactForm.tsx",
    "line": "11-16",
    "issue": "fieldClass hardcodes text-slate-200 / placeholder:text-slate-600. On the light theme's white card (--color-card-surface: #ffffff) typed text resolves to oklch(0.929 0.013 255.508) ~= #e2e8f0, approx 1.2:1. Confirmed visually: typed values are unreadable.",
    "recommendation": "Replace the hardcoded slate literals with theme tokens: text-[var(--color-ink-muted)] and placeholder:text-[var(--color-ink-faint)].",
    "verified": "playwright: computed color + filled-field screenshot at 1440x900 light",
    "references": ["https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html"]
  },
  "A11Y-002": {
    "id": "A11Y-002",
    "severity": "high",
    "category": "accessibility/focus-order",
    "file": "src/components/common/tsx/HeaderComponent.tsx",
    "line": "100-105",
    "issue": "Loading /#contact makes the first Tab land on a link inside #contact; the skip link and the whole nav come after all panel content, because sequential focus navigation starts at the hash target.",
    "recommendation": "After canonicalising the hash on mount, reset the sequential focus start point (focus document.body, or #main with preventScroll) so traversal restarts at the document top.",
    "verified": "playwright: fresh load of /#contact, 8 Tab presses recorded",
    "references": ["https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html"]
  },
  "A11Y-003": {
    "id": "A11Y-003",
    "severity": "high",
    "category": "accessibility/interaction",
    "file": "src/components/experience/TimelineList.tsx",
    "line": "77-79",
    "issue": "Rail buttons bind onClick, onFocus and onMouseEnter all to setActive. Tabbing to the first item changed the detail card from 'Present & Beyond' to 'The Spark'; hovering item 3 changed it to 'Going Professional' and it did not revert on mouse-out. All six buttons are tabIndex 0.",
    "recommendation": "Remove onFocus and onMouseEnter, keeping onClick (plus Arrow-key handling). Optionally convert the rail to a roving-tabindex tablist so it is a single tab stop.",
    "verified": "playwright: focus + hover + mouse-leave state transitions recorded at 1440x900",
    "references": ["https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html", "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/"]
  },
  "A11Y-004": {
    "id": "A11Y-004",
    "severity": "high",
    "category": "accessibility/contrast",
    "file": "src/components/skills/SkillsTabs.tsx,src/components/skills/SkillsStrip.tsx,src/components/projects/ProjectsGrid.tsx,src/components/experience/TimelineList.tsx",
    "line": "SkillsTabs.tsx:63, SkillsStrip.tsx:55,66, ProjectsGrid.tsx:242,252, TimelineList.tsx:157,208",
    "issue": "Light theme uses --color-brand-300 (#60a5fa) and --color-brand-400 (#3b82f6) as body-size label text on white/#f8fafc. Measured 2.43:1 (13.1px skill badges), 2.54:1 (11.2px strip badges and the '// technologies I work with' caption), 2.43:1 (12px filter chip), 3.68:1 (9.6-9.9px experience tag badges). global.css:169-170 already documents -300 as decorative-only and -400 as large-text-only.",
    "recommendation": "Add a --color-brand-text token (#1d4ed8 light / #93c5fd dark) and use it for all body-size brand-coloured label text. Dark theme already passes and needs no change.",
    "verified": "playwright contrast sweep, 6 viewports x 2 themes; dark theme confirmed passing",
    "references": ["https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html"]
  },
  "A11Y-005": {
    "id": "A11Y-005",
    "severity": "medium",
    "category": "accessibility/contrast",
    "file": "src/components/mainvisual/MainvisualComponent.astro",
    "line": "94",
    "issue": "Primary CTA background is linear-gradient(135deg, --color-brand-700, --color-brand). In dark theme these resolve to #2563eb -> #3b82f6; the lighter stop gives 3.03:1 against the #f8fafc label at 14.4px/500. Light theme passes.",
    "recommendation": "In dark theme use a darker gradient pair (--brand-900 -> --brand-700), or darken --t-on-brand. Do not repurpose --color-primary-foreground; --color-on-brand is intentionally distinct.",
    "verified": "playwright: computed backgroundImage stops per theme",
    "references": ["https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html"]
  },
  "UX-001": {
    "id": "UX-001",
    "severity": "medium",
    "category": "interaction/discoverability",
    "file": "src/styles/global.css",
    "line": "983-991",
    "issue": "`.panel-scroll` sets overflow-y:auto with no fade, shadow or gutter cue. The comment directly above claims 'Padding keeps the last row clear of the fade at the bottom' but no such fade rule exists in the file. Internal scrolling measured on #about, #skills, #projects and #contact.",
    "recommendation": "Add a bottom mask mirroring the existing .edge-fade-x pattern (mask-image: linear-gradient(to bottom, #000 calc(100% - 2rem), transparent)), applied when the region overflows; consider scrollbar-gutter: stable.",
    "verified": "playwright: scrollHeight vs clientHeight per panel/viewport; grep confirmed no fade rule",
    "references": ["https://www.nngroup.com/articles/visibility-system-status/"]
  },
  "UX-002": {
    "id": "UX-002",
    "severity": "medium",
    "category": "layout",
    "file": "src/components/skills/SkillsComponent.astro,src/components/skills/SkillsTabs.tsx",
    "line": "SkillsComponent.astro:21-34, SkillsTabs.tsx:83,101",
    "issue": "Skills content region measures 596px against 588px available at 1280x900 and 1440x900 (873 vs 721 at 768x1024), clipping the bottom 'technologies I work with' strip mid-badge in both themes, while the left column shows a large empty block.",
    "recommendation": "Tighten SkillsTabs spacing (mb-8 on the TabsList, p-6 on the panel card) and/or let the grid stretch to consume free vertical space so the strip fits without internal scroll at >=1280x900.",
    "verified": "playwright measurement + screenshots at 1280x900, 1440x900, both themes",
    "references": []
  },
  "UX-003": {
    "id": "UX-003",
    "severity": "medium",
    "category": "responsive",
    "file": "src/components/experience/TimelineList.tsx",
    "line": "40-50,60",
    "issue": "At 390px the rail is a horizontal scroller: '2021' is cut mid-label at the right edge and the selected entry (index 5, 'Now') is off-screen, so the detail card matches no visible rail item. The .timeline-rail scrollbar is 4px and visually absent.",
    "recommendation": "Apply an edge-fade-x mask to the horizontal rail so cut items read as 'more this way', and defer the scrollIntoView by a requestAnimationFrame (or use useLayoutEffect) so the default selection is actually scrolled into view.",
    "verified": "playwright screenshot at 390x844 light",
    "references": []
  },
  "UX-004": {
    "id": "UX-004",
    "severity": "low",
    "category": "layout/hierarchy",
    "file": "src/components/experience/TimelineList.tsx",
    "line": "57",
    "issue": "Root grid uses `m-auto ... justify-center`, centring the timeline in the flex region. At 1440x900 this leaves roughly 150px between the h2 and the rail and about 240px below, orphaning the heading from its content.",
    "recommendation": "Replace m-auto with mt-0 mx-auto (or add content-start) so the block sits directly under its heading, consistent with About/Skills/Projects.",
    "verified": "screenshots at 1440x900 and 1280x720",
    "references": []
  },
  "UX-005": {
    "id": "UX-005",
    "severity": "low",
    "category": "interaction/content",
    "file": "src/components/contact/ContactForm.tsx",
    "line": "24-27,31-55",
    "issue": "handleSubmit only sets local state; no request is made, yet the success panel claims 'status: 200 OK - message delivered'. The success state is terminal with no reset affordance. Validation is native `required` only. The role=status live region is correctly present.",
    "recommendation": "Wire a real endpoint or change the copy to stop asserting delivery and surface the mailto fallback; add a 'Send another message' control that resets `submitted`.",
    "verified": "source read; no network request observed on submit",
    "references": ["https://www.nngroup.com/articles/error-message-guidelines/"]
  }
}
```

---

## 6. Prioritised action list

> **Status:** items 1-10 are done as of commit on `refactor/ui`; POLISH-001..004
> are left for the author. Each fix was verified against the running preview,
> not just applied. See the commits for measurements.

- [x] 1. `A11Y-001` — swap `text-slate-200`/`placeholder:text-slate-600` for ink tokens in `ContactForm.tsx`. One-line fix, unblocks the site's only conversion path.
- [x] 2. `A11Y-003` — delete `onFocus` / `onMouseEnter` from the timeline rail button. One-line fix, restores the documented intent.
- [x] 3. `A11Y-004` — add `--color-brand-text` and repoint the 6 label call-sites. Systemic; prevents recurrence.
- [x] 4. `A11Y-002` — reset the sequential-focus start point after hash canonicalisation in `HeaderComponent`.
- [x] 5. `A11Y-005` — darken the dark-theme CTA gradient stops.
- [x] 6. `UX-001` — add the bottom scroll fade that `global.css` already claims exists.
- [x] 7. `UX-002` — tighten skills spacing so the strip fits at ≥1280x900.
- [x] 8. `UX-003` — fade + fix `scrollIntoView` timing on the mobile timeline rail.
- [x] 9. `UX-004` — un-centre the experience timeline block.
- [x] 10. `UX-005` — correct the contact success copy and add a reset control.
- [ ] 11. `POLISH-001..004` — discuss with the author; no action implied.

---

## 7. Assumptions & open questions

1. **`--color-brand-300` as light-theme body text (A11Y-004)** — I treated this as a defect because the token's own comment says "decorative only". If these badges are considered decorative chrome rather than content, the finding softens to `low`. I judged them content: they are the substance of the Skills panel.
2. **Scroll-fade placement (UX-001)** — the stale comment suggests a fade was intended and later removed, possibly deliberately. Confirm before re-adding.
3. **A11Y-002 fix approach** — focusing `#main` on mount competes with `selectTab`'s existing `requestAnimationFrame(() => getElementById(id)?.focus())`. Sequence carefully so the initial-load reset does not fight per-tab focus management. Worth a manual keyboard pass after the change.
4. **Contact form (UX-005)** — I assumed no backend exists because none appears in the source. If submission is handled by a platform-level integration not visible here, only the "send another" and validation points stand.
5. **Screen-reader verification** — all ARIA conclusions are markup/Playwright-derived. Item 2 and 3 in particular deserve one NVDA or VoiceOver pass before being closed.
