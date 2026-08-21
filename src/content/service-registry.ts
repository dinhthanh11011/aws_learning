import type { CategoryId, CertId, Service, Tier } from './schema'
import { CATEGORY_IDS } from './schema'
import { inScope } from './cert-registry'
import { computeServices } from './services/compute'
import { containerServices } from './services/containers'
import { serverlessServices } from './services/serverless'
import { storageServices } from './services/storage'
import { databaseServices } from './services/database'
import { networkServices } from './services/network'
import { securityServices } from './services/security'
import { appIntegrationServices } from './services/appint'
import { analyticsServices } from './services/analytics'
import { mgmtServices } from './services/mgmt'
import { devToolServices } from './services/devtools'
import { frontendServices } from './services/frontend'
import { miscServices } from './services/misc'

/**
 * The service corpus, aggregated here rather than in the top-level barrel so
 * that derived content (cards) can import it without a circular dependency.
 *
 * Deliberately not `services/index.ts`: a directory index that the barrel also
 * re-exports confuses the bundler's module graph, and the failure mode is an
 * unhelpful "module factory is not available" at runtime.
 */
export const services: Service[] = [
  ...computeServices,
  ...containerServices,
  ...serverlessServices,
  ...storageServices,
  ...databaseServices,
  ...networkServices,
  ...securityServices,
  ...appIntegrationServices,
  ...analyticsServices,
  ...mgmtServices,
  ...devToolServices,
  ...frontendServices,
  ...miscServices,
].sort((a, b) => a.name.localeCompare(b.name))

export const serviceBySlug = new Map(services.map((s) => [s.slug, s]))

export function service(slug: string): Service | undefined {
  return serviceBySlug.get(slug)
}

/** Short label for dense canvases — falls back to a trimmed name. */
export function serviceLabel(s: Service): string {
  return s.abbr ?? s.name.replace(/^(Amazon|AWS)\s+/, '')
}

export function servicesFor(certId: CertId): Service[] {
  return services.filter((s) => inScope(s, certId))
}

export function servicesByCategory(certId?: CertId): Map<CategoryId, Service[]> {
  const pool = certId ? servicesFor(certId) : services
  const out = new Map<CategoryId, Service[]>()
  for (const id of CATEGORY_IDS) {
    const inCat = pool.filter((s) => s.category === id)
    if (inCat.length) out.set(id, inCat)
  }
  return out
}

export function servicesByTier(tier: Tier, certId?: CertId): Service[] {
  return (certId ? servicesFor(certId) : services).filter((s) => s.tier === tier)
}
