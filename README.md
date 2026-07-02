# Portfolio — Abdulmalik Abdulmawla

Personal portfolio site for **Abdulmalik Abdulmawla** — computational urban designer and
spatial-economic researcher. A single-page, links-first hub that gives a quick overview and
points visitors directly to published work (papers, DeCodingSpaces Toolbox, VSP Unfallatlas,
profiles, code).

**Live:** https://abdulmalikabdulmawla.github.io

## Stack

Hand-written **static HTML + CSS**. No framework, no build step, no dependencies — just open
`index.html`. Deploys as-is to GitHub Pages.

```
portfolio/
├── index.html      ← the whole site: hero + 4 tabbed panels; English text is the default
├── styles.css      ← muted-Bauhaus styling (palette shared with VSP_Unfallatlas exports)
├── boids.js        ← hero canvas: boids over a street network; the cursor is an attractor
├── card-art.js     ← generative, mouse-reactive canvas scenes over the 5 work-card diagrams
├── tabs.js         ← accessible tab switching (Work / Research / Experience / About)
├── i18n.js         ← EN/DE language toggle (German strings live here)
├── assets/         ← favicon (+ optional CV.pdf, real screenshots later)
├── .nojekyll       ← serve files verbatim on GitHub Pages
└── README.md
```

## Layout

A short **hero + tabs** design, not a long scroll: the top band is always visible; the tab bar switches
between **Work · Research · Experience · About**. Each work card shows a hand-drawn SVG diagram that
`card-art.js` brings to life as a small generative animation themed to the project (accident hotspots,
a self-drawing street network, mobility flows, an exchange of communities, a live regression) — all of
them react to the cursor, as does the boids flock in the hero. To use a real screenshot instead, drop
an `<img>` into that card's `card-media` slot and remove the slot's `data-art` attribute. Deep-links
work (e.g. `…github.io/#research`).

## Languages (EN / DE)

The site has an **EN⇄DE toggle** (button top-right of the sticky nav). English is written directly in
`index.html`; the German versions live in `i18n.js` keyed by each element's `data-i18n` attribute.
**To edit a sentence, change it in both places.** The visitor's choice is remembered; `?lang=de` opens
the site in German directly. Publications stay in English (they were published in English).

## Editing content

All content lives in `index.html`, in clearly-commented sections (`ABOUT`, `FEATURED WORK`,
`PUBLICATIONS`, `EXPERIENCE`, `TEACHING`, `SKILLS`). Edit the HTML directly — no compilation.
The single source of truth for the underlying facts is the master CV:
`…/Claude Code/profile/2026.03.17 - CV - full English.md`.

To preview: double-click `index.html` (opens in your browser). To publish: commit and push —
GitHub Pages redeploys automatically.

## To do

- Optional: add a downloadable `assets/CV.pdf` and link it from the hero.

## Deployment (GitHub Pages)

This is a **user site** repo (`AbdulmalikAbdulmawla.github.io`): GitHub Pages serves the default
branch root at `https://abdulmalikabdulmawla.github.io`. No workflow or build needed — pushing to
the default branch publishes.
