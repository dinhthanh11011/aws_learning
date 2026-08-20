import type { Phase } from './schema'

/**
 * The learning path. Weeks and hours assume ~6 hours per week, which is what
 * the plan generator scales from — if you tell it 10 hours a week, the same
 * phases compress rather than change shape.
 *
 * The order is deliberate: SAA before DVA, because SAA teaches the
 * architectural vocabulary (Multi-AZ, decoupling, DR patterns, the shared
 * responsibility line) that DVA assumes you already have.
 */
export const phases: Phase[] = [
  {
    id: 'phase-0',
    index: 0,
    title: 'Foundations',
    purpose:
      'The four things every VPC and security question reduces to: CIDR arithmetic, DNS resolution, the IAM evaluation model, and a safely configured account. Skip these and everything after is a list of terms.',
    weekFrom: 1,
    weekTo: 2,
    hours: 12,
    certs: ['SAA-C03', 'DVA-C02'],
    exitCriteria: [
      'You can subnet a /16 into /24s and say how many usable addresses each has, without a calculator',
      'You can trace a DNS query from browser to origin and name what each step returns',
      'You can state the IAM evaluation order and predict the outcome of a deny/allow conflict',
      'Root MFA is on, an admin identity exists, and a $10 budget alarm is configured',
    ],
    taskIds: ['saa-1.1', 'saa-1.2'],
    lessonIds: [],
    labIds: ['iam-puzzle'],
  },
  {
    id: 'phase-1',
    index: 1,
    title: 'Core Services',
    purpose:
      'The ~15 services that carry most of both exams, in dependency order: identity, network, compute, storage, database, load balancing, then decoupling. Breadth is a trap here — depth on these fifteen beats familiarity with fifty.',
    weekFrom: 3,
    weekTo: 12,
    hours: 60,
    certs: ['SAA-C03'],
    exitCriteria: [
      'You can reproduce every decision rule (which database, which storage, which compute) from memory',
      'You have built IAM, VPC, EC2, S3, RDS and an ALB at least once each',
      'You can explain stateful versus stateless filtering without looking it up',
    ],
    taskIds: [
      'saa-1.1',
      'saa-1.2',
      'saa-1.3',
      'saa-2.1',
      'saa-2.2',
      'saa-3.1',
      'saa-3.2',
      'saa-3.3',
      'saa-3.4',
    ],
    lessonIds: [],
    labIds: ['vpc-builder', 'iam-puzzle', 'storage-cost'],
  },
  {
    id: 'phase-2',
    index: 2,
    title: 'Build & Break',
    purpose:
      'Reading produces recognition; building produces recall — and the exam tests recall under time pressure with four plausible answers. Breaking things deliberately is the highest-value step, because most questions are "this is broken, why?" rather than "what is this?".',
    weekFrom: 13,
    weekTo: 16,
    hours: 28,
    certs: ['SAA-C03'],
    exitCriteria: [
      "You have built and torn down every lab, and passed each one's break-it challenge",
      'You can predict the exact failure symptom from a missing route, a missing permission, or a too-short visibility timeout',
      'You can rebuild a three-tier VPC from an empty canvas without hints',
    ],
    taskIds: ['saa-1.2', 'saa-2.1', 'saa-2.2', 'saa-3.4', 'saa-4.4'],
    lessonIds: [],
    labIds: ['vpc-builder', 'request-racer', 'az-drill', 'storage-cost', 'iam-puzzle'],
  },
  {
    id: 'phase-3',
    index: 3,
    title: 'SAA Exam Prep',
    purpose:
      'Diagnostic first, then repair the gaps it finds, then drill. Reviewing a practice exam properly — writing why each distractor is wrong, including on questions you got right — is worth more than taking another one.',
    weekFrom: 17,
    weekTo: 21,
    hours: 30,
    certs: ['SAA-C03'],
    exitCriteria: [
      'You score 80%+ on a full exam you have never seen before',
      'Your mistake log shows no service appearing three or more times',
      'You can articulate why each wrong option is wrong, not only why the right one is right',
    ],
    taskIds: ['saa-4.1', 'saa-4.2', 'saa-4.3', 'saa-4.4', 'saa-3.5'],
    lessonIds: [],
    labIds: [],
  },
  {
    id: 'phase-4',
    index: 4,
    title: 'DVA Delta & Prep',
    purpose:
      'About 60% of DVA overlaps with what you already know, so this phase is the delta: Lambda internals, API Gateway specifics, DynamoDB data modelling, Cognito, CI/CD and observability. Take it within four to six weeks of SAA, while the overlap is still fresh.',
    weekFrom: 22,
    weekTo: 29,
    hours: 48,
    certs: ['DVA-C02'],
    exitCriteria: [
      'You can design DynamoDB keys and indexes for a stated access pattern, and say why a scan would be wrong',
      'You can name every Lambda configuration knob and what it changes',
      'You have built a pipeline that deploys with a canary and rolls back on an alarm',
      'You score 80%+ on a full DVA exam you have never seen before',
    ],
    taskIds: [
      'dva-1.1',
      'dva-1.2',
      'dva-1.3',
      'dva-2.1',
      'dva-2.2',
      'dva-2.3',
      'dva-3.1',
      'dva-3.2',
      'dva-3.3',
      'dva-3.4',
      'dva-4.1',
      'dva-4.2',
      'dva-4.3',
    ],
    lessonIds: [],
    labIds: ['ddb-keys', 'event-wiring'],
  },
]
