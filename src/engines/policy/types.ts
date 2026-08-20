/**
 * A deliberately small model of IAM. It is not a reimplementation of AWS —
 * it covers the mechanics the exam actually tests: the evaluation order, the
 * identity/resource policy pair, SCP and boundary ceilings, and condition keys.
 */

export type Effect = 'Allow' | 'Deny'

export type ConditionOperator =
  | 'StringEquals'
  | 'StringNotEquals'
  | 'StringLike'
  | 'Bool'
  | 'IpAddress'
  | 'NotIpAddress'
  | 'ArnEquals'
  | 'ArnLike'
  | 'NumericLessThan'

export interface Statement {
  Sid?: string
  Effect: Effect
  /** Actions like `s3:GetObject`, `s3:*`, or `*`. */
  Action: string | string[]
  NotAction?: string | string[]
  /** ARNs, possibly with wildcards. Omitted on identity policies means `*`. */
  Resource?: string | string[]
  NotResource?: string | string[]
  /** Only meaningful on resource, trust and SCP policies. */
  Principal?: string | string[]
  Condition?: Partial<Record<ConditionOperator, Record<string, string | string[]>>>
}

export interface PolicyDoc {
  Version?: string
  Statement: Statement[]
}

/** Where a policy sits in the evaluation chain. */
export type PolicyKind =
  | 'identity'
  | 'resource'
  | 'scp'
  | 'boundary'
  | 'session'

export interface AttachedPolicy {
  id: string
  name: string
  kind: PolicyKind
  doc: PolicyDoc
}

export interface AuthRequest {
  /** ARN of the calling principal. */
  principal: string
  /** e.g. `s3:GetObject` */
  action: string
  /** ARN of the target resource. */
  resource: string
  /** Condition context: `aws:SourceIp`, `aws:MultiFactorAuthPresent`, `aws:RequestedRegion`… */
  context?: Record<string, string>
  /** True when the principal and resource live in different accounts. */
  crossAccount?: boolean
}

export type TraceOutcome =
  | 'explicit-deny'
  | 'allow'
  | 'no-match'
  | 'implicit-deny'
  | 'not-permitted-by-ceiling'

export interface TraceLine {
  policyId: string
  policyName: string
  kind: PolicyKind
  sid: string
  outcome: TraceOutcome
  /** Human explanation of why this statement did or did not apply. */
  reason: string
}

export interface Decision {
  allowed: boolean
  /** The single sentence that explains the result. */
  summary: string
  /** Which rule decided it — what the lab highlights. */
  decidedBy: TraceLine | null
  trace: TraceLine[]
}
