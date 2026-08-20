import type { Cert, CertId, Domain, Service, Task } from './schema'
import { saaC03 } from './certs/saa-c03'
import { dvaC02 } from './certs/dva-c02'
import {
  service,
  serviceBySlug,
  serviceLabel,
  services,
  servicesByCategory,
  servicesByTier,
  servicesFor,
} from './service-registry'
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

export const certs: Cert[] = [saaC03, dvaC02]

export const certById = new Map<CertId, Cert>(certs.map((c) => [c.id, c]))

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

export const triggersFor = (certId: CertId) => triggers.filter((t) => t.certs.includes(certId))
export const phasesFor = (certId: CertId) => phases.filter((p) => p.certs.includes(certId))
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
  const taskIds = new Set(domainById.get(domainId)?.tasks.map((t) => t.id) ?? [])
  return questions.filter((q) => taskIds.has(q.taskId))
}

/**
 * Whether the bank can fill a full domain-weighted paper without repeats. The
 * UI says so plainly rather than quietly handing you a short exam.
 */
export function examCoverage(certId: CertId) {
  const cert = certById.get(certId)
  if (!cert) return { ok: false, total: 0, perDomain: [] as { domainId: string; title: string; have: number; need: number }[] }
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
  return {
    services: pool.length,
    tier1: pool.filter((s) => s.tier === 1).length,
    tier2: pool.filter((s) => s.tier === 2).length,
    tier3: pool.filter((s) => s.tier === 3).length,
    domains: certId ? domainsFor(certId).length : domains.length,
    tasks: certId ? tasksFor(certId).length : tasks.length,
    triggers: certId ? triggersFor(certId).length : triggers.length,
    keyNumbers: pool.reduce((n, s) => n + s.keyNumbers.length, 0),
    examTraps: pool.reduce((n, s) => n + s.examTraps.length, 0),
    questions: certId ? questionsFor(certId).length : questions.length,
  }
}
