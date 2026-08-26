import { Fragment, type ReactNode } from 'react'
import { conceptBySlug, serviceBySlug } from '@/content'
import { ConceptRef } from '@/components/service/ConceptRef'
import { ServiceRef } from '@/components/service/ServiceRef'

/**
 * The deliberately tiny inline syntax that lesson and story prose is written
 * in: `**bold**`, `*italic*`, `` `code` ``, `[text](url)` and — the one that
 * earns its keep — `[[slug]]`, which becomes a quick-look reference to a
 * service or concept.
 *
 * `[[slug|text]]` overrides the displayed text. Needed because the default is
 * the service's *short* label, which is the right choice in a chip and the wrong
 * one mid-sentence: `[[security-group]]` renders "SG", and "a SG is a firewall"
 * is not a sentence anybody wrote on purpose.
 *
 * It returns `ReactNode`, not a string, and that is the whole point:
 * `[[slug]]` has to become a real component with a click handler, so there is
 * nothing to inject and `dangerouslySetInnerHTML` never appears.
 *
 * Not a markdown library because this is not markdown — it is five inline
 * constructs over a single paragraph, and block structure is carried by the
 * section kinds instead.
 */

const PATTERN =
  /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*/g

export function formatMd(md: string): ReactNode {
  const out: ReactNode[] = []
  let last = 0
  let key = 0

  for (const m of md.matchAll(PATTERN)) {
    const at = m.index
    if (at > last) out.push(md.slice(last, at))
    last = at + m[0].length

    const [, ref, refLabel, linkText, href, bold, code, italic] = m
    if (ref !== undefined) {
      // Services and concepts share one slug namespace, so which component to
      // use is a lookup rather than something the author has to remember.
      if (serviceBySlug.has(ref)) {
        out.push(<ServiceRef key={key++} slug={ref} label={refLabel} bare />)
      } else if (conceptBySlug.has(ref)) {
        out.push(<ConceptRef key={key++} slug={ref} label={refLabel} bare />)
      } else {
        // Unresolvable: render the slug rather than nothing, so a bad reference
        // is visible in the page instead of silently vanishing. content:check
        // fails on it, so this should never reach a reader.
        out.push(<Fragment key={key++}>{refLabel ?? ref}</Fragment>)
      }
    } else if (linkText !== undefined) {
      out.push(
        <a
          key={key++}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-accent"
        >
          {linkText}
        </a>,
      )
    } else if (bold !== undefined) {
      out.push(<strong key={key++}>{bold}</strong>)
    } else if (code !== undefined) {
      out.push(
        <code key={key++} className="rounded bg-bg-inset px-1 py-0.5 text-[0.9em]">
          {code}
        </code>,
      )
    } else if (italic !== undefined) {
      out.push(<em key={key++}>{italic}</em>)
    }
  }

  if (last < md.length) out.push(md.slice(last))
  return out
}

/** Every `[[slug]]` in a string, for `content:check` to verify they resolve. */
export function refSlugs(md: string): string[] {
  return [...md.matchAll(/\[\[([a-z0-9-]+)(?:\|[^\]]+)?\]\]/g)].map((m) => m[1])
}
