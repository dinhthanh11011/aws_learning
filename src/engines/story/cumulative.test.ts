import { describe, expect, it } from 'vitest'
import type { Story } from '@/content/schema'
import { clampIndex, nextChapter, storyProgress, visibleAt } from './cumulative'

/**
 * A three-chapter fixture rather than the real story: the fold is what is under
 * test, and asserting against authored content would make these tests fail
 * every time a chapter is reworded.
 */
const story: Story = {
  slug: 'fix',
  title: 'Fixture',
  premise: 'A test.',
  families: ['saa'],
  architecture: {
    id: 'arch',
    cols: 12,
    rows: 6,
    nodes: [
      { id: 'ec2', label: 'EC2', kind: 'service', x: 1, y: 1, w: 2, h: 1 },
      { id: 'alb', label: 'ALB', kind: 'service', x: 4, y: 1, w: 2, h: 1 },
      { id: 'rds', label: 'RDS', kind: 'service', x: 7, y: 1, w: 2, h: 1 },
    ],
    edges: [
      { id: 'e1', from: 'alb', to: 'ec2', tone: 'default' },
      { id: 'e2', from: 'ec2', to: 'rds', tone: 'default' },
    ],
    groups: [
      { id: 'vpc', label: 'VPC', kind: 'vpc', nodeIds: ['ec2', 'alb', 'rds'] },
      { id: 'az', label: 'AZ', kind: 'az', nodeIds: ['ec2'], parent: 'vpc' },
    ],
    steps: [],
  },
  chapters: [
    {
      id: 'fix-c1',
      title: 'One box',
      pain: 'Nothing yet.',
      minutes: 10,
      taskId: 'saa-1.1',
      serviceSlugs: [],
      conceptSlugs: [],
      adds: { nodeIds: ['ec2'], edgeIds: [], groupIds: [] },
      decision: {
        situation: 's',
        prompt: 'p',
        options: [
          { slug: 'ec2', correct: true, why: 'w' },
          { slug: 'rds', correct: false, why: 'w' },
          { slug: 'alb', correct: false, why: 'w' },
        ],
      },
      sections: [{ kind: 'prose', md: 'x' }],
      checks: [],
    },
    {
      id: 'fix-c2',
      title: 'The box dies',
      pain: 'One box, one failure.',
      minutes: 20,
      taskId: 'saa-1.2',
      serviceSlugs: [],
      conceptSlugs: [],
      adds: { nodeIds: ['alb'], edgeIds: ['e1'], groupIds: ['vpc', 'az'] },
      decision: {
        situation: 's',
        prompt: 'p',
        options: [
          { slug: 'alb', correct: true, why: 'w' },
          { slug: 'rds', correct: false, why: 'w' },
          { slug: 'ec2', correct: false, why: 'w' },
        ],
      },
      sections: [{ kind: 'prose', md: 'x' }],
      checks: [],
    },
    {
      id: 'fix-c3',
      title: 'State',
      pain: 'Sessions on disk.',
      minutes: 30,
      taskId: 'saa-1.3',
      serviceSlugs: [],
      conceptSlugs: [],
      adds: { nodeIds: ['rds'], edgeIds: ['e2'], groupIds: [] },
      decision: {
        situation: 's',
        prompt: 'p',
        options: [
          { slug: 'rds', correct: true, why: 'w' },
          { slug: 'alb', correct: false, why: 'w' },
          { slug: 'ec2', correct: false, why: 'w' },
        ],
      },
      sections: [{ kind: 'prose', md: 'x' }],
      checks: [],
    },
  ],
}

const ids = (v: { node: { id: string } }[]) => v.map((n) => n.node.id)

describe('visibleAt', () => {
  it('shows only the first chapter’s additions at chapter 0', () => {
    const v = visibleAt(story, 0)
    expect(ids(v.nodes)).toEqual(['ec2'])
    expect(v.edges).toHaveLength(0)
    expect(v.groups).toHaveLength(0)
  })

  it('accumulates rather than replacing', () => {
    expect(ids(visibleAt(story, 1).nodes)).toEqual(['ec2', 'alb'])
    expect(ids(visibleAt(story, 2).nodes)).toEqual(['ec2', 'alb', 'rds'])
  })

  it('marks only the current chapter’s additions as new', () => {
    const v = visibleAt(story, 1)
    expect(v.nodes.find((n) => n.node.id === 'ec2')!.state).toBe('settled')
    expect(v.nodes.find((n) => n.node.id === 'alb')!.state).toBe('new')
    expect(v.edges.find((e) => e.edge.id === 'e1')!.state).toBe('new')
    expect(v.groups.every((g) => g.state === 'new')).toBe(true)
  })

  it('reveals the whole architecture by the last chapter', () => {
    const v = visibleAt(story, story.chapters.length - 1)
    expect(v.nodes).toHaveLength(story.architecture.nodes.length)
    expect(v.edges).toHaveLength(story.architecture.edges.length)
    expect(v.groups).toHaveLength(story.architecture.groups.length)
  })

  it('never shows an empty group — it holds a node or a visible child group', () => {
    // A Region legitimately appears before any of its *own* nodes, because its
    // content can sit in a child group (Region → VPC → subnet). So the rule is
    // "has something in it", not "has a direct node".
    for (let i = 0; i < story.chapters.length; i += 1) {
      const v = visibleAt(story, i)
      const shownNodes = new Set(ids(v.nodes))
      const shownGroups = new Set(v.groups.map((g) => g.group.id))
      for (const { group } of v.groups) {
        const hasNode = group.nodeIds.some((id) => shownNodes.has(id))
        const hasChild = v.groups.some((g) => g.group.parent === group.id)
        expect(hasNode || hasChild).toBe(true)
        if (group.parent) expect(shownGroups.has(group.parent)).toBe(true)
      }
    }
  })

  it('clamps out-of-range indexes instead of throwing', () => {
    expect(ids(visibleAt(story, 99).nodes)).toEqual(['ec2', 'alb', 'rds'])
    expect(ids(visibleAt(story, -5).nodes)).toEqual(['ec2'])
    expect(clampIndex(story, Number.NaN)).toBe(0)
  })
})

describe('storyProgress', () => {
  it('weights by minutes as well as counting', () => {
    const p = storyProgress(story, new Set(['fix-c1', 'fix-c3']))
    expect(p).toEqual({ done: 2, total: 3, minutes: 60, minutesDone: 40 })
  })

  it('is zero-done on a fresh start', () => {
    expect(storyProgress(story, new Set()).done).toBe(0)
  })
})

describe('nextChapter', () => {
  it('returns the first unread chapter in order', () => {
    expect(nextChapter(story, new Set())!.chapter.id).toBe('fix-c1')
    expect(nextChapter(story, new Set(['fix-c1']))!.position).toBe(2)
  })

  it('does not skip ahead past a gap', () => {
    // Reading chapter 3 early must not mark chapter 2 as the wrong next step.
    expect(nextChapter(story, new Set(['fix-c1', 'fix-c3']))!.chapter.id).toBe('fix-c2')
  })

  it('returns null once every chapter is read', () => {
    expect(nextChapter(story, new Set(['fix-c1', 'fix-c2', 'fix-c3']))).toBeNull()
  })
})
