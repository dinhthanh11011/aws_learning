import type { CertId, Concept, Domain, Service, Task } from './schema'
import {
  DEFAULT_CERT_ID,
  certById,
  certFor,
  certLabel,
  certShort,
  certs,
  currentCertFor,
  currentCerts,
  familyLabel,
  familyOf,
  familyShort,
  inScope,
  resolveTaskId,
  retirementTarget,
  scopeFilterFor,
  scopedFor,
  taskAliasFor,
} from './cert-registry'
import {
  service,
  serviceBySlug,
  serviceLabel,
  services,
  servicesByCategory,
  servicesByTier,
  servicesFor,
} from './service-registry'
import {
  concept,
  conceptBySlug,
  conceptLabel,
  concepts,
  conceptsByGroup,
  conceptsFor,
  conceptsForService,
} from './concept-registry'
import { phases } from './phases'
import { triggers } from './triggers'
import { idleCosts } from './idle-costs'
import { questions, questionById, questionsFor, questionsForTask } from './questions'
// Cards are derived from the service content — see ./cards.
import { cards, cardById, cardsFor } from './cards'
import { labs, labById } from './labs'
import { decisionTrees, treeById } from './decision-trees'

export * from './schema'
export { phases, triggers, idleCosts, questions, questionById, questionsFor, questionsForTask }
export { cards, cardById, cardsFor }
export { labs, labById }
export { decisionTrees, treeById }

/* ── Certs, domains, tasks ───────────────────────────────────────────────── */

export {
  certs,
  certById,
  certFor,
  certLabel,
  certShort,
  currentCerts,
  currentCertFor,
  DEFAULT_CERT_ID,
  familyOf,
  familyShort,
  familyLabel,
  inScope,
  scopedFor,
  scopeFilterFor,
  resolveTaskId,
  retirementTarget,
  taskAliasFor,
}

export const domains: Domain[] = certs.flatMap((c) => c.domains)
export const domainById = new Map(domains.map((d) => [d.id, d]))

export const tasks: Task[] = domains.flatMap((d) => d.tasks)
export const taskById = new Map(tasks.map((t) => [t.id, t]))

export function domainsFor(certId: CertId): Domain[] {
  return certById.get(certId)?.domains ?? []
}

export function tasksFor(certId: CertId): Task[] {
  return domainsFor(certId).flatMap((d) => d.tasks)
}

/** The domain a task belongs to. Cheaper and safer than parsing the id. */
export function domainOfTask(taskId: string): Domain | undefined {
  const task = taskById.get(taskId)
  return task ? domainById.get(task.domainId) : undefined
}

/* ── Services ────────────────────────────────────────────────────────────── */

// Exported from the local bindings imported above rather than with
// `export ... from`. Doing both for the same name gives the bundler two paths to
// the same binding, and the one it picks can resolve to undefined at runtime.
export {
  services,
  serviceBySlug,
  service,
  serviceLabel,
  servicesFor,
  servicesByCategory,
  servicesByTier,
}

/* ── Concepts ────────────────────────────────────────────────────────────── */

// Same import-then-export-the-local-binding rule as the services above. Doing
// both for one name gives the bundler two paths to it, and the one it picks can
// resolve to undefined at runtime.
export {
  concepts,
  conceptBySlug,
  concept,
  conceptLabel,
  conceptsFor,
  conceptsByGroup,
  conceptsForService,
}

/** Services a task statement points at, in tier order (core first). */
export function servicesForTask(taskId: string): Service[] {
  const slugs = taskById.get(taskId)?.serviceSlugs ?? []
  return slugs
    .map((s) => serviceBySlug.get(s))
    .filter((s): s is Service => Boolean(s))
    .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name))
}

/** Task statements that reference a service — the reverse index. */
export function tasksForService(slug: string): Task[] {
  return tasks.filter((t) => t.serviceSlugs.includes(slug))
}

/* ── Triggers & phases ───────────────────────────────────────────────────── */

export const triggersFor = (certId: CertId) => scopedFor(triggers, certId)
export const phasesFor = (certId: CertId) => scopedFor(phases, certId)
/** Every step of every phase for a cert, already in the order to do them. */
export const stepsFor = (certId: CertId) => phasesFor(certId).flatMap((p) => p.steps)
export const stepById = new Map(phases.flatMap((p) => p.steps).map((s) => [s.id, s]))
export const phaseById = new Map(phases.map((p) => [p.id, p]))

export const idleCostTotal = idleCosts.reduce((sum, c) => sum + c.usdPerMonth, 0)

/* ── Search ──────────────────────────────────────────────────────────────── */

/**
 * Cheap ranked substring search over services, tasks and triggers. Deliberately
 * not fuzzy: on a 135-service corpus, exact substring plus field weighting beats
 * a fuzzy matcher for both accuracy and bundle size.
 */
export type SearchHit =
  | { kind: 'service'; score: number; service: Service }
  | { kind: 'concept'; score: number; concept: Concept }
  | { kind: 'task'; score: number; task: Task; domain: Domain }
  | { kind: 'trigger'; score: number; trigger: (typeof triggers)[number] }

export function search(rawQuery: string, certId?: CertId, limit = 20): SearchHit[] {
  const q = rawQuery.trim().toLowerCase()
  if (q.length < 2) return []
  const hits: SearchHit[] = []

  for (const s of certId ? servicesFor(certId) : services) {
    const name = s.name.toLowerCase()
    const abbr = s.abbr?.toLowerCase() ?? ''
    let score = 0
    if (abbr === q) score = 120
    else if (name === q || s.slug === q) score = 110
    else if (name.startsWith(q)) score = 90
    else if (name.includes(q)) score = 70
    else if (s.slug.includes(q)) score = 60
    else if (s.oneLiner.toLowerCase().includes(q)) score = 40
    else if (s.whatItIs.toLowerCase().includes(q)) score = 20
    // Core services outrank recognise-only ones on an otherwise equal match.
    if (score) hits.push({ kind: 'service', score: score + (4 - s.tier) * 3, service: s })
  }

  // Concepts score alongside services rather than below them: someone typing
  // "RPO" wants the definition, not the six services that mention it.
  for (const c of certId ? conceptsFor(certId) : concepts) {
    const term = c.term.toLowerCase()
    const abbr = c.abbr?.toLowerCase() ?? ''
    let score = 0
    if (abbr === q) score = 120
    else if (term === q || c.slug === q) score = 110
    else if (c.aka?.some((a) => a.toLowerCase() === q)) score = 100
    else if (term.startsWith(q)) score = 90
    else if (term.includes(q) || c.aka?.some((a) => a.toLowerCase().includes(q))) score = 70
    else if (c.slug.includes(q)) score = 60
    else if (c.oneLiner.toLowerCase().includes(q)) score = 40
    else if (c.keyIdea.toLowerCase().includes(q) || c.whatItIs.toLowerCase().includes(q)) score = 20
    if (score) hits.push({ kind: 'concept', score, concept: c })
  }

  for (const t of certId ? tasksFor(certId) : tasks) {
    const domain = domainById.get(t.domainId)
    if (!domain) continue
    const title = t.title.toLowerCase()
    let score = 0
    if (title.includes(q)) score = 65
    else if ([...t.knowledge, ...t.skills].some((b) => b.toLowerCase().includes(q))) score = 30
    if (score) hits.push({ kind: 'task', score, task: t, domain })
  }

  for (const t of certId ? triggersFor(certId) : triggers) {
    if (t.phrase.toLowerCase().includes(q) || t.means.toLowerCase().includes(q)) {
      hits.push({ kind: 'trigger', score: 55, trigger: t })
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}

/* ── Questions ───────────────────────────────────────────────────────────── */

/** Questions belonging to a domain, resolved through their task statement. */
export function questionsForDomain(domainId: string) {
  const tasksOfDomain = domainById.get(domainId)?.tasks ?? []
  // A domain also owns the questions written against the task statements it
  // absorbed from an earlier version of the same exam. Without this, the first
  // renumbered version would report an empty bank while 142 perfectly good
  // questions sat unused.
  const taskIds = new Set(tasksOfDomain.flatMap((t) => [t.id, ...(t.supersedes ?? [])]))
  return questions.filter((q) => taskIds.has(q.taskId))
}

/**
 * Whether the bank can fill a full domain-weighted paper without repeats. The
 * UI says so plainly rather than quietly handing you a short exam.
 */
export function examCoverage(certId: CertId) {
  const cert = certById.get(certId)
  if (!cert)
    return {
      ok: false,
      total: 0,
      perDomain: [] as { domainId: string; title: string; have: number; need: number }[],
    }
  const total = cert.questionCount
  const perDomain = cert.domains.map((d) => ({
    domainId: d.id,
    title: d.title,
    have: questionsForDomain(d.id).length,
    need: Math.round((d.weight / 100) * total),
  }))
  return { ok: perDomain.every((d) => d.have >= d.need), total, perDomain }
}

/* ── Stats for the dashboard ─────────────────────────────────────────────── */

export function contentStats(certId?: CertId) {
  const pool = certId ? servicesFor(certId) : services
  const conceptPool = certId ? conceptsFor(certId) : concepts
  return {
    services: pool.length,
    concepts: conceptPool.length,
    tier1: pool.filter((s) => s.tier === 1).length,
    tier2: pool.filter((s) => s.tier === 2).length,
    tier3: pool.filter((s) => s.tier === 3).length,
    domains: certId ? domainsFor(certId).length : domains.length,
    tasks: certId ? tasksFor(certId).length : tasks.length,
    triggers: certId ? triggersFor(certId).length : triggers.length,
    keyNumbers:
      pool.reduce((n, s) => n + s.keyNumbers.length, 0) +
      conceptPool.reduce((n, c) => n + c.keyNumbers.length, 0),
    examTraps:
      pool.reduce((n, s) => n + s.examTraps.length, 0) +
      conceptPool.reduce((n, c) => n + c.examTraps.length, 0),
    questions: certId ? questionsFor(certId).length : questions.length,
    steps: certId ? stepsFor(certId).length : phases.flatMap((p) => p.steps).length,
  }
}
