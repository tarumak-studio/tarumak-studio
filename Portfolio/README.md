# Sudhir Kumar — Portfolio

React 19 + TypeScript + modern CSS (design tokens, no CSS framework).

## Run

```bash
npm install
npm run dev        # local dev server (Vite)
npm run build      # type-check + production build to dist/
```

`npm run build:single` (requires Bun) produces one pre-rendered, self-contained
`dist/index.html` — the same file as the published preview.

## Structure

```
src/
  content/site.ts     All copy and project data. Edit this first.
  types.ts            Content model
  styles/tokens.css   Design tokens: colour, type scale, spacing, motion
  styles/base.css     Reset, typography, shared components (buttons, nav, cursor)
  styles/sections.css Section layouts
  hooks/              useInView, useTheme, useScrollFrame, useActiveSection...
  components/         Nav, Cursor, Artwork, primitives (Reveal, LineReveal, Magnetic, Marquee)
  sections/           Hero, About, Services, Projects, CaseStudies, Process, Tools, Testimonials, Contact
```

## Before going live

Search `src/content/site.ts` for `TODO`:

- `profile.email` and `profile.url` are placeholders.
- Testimonials are sample quotes (rendered with a "Placeholder quote" tag).
- "Finance Project" is a sample entry; BookVIP.com detail copy is generic.
- Tool list and social URLs should be checked.
- Project covers are generated SVG art (`components/Artwork.tsx`); swap for real imagery.
- Add an `og:image` and a real form endpoint if you want enquiries sent without the visitor's email app.
