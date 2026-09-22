# Delirium policy microsite

A task-first bedside reference for the Trust's draft **Delirium: Prevention, Recognition and Management Policy** (DRAFT v0.1 for consultation, not ratified). It is a static site built for GitHub Pages: no backend, no accounts, nothing stored.

The policy markdown file in this folder is the single source of truth. Every page is generated from it, so editing the policy and rebuilding updates the whole site.

## What the site contains

- **Task hub** (`index.html`) – draft status, the immediate safety message from section 9.1, and three priority entry points: assess, manage distress, monitor after medication. Then compact rows for the other tasks and the reference layer.
- **Seven task pages** – Assess suspected delirium, Manage severe distress, Monitor after medication, Find and treat causes, Prevent delirium, Discharge and follow-up, Special situations and capacity. Each follows the same order: immediate action or warning → pathway or checklist → supporting detail → source section.
- **Full policy** (`policy/`) – all 19 sections and 7 appendices with their original numbering, one page each, plus a single printable page.
- **Get help** – escalation triggers and specialist teams from section 5, with contact details left as `[Trust to confirm]`.
- **Search** – client-side search over every subsection and task page.
- **Policy version and changes** – document details, drafting note, every `[Trust to confirm]` item collected from the policy, and the change log (Appendix G).

The draft status appears on every page (amber strip) and on every printed page (footer line).

## Editing the policy

1. Edit `Delirium_Policy_DRAFT_v0.1.md` (or pass another file: `npm run build -- path/to/policy.md`).
2. Run `npm run build`.
3. Commit the `docs/` folder.

The build fails loudly if a task page can no longer find a paragraph, list or table it depends on (for example if the wording that opens section 12.9 "Frequency:" changes). Fix the reference in `src/pages/tasks.mjs` and rebuild. Headings must keep the `## 12. Title` and `### 12.4 Title` pattern.

Two things are not generated from the policy text and need updating by hand if the policy changes:

- The short labels in the three pathways (`src/pages/tasks.mjs`). Each step links to the subsection it summarises.
- The "Get help" senior-review list, which paraphrases the review thresholds in sections 12.4 to 14.3 with links to each.

## Building locally

```bash
npm install
npm run build      # writes docs/
npm run preview    # serves docs/ at http://localhost:8080
```

`docs/` is generated and safe to delete; the build recreates it (it refuses to overwrite a `docs/` folder it did not create).

## Publishing on GitHub Pages

1. Push the repository to GitHub (including the `docs/` folder).
2. In the repository settings, open **Pages**, choose **Deploy from a branch**, branch `main`, folder `/docs`.
3. The site appears at `https://<user>.github.io/<repository>/`. All links are relative, so no base-path configuration is needed.

Every page carries `<meta name="robots" content="noindex">` so the draft is not picked up by search engines.

## Design notes

- Components come from [nhsuk-frontend](https://github.com/nhsuk/nhsuk-frontend) 10.x (MIT). The Frutiger font is loaded from `assets.nhs.uk` with Arial as the fallback; Frutiger is licensed for NHS organisations only.
- The header uses the Trust's NHS lock-up (`src/assets/images/cw-logo.png`) on nhsuk's white organisational header. The Trust's W mark (`w-logo.png`) appears in the footer and, padded to a square, as the favicon and home-screen icon. The NHS identity is for NHS organisations only.
- Body text is 18px with 1.5 line spacing on phones, 19px on larger screens. Navigation rows are at least 48px tall.
- Red is reserved for stop and escalation messages, amber for caution and the draft status.
- Pathways are vertical HTML lists with visible branches, not images, so they reflow at 320px, print, and read in order with a screen reader.
- Checklists (Appendix F) use real checkboxes but nothing is saved. The pre-prescribing checks in section 12.3 are a plain list, not tick-boxes, because the policy's emergency ECG exception must sit beside the ECG requirement.

## Project layout

```
Delirium_Policy_DRAFT_v0.1.md   policy source
src/build.mjs                   build script (markdown → docs/, Sass, assets, link check)
src/lib/policy.mjs              parses the markdown into sections and subsections
src/lib/markdown.mjs            renders markdown as NHS design system HTML; helpers to pull out paragraphs, lists, tables
src/lib/html.mjs                nhsuk component markup and the page shell
src/lib/site.mjs                URLs and task list
src/pages/                      hub, task pages, full policy, secondary pages
src/assets/images/              Trust logos and icons, copied to docs/assets/images/
src/styles/app.scss             styles (imports nhsuk-frontend)
src/js/search.js                client-side search
docs/                           generated site (GitHub Pages)
```

`govuk-design-system/` and `govuk-frontend-main/` are local reference clones and are ignored by git.
