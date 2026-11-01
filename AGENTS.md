# AGENTS.md

Guidance for AI agents (and humans) working in this repo.

## Project

Multi-page portfolio for **Astha Shukla** (BBA Marketing student, Allenhouse Business School, Kanpur).
Being rebuilt from a plain static site into a **3D, scroll-driven, multi-page site**.

- **Audience:** recruiters, internship leads, faculty.
- **Design read:** cinematic, dark-first portfolio with a warm coral accent carried over from the original brand. 3D objects react to scroll and pointer; content stays readable and fast.
- **Dials:** variance 8, motion 8, density 3 (design-taste skill scale).

## Stack

| Concern | Choice |
|---|---|
| Build | Vite (multi-page app, one HTML entry per page) |
| 3D | Three.js (single shared WebGL canvas, per-page scene modules) |
| Scroll animation | GSAP + ScrollTrigger |
| Smooth scroll | Lenis (driven by GSAP ticker) |
| Page transitions | Cross-document View Transitions API + GSAP overlay fallback |
| Fonts | Self-hosted via `@fontsource-variable/*` (no font CDN) |
| Language | Vanilla ES modules, no UI framework |
| Deploy | GitHub Pages via GitHub Actions (`dist/`) |

## Commands

```bash
npm install
npm run dev       # Vite dev server
npm run build     # Production build to dist/
npm run preview   # Serve dist/ locally
```

## Structure (target)

```
/
├── index.html  about.html  skills.html  projects.html  certifications.html  contact.html
├── partials/              nav.html, footer.html, head.html (injected at build by vite.config.js)
├── public/                static assets copied as-is (photo, certificate, favicon, robots.txt, sitemap.xml)
├── src/
│   ├── main.js            entry for every page: boots scroll, 3D, transitions, UI, then page module
│   ├── core/              lenis + gsap setup, nav, reduced-motion + WebGL capability checks
│   ├── three/             renderer singleton, shared materials/palette, scenes/<page>.js
│   ├── pages/             per-page scroll choreography (<page>.js), selected by body[data-page]
│   ├── ui/                reusable behaviors (split text, magnetic buttons, counters, tilt, filter)
│   └── styles/            tokens.css, base.css, layout.css, components.css, pages/<page>.css
├── .github/workflows/     deploy.yml (Pages)
└── web-dev-skills/        optional local reference material, gitignored, never shipped (absent in a fresh clone)
```

## Deploy URL

Live site: `https://workwithaastha.github.io/new3d/`. `vite.config.js` has `base: './'` and the `html-partials` plugin rewrites the placeholder host `https://aman-0402.github.io/asport/` in canonical, Open Graph and JSON-LD URLs to the live URL above, and strips the leading `/` from `images/` and `favicon.svg` links. Keep `public/sitemap.xml` and `public/robots.txt` on the same URL.

## Conventions

- **Partials:** nav/footer/head markup lives once in `partials/` and is injected with `<!-- @include name -->` via the custom plugin in `vite.config.js`. Never duplicate nav/footer into pages.
- **Page identity:** `<body data-page="...">` selects the page module in `src/pages/` and the 3D scene in `src/three/scenes/`, and drives the active nav link.
- **One WebGL canvas** (`#webgl`, fixed, behind content). Scenes are lazy-imported per page so Three.js code for other pages is never loaded.
- **Styling:** CSS only, no inline `<style>` blocks, no inline `style=""` except values set by JS animation. Tokens in `src/styles/tokens.css` (OKLCH). Dark theme only (no light theme or toggle).
- **Accent lock:** coral is the only UI accent. Mint appears only as a lighting tint inside 3D scenes.
- **Radius system:** buttons/tags full-pill, cards and media 14px, nothing larger.
- **Motion rules:** animate `transform`/`opacity` (and shader uniforms) only. UI transitions under 300ms with `cubic-bezier(0.23, 1, 0.32, 1)`. Scroll-scrubbed motion may be longer.
- **Reduced motion is mandatory:** `prefers-reduced-motion: reduce` disables Lenis, scrubbed 3D camera moves, and split-text; content must render fully visible with no animation.
- **No-WebGL fallback:** if WebGL is unavailable, skip Three.js entirely and show the CSS gradient backdrop. No page may depend on the canvas for content.
- **Performance budget:** device pixel ratio capped at 2 (1.5 on mobile), ~30fps on mobile/low-power, pause render loop when tab hidden, dispose scene on page leave, engine loads after `load` + idle with `compileAsync`, software WebGL treated as no WebGL (`?webgl=force` to override). Target Lighthouse Performance >= 85 on mobile.
- **Copy rules:** no em dashes or en dashes anywhere (use commas, colons, hyphens). No buzzwords. No invented stats: only numbers from the resume.
- **Contact privacy:** phone number is intentionally hidden. Do not add `tel:` links or phone copy unless the user asks.
- **SEO:** unique `<title>` and meta description per page, one `h1` per page, JSON-LD `Person` on home, canonical URLs, `sitemap.xml`, `robots.txt`, descriptive alt text.

## Interactive hero character

`src/components/InteractiveCharacter/InteractiveCharacter.js` (+ `.css`), mounted from `src/pages/home.js` into `[data-interactive-character]` (full-bleed, `fit: 'cover'`, `focus: { x: 'face', y: 0 }`).

- Frames: `public/character/webp-main/frame_0001..0300.webp` (800x450); the observed frame ranges are documented at the top of the file.
- The hero is a 3x2 grid (`GRID`). Top: left 61-93 / centre 100-128 / right 151-164. Bottom: down-left 197-227 / down 180-192 / down-right 167-178 (`ZONES`). Entering a cell plays into its pose frame (`POSE`: 82 / 126 / 160 / 215 / 186 / 172) and, while the pointer rests, rewinds a few frames and replays them (`IDLE`: 6 frames, 2.4 s cycle).
- Changing cells always goes via centre: the playhead returns to the hub frame 126, then plays the footage out to the new pose. Every frame in between is played (backwards when returning to centre), passing the hub at full speed. Blinks (94-99 on the left path) are never drawn. Pointer leaving the hero returns to centre.
- Tuning at the top of the file: `ZONES`, `HUB`, `POSE`, `IDLE`, `GRID`, `GRID_HYSTERESIS`, `REST_FRAME`, `SKIP_FRAMES`, `TRACKING`, `MOTION`, `FACE_ORIGIN`.
- Phones and reduced motion load and show frame 126 only (no listeners, no preload, no render loop). Only frames 61-227 are preloaded on desktop/tablet.
- Source media (MP4, PNG frames, contact sheet, the previous `webp` set) live in gitignored `assets-src/character/`; never put them back in `public/`.
- Hero copy (intro, name `h1`, tagline, rotator, CTAs, highlights) sits in `.hero__content` over the empty dark left half of the frame. Below 900px the character stacks above the copy instead of behind it.
- The home 3D butterfly is hidden in the hero station so it does not compete with the character.

## 3D butterfly

`src/three/butterfly.js`: procedural butterfly (shape-geometry wings on hinges, shader with coral gradient, veins, edge spots, mint shimmer). It keeps the old blob uniform names: `uAmp` = wing reach, `uFreq` = beat rate, `uRimStrength` = edge glow, `uOpacity`. Wings beat faster with scroll velocity. `scenes/ambient.js` flies it along a scroll `path` (camera-relative CatmullRom, `mobilePath` below 768px, optional pointer `lean`) and fades it to 35% while crossing mid-screen. Home keeps its station tweens instead of a path. Each page sets its own `colors` (wing, base, edge glow): home coral, about monarch orange, skills blue morpho, projects violet, certifications gold, contact emerald.

## Content source

All copy comes from Astha Shukla's resume (Digital Marketing Intern version, October 2026; kept locally, gitignored because it contains a phone number). Facts to keep exact:

- Digital Marketing Intern, DeepSetu AI Technologies, October 2026 - Present: grew social media following from 30 to 1K in 2 weeks
- Digital Marketing & Lead Generation Intern, ARX Infotech, October 2026 - Present, remote: LinkedIn prospecting, lead lists in Google Sheets and HubSpot CRM, email outreach
- Projects (October 2026): Competitor and Social Media Audit (DeepSetu AI Technologies); Email Marketing Campaign (ARX Infotech)
- BBA Marketing, Allenhouse Business School, Kanpur, 2025 - 2027; Class XII Commerce (CBSE) 2024 and Class X (CBSE) 2022, K.R. Education Centre (no percentages on the resume, so none on the site)
- Digital Marketing Certified, HubSpot Academy (valid Sep 11, 2026 to Oct 10, 2028)
- Agentic AI Certified Foundations Associate, Oracle University (Oracle Certified), September 18, 2026 (not on the resume, kept because the certificate exists)
- Digital Marketing Training, Allenhouse Business School, 2026, ongoing (never call it a completed certification)
- Email: aasthashuklaastha44@gmail.com, LinkedIn: linkedin.com/in/astha-shukla-96891a430, based in Kanpur, Uttar Pradesh
- The resume lists the portfolio as workwithaastha.github.io/portfolio; this site deploys at workwithaastha.github.io/new3d/

## Git workflow

- Work on `main`, one commit (or small set) per phase, then `git push origin main`.
- **No `Co-Authored-By` or other attribution trailers in commit messages.**
- Conventional commit subjects, e.g. `feat(phase-2): three.js engine with scroll-driven camera`.

## Phase plan

Status legend: `[ ]` todo, `[x]` done.

### Phase 0: Plan and guardrails
- [x] Audit existing site (6 pages, `styles.css`, `main.js`, assets)
- [x] Rewrite AGENTS.md with stack, conventions, phase plan
- [x] Gitignore `web-dev-skills/`, `node_modules/`, `dist/`

### Phase 1: Vite foundation and design system
- [x] `package.json`, Vite MPA config with 6 entries and partial-include plugin
- [x] Move assets to `public/` (rename certificate to a URL-safe filename)
- [x] New token system (OKLCH, dark only after Phase 5), self-hosted fonts, base/layout/components CSS
- [x] Shared nav (with mobile menu) and footer as partials
- [x] Port all six pages' content into the new markup skeleton (no 3D yet), remove old `styles.css`/`main.js`
- [x] Build passes

### Phase 2: Motion and 3D engine
- [x] Lenis smooth scroll synced to GSAP ticker + ScrollTrigger
- [x] Three.js renderer singleton, resize, DPR cap, visibility pause, dispose
- [x] Capability checks: reduced motion, WebGL, low-power heuristics
- [x] Scene contract: `create({ renderer, scroll }) -> { update(t), onScroll(p), dispose() }`
- [x] Shared UI motion: split-text reveals, magnetic buttons, scroll reveals, counters

### Phase 3: Home page experience
- [x] Hero 3D scene: floating coral/mint sculptural forms, pointer parallax, scroll-driven camera dolly
- [x] Pinned scroll story sections (who I am, what I work on, featured work teaser)
- [x] Horizontal marquee of focus areas, CTA to projects/contact

### Phase 4: Inner pages, 3D per page
- [x] About: scroll-drawn 3D path through education timeline
- [x] Skills: 3D sphere of skill labels (CSS-projected DOM text) in a sticky column, highlighting the group in view
- [x] Projects: sticky stacked case panels that tilt in from 3D and recede under the next, with filter
- [x] Certifications: 3D certificate plane that turns in on scroll, animated counters
- [x] Contact: pointer-leaning butterfly, large email CTA with copy-to-clipboard

### Phase 5: Transitions and polish
- [x] Cross-page transitions (View Transitions API, overlay fallback)
- [x] Preloader tied to font + scene readiness (short, skippable)
- [x] All interaction states (hover, focus-visible, active) audited
- [x] Dark-only theme (light theme and toggle removed)

### Phase 6: SEO, performance, deploy
- [x] Meta, Open Graph, JSON-LD, canonical, sitemap.xml, robots.txt, favicon
- [x] Image optimization, lazy loading, code-split check
- [x] GitHub Actions workflow to deploy `dist/` to GitHub Pages
- [ ] Enable Pages in repo settings (Source: GitHub Actions); owner action
- [x] Final design-taste pre-flight + README update
