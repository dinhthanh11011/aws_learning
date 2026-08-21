import type { Cert, CertFamily, CertId, Scoped, Task } from './schema'
import { CERT_FAMILIES } from './schema'
import { saaC03 } from './certs/saa-c03'
import { dvaC02 } from './certs/dva-c02'

/**
 * The cert registry: the one place that knows which exam versions exist, which
 * family each belongs to, and therefore which content is in scope for which
 * paper.
 *
 * Named `cert-registry.ts` rather than `certs/index.ts` for the same reason the
 * service and concept registries are — a directory index that the `@/content`
 * barrel also re-exports confuses the bundler's module graph, and the runtime
 * error points nowhere near the cause.
 *
 * It imports only ./schema and ./certs/*, so the service registry, the concept
 * registry and the derived cards can all import `inScope` without a cycle.
 *
 * Retired versions are deliberately never deleted from this list. Old questions
 * still carry their task ids and old attempts still record the paper the
 * learner actually sat, so removing a version would orphan a learner's history
 * to save a few hundred lines of dead data.
 */
export const certs: Cert[] = [saaC03, dvaC02]

export const certById = new Map<CertId, Cert>(certs.map((c) => [c.id, c]))

export const currentCerts: Cert[] = certs.filter((c) => c.status === 'current')

/** The cert a fresh profile starts on — data, not a hardcoded literal. */
export const DEFAULT_CERT_ID: CertId =
  (currentCerts.find((c) => c.recommendedFirst) ?? currentCerts[0] ?? certs[0]).id

export const certFor = (id: CertId): Cert | undefined => certById.get(id)

export const familyOf = (id: CertId): CertFamily | undefined => certById.get(id)?.family

/** The current paper for a family — what a learner should actually be studying for. */
export const currentCertFor = (family: CertFamily): Cert | undefined =>
  currentCerts.find((c) => c.family === family)

/** "SAA-C03" -> "SAA". Every badge goes through here rather than a ternary. */
export function certShort(id: CertId): string {
  const family = familyOf(id)
  return family ? CERT_FAMILIES[family].short : id
}

export function certLabel(id: CertId): string {
  const family = familyOf(id)
  return family ? CERT_FAMILIES[family].label : id
}

export const familyShort = (family: CertFamily): string => CERT_FAMILIES[family].short
export const familyLabel = (family: CertFamily): string => CERT_FAMILIES[family].label

/**
 * Follows `supersededBy` to the version a learner on `id` should be moved to.
 * Returns `id` unchanged when it is still current. Guards against a cycle
 * rather than trusting the data — content:check also rejects one, but a hang
 * here would be a blank app.
 */
export function retirementTarget(id: CertId): CertId {
  let at = id
  for (let hops = 0; hops < certs.length; hops++) {
    const cert = certById.get(at)
    if (!cert?.supersededBy) return at
    at = cert.supersededBy
  }
  return at
}

/* ── Scope: the one predicate every "…For(certId)" helper delegates to ────── */

/**
 * Is this content in scope for this exam version?
 *
 * Content tags a family, so the common case is a family match and a version
 * bump costs nothing. `versionScope` is the narrow override for content that
 * genuinely differs between versions of the same family.
 */
export function inScope(item: Scoped, certId: CertId): boolean {
  const cert = certById.get(certId)
  if (!cert) return false
  if (!item.families.includes(cert.family)) return false
  const scope = item.versionScope
  if (!scope) return true
  return scope.onlyIn ? scope.onlyIn.includes(certId) : !scope.notIn!.includes(certId)
}

export const scopedFor = <T extends Scoped>(items: readonly T[], certId: CertId): T[] =>
  items.filter((item) => inScope(item, certId))

/** A predicate bound to one cert — for passing into the pure engines. */
export const scopeFilterFor =
  (certId: CertId) =>
  (item: Scoped): boolean =>
    inScope(item, certId)

/* ── Task aliasing across versions ───────────────────────────────────────── */

const tasksOf = (cert: Cert): Task[] => cert.domains.flatMap((d) => d.tasks)

/**
 * Per cert, a map from every superseded task id to the task that absorbed it,
 * resolved transitively so a question written for C03 still routes after two
 * version bumps.
 */
const aliasByCert = new Map<CertId, Map<string, string>>(
  certs.map((cert) => {
    const direct = new Map<string, string>()
    for (const task of tasksOf(cert)) {
      for (const old of task.supersedes ?? []) direct.set(old, task.id)
    }
    // Chase chains (C02 task -> C03 task -> C04 task) to their end point.
    const resolved = new Map<string, string>()
    for (const [old] of direct) {
      let at = old
      const seen = new Set<string>([at])
      while (direct.has(at)) {
        const next = direct.get(at)!
        if (seen.has(next)) break
        at = next
        seen.add(at)
      }
      resolved.set(old, at)
    }
    return [cert.id, resolved] as const
  }),
)

const liveTaskIds = new Map<CertId, Set<string>>(
  certs.map((cert) => [cert.id, new Set(tasksOf(cert).map((t) => t.id))] as const),
)

/**
 * The id of the task that covers `taskId` on this cert, or undefined when this
 * cert does not test it at all. A question whose task resolves nowhere current
 * is a content:check failure — that is the rule that stops a version bump from
 * quietly emptying the exam sampler.
 */
export function resolveTaskId(taskId: string, certId: CertId): string | undefined {
  if (liveTaskIds.get(certId)?.has(taskId)) return taskId
  const mapped = aliasByCert.get(certId)?.get(taskId)
  return mapped && liveTaskIds.get(certId)?.has(mapped) ? mapped : undefined
}

/** Identity for today's corpus, since nothing supersedes anything yet. */
export const taskAliasFor =
  (certId: CertId) =>
  (taskId: string): string =>
    resolveTaskId(taskId, certId) ?? taskId
