# Solrouter docs

Source for [docs.solrouter.com](https://docs.solrouter.com). Built with [Fumadocs](https://fumadocs.dev) on Next.js.

This repository is the source of truth for the public docs. Changes land through pull requests into `main`, and `main` deploys automatically. `scripts/publish-mirror.sh` is retired: it force-pushes a copy from the product monorepo and would erase merged pull requests.

## Run it

```bash
npm ci
npm run dev          # http://localhost:3000
npm run build        # production build
npm run types:check  # MDX collection, route types, tsc
npm run check        # prose, status, and diagram-fallback checks
```

## Layout

```
content/docs/                 hand-written pages (MDX) and meta.json sidebars
content/docs/api-reference/agent-privacy/
                              generated from openapi/agent-privacy.json, do not edit by hand
openapi/agent-privacy.json    snapshot of https://api.solrouter.com/agents/v1/openapi.json
scripts/generate-openapi.mjs  regenerates the Agent Privacy API pages from the snapshot
scripts/check-docs.mjs        the checks behind `npm run check`
src/components/diagrams/      static, theme-aware diagrams (React + Tailwind)
src/components/verify/        client widgets that call the live API
src/lib/status.ts             the status sentence shown under every page title
```

The docs have two tiers. Start here, Products, and Account are written for readers with no technical background. Under the hood and Reference are written for engineers and auditors and cite the code that backs each claim.

## Status policy

Every hand-written page declares three frontmatter fields:

```yaml
status: live        # live | soon | archived | mixed
checked: "2026-08-26"
statusNote: "Optional one-sentence reason for soon, archived, or mixed."
```

- Live: the code path exists and the surface answered on api.solrouter.com, npm, or solrouter.com on the `checked` date.
- Soon: the code exists, but the surface is not published, not deployed, or not confirmed end to end.
- Archived: removed or disabled. The page stays to explain the change.
- Mixed: the page holds a table with a Status column. Read the rows.

A feature nobody has confirmed ships as Soon, never as Live. The `checked` date changes only when someone re-checks the page against code or a live endpoint.

## Truth rule

Every product claim in a pull request cites a file path in the product code or a live response in the PR body. No number, name, date, or benchmark goes in without a source.

## Diagrams

Add a diagram as a React component under `src/components/diagrams/`. Give the root element `role="img"` and an `aria-label` that describes the whole picture in one sentence. In the MDX, follow the component with a short Markdown list titled **In words**. That list is what screen readers, `llms.txt`, and the `.md` routes see, because component markup carries no meaning there. `npm run check` fails when the list is missing.

## Writing rules

- Short sentences, about 20 words or fewer. One idea per sentence. Active voice.
- No em dashes or en dashes. Use a period, a comma, a colon, or parentheses.
- No filler vocabulary. `npm run check` lists the banned words.
- Define a term in plain words before you use its acronym, or link to the glossary.

## Pull request checklist

1. `npm run types:check`, `npm run check`, and `npm run build` pass.
2. Every changed factual sentence cites a file path or a live response in the PR body.
3. Touched pages have no horizontal scroll at 375 px. Wrap wide tables in a scroll container.
4. Moved or renamed pages have a redirect row in `next.config.mjs`.
5. No `Co-Authored-By` trailer in commits.
