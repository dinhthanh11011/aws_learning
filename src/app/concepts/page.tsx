import { Page } from '@/components/shell/AppShell'
import { CONCEPT_GROUP_META, conceptsByGroup, contentStats } from '@/content'
import { ConceptTile } from '@/components/service/ConceptRef'

export const metadata = { title: 'Concepts · AWS Trainer' }

/**
 * The primitives the exam assumes and the service atlas never defines.
 *
 * Grouped rather than filterable: there are forty of these, not a hundred and
 * forty, and within a group they are ordered so that each one only depends on
 * the ones above it. A filter bar would hide that ordering, which is most of
 * the value.
 */
export default function ConceptsPage() {
  const stats = contentStats()
  const groups = conceptsByGroup()

  return (
    <Page
      title="Concepts"
      lede={
        <>
          The {stats.concepts} primitives the exam assumes you already know — CIDR, subnet, RPO,
          idempotency, the shape of an ARN. None of them is an AWS service, which is why they had no
          home in the Service Atlas and appeared there only as vocabulary. Each group reads top to
          bottom: nothing depends on a term below it.
        </>
      }
    >
      <div className="flex flex-col gap-9">
        {[...groups].map(([id, list]) => {
          const meta = CONCEPT_GROUP_META[id]
          return (
            <section key={id}>
              <div className="mb-3 flex items-baseline gap-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: meta.token }}
                  aria-hidden
                />
                <h2 className="text-[15px] font-semibold tracking-tight">{meta.label}</h2>
                <p className="text-[12.5px] text-fg-subtle">{meta.blurb}</p>
                <span className="nums ml-auto text-[12px] text-fg-subtle">{list.length}</span>
              </div>
              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((c) => (
                  <li key={c.slug} className="contents">
                    <ConceptTile concept={c} />
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </Page>
  )
}
