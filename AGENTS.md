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
| You are about to touch `src/content/` or `src/engines/` — **required** | [`docs/INVARIANTS.md`](docs/INVARIANTS.md) |
| You are writing a lesson — read this **first**, it replaces exploring | [`docs/LESSONS.md`](docs/LESSONS.md) |
| You want to hand a fresh session the next lesson batch | [`docs/CONTINUE-LESSONS.md`](docs/CONTINUE-LESSONS.md) |
| You want the history of which lesson batches were written and why | [`docs/LESSONS-BATCHES.md`](docs/LESSONS-BATCHES.md) |
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
npm run verify          # all six gates, cheapest first, stops at the first failure
npm run verify -- --fast     # the same without the build, for the edit loop
npm run content:fingerprint  # hash of the whole corpus — assert it around any file move
```

`verify` runs, in order: `content:check` (zod validation, referential integrity,
coverage warnings) · `diagram:audit` (overlaps, label collisions, dead space) ·
`typecheck` (strict) · `test` (vitest over `src/engines`, `src/content`, `src/db`) ·
`eslint src scripts` at zero warnings · `build` (228 prerendered pages). Each still has
its own npm script if you want one alone. All six are currently clean.

`npm run dev` for the app; drive it in a real
browser before saying a UI change works — but for a *diagram*, `diagram:audit`
answers in text what used to take a screenshot loop, so run that first and keep
the browser pass for whether the page actually teaches.

`npm run lesson:brief -- <slug...>` prints every fact in the corpus about some
slugs, which is the whole research step for a lesson. Use it instead of reading
`src/content/services/*` — see [`docs/LESSONS.md`](docs/LESSONS.md). To edit rather than
research, `npm run where -- <id> --print` prints just that entry; see § Token discipline.

## Invariants — these bite if you undo them

One line each. **The reasons are in [`docs/INVARIANTS.md`](docs/INVARIANTS.md), and you
read that file before touching `src/content/` or `src/engines/`** — a one-liner is enough
to notice you are about to break one, never enough to decide it does not apply. Numbering
is stable and quoted elsewhere, including the deliberate 18-before-17 order.

1. All teaching content is typed data in `src/content/`, validated by zod — adding content means editing a typed array, never writing a component.
2. SRS cards are derived by `cards.ts`, never hand-written.
3. `src/content/service-registry.ts` must not become `src/content/services/index.ts`.
4. The `@/content` barrel must not both `import` and `export ... from` the same binding.
5. Theming is pure CSS, three-state (`:root` dark · `prefers-color-scheme: light` · `[data-theme]`), with no blocking inline script.
6. Never dim a card with `opacity` to show a locked or unearned state — muted background plus dashed border.
7. The repo layer owns timestamps; components must not call `Date.now()` during render.
8. Engines stay pure: no React, no I/O, no uncontrollable `Date.now()` in `src/engines/**`.
9. Honesty over flattery in the UI — label an estimate as an estimate, say when the bank cannot fill a paper.
10. The atlas is the only place a fact lives; a question, lesson or story may restate a fact, never introduce one.
11. A service reference opens the quick look, it does not navigate — `ServiceRef` / `serviceLinkProps`.
12. A phase without `steps` is a syllabus, and a syllabus is a dead end.
13. Ticking a step awards nothing and moves no ring.
14. A primitive is a concept in `src/content/concepts/`, not a fourth service tier.
15. Every URL in a reading list or atlas entry has been curled and resolves.
16. Content is tagged with an exam *family* (`families: ['saa']`), never an exam *version*.
17. A number the exam sets is read from the `Cert`, never typed into prose.
18. A storyline declares its architecture once; chapters only *add* to it.
19. Reading a chapter awards nothing.
20. `whyItExists` is motivation, not mechanism — optional, with a counted coverage warning.
21. A mutually exclusive choice inside a service is an `optionSet`, not more `keyNumbers` rows.
22. A card id never encodes a position — ids are keyed by label.
23. A lesson is an order, not a source; reading one awards nothing, and only its `checks` pay.

## Token discipline

The corpus is a handful of long typed arrays, so the file is never the unit of work and
should not be the unit of reading either.

- **Find the entry, then read only it.** `npm run where -- kms --print` prints the `kms`
  atlas entry — about 120 lines — instead of the 1,212-line file around it. It takes
  several ids, works on any `id:` or `slug:` in `src/content/`, and is textual, so it
  still answers while the corpus does not compile.
- **`npm run verify`** runs all six gates cheapest-first, stops at the first failure, and
  prints one line per passing gate. `-- --fast` skips the build for the edit loop; run it
  without `--fast` before claiming anything is done.
- **`npm run lesson:brief -- <slug...>`** is the whole research step for a lesson. Do not
  read `src/content/services/*` for it.
- Do not re-read a file to confirm an edit landed — the edit would have failed loudly.
- One lesson, or one piece of work, per session. Then clear the context.


## Content status

| | SAA-C03 | DVA-C02 |
|---|---|---|
| Questions | 142 (40/36/34/32) — two full 65q papers | 132 (42/34/32/24) — two full 65q papers |
| Services | 141 total, tiered core/working/recognise | shared corpus, per-cert tagged |
| Concepts | 37 primitives in 6 groups | shared corpus, per-cert tagged |
| Cards | 1,852 derived | shared corpus |
| Option matrices | 17 sets, 77 options on 15 services | shared corpus |
| Study steps | 47 across 4 phases, 80 h guided of 130 h | 24 across 2 phases, 40 h of 60 h (phase 0 is shared) |
| Story chapters | 13 in one arc, 9 h | not written yet |
| Lessons | 26 (reachability + identity + storage + resilience + serverless + data and cost + the developer cluster + the long tail), 485 sections, 108 checks | 13 (the serverless three, partition keys, caching, the developer four, and the long-tail four) |

Both banks now serve two consecutive full papers with no repeated question. A
third consecutive paper cannot be filled from unseen questions, and the sampler
repeats silently rather than saying so — see [`docs/BACKLOG.md`](docs/BACKLOG.md).

## Conventions

- Prettier: no semicolons, single quotes, 100 cols, trailing commas. `.prettierrc` is authoritative.
- Comments explain **why**, not what. The content files carry a lot of pedagogical
  reasoning in comments — keep that register.
- User-facing copy is plain, specific and never breathless. No emoji in prose.
  British-leaning spelling in prose; AWS product names verbatim.
- Icons are inline SVG (`src/components/ui/Icon.tsx`), never unicode glyphs —
  glyph coverage for symbols like `⚿` and `⑃` varies by platform and half of them
  render as boxes.
