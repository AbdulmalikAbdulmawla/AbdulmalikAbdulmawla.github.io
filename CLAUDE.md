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
keeps the hero text legible over it. Work cards carry hand-authored **SVG data-diagrams** in a fixed
16:10 `.card-media` slot — swap for real app screenshots later by dropping an `<img>` in the same slot
(no layout change).

## Files
| File | Role |
|---|---|
| `index.html` | Entire site: hero, tab bar (`role="tablist"`), 4 `.panel` sections, footer. HTML-commented per panel. Inline `<head>` script flips `no-js`→`js`. |
| `styles.css` | Muted-Bauhaus design system. Palette + system-ui font borrowed from VSP_Unfallatlas chart-export (`src/lib/plotExport.ts`). Tokens in `:root`; tab/panel/card/motif styles; reduced-motion + print (print expands all panels). |
| `boids.js` | Hero motif: Reynolds boids flocking node-to-node across a procedural street network on a `<canvas>`. Decorative + aria-hidden; freezes to a static frame under `prefers-reduced-motion`; pauses when the hero is off-screen (IntersectionObserver) or the tab is hidden. No deps. |
| `tabs.js` | Accessible tabs (APG pattern): click + Arrow/Home/End keys, `aria-selected`, roving tabindex, hash deep-link + alias map. ~70 lines, no deps. |
| `i18n.js` | Vanilla EN⇄DE toggle. English is the in-HTML default; German strings in the `DE` dict keyed by `data-i18n`. Publications intentionally NOT translated. Persisted in `localStorage`; `?lang=de` forces German. |
| `assets/` | `favicon.svg`; optional `CV.pdf` / real screenshots later. |
| `.nojekyll` | GitHub Pages serves files verbatim. |

## i18n — how to edit bilingual content
Every translatable element carries a `data-i18n="key"`; its **English** text is the element's own
HTML (the default, works with JS off). The **German** counterpart is the matching key in the `DE`
object in `i18n.js`. To change a sentence, edit BOTH the HTML (EN) and the `DE[key]` (DE). Keep the two
in sync. Publications carry no `data-i18n` (they stay English, as published). Coverage is exact —
55 keys, 55 translations — verify with:
`grep -oE 'data-i18n="[^"]+"' index.html | ... ` vs the `DE` keys (see the deploy session for the diff).

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
- No CV PDF yet (decision pending).

## Verify after edits
Open `index.html` in Edge (`file://`): all sections render, every external link opens the right
target in a new tab, layout holds at mobile + desktop widths, print preview is clean.
