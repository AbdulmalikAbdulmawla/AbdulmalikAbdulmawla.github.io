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
├── index.html      ← the whole site (all sections)
├── styles.css      ← academic-minimal styling (palette shared with VSP_Unfallatlas exports)
├── assets/         ← favicon (+ optional CV.pdf, thumbnails later)
├── .nojekyll       ← serve files verbatim on GitHub Pages
└── README.md
```

## Editing content

All content lives in `index.html`, in clearly-commented sections (`ABOUT`, `FEATURED WORK`,
`PUBLICATIONS`, `EXPERIENCE`, `TEACHING`, `SKILLS`). Edit the HTML directly — no compilation.
The single source of truth for the underlying facts is the master CV:
`…/Claude Code/profile/2026.03.17 - CV - full English.md`.

To preview: double-click `index.html` (opens in your browser). To publish: commit and push —
GitHub Pages redeploys automatically.

## To do

- Replace the **ORCID** placeholder link in the hero + footer (marked with a dashed border and
  `data-placeholder="orcid"`) once the ORCID iD is available.
- Optional: add a downloadable `assets/CV.pdf` and link it from the hero.

## Deployment (GitHub Pages)

This is a **user site** repo (`AbdulmalikAbdulmawla.github.io`): GitHub Pages serves the default
branch root at `https://abdulmalikabdulmawla.github.io`. No workflow or build needed — pushing to
the default branch publishes.
