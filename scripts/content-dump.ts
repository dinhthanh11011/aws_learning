/**
 * Prints the corpus fingerprint — see scripts/lib/fingerprint.ts for why.
 *
 * Run: npm run content:fingerprint
 *      npm run content:fingerprint -- --expect <hash>   (exits 1 on drift)
 *
 * Use it around any mechanical content refactor: record the hash first, then
 * assert it afterwards. A changed hash after a pure file move means content
 * was lost, duplicated or reordered.
 */
import {
  cards,
  concepts,
  decisionTrees,
  idleCosts,
  labs,
  lessons,
  phases,
  questions,
  services,
  tasks,
  triggers,
  domains,
  certs,
} from '../src/content'
import { fingerprint } from './lib/fingerprint'

const fp = fingerprint({
  certs,
  domains,
  tasks,
  services,
  concepts,
  questions,
  triggers,
  phases,
  steps: phases.flatMap((p) => p.steps),
  labs,
  lessons,
  decisionTrees,
  idleCosts,
  cards,
})

const expectFlag = process.argv.indexOf('--expect')
const expected = expectFlag === -1 ? undefined : process.argv[expectFlag + 1]

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(fp, null, 2))
} else {
  console.log('\n  Corpus fingerprint')
  console.log('  ─────────────────────────────────────────')
  for (const [name, part] of Object.entries(fp.parts)) {
    console.log(`  ${name.padEnd(16)}${String(part.count).padStart(5)}  ${part.hash}`)
  }
  console.log('  ─────────────────────────────────────────')
  console.log(`  overall                ${fp.overall}\n`)
}

if (expected && expected !== fp.overall) {
  console.error(`  ✗ fingerprint drift: expected ${expected}, got ${fp.overall}`)
  console.error('    Content changed. If this followed a pure file move, something was lost.\n')
  process.exit(1)
}
if (expected) console.log(`  ✓ fingerprint matches ${expected}\n`)
