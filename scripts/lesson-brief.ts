/**
 * Prints everything you need to write a lesson about some slugs, and nothing
 * else.
 *
 * Run: npm run lesson:brief -- security-group nacl
 *      npm run lesson:brief -- s3 --questions      (include full question stems)
 *
 * Why this exists: a lesson introduces no facts (invariant 23), so writing one
 * is entirely a matter of *selecting and ordering* facts that already exist. The
 * obvious way to find them is to read `services/network.ts`, `concepts/
 * networking.ts`, `triggers.ts` and a questions file — four files, several
 * thousand lines, to end up using perhaps sixty of them. That cost is paid again
 * for every lesson.
 *
 * This prints the same sixty lines directly: the atlas entry, the concepts it
 * leans on, the card ids to cite, the trigger phrases the exam uses, and which
 * task statements own it. It is the whole research step for a lesson, in one
 * command, and it also means the facts in a lesson are copied from the corpus
 * rather than recalled — which is what keeps invariant 23 true in practice
 * rather than only in principle.
 */
import {
  cards,
  conceptBySlug,
  conceptsForService,
  questions,
  serviceBySlug,
  tasks,
  triggers,
} from '../src/content'

const args = process.argv.slice(2)
const withQuestions = args.includes('--questions')
const slugs = args.filter((a) => !a.startsWith('--'))

if (!slugs.length) {
  console.error('usage: npm run lesson:brief -- <slug> [slug...] [--questions]')
  process.exit(1)
}

const rule = (label: string) =>
  console.log(`\n──── ${label} ${'─'.repeat(Math.max(2, 62 - label.length))}`)
const bullets = (items: readonly string[], indent = '  ') => {
  for (const i of items) console.log(`${indent}· ${i}`)
}

for (const slug of slugs) {
  const svc = serviceBySlug.get(slug)
  const con = conceptBySlug.get(slug)

  if (!svc && !con) {
    console.log(`\n### ${slug} — NOT FOUND (neither service nor concept)`)
    continue
  }

  if (svc) {
    console.log(`\n\n═══ SERVICE ${svc.slug} — ${svc.name}${svc.abbr ? ` (${svc.abbr})` : ''}`)
    console.log(`    tier ${svc.tier} · ${svc.families.join('/')} · ${svc.pricing}`)
    console.log(`    ${svc.oneLiner}`)

    rule('whatItIs')
    console.log(`  ${svc.whatItIs}`)
    if (svc.whyItExists) {
      rule('whyItExists')
      console.log(`  ${svc.whyItExists}`)
    }
    rule('whenToUse / whenNotToUse')
    bullets(svc.whenToUse)
    bullets(svc.whenNotToUse.map((x) => `NOT: ${x}`))

    rule('keyNumbers — copy these verbatim into a `numbers` section')
    for (const n of svc.keyNumbers) {
      console.log(`  · ${n.label}: ${n.value}${n.volatile ? '   [volatile → verify badge]' : ''}`)
      if (n.note) console.log(`      note: ${n.note}`)
    }

    for (const set of svc.optionSets ?? []) {
      rule(`optionSet "${set.label}" — already a table; a compare section would duplicate it`)
      console.log(`  ${set.prompt}`)
      for (const o of set.options) {
        console.log(`  · ${o.name} — pick when: ${o.pick}`)
        if (o.signal) console.log(`      signal: ${o.signal}`)
        if (o.gotcha) console.log(`      gotcha: ${o.gotcha}`)
      }
    }

    rule('examTraps — each one is a candidate `trap` callout')
    bullets(svc.examTraps)

    rule('confusedWith — each one is a candidate `compare` row')
    for (const c of svc.confusedWith) console.log(`  · vs ${c.slug}: ${c.difference}`)

    rule('related')
    console.log(`  ${svc.related.join(', ')}`)

    const cons = conceptsForService(slug)
    if (cons.length) {
      rule('concepts this service assumes — reference with [[slug]], do not re-explain')
      for (const c of cons) console.log(`  · [[${c.slug}]] ${c.term} — ${c.oneLiner}`)
    }
  }

  if (con) {
    console.log(`\n\n═══ CONCEPT ${con.slug} — ${con.term}${con.abbr ? ` (${con.abbr})` : ''}`)
    console.log(`    ${con.group} · ${con.families.join('/')}`)
    console.log(`    ${con.oneLiner}`)
    rule('keyIdea — usually the best single sentence to open a lesson with')
    console.log(`  ${con.keyIdea}`)
    rule('whatItIs')
    console.log(`  ${con.whatItIs}`)
    if (con.whyItExists) {
      rule('whyItExists')
      console.log(`  ${con.whyItExists}`)
    }
    rule('onTheExam')
    bullets(con.onTheExam)
    rule('keyNumbers')
    for (const n of con.keyNumbers) {
      console.log(`  · ${n.label}: ${n.value}${n.volatile ? '   [volatile]' : ''}`)
      if (n.note) console.log(`      note: ${n.note}`)
    }
    rule('examTraps')
    bullets(con.examTraps)
    rule('confusedWith')
    for (const c of con.confusedWith) console.log(`  · vs ${c.slug}: ${c.difference}`)
  }

  /* ── Cards: the ids a lesson cites, so the drill and the lesson agree ── */
  const mine = cards.filter((c) => c.serviceSlugs.includes(slug))
  if (mine.length) {
    rule(`cardIds (${mine.length}) — cite the load-bearing ones in the lesson`)
    for (const c of mine) console.log(`  ${c.kind.padEnd(13)} ${c.id}`)
  }

  /* ── Triggers: the exam's actual wording ── */
  const trig = triggers.filter(
    (t) => t.slugs.includes(slug) || t.notThis.some((n) => n.slug === slug),
  )
  if (trig.length) {
    rule('trigger phrases — the wording the paper uses; quote these in prose')
    for (const t of trig) {
      const role = t.slugs.includes(slug) ? 'ANSWER' : 'DISTRACTOR'
      console.log(`  · [${role}] "${t.phrase}" → ${t.means}`)
      for (const n of t.notThis) console.log(`      not ${n.slug}: ${n.why}`)
    }
  }

  /* ── Tasks: candidate taskId values for the lesson ── */
  const owning = tasks.filter((t) => t.serviceSlugs.includes(slug))
  if (owning.length) {
    rule('taskId candidates — a lesson carries exactly one')
    for (const t of owning) console.log(`  · ${t.id}  ${t.code} ${t.title}`)
  }

  /* ── Questions: what the bank already asserts. Read the explanations; a
       lesson must not contradict one, and they are a good source of angles. ── */
  const qs = questions.filter((q) => q.serviceSlugs.includes(slug))
  if (qs.length) {
    rule(`questions in the bank (${qs.length}) — the lesson must not contradict these`)
    for (const q of qs) {
      console.log(`  · ${q.id} (d${q.difficulty}, ${q.taskId})`)
      console.log(`      takeaway: ${q.explanation}`)
      if (withQuestions) console.log(`      stem: ${q.stem}`)
    }
  }
}

console.log(`\n${'═'.repeat(70)}`)
console.log('Next: docs/LESSONS.md for the section order, then write the file.')
console.log('Nothing above may be reworded into a new fact — copy or cite it.\n')
