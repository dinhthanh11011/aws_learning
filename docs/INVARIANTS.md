# Invariants — the full reasons

`AGENTS.md` carries these as one line each, which is enough to notice you are
about to break one. This file is the *why*, and the why is the part that stops
somebody undoing an invariant on the grounds that the one-liner looked arbitrary.

**Read this before touching `src/content/` or `src/engines/`.** Numbering is
stable and quoted elsewhere in the repo — including the deliberate 18-before-17
order at the end. Do not renumber.

---

1. **All teaching content is typed data in `src/content/`**, validated by zod.
   Adding content means editing a typed array, never writing a component.
   `content:check` fails on a dangling id — that is deliberate, so a renamed task
   statement is a build error rather than a blank screen the night before an exam.

2. **SRS cards are derived, never hand-written.** `src/content/cards.ts` generates
   every card from the service cards, concepts and triggers; run
   `npm run content:check` for the live count. Never add a card by hand — it would
   drift out of step with the atlas and the learner would drill something the
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

10. **The atlas is the only place a fact lives**, and a fact that is not about
    a service lives in `src/content/concepts/`. A question explanation may
    *restate* a fact, never introduce one. Everything teachable belongs in
    `src/content/services/*` first, because that is what `cards.ts` derives from,
    what search finds, and what the quick-look panel shows — a fact that exists
    only in a question is drilled by nothing and findable by nobody.
    `content:check` audits this: it reads the quantities out of every explanation
    and warns when one appears in no referenced service's atlas entry.

11. **A service reference opens the quick look, it does not navigate.** Inline
    references use `ServiceRef` or `serviceLinkProps` from
    `src/components/service/ServiceRef.tsx`, which render a real `<a href>` (so
    ⌘-click still works) but open `ServicePeek` on a plain click. Navigating
    mid-question costs the question, so in practice the learner does not look it
    up at all. Both the panel and `/services/[slug]` render the same
    `ServiceAtlas`, so they cannot drift. Any component with a global key
    handler must bail while `[role="dialog"]` is in the DOM.

12. **A phase without `steps` is a syllabus, and a syllabus is a dead end.** The
    phases say what a stretch of weeks is *about*; `steps` says what to do on
    Tuesday evening — in order, with the pages to read, where in the app to do the
    work, and the retrieval test that closes it. This was the gap that made the
    roadmap unusable: it listed sixteen services and no first move. Step minutes
    deliberately total **less** than the phase's `hours`, because the remainder is
    unstructured building and drilling; padding the list to match would be a fake
    plan. `content:check` fails a step whose id does not match its position, whose
    action points at a route that does not exist, or whose phase claims more
    guided hours than it has.

13. **Ticking a step awards nothing and moves no ring.** A checkbox is a
    self-report, and mastery is measured only from what was recalled, answered or
    built — the lab, quiz or drill a step points at awards its own XP when the
    work actually happens. Keep `steps` out of `MasteryInput` for that reason.

14. **A primitive is a concept, not a fourth service tier.** CIDR, subnet, RPO,
    idempotency and the shape of an ARN are not AWS services — they have no
    pricing page, no idle cost and no console — so they live in
    `src/content/concepts/` behind `ConceptSchema`, aggregated by
    `concept-registry.ts` (same naming rule as invariant 3). Widening `Service`
    to hold them would make every tier badge, category filter and atlas grouping
    lie a little. Concept and service slugs share one namespace because they
    share the peek stack and the search list; `content:check` fails a collision.

15. **Every URL in a reading list or atlas entry has been checked to resolve.** All 84 were
    curled before being committed. A 404 in a reading list costs the trust that
    makes the learner follow the next one, so check new ones the same way rather
    than writing a plausible-looking doc path from memory.

16. **Content is tagged with an exam *family*, never an exam *version*.**
    A service, concept, question, trigger or phase carries `families: ['saa']`,
    not `certs: ['SAA-C03']`. A fact about S3 does not change when SAA-C03
    becomes SAA-C04, so version tagging would mean re-editing all 141 services,
    37 concepts and 274 questions for a revision that taught nothing new — the
    worst possible ratio. `src/content/certs/*` says which family each version
    belongs to, `cert-registry.ts` owns the single `inScope()` predicate every
    `xFor(certId)` helper delegates to, and a version bump is one new cert file
    plus two registry lines. Version-specific content uses a `versionScope`
    override with a required `note`; `content:check` prints every override on
    every run so the list cannot grow unseen, and ESLint fails a version literal
    outside `src/content/certs/`, `cert-registry.ts`, `schema.ts` and
    `src/db/migrate.ts`. A new version's tasks declare `supersedes` so existing
    questions keep resolving — a question that resolves on no current paper is a
    `content:check` failure, because it would otherwise vanish from every exam
    silently.

18. **A storyline declares its architecture once; chapters only *add* to it.**
    `src/content/stories/*` carries one complete `DiagramSpec` and each chapter
    names the node, edge and group ids it introduces. Fourteen per-chapter
    diagrams would be fourteen places for a node to drift two grid units
    sideways, and the learner would watch the architecture jump rather than grow.
    `content:check` fails an id a chapter adds that the spec lacks, an id the
    spec declares that no chapter introduces, an id added twice, an edge drawn
    before both endpoints, and a group that would appear empty. Group boxes are
    laid out from the *whole* spec, not from what is visible, so revealing a node
    never resizes the Region around it.

19. **Reading a chapter awards nothing.** Same rule as a study step, same
    reason. The chapter's "you decide" pick records a real `Attempt` against the
    chapter's `taskId` with `source: 'story'`, so it feeds domain mastery exactly
    as a quiz answer does; its recall checks award XP but deliberately record no
    attempt, because inflating the accuracy stream with three-option
    comprehension checks would make readiness read higher than the learner's
    actual standing.

20. **`whyItExists` is motivation, not mechanism.** `whatItIs` says what a thing
    is and `whenToUse` says when it applies; neither says what people did before
    it existed or why that hurt. It is optional with a counted coverage warning
    rather than required, because making it required turned the gate red 178
    times on the first run — and a gate that is always red is a gate nobody
    reads. It derives no SRS card: the exam asks which service meets a
    requirement, which `whichService` already drills.

21. **A mutually exclusive choice inside a service is an `optionSet`, not more
    `keyNumbers` rows.** S3 storage classes, EBS volume types, EC2 purchase
    options and Route 53 routing policies are the shape the exam actually asks
    about — it describes a requirement and makes you name the option — and a
    flat `label`/`value` pair cannot say which half is the requirement, so it
    derives no card that asks you to choose. `pick` is that requirement and is
    required for exactly that reason. The table on screen is *derived*: the axes
    are always Option / When to pick / Signal / Gotcha, because per-service axes
    are how `keyNumbers` drifted into meaning something different on every
    entry. A `keyNumbers` row whose label names an option **moves** here — never
    copied — and `content:check` fails the duplicate, because two sources for
    one fact is the drift invariant 2 exists to prevent even when both sides are
    derived. `signal` deliberately derives no `number` card for the same reason.

22. **A card id never encodes a position.** The SRS schedule is keyed by card
    id, so `num:s3:3` meaning one fact today and another tomorrow silently
    rebinds a learner's reps, ease and due date to something they never studied
    — invisibly. Ids are keyed by label (`num:<slug>:<kebab(label)>`), so
    removing a fact *orphans* its card, which the drill reports honestly and
    `pruneOrphanCards` then clears. `cards.test.ts` fails any id with a
    digits-only segment.

23. **A lesson is an order, not a source.** `src/content/lessons/*` may restate
    any fact in the atlas or the concepts and may introduce none — same rule as a
    question explanation, invariant 10, and for the same reason: a fact that
    exists only in a lesson is drilled by no card and findable by no search. When
    a lesson wants a fact the atlas lacks, the atlas entry gets edited first and
    `cards.ts` derives the card for free. The lesson's whole contribution is
    *sequence*: a picture before the definition, the wrong answer written out
    before it is rejected, statefulness demonstrated with two arrows before the
    word is used. That is what the atlas cannot do, being a reference — and it is
    the actual complaint that produced this layer, not any missing fact.

    A `DiagramSpec` that declares `steps` renders as a walkthrough rather than a
    picture (`traceAt` in `src/engines/lesson/trace.ts`), so use steps only when
    the *sequence* is the teaching. If the whole thing needs to be seen at once,
    leave `steps` empty — `content:check` fails a walkthrough with an edge no
    step lights, because it would be invisible for the diagram's whole life.

    Reading a lesson awards nothing. `XP.lessonSection` and `XP.lessonComplete`
    exist and are deliberately unused; only the checks pay, and they record no
    `Attempt`. Same rule as a study step (13) and a story chapter (19).

17. **A number the exam sets is read from the `Cert`, never typed into prose.**
    Minutes, question count, pass score and the pass-accuracy anchor all live on
    the cert. Both current papers happen to share 130/65/720, which is exactly
    why hardcoding them looked harmless — and why nine places had drifted into
    asserting them. If a component does not have the cert in hand, it does not
    state the number. Note `passAccuracy` is deliberately *not* derived from
    `passScore / scaleMax`: those agreeing at 0.72 is a coincidence of units, and
    AWS does not publish the raw-to-scaled mapping.
