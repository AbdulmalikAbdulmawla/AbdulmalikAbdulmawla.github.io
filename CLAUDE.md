# portfolio — project instructions

## What this is
Abdulmalik's public personal portfolio website. Purpose: a links-first hub for people hiring
**urban designers who build research/decision tools for data investigation and evidence-based
design** (esp. urban economy). Quick "about", featured work, publications, experience — every
item pointing to a stable public link.

## Stack — do not add tooling
Hand-written **static HTML + CSS**. No framework, no Vite, no `node_modules`, no build step.
This is deliberate (lowest upkeep, instant GitHub Pages deploy). Sibling platform apps are
Vite+React — this one is intentionally NOT. Do not scaffold a build system here.

## Layout — landing hero + tabbed workspace
Not a long scroll. A constant **hero** sits on top; below it a sticky **tab bar** swaps between 4
panels — **Work · Research · Experience · About** (Research = publications + teaching; About = bio +
skills). All 4 are real `<section class="panel">`s in source order, so **no-JS + crawlers see
everything stacked**; JS hides the inactive ones. Progressive-enhancement guard: `<html class="no-js">`
is flipped to `js` by an inline `<head>` script, and CSS only hides panels under `.js` — so with JS off
nothing is hidden. Deep-links work (`#research`); legacy anchors (`#publications`, `#teaching`,
`#skills`) alias to their tab (see `ALIAS` in `tabs.js`).

Visual system = **muted Bauhaus**: desaturated accent trio (`--bau-red/-yellow/-blue`, ochre-dk for
text) used only as per-tab wayfinding + motif, never a colour flood. Each panel sets its category colour
via inline `style="--cat: …"`. Dual measure: `--measure-wide` (72rem) shell, `--measure` (46rem) for
prose. Hero has a faint CSS grid + an animated **boids-over-street-network** canvas (`boids.js`) — a
signature motif tying his arc from swarm/CA simulation to urban movement; a soft `.hero::after` scrim
keeps the hero text legible over it; the boids also treat the **cursor as an attractor** (stream to it,
orbit it, release on leave / 2.5 s idle). Work cards carry hand-authored **SVG data-diagrams** in a fixed
16:10 `.card-media` slot; `card-art.js` overlays each with a generative canvas scene, bound by the
slot's `data-art` attribute — a scene runs **only while the cursor is over its card** and freezes on the
last frame when it leaves (at rest / on touch devices the SVG diagram shows). Swap for real app
screenshots later by dropping an `<img>` in the same slot **and removing that slot's `data-art`
attribute** (card-art.js then skips the card; no layout change — the SVG stays in the DOM as the
no-JS / motion-off / print fallback either way).

**Motion policy (decided 2026-07-02):** all animation obeys a single state on `<html>` —
`motion-on` / `motion-off` — resolved synchronously by the inline `<head>` script: a stored per-device
choice (`localStorage["motion"]`) wins, else the visitor's OS `prefers-reduced-motion` preference.
`motion.js` injects a ⏸/▶ button beside the DE/EN switch (constant `aria-label="Animation"` — same word
EN/DE, so no i18n keys — with `aria-pressed` carrying state) that flips the class pair, persists, and
broadcasts `motionchange`; boids.js + card-art.js listen. With no stored choice the page also follows
live OS changes. The reduced-motion **media query remains only as the no-JS fallback**. Rationale: the
owner's own Windows has "Animation effects" off, and WCAG 2.2.2 wants a pause control anyway.

## Files
| File | Role |
|---|---|
| `index.html` | Entire site: hero, tab bar (`role="tablist"`), 4 `.panel` sections, footer. HTML-commented per panel. Inline `<head>` script flips `no-js`→`js` AND resolves the motion state (`motion-on`/`motion-off` from stored choice, else OS preference) before first paint. |
| `styles.css` | Muted-Bauhaus design system. Palette + system-ui font borrowed from VSP_Unfallatlas chart-export (`src/lib/plotExport.ts`). Tokens in `:root`; tab/panel/card/motif styles; `html.motion-off` rules (canvas hide, SVG restore, transitions off) + reduced-motion media query as no-JS fallback + print (print expands all panels). |
| `motion.js` | The ⏸/▶ motion toggle: injects the button beside `#lang-toggle`, flips `motion-on`/`motion-off` on `<html>`, persists to `localStorage["motion"]`, dispatches `motionchange`, follows live OS `prefers-reduced-motion` changes when no choice is stored. Icon swap is pure CSS off the html class; `aria-pressed` = animation running. ~60 lines, no deps. |
| `boids.js` | Hero motif: Reynolds boids flocking node-to-node across a procedural street network on a `<canvas>`. The cursor is an attractor — the flock streams toward it and orbits (seek/orbit/ring-spring weights at the top of the file are the tuning dials); releases smoothly on pointer-leave or 2.5 s idle. Decorative + aria-hidden; freezes to a static frame while `motion-off` (resumes/refreezes on `motionchange`); pauses when the hero is off-screen (IntersectionObserver) or the tab is hidden. No deps. |
| `card-art.js` | Generative canvas scenes for the 5 work cards, injected over the SVG diagrams and bound by `.card-media[data-art]` (`unfall` lens · `toolbox` self-drawing network · `flows` corridors · `venn` exchange · `miner` live weighted least-squares). One shared rAF engine: only visible scenes tick (IntersectionObserver — hidden tab panels pause for free), self-halts when none; a scene draws **only while hovered** (+ ease-out tail), freezing on its last frame; window-level pointer tracking (canvases are `pointer-events:none`, stretched card links stay clickable); DPR ≤ 2; touch = static SVGs (no hover). Engine stops under `motion-off` (canvases CSS-hidden, SVGs return). No deps. |
| `tabs.js` | Accessible tabs (APG pattern): click + Arrow/Home/End keys, `aria-selected`, roving tabindex, hash deep-link + alias map. ~70 lines, no deps. |
| `i18n.js` | Vanilla EN⇄DE toggle. English is the in-HTML default; German strings in the `DE` dict keyed by `data-i18n`. Publications intentionally NOT translated. Persisted in `localStorage`; `?lang=de` forces German. |
| `assets/` | `favicon.svg`; optional `CV.pdf` / real screenshots later. |
| `.nojekyll` | GitHub Pages serves files verbatim. |

## i18n — how to edit bilingual content
Every translatable element carries a `data-i18n="key"`; its **English** text is the element's own
HTML (the default, works with JS off). The **German** counterpart is the matching key in the `DE`
object in `i18n.js`. To change a sentence, edit BOTH the HTML (EN) and the `DE[key]` (DE). Keep the two
in sync. Publications carry no `data-i18n` (they stay English, as published). Coverage is exact —
66 keys, 66 translations — verify with the parity script pattern:
`data-i18n="…"` keys in `index.html` vs the 4-space-indented `"key":` lines of the `DE` dict
(any missing/orphan key is a bug; keep the count exact after every content edit).

## Content source of truth
The master CV: `…/Notes (Regular)/Claude Code/profile/2026.03.17 - CV - full English.md`.
Content on the site is a **condensed, hand-authored** distillation of that file — NOT
auto-generated. When the CV changes materially, update the HTML by hand.

## Deploy
User-site repo `AbdulmalikAbdulmawla.github.io` → GitHub Pages serves default-branch root at
`https://abdulmalikabdulmawla.github.io`. Push = publish. Registered as a submodule of the
**work-dev** repo (private workspace) at `work-dev/portfolio`; this repo's own remote is **public**
(a portfolio is a public site by nature — its served source is already public).

## Known open items
- ORCID wired in (hero + footer) → https://orcid.org/0000-0003-3383-5998.
- `assets/CV.pdf` — generated from the master CV (Edge headless print-to-pdf over a hand-built
  HTML). **Phone + home address deliberately stripped** (public file: email/city/links only);
  **PhD always "in progress"** — he is not a PhD holder. Regenerate by hand when the master CV
  changes materially.

## Verify after edits
`node --check` on all JS files (motion, boids, tabs, i18n, card-art) + exact `data-i18n` ↔ `DE`-dict
parity. Open `index.html` in Edge (`file://`): all sections render, every external link opens the
right target in a new tab, layout holds at mobile + desktop widths, print preview is clean (SVG
diagrams, no canvases, no toggle). Animations: the ⏸/▶ toggle sits beside DE and its state persists
across reloads; with motion on, boids chase + orbit the cursor and release on leave/idle; a card scene
loops **only while hovered** and freezes when the mouse leaves (at rest = SVG diagram); whole-card
links stay clickable over the canvases; switching tabs pauses card scenes (0 CPU); pressing ⏸ freezes
the hero to a static frame and restores the SVGs; DevTools reduced-motion emulation with no stored
choice ⇒ starts paused with ▶ showing. After push: check
`gh api repos/AbdulmalikAbdulmawla/AbdulmalikAbdulmawla.github.io/pages/builds/latest` — deployments
can queue-stall on GitHub's side (2026-07-02: two builds hung in `deployment_queued` ~10 min → "Page
build failed" while the content was fine; a later push/rerun deployed cleanly).
