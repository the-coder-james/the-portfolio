# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Astro on localhost:4321)
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run shadcn    # Run shadcn CLI to add/update components
```

No linting or test scripts are configured.

## Architecture

This is an **Astro + React + Tailwind** portfolio site deployed to GitHub Pages at `https://alejandrejames.github.io/the-portfolio/` (base path `/the-portfolio/`).

### Data flow

All site content lives in `src/assets/*.json`:
- `data.json` — nav links and user profile (name, role, tech stack cards)
- `projectlist.json` — portfolio project entries (title, date, tags, role, tech, provider, image, description, siteurl)
- `taglist.json` — tag ID → name map (`"1": Wordpress`, `"2": Eccube`, `"3": Welcart`)
- `roles.json` — role ID → name map (1: Lead-Developer, 2: Developer, 3: E-commerce module developer)
- `techs.json` / `projectprovider.json` — similar lookup tables
- `contact.json` — social/contact link list

`src/middleware.ts` injects `data.json` into `Astro.locals.webdata` on every request, making it available to all Astro components via `Astro.locals.webdata`.

### Component pattern

Pages use `.astro` files as containers/shells; interactive UI uses React (`.tsx`) with `client:only="react"` or `client:load` directives. The split is:

- **Astro components** (`src/components/*/[Name]Component.astro`) — static shells that import JSON and pass data as props to React islands
- **React components** (`src/components/*/[Name]Component.tsx`) — all interactivity (filtering, dialogs, theme toggle)

### Page structure

Single-page app (`src/pages/index.astro`) with four full-screen snap sections: `#home`, `#about`, `#works`, `#contact`. The main scroll container uses `snap-y snap-mandatory overflow-y-scroll h-screen`.

### Theming

Dark/light mode is managed by `src/components/theme-provider.tsx` (wraps the app) and toggled via `src/components/common/tsx/ModeToggle.tsx`. The layout defaults to `class="dark"` on `<html>`.

### UI components

`src/components/ui/` contains shadcn/ui components. Add new ones with `npm run shadcn add <component>`.

### Works section

`projectlist.json` entries use integer IDs to reference `taglist.json`, `roles.json`, `techs.json`, and `projectprovider.json`. When adding a project, all referenced IDs must exist in those lookup files. The `WorksMainComponent.tsx` handles client-side filtering by title search, tag toggle, and sort order.

### Path alias

`@/` maps to `src/` throughout the codebase (configured via Astro's built-in tsconfig paths).
