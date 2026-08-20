import type {
  AttachedPolicy,
  AuthRequest,
  Decision,
  PolicyDoc,
  Statement,
  TraceLine,
} from './types'

/* ── Matching helpers ────────────────────────────────────────────────────── */

const asArray = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v]

/**
 * IAM wildcards are not regex: `*` matches any sequence, `?` matches one
 * character, and matching is case-insensitive for action names.
 */
export function wildcardMatch(pattern: string, value: string): boolean {
  if (pattern === '*') return true
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
  return new RegExp(`^${escaped}$`, 'i').test(value)
}

function matchesAction(st: Statement, action: string): boolean {
  const not = asArray(st.NotAction)
  if (not.length) return !not.some((p) => wildcardMatch(p, action))
  return asArray(st.Action).some((p) => wildcardMatch(p, action))
}

function matchesResource(st: Statement, resource: string, isIdentity: boolean): boolean {
  const not = asArray(st.NotResource)
  if (not.length) return !not.some((p) => wildcardMatch(p, resource))
  const res = asArray(st.Resource)
  // An identity policy with no Resource is unusual but treated as `*`; a
  // resource policy with no Resource means "this resource".
  if (!res.length) return true
  void isIdentity
  return res.some((p) => wildcardMatch(p, resource))
}

function matchesPrincipal(st: Statement, principal: string): boolean {
  const p = asArray(st.Principal)
  if (!p.length) return true
  return p.some((pat) => pat === '*' || wildcardMatch(pat, principal))
}

/** Returns null when all conditions pass, or the key that failed. */
function failingCondition(st: Statement, ctx: Record<string, string>): string | null {
  if (!st.Condition) return null
  for (const [op, entries] of Object.entries(st.Condition)) {
    for (const [key, expectedRaw] of Object.entries(entries ?? {})) {
      const expected = Array.isArray(expectedRaw) ? expectedRaw : [expectedRaw]
      const actual = ctx[key]
      // A condition key absent from the request context cannot be satisfied by
      // a positive operator — the statement simply does not apply.
      const negative = op === 'StringNotEquals' || op === 'NotIpAddress'
      if (actual === undefined) {
        if (!negative) return key
        continue
      }
      let ok: boolean
      switch (op) {
        case 'StringEquals':
        case 'ArnEquals':
          ok = expected.includes(actual)
          break
        case 'StringNotEquals':
          ok = !expected.includes(actual)
          break
        case 'StringLike':
        case 'ArnLike':
          ok = expected.some((e) => wildcardMatch(e, actual))
          break
        case 'Bool':
          ok = expected.some((e) => e.toLowerCase() === actual.toLowerCase())
          break
        case 'IpAddress':
          ok = expected.some((cidr) => ipInCidr(actual, cidr))
          break
        case 'NotIpAddress':
          ok = !expected.some((cidr) => ipInCidr(actual, cidr))
          break
        case 'NumericLessThan':
          ok = expected.some((e) => Number(actual) < Number(e))
          break
        default:
          ok = false
      }
      if (!ok) return key
    }
  }
  return null
}

export function ipInCidr(ip: string, cidr: string): boolean {
  const [range, bitsRaw] = cidr.split('/')
  const bits = bitsRaw === undefined ? 32 : Number(bitsRaw)
  const toInt = (s: string) =>
    s.split('.').reduce((acc, oct) => (acc << 8) + (Number(oct) & 255), 0) >>> 0
  if (bits === 0) return true
  const mask = (0xffffffff << (32 - bits)) >>> 0
  return (toInt(ip) & mask) === (toInt(range) & mask)
}

/* ── Evaluation ──────────────────────────────────────────────────────────── */

interface Verdict {
  allow: boolean
  deny: boolean
  lines: TraceLine[]
}

function evaluateDoc(
  policy: AttachedPolicy,
  req: AuthRequest,
  ctx: Record<string, string>,
): Verdict {
  const lines: TraceLine[] = []
  let allow = false
  let deny = false
  const isIdentity = policy.kind === 'identity'
  const doc: PolicyDoc = policy.doc

  doc.Statement.forEach((st, i) => {
    const sid = st.Sid ?? `${policy.name}#${i + 1}`
    const base = { policyId: policy.id, policyName: policy.name, kind: policy.kind, sid }

    if (!matchesAction(st, req.action)) {
      lines.push({ ...base, outcome: 'no-match', reason: `action ${req.action} not covered` })
      return
    }
    if (!matchesResource(st, req.resource, isIdentity)) {
      lines.push({ ...base, outcome: 'no-match', reason: `resource not covered by this statement` })
      return
    }
    if (
      (policy.kind === 'resource' || policy.kind === 'scp') &&
      !matchesPrincipal(st, req.principal)
    ) {
      lines.push({ ...base, outcome: 'no-match', reason: `principal ${req.principal} not listed` })
      return
    }
    const failed = failingCondition(st, ctx)
    if (failed) {
      lines.push({
        ...base,
        outcome: 'no-match',
        reason: `condition on ${failed} not satisfied`,
      })
      return
    }

    if (st.Effect === 'Deny') {
      deny = true
      lines.push({ ...base, outcome: 'explicit-deny', reason: 'explicit Deny matches this request' })
    } else {
      allow = true
      lines.push({ ...base, outcome: 'allow', reason: 'Allow matches this request' })
    }
  })

  return { allow, deny, lines }
}

/**
 * Evaluates a request the way AWS does, in the order the exam tests:
 *
 *   1. An explicit Deny anywhere wins, immediately and unconditionally.
 *   2. An SCP, permissions boundary or session policy must *permit* the action.
 *      They never grant it — they only cap what a grant can reach.
 *   3. Some Allow must exist. For a same-account request, an identity policy
 *      or a resource policy is enough. For cross-account, BOTH sides must allow.
 *   4. Otherwise the default is deny.
 *
 * Returns a full trace so the lab can show which line decided the outcome —
 * which is the part that actually teaches the model.
 */
export function evaluate(policies: AttachedPolicy[], req: AuthRequest): Decision {
  const ctx = req.context ?? {}
  const trace: TraceLine[] = []
  const byKind = (kind: AttachedPolicy['kind']) => policies.filter((p) => p.kind === kind)

  const verdicts = new Map<string, Verdict>()
  for (const p of policies) {
    const v = evaluateDoc(p, req, ctx)
    verdicts.set(p.id, v)
    trace.push(...v.lines)
  }

  /* 1 — explicit deny wins */
  const denyLine = trace.find((l) => l.outcome === 'explicit-deny')
  if (denyLine) {
    return {
      allowed: false,
      summary: `Denied. An explicit Deny in "${denyLine.policyName}" (${denyLine.sid}) beats every Allow — this is the first rule of IAM evaluation and it has no exceptions.`,
      decidedBy: denyLine,
      trace,
    }
  }

  /* 2 — ceilings must permit */
  for (const kind of ['scp', 'boundary', 'session'] as const) {
    const ceilings = byKind(kind)
    if (!ceilings.length) continue
    const permitted = ceilings.some((p) => verdicts.get(p.id)?.allow)
    if (!permitted) {
      const label =
        kind === 'scp'
          ? 'service control policy'
          : kind === 'boundary'
            ? 'permissions boundary'
            : 'session policy'
      const line: TraceLine = {
        policyId: ceilings[0].id,
        policyName: ceilings[0].name,
        kind,
        sid: '—',
        outcome: 'not-permitted-by-ceiling',
        reason: `${label} does not permit ${req.action} on this resource`,
      }
      trace.push(line)
      return {
        allowed: false,
        summary: `Denied. The ${label} does not permit ${req.action}. A ceiling never grants permission — it only limits what an Allow can reach — so no identity policy can override this.`,
        decidedBy: line,
        trace,
      }
    }
  }

  /* 3 — something must allow */
  const identityAllow = byKind('identity').find((p) => verdicts.get(p.id)?.allow)
  const resourceAllow = byKind('resource').find((p) => verdicts.get(p.id)?.allow)

  if (req.crossAccount) {
    if (identityAllow && resourceAllow) {
      const line = trace.find(
        (l) => l.outcome === 'allow' && l.policyId === resourceAllow.id,
      )!
      return {
        allowed: true,
        summary: `Allowed. Cross-account access needs both halves, and both are present: "${identityAllow.name}" allows the caller to make the call, and "${resourceAllow.name}" allows this principal on the resource.`,
        decidedBy: line,
        trace,
      }
    }
    const missing = identityAllow ? 'the resource policy' : 'the caller’s identity policy'
    return {
      allowed: false,
      summary: `Denied. Cross-account access requires an Allow on both sides, and ${missing} is missing one. This is the most common cross-account mistake.`,
      decidedBy: null,
      trace,
    }
  }

  // Only identity and resource policies can *grant*. A ceiling that permits an
  // action has removed an obstacle, not created a permission — which is exactly
  // the distinction the exam keeps testing.
  const granting = identityAllow ?? resourceAllow
  const allowLine = granting
    ? trace.find((l) => l.outcome === 'allow' && l.policyId === granting.id)
    : undefined
  if (allowLine) {
    return {
      allowed: true,
      summary: `Allowed by "${allowLine.policyName}" (${allowLine.sid}), with no Deny and no ceiling blocking it.`,
      decidedBy: allowLine,
      trace,
    }
  }

  return {
    allowed: false,
    summary: `Denied by default. Nothing explicitly allowed ${req.action} on this resource — and in IAM, anything not allowed is denied.`,
    decidedBy: null,
    trace,
  }
}
