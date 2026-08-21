import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'

/**
 * The story reader's two persistence claims, which are the parts a learner
 * notices when they break: a chapter tick survives a reload, and it survives the
 * export/import round trip that is the only backup this app has.
 *
 * Dynamically imported because the db module builds its Dexie instance at module
 * scope, the same reason `upgrade.test.ts` does it.
 */
describe('story chapter persistence', () => {
  beforeEach(async () => {
    const { db } = await import('.')
    if (!db.isOpen()) await db.open()
    await db.storyChapters.clear()
  })

  it('records a tick as a row and an untick as a delete', async () => {
    const { db } = await import('.')
    const { setChapterRead, allStoryChapters } = await import('./repo')

    await setChapterRead('startup-saa-c1', true)
    expect((await allStoryChapters()).map((r) => r.chapterId)).toEqual(['startup-saa-c1'])

    // Row presence *is* the tick, so unticking must remove the row rather than
    // leave a `read: false` that a later query would have to know to ignore.
    await setChapterRead('startup-saa-c1', false)
    expect(await db.storyChapters.count()).toBe(0)
  })

  it('is idempotent, so a double click does not duplicate', async () => {
    const { setChapterRead, allStoryChapters } = await import('./repo')
    await setChapterRead('startup-saa-c2', true)
    await setChapterRead('startup-saa-c2', true)
    expect(await allStoryChapters()).toHaveLength(1)
  })

  it('survives the export/import round trip', async () => {
    const { setChapterRead, exportAll, importAll } = await import('./repo')
    const { db } = await import('.')

    await setChapterRead('startup-saa-c3', true)
    const backup = await exportAll()
    expect(backup.storyChapters?.map((r) => r.chapterId)).toEqual(['startup-saa-c3'])

    await db.storyChapters.clear()
    const result = await importAll(backup)
    expect(result.ok).toBe(true)
    expect((await db.storyChapters.toArray()).map((r) => r.chapterId)).toEqual(['startup-saa-c3'])
  })

  it('restores an older backup that predates the story reader', async () => {
    const { exportAll, importAll } = await import('./repo')
    const { db } = await import('.')
    const backup = await exportAll()
    // A backup taken before this table existed simply has no key for it, and
    // importing it must not throw.
    delete backup.storyChapters
    const result = await importAll(backup)
    expect(result.ok).toBe(true)
    expect(await db.storyChapters.count()).toBe(0)
  })
})
