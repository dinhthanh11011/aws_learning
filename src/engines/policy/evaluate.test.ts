import { describe, expect, it } from 'vitest'
import { evaluate, ipInCidr, wildcardMatch } from './evaluate'
import type { AttachedPolicy } from './types'

const identity = (name: string, doc: AttachedPolicy['doc']): AttachedPolicy => ({
  id: `i-${name}`,
  name,
  kind: 'identity',
  doc,
})
const resource = (name: string, doc: AttachedPolicy['doc']): AttachedPolicy => ({
  id: `r-${name}`,
  name,
  kind: 'resource',
  doc,
})
const scp = (name: string, doc: AttachedPolicy['doc']): AttachedPolicy => ({
  id: `s-${name}`,
  name,
  kind: 'scp',
  doc,
})

const req = {
  principal: 'arn:aws:iam::111122223333:role/App',
  action: 's3:GetObject',
  resource: 'arn:aws:s3:::reports/q3.pdf',
}

const allowAll = { Statement: [{ Effect: 'Allow' as const, Action: 's3:*', Resource: '*' }] }

describe('wildcardMatch', () => {
  it('treats * as any sequence and ? as one character', () => {
    expect(wildcardMatch('s3:*', 's3:GetObject')).toBe(true)
    expect(wildcardMatch('s3:Get*', 's3:PutObject')).toBe(false)
    expect(wildcardMatch('*', 'anything')).toBe(true)
    expect(wildcardMatch('arn:aws:s3:::bucket/*', 'arn:aws:s3:::bucket/a/b.txt')).toBe(true)
  })

  it('does not let regex metacharacters in the pattern match arbitrarily', () => {
    expect(wildcardMatch('s3:Get.bject', 's3:GetObject')).toBe(false)
  })
})

describe('ipInCidr', () => {
  it('matches inside the range and rejects outside it', () => {
    expect(ipInCidr('203.0.113.5', '203.0.113.0/24')).toBe(true)
    expect(ipInCidr('203.0.114.5', '203.0.113.0/24')).toBe(false)
    expect(ipInCidr('10.1.2.3', '0.0.0.0/0')).toBe(true)
  })
})

describe('evaluate — the rule that decides most exam questions', () => {
  it('lets an explicit Deny beat a full Allow', () => {
    const d = evaluate(
      [
        identity('AdminAccess', allowAll),
        identity('DenyReports', {
          Statement: [
            { Sid: 'BlockReports', Effect: 'Deny', Action: 's3:*', Resource: 'arn:aws:s3:::reports/*' },
          ],
        }),
      ],
      req,
    )
    expect(d.allowed).toBe(false)
    expect(d.decidedBy?.outcome).toBe('explicit-deny')
    expect(d.decidedBy?.sid).toBe('BlockReports')
  })

  it('denies by default when nothing allows', () => {
    const d = evaluate([identity('EC2Only', {
      Statement: [{ Effect: 'Allow', Action: 'ec2:*', Resource: '*' }],
    })], req)
    expect(d.allowed).toBe(false)
    expect(d.decidedBy).toBeNull()
    expect(d.summary).toMatch(/denied by default/i)
  })

  it('allows a plain same-account request', () => {
    expect(evaluate([identity('S3Read', allowAll)], req).allowed).toBe(true)
  })
})

describe('evaluate — ceilings cap but never grant', () => {
  it('blocks an allowed action when the SCP does not permit it', () => {
    const d = evaluate(
      [identity('AdminAccess', allowAll), scp('SandboxSCP', {
        Statement: [{ Effect: 'Allow', Action: 'ec2:*', Resource: '*' }],
      })],
      req,
    )
    expect(d.allowed).toBe(false)
    expect(d.decidedBy?.outcome).toBe('not-permitted-by-ceiling')
  })

  it('does not grant access from an SCP alone', () => {
    const d = evaluate([scp('SandboxSCP', allowAll)], req)
    expect(d.allowed).toBe(false)
    expect(d.summary).toMatch(/denied by default/i)
  })

  it('allows when both the SCP and the identity policy permit', () => {
    const d = evaluate([identity('S3Read', allowAll), scp('SandboxSCP', allowAll)], req)
    expect(d.allowed).toBe(true)
  })
})

describe('evaluate — cross-account needs both halves', () => {
  const crossReq = { ...req, crossAccount: true }

  it('denies when only the identity policy allows', () => {
    expect(evaluate([identity('S3Read', allowAll)], crossReq).allowed).toBe(false)
  })

  it('denies when only the resource policy allows', () => {
    const d = evaluate(
      [resource('BucketPolicy', {
        Statement: [{ Effect: 'Allow', Action: 's3:*', Resource: '*', Principal: req.principal }],
      })],
      crossReq,
    )
    expect(d.allowed).toBe(false)
  })

  it('allows when both sides allow', () => {
    const d = evaluate(
      [
        identity('S3Read', allowAll),
        resource('BucketPolicy', {
          Statement: [{ Effect: 'Allow', Action: 's3:*', Resource: '*', Principal: req.principal }],
        }),
      ],
      crossReq,
    )
    expect(d.allowed).toBe(true)
  })

  it('denies when the bucket policy names a different principal', () => {
    const d = evaluate(
      [
        identity('S3Read', allowAll),
        resource('BucketPolicy', {
          Statement: [
            {
              Effect: 'Allow',
              Action: 's3:*',
              Resource: '*',
              Principal: 'arn:aws:iam::999988887777:role/Other',
            },
          ],
        }),
      ],
      crossReq,
    )
    expect(d.allowed).toBe(false)
  })
})

describe('evaluate — conditions', () => {
  it('applies an Allow only when the condition is satisfied', () => {
    const p = identity('MfaOnly', {
      Statement: [
        {
          Effect: 'Allow',
          Action: 's3:*',
          Resource: '*',
          Condition: { Bool: { 'aws:MultiFactorAuthPresent': 'true' } },
        },
      ],
    })
    expect(evaluate([p], { ...req, context: { 'aws:MultiFactorAuthPresent': 'true' } }).allowed).toBe(true)
    expect(evaluate([p], { ...req, context: { 'aws:MultiFactorAuthPresent': 'false' } }).allowed).toBe(false)
    // Key missing entirely — the statement cannot apply.
    expect(evaluate([p], req).allowed).toBe(false)
  })

  it('enforces a source-IP condition', () => {
    const p = identity('OfficeOnly', {
      Statement: [
        {
          Effect: 'Allow',
          Action: 's3:*',
          Resource: '*',
          Condition: { IpAddress: { 'aws:SourceIp': '203.0.113.0/24' } },
        },
      ],
    })
    expect(evaluate([p], { ...req, context: { 'aws:SourceIp': '203.0.113.9' } }).allowed).toBe(true)
    expect(evaluate([p], { ...req, context: { 'aws:SourceIp': '198.51.100.9' } }).allowed).toBe(false)
  })

  it('applies a conditional Deny only inside its condition', () => {
    const policies = [
      identity('AdminAccess', allowAll),
      identity('RegionLock', {
        Statement: [
          {
            Sid: 'OnlyEu',
            Effect: 'Deny' as const,
            Action: '*',
            Resource: '*',
            Condition: { StringNotEquals: { 'aws:RequestedRegion': 'eu-west-1' } },
          },
        ],
      }),
    ]
    expect(evaluate(policies, { ...req, context: { 'aws:RequestedRegion': 'eu-west-1' } }).allowed).toBe(true)
    expect(evaluate(policies, { ...req, context: { 'aws:RequestedRegion': 'us-east-1' } }).allowed).toBe(false)
  })
})

describe('evaluate — NotAction and resource scoping', () => {
  it('honours NotAction as everything except the listed actions', () => {
    const p = identity('AllButDelete', {
      Statement: [{ Effect: 'Allow', NotAction: 's3:DeleteObject', Action: [], Resource: '*' }],
    })
    expect(evaluate([p], req).allowed).toBe(true)
    expect(evaluate([p], { ...req, action: 's3:DeleteObject' }).allowed).toBe(false)
  })

  it('does not allow a resource outside the statement scope', () => {
    const p = identity('OneBucket', {
      Statement: [{ Effect: 'Allow', Action: 's3:*', Resource: 'arn:aws:s3:::public/*' }],
    })
    expect(evaluate([p], req).allowed).toBe(false)
    expect(evaluate([p], { ...req, resource: 'arn:aws:s3:::public/logo.png' }).allowed).toBe(true)
  })
})

describe('evaluate — trace', () => {
  it('records a line per statement so the lab can show the reasoning', () => {
    const d = evaluate(
      [identity('Mixed', {
        Statement: [
          { Sid: 'A', Effect: 'Allow', Action: 'ec2:*', Resource: '*' },
          { Sid: 'B', Effect: 'Allow', Action: 's3:GetObject', Resource: '*' },
        ],
      })],
      req,
    )
    expect(d.trace).toHaveLength(2)
    expect(d.trace[0]).toMatchObject({ sid: 'A', outcome: 'no-match' })
    expect(d.trace[1]).toMatchObject({ sid: 'B', outcome: 'allow' })
  })
})
