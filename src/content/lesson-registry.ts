import type { CertId, Lesson } from './schema'
import { inScope } from './cert-registry'
import { securityGroups } from './lessons/security-groups'
import { subnetsAndRouteTables } from './lessons/subnets-and-route-tables'
import { networkAcls } from './lessons/network-acls'
import { whyCantItReachTheInternet } from './lessons/why-cant-it-reach-the-internet'

/**
 * Aggregates the lessons.
 *
 * Named `lesson-registry.ts` rather than `lessons/index.ts` for the same reason
 * the service, concept and story registries are: a directory index that the
 * `@/content` barrel also re-exports breaks Turbopack's module graph, and the
 * runtime error points nowhere near the cause.
 *
 * Not sorted. Lessons are read in the order they are listed, and `requires`
 * carries any ordering that actually matters.
 */
export const lessons: Lesson[] = [
  securityGroups,
  subnetsAndRouteTables,
  whyCantItReachTheInternet,
  networkAcls,
]

export const lessonById = new Map(lessons.map((l) => [l.id, l]))
export const lesson = (id: string): Lesson | undefined => lessonById.get(id)

export const lessonsFor = (certId: CertId): Lesson[] => lessons.filter((l) => inScope(l, certId))

/**
 * The reverse index the atlas needs: which lessons teach this service. Same
 * shape as `conceptsForService`. Cheap enough to scan on every render at this
 * corpus size, and a precomputed map would be one more thing to keep in step.
 */
export function lessonsForService(slug: string): Lesson[] {
  return lessons.filter((l) => l.serviceSlugs.includes(slug))
}
