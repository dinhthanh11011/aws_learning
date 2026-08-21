import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CERT_ID,
  certShort,
  currentCertFor,
  currentCerts,
  familyOf,
  inScope,
  resolveTaskId,
  retirementTarget,
} from './cert-registry'
import { questionsFor, servicesFor } from '.'

describe('scope', () => {
  it('matches on family, so a version bump needs no content retag', () => {
    expect(inScope({ families: ['saa'] }, 'SAA-C03')).toBe(true)
    expect(inScope({ families: ['dva'] }, 'SAA-C03')).toBe(false)
    expect(inScope({ families: ['saa', 'dva'] }, 'DVA-C02')).toBe(true)
  })

  it('honours an onlyIn override', () => {
    const item = { families: ['saa' as const], versionScope: { onlyIn: ['SAA-C03' as const], note: 'x' } }
    expect(inScope(item, 'SAA-C03')).toBe(true)
  })

  it('honours a notIn override', () => {
    const item = { families: ['saa' as const], versionScope: { notIn: ['SAA-C03' as const], note: 'x' } }
    expect(inScope(item, 'SAA-C03')).toBe(false)
  })

  it('never puts content in scope for an unknown cert', () => {
    expect(inScope({ families: ['saa'] }, 'NOPE-C01' as never)).toBe(false)
  })

  it('still partitions the real corpus per exam', () => {
    expect(servicesFor('SAA-C03').length).toBeGreaterThan(servicesFor('DVA-C02').length)
    expect(questionsFor('SAA-C03').length + questionsFor('DVA-C02').length).toBe(274)
  })
})

describe('identity and lifecycle', () => {
  it('derives the badge label from the family, not a ternary', () => {
    expect(certShort('SAA-C03')).toBe('SAA')
    expect(certShort('DVA-C02')).toBe('DVA')
  })

  it('starts a fresh learner on the recommended current cert', () => {
    expect(currentCerts.map((c) => c.id)).toContain(DEFAULT_CERT_ID)
  })

  it('resolves the current paper for a family', () => {
    expect(currentCertFor('saa')?.family).toBe('saa')
    expect(familyOf('DVA-C02')).toBe('dva')
  })

  it('leaves a learner alone while their exam version is current', () => {
    for (const cert of currentCerts) expect(retirementTarget(cert.id)).toBe(cert.id)
  })
})

describe('task resolution', () => {
  it('resolves a live task id on its own cert', () => {
    expect(resolveTaskId('saa-1.1', 'SAA-C03')).toBe('saa-1.1')
  })

  it('refuses a task that the cert does not test', () => {
    expect(resolveTaskId('saa-1.1', 'DVA-C02')).toBeUndefined()
    expect(resolveTaskId('made-up-9.9', 'SAA-C03')).toBeUndefined()
  })

  it('resolves every question in the bank against a current cert', () => {
    // This is the rule that stops a version bump from quietly emptying the
    // exam sampler: a question whose task resolves nowhere would vanish from
    // every paper without any error.
    for (const cert of currentCerts) {
      for (const q of questionsFor(cert.id)) {
        expect(resolveTaskId(q.taskId, cert.id), `${q.id} -> ${q.taskId}`).toBeDefined()
      }
    }
  })
})
