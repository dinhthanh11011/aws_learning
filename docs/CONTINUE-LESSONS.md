# Reusable prompt — write the next lesson batch

Paste the block below into a fresh session, unedited. It stays correct as batches
land, because it asks you to read the batch list rather than restating it.

---

Continue the lesson layer in this repo until the next batch is finished and every
gate is green. Work autonomously — do not stop to ask me which batch or which
service unless something is genuinely undecidable.

**Read first, in this order.** `AGENTS.md`, then `docs/LESSONS.md` (the process —
it replaces exploring the codebase), then `docs/CONTENT.md § A lesson` (the
shape). `docs/BACKLOG.md` § "The lesson player" says where the layer stands.

**Pick the work.** `docs/LESSONS.md § The batches` lists the batches in priority
order, ranked by how many questions in the bank touch each service. Take the
first batch that is not marked done and write **all** of its lessons in one pass.
Batching is the point: they share one brief, one set of diagram coordinates and
one browser pass.

**The rules that matter most** (they are all in `AGENTS.md`, these are the ones a
lesson breaks):

- A lesson introduces **no facts** (invariant 23). Get every fact from
  `npm run lesson:brief -- <slugs>` and nowhere else. If the brief lacks a fact
  you want, edit the atlas entry in `src/content/services/*` first so `cards.ts`
  derives the card — never write it only into the lesson.
- A lesson's whole contribution is **sequence**: a picture before the definition,
  the wrong answer written out as real syntax before it is rejected, `compare`
  last, `numbers` last of all.
- Do not invent diagram coordinates. Use a template from
  `docs/LESSONS.md § Diagram templates`. Check the flow reads **left to right** —
  `diagram:audit` cannot see direction, and two of batch 1's diagrams had to be
  mirrored after a look in the browser.
- Reading awards nothing. Only the `checks` pay, and they record no `Attempt`.
- Ids never encode a position (invariant 22).

**Wire each lesson in** — `docs/LESSONS.md § Wiring a lesson in` has the three
places. An unwired lesson is reachable only by someone who already knows it
exists. If a step's minute budget does not cover the lesson on top of its
existing reading, raise the budget rather than assuming the reader reads faster.

**Verify before claiming anything works.** All of these, and report the actual
output, not a summary of your intentions:

```bash
npm run content:fingerprint   # before and after: only lessons/steps/phases may change
npm run content:check         # loop until clean
npm run diagram:audit         # loop until clean; run before any browser pass
npm run typecheck
npm test
npx eslint src scripts        # must be 0 errors AND 0 warnings
npm run build                 # +1 prerendered page per lesson
```

Then **one browser pass for the whole batch** (`npm run dev`), for the one thing
no script catches: whether the order actually teaches. Step each walkthrough,
confirm a correct check moves XP and records no attempt, and confirm the lesson
appears on `/map`, in ⌘K, and on the atlas entries for its services. Do **not**
take full-page accessibility snapshots — use `evaluate_script` returning small
objects, and at most one screenshot per lesson. Kill the dev server before
`npm run build` or the build fails on `.next`.

**Finish the job.** Before you report done, update the places that now state
something false: the status table in `AGENTS.md`, the Lessons row in `README.md`,
the counts and "what is owed" in `docs/BACKLOG.md`, the batch's row in
`docs/LESSONS.md`, and the closing paragraph of `src/app/learn/page.tsx` — that
one is hand-written on purpose, and it must say honestly which clusters are still
unwritten. Leave pre-existing `prettier --check` warnings on files you did not
touch alone.

Tell me plainly at the end what you wrote, what you changed, what the gates said,
and anything you left undone and why.
