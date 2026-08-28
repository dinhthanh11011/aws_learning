import type { CertId, Question } from '../schema'
import { inScope } from '../cert-registry'
import { saaD1Questions } from './saa-d1'
import { saaD2Questions } from './saa-d2'
import { saaD3Questions } from './saa-d3'
import { saaD4Questions } from './saa-d4'
/**
 * DVA-C02. A build-and-debug paper, not an architecture paper — it wants the
 * specific setting, the specific API call, the specific error. Lambda and
 * DynamoDB carry most of the weight.
 */
import { dvaD1Questions } from './dva-d1'
import { dvaD2Questions } from './dva-d2'
import { dvaD3Questions } from './dva-d3'
import { dvaD4Questions } from './dva-d4'

export const questions: Question[] = [
  ...saaD1Questions,
  ...saaD2Questions,
  ...saaD3Questions,
  ...saaD4Questions,
  ...dvaD1Questions,
  ...dvaD2Questions,
  ...dvaD3Questions,
  ...dvaD4Questions,
]

export const questionById = new Map(questions.map((q) => [q.id, q]))

export const questionsFor = (certId: CertId) => questions.filter((q) => inScope(q, certId))

export const questionsForTask = (taskId: string) => questions.filter((q) => q.taskId === taskId)
