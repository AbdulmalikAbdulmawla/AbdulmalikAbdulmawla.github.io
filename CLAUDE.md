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

## Files
| File | Role |
|---|---|
| `index.html` | Entire site. Sections are HTML-commented (ABOUT / FEATURED WORK / PUBLICATIONS / EXPERIENCE / TEACHING / SKILLS). |
| `styles.css` | Academic-minimal design system. Palette + system-ui font borrowed from VSP_Unfallatlas chart-export (`src/lib/plotExport.ts`) for cross-project continuity. CSS custom props in `:root`. |
| `i18n.js` | Vanilla EN⇄DE toggle. English is the in-HTML default; German strings live in the `DE` dict keyed by `data-i18n`. Publications intentionally NOT translated. Choice persisted in `localStorage`; `?lang=de` forces German. |
| `assets/` | `favicon.svg`; optional `CV.pdf` / thumbnails later. |
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
`https://abdulmalikabdulmawla.github.io`. Push = publish. Registered as a submodule of
research-lab (private workspace); this repo's own remote is **public**.

## Known open items
- ORCID wired in (hero + footer) → https://orcid.org/0000-0003-3383-5998.
- No CV PDF yet (decision pending).

## Verify after edits
Open `index.html` in Edge (`file://`): all sections render, every external link opens the right
target in a new tab, layout holds at mobile + desktop widths, print preview is clean.
