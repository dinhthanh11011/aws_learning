import { CERT_FAMILIES, type Scoped } from '@/content'
import { Badge } from '@/components/ui/Badge'

/**
 * The "which exams is this on" strip, in one place.
 *
 * It used to be a `cert === 'SAA-C03' ? 'SAA' : 'DVA'` ternary copied into four
 * components, which would have labelled a third exam as "DVA" the day one was
 * added. Content is tagged by family now, so the label comes from the family
 * table and a new family needs no change here.
 *
 * A `versionScope` override is shown rather than hidden: the learner is
 * studying for one specific paper, so "not on C04" is exactly the sort of thing
 * they should not have to discover in the exam.
 */
export function FamilyBadges({ item }: { item: Scoped }) {
  return (
    <>
      {item.families.map((family) => (
        <Badge key={family} title={CERT_FAMILIES[family].label}>
          {CERT_FAMILIES[family].short}
        </Badge>
      ))}
      {item.versionScope ? (
        <Badge tone="warn" title={item.versionScope.note}>
          {item.versionScope.onlyIn
            ? `${item.versionScope.onlyIn.join(', ')} only`
            : `not on ${item.versionScope.notIn!.join(', ')}`}
        </Badge>
      ) : null}
    </>
  )
}
