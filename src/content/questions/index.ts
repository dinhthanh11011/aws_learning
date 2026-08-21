import type { CertId, Question } from '../schema'
import { inScope } from '../cert-registry'
import { saaD1Questions } from './saa-d1'
import { saaD2Questions } from './saa-d2'
import { saaD3Questions } from './saa-d3'
import { saaD4Questions } from './saa-d4'
import { dvaQuestions } from './dva'

export const questions: Question[] = [
  ...saaD1Questions,
  ...saaD2Questions,
  ...saaD3Questions,
  ...saaD4Questions,
  ...dvaQuestions,
]

export const questionById = new Map(questions.map((q) => [q.id, q]))

export const questionsFor = (certId: CertId) => questions.filter((q) => inScope(q, certId))

export const questionsForTask = (taskId: string) => questions.filter((q) => q.taskId === taskId)
