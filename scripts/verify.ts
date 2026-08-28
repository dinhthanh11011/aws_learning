/**
 * Runs every gate in one command, cheapest first, and stops at the first failure.
 *
 * Run: npm run verify          # all six gates
 *      npm run verify -- --fast   # everything except the build
 *
 * Why this exists: the six gates were six separate invocations, and five of them
 * are near-silent when they pass — 32 lines, 9, 4, 13, 0. The build is the one
 * that is not: it prints a 228-row route table on every success, which nobody
 * reads and which is the same table it printed last time. So a green run cost
 * six round trips and a page of noise to say "nothing is wrong".
 *
 * Here a passing gate is one line. A failing gate prints everything it said and
 * nothing after it runs, because the later gates are usually just the first
 * failure again in a different voice.
 */
import { spawnSync } from 'node:child_process'

const fast = process.argv.includes('--fast')

type Gate = {
  name: string
  cmd: string
  args: string[]
  /** Passing output worth keeping — everything else is dropped on success. */
  keep?: RegExp
}

const gates: Gate[] = [
  {
    name: 'content:check',
    cmd: 'tsx',
    args: ['scripts/content-check.ts'],
    keep: /warning\(s\)|^\s*·\s|✓/,
  },
  { name: 'diagram:audit', cmd: 'tsx', args: ['scripts/diagram-audit.ts'], keep: /✓|✗|warn/i },
  { name: 'typecheck', cmd: 'tsc', args: ['--noEmit'] },
  { name: 'test', cmd: 'vitest', args: ['run', '--reporter=dot'], keep: /Test Files|Tests / },
  { name: 'eslint', cmd: 'eslint', args: ['src', 'scripts', '--max-warnings', '0'] },
  ...(fast
    ? []
    : [
        {
          name: 'build',
          cmd: 'next',
          args: ['build'],
          keep: /✓ Generating static pages.*\(\d+\/\d+\)/,
        },
      ]),
]

let failed = false

for (const gate of gates) {
  const started = Date.now()
  const run = spawnSync(gate.cmd, gate.args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  const secs = ((Date.now() - started) / 1000).toFixed(1)
  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`

  if (run.status !== 0) {
    console.log(`✗ ${gate.name}  ${secs}s`)
    console.log(output.trimEnd())
    failed = true
    break
  }

  console.log(`✓ ${gate.name}  ${secs}s`)
  if (gate.keep) {
    for (const line of output.split('\n')) {
      if (gate.keep.test(line) && line.trim()) console.log(`    ${line.trim()}`)
    }
  }
}

if (failed) {
  console.log('\nStopped at the first failing gate. Later gates were not run.')
  process.exit(1)
}

console.log(
  fast
    ? '\nAll gates pass (build skipped — run without --fast before claiming done).'
    : '\nAll gates pass.',
)
