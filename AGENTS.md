<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# AWS Trainer — project brief

A local-only Next.js app for learning AWS and passing **SAA-C03** and **DVA-C02**.
Built August 2026. Read this before changing anything; the deeper references are
in [`docs/`](docs/).

| Read this when | File |
|---|---|
| You need the full map — content model, engines, data flow, routes | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| You are adding or editing teaching content | [`docs/CONTENT.md`](docs/CONTENT.md) |
| You want to know what is unfinished and what to do next | [`docs/BACKLOG.md`](docs/BACKLOG.md) |
| You want the user-facing overview | [`README.md`](README.md) |

## The premise, in one paragraph

Reading produces recognition; the exam tests **recall** under time pressure
against four plausible options. So every feature is built around retrieval, and
progress is measured from what the learner has *recalled, answered and built* —
never from what they have read. When you add a feature, ask which of those three
it exercises. If the answer is "none", it probably does not belong.

## Verify before you claim anything works

```bash
npm run content:check   # zod validation + referential integrity + coverage warnings
npm run typecheck       # tsc --noEmit, strict
npm test                # 104 vitest tests over src/engines
npx eslint src scripts  # must be 0 errors AND 0 warnings
npm run build           # 151 prerendered pages
```

All five are currently clean. `npm run dev` for the app; drive it in a real
browser before saying a UI change works.

## Invariants — these bite if you undo them

1. **All teaching content is typed data in `src/content/`**, validated by zod.
   Adding content means editing a typed array, never writing a component.
   `content:check` fails on a dangling id — that is deliberate, so a renamed task
   statement is a build error rather than a blank screen the night before an exam.

2. **SRS cards are derived, never hand-written.** `src/content/cards.ts` generates
   ~1,387 cards from the service cards and triggers. Never add a card by hand — it
   would drift out of step with the atlas and the learner would drill something the
   atlas contradicts.

3. **`src/content/service-registry.ts` must not be moved to `src/content/services/index.ts`.**
   A directory index that the `@/content` barrel also re-exports breaks Turbopack's
   module graph, and the runtime error (`module factory is not available`) points
   nowhere near the cause.

4. **The `@/content` barrel must not both `import` and `export ... from` the same
   binding.** Import once, then export the local binding. Doing both gives the
   bundler two paths to one binding and the one it picks can resolve to `undefined`
   at runtime.

5. **Theming is pure CSS**, three-state: `:root` is dark, `@media
   (prefers-color-scheme: light)` handles system-light, `[data-theme]` is an
   explicit override. There is deliberately **no blocking inline theme script** —
   it caused a React 19 warning and was unnecessary once the CSS covered all three
   states. Read the theme via `src/lib/theme-store.ts` and `useSyncExternalStore`.

6. **Never dim a card with `opacity` to show a locked or unearned state.** It drops
   text below the WCAG contrast threshold and fails the accessibility audit. Use a
   muted background plus a dashed border (see `RoadmapView`, `ProgressPanel`).

7. **The repo layer owns timestamps.** `recordAttempt` and `logMistake` stamp `at`
   themselves. Components must not call `Date.now()` during render — `react-hooks/purity`
   is an *error* here, not a warning.

8. **Engines stay pure.** `src/engines/**` has no React, no I/O, no `Date.now()`
   defaults that tests cannot control. That is what makes them testable, and they
   are the only tested layer.

9. **Honesty over flattery in the UI.** If the question bank cannot fill a paper,
   say so rather than repeating questions. If a score is an estimate, label it. If
   a quota is one AWS changes, mark it "verify". This is a study tool; a
   comfortable lie costs the user marks.

## Content status

| | SAA-C03 | DVA-C02 |
|---|---|---|
| Questions | 120 (30 per domain) — ~1.8 full 65q papers | 66 — fills one full 65q paper exactly |
| Services | 141 total, tiered core/working/recognise | shared corpus, per-cert tagged |
| Cards | 1,387 derived | shared corpus |

Both banks now fill a full paper. DVA sits exactly on its domain weighting, so a
second paper that excludes everything already seen will report a shortfall — the
next 30 DVA questions are what buy real repeat practice. See
[`docs/BACKLOG.md`](docs/BACKLOG.md).

## Conventions

- Prettier: no semicolons, single quotes, 100 cols, trailing commas. `.prettierrc` is authoritative.
- Comments explain **why**, not what. The content files carry a lot of pedagogical
  reasoning in comments — keep that register.
- User-facing copy is plain, specific and never breathless. No emoji in prose.
  British-leaning spelling in prose; AWS product names verbatim.
- Icons are inline SVG (`src/components/ui/Icon.tsx`), never unicode glyphs —
  glyph coverage for symbols like `⚿` and `⑃` varies by platform and half of them
  render as boxes.
