import type { CertId, Lesson } from './schema'
import { inScope } from './cert-registry'
import { securityGroups } from './lessons/security-groups'
import { subnetsAndRouteTables } from './lessons/subnets-and-route-tables'
import { networkAcls } from './lessons/network-acls'
import { whyCantItReachTheInternet } from './lessons/why-cant-it-reach-the-internet'
import { howIamDecides } from './lessons/how-iam-decides'
import { rolesNotKeys } from './lessons/roles-not-keys'
import { kmsAndEnvelopeEncryption } from './lessons/kms-and-envelope-encryption'
import { blockFileObject } from './lessons/block-file-object'
import { s3StorageClasses } from './lessons/s3-storage-classes'
import { s3DurabilityVsAvailability } from './lessons/s3-durability-vs-availability'
import { multiAzVsReadReplica } from './lessons/multi-az-vs-read-replica'
import { rtoRpoAndTheFourDrStrategies } from './lessons/rto-rpo-and-the-four-dr-strategies'
import { whichLoadBalancer } from './lessons/which-load-balancer'
import { lambdaExecutionModel } from './lessons/lambda-execution-model'
import { queueTopicBus } from './lessons/queue-topic-bus'
import { retriesDlqsAndIdempotency } from './lessons/retries-dlqs-and-idempotency'
import { partitionKeys } from './lessons/partition-keys'
import { whereToCache } from './lessons/where-to-cache'
import { payingLessForTheSameThing } from './lessons/paying-less-for-the-same-thing'
import { apiGatewayRequestPath } from './lessons/api-gateway-request-path'
import { userPoolOrIdentityPool } from './lessons/user-pool-or-identity-pool'
import { shippingAChangeSafely } from './lessons/shipping-a-change-safely'
import { metricsTracesAndLogs } from './lessons/metrics-traces-and-logs'

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
  howIamDecides,
  rolesNotKeys,
  kmsAndEnvelopeEncryption,
  blockFileObject,
  s3StorageClasses,
  s3DurabilityVsAvailability,
  multiAzVsReadReplica,
  rtoRpoAndTheFourDrStrategies,
  whichLoadBalancer,
  lambdaExecutionModel,
  queueTopicBus,
  retriesDlqsAndIdempotency,
  partitionKeys,
  whereToCache,
  payingLessForTheSameThing,
  apiGatewayRequestPath,
  userPoolOrIdentityPool,
  shippingAChangeSafely,
  metricsTracesAndLogs,
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
