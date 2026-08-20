'use client'
import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { CATEGORIES, decisionTrees, serviceBySlug, serviceLabel, type DecisionTree } from '@/content'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { serviceLinkProps } from '@/components/service/ServiceRef'

export function DecisionTreeView() {
  const profile = useProfile()
  const trees = decisionTrees.filter((t) => t.certs.includes(profile.targetCert))
  const [activeId, setActiveId] = useState(trees[0]?.id ?? '')
  const tree = trees.find((t) => t.id === activeId) ?? trees[0]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {trees.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-[13px] transition-colors',
              t.id === activeId
                ? 'border-accent/40 bg-accent-soft font-medium text-accent'
                : 'border-border text-fg-muted hover:border-border-strong hover:text-fg',
            )}
          >
            {t.title}
          </button>
        ))}
      </div>
      {tree ? <Walker key={tree.id} tree={tree} /> : null}
    </div>
  )
}

/**
 * Walks the tree one question at a time rather than showing it all at once.
 * The point is to rehearse the *path* — the exam gives you a requirement and
 * expects you to arrive at the answer, not to recognise a diagram.
 */
function Walker({ tree }: { tree: DecisionTree }) {
  const reduce = useReducedMotion()
  const [path, setPath] = useState<string[]>([tree.rootId])
  const currentId = path[path.length - 1]
  const current = tree.nodes.find((n) => n.id === currentId)!

  const choose = (next: string) => setPath([...path, next])
  const back = () => setPath(path.slice(0, -1))
  const restart = () => setPath([tree.rootId])

  return (
    <div className="flex flex-col gap-4">
      <div className="surface p-5">
        <p className="text-[13px] italic text-fg-subtle">{tree.question}</p>

        {/* Breadcrumb of the reasoning so far. */}
        {path.length > 1 ? (
          <ol className="mt-3 flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
            {path.slice(0, -1).map((id, i) => {
              const node = tree.nodes.find((n) => n.id === id)
              if (!node || node.kind !== 'question') return null
              const chosen = node.answers.find((a) => a.next === path[i + 1])
              return (
                <li key={id} className="flex items-center gap-1.5 text-[11.5px] text-fg-subtle">
                  {i > 0 ? <span aria-hidden>→</span> : null}
                  <span className="rounded bg-bg-inset px-1.5 py-0.5">{chosen?.label}</span>
                </li>
              )
            })}
          </ol>
        ) : null}

        <AnimatePresence mode="wait">
          {current.kind === 'question' ? (
            <motion.div
              key={current.id}
              initial={reduce ? undefined : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: -12 }}
              className="mt-4"
            >
              <h3 className="text-[16px] font-semibold tracking-tight">{current.prompt}</h3>
              {current.hint ? (
                <p className="mt-1 text-[12.5px] text-fg-subtle">{current.hint}</p>
              ) : null}
              <ul className="mt-3 flex flex-col gap-2">
                {current.answers.map((a) => (
                  <li key={a.next + a.label}>
                    <button
                      onClick={() => choose(a.next)}
                      className="w-full rounded-xl border border-border bg-bg-inset p-3 text-left text-[13.5px] transition-colors hover:border-accent hover:bg-bg-overlay"
                    >
                      {a.label}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : (
            <motion.div
              key={current.id}
              initial={reduce ? undefined : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4"
            >
              <Answer node={current} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex gap-2 border-t border-border pt-3">
          <Button size="sm" variant="ghost" disabled={path.length === 1} onClick={back}>
            ← Back
          </Button>
          <Button size="sm" variant="ghost" onClick={restart}>
            Start again
          </Button>
        </div>
      </div>

      {tree.matrix ? (
        <div className="surface overflow-hidden p-0">
          <h3 className="border-b border-border px-4 py-3 text-[14px] font-semibold tracking-tight">
            Side by side
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 font-semibold">Service</th>
                  {tree.matrix.columns.map((c) => (
                    <th key={c} className="px-4 py-2 font-semibold">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tree.matrix.rows.map((r) => {
                  const svc = serviceBySlug.get(r.slug)
                  return (
                    <tr key={r.slug} className="border-b border-border last:border-0">
                      <td className="px-4 py-2">
                        {svc ? (
                          <a
                            {...serviceLinkProps(svc.slug)}
                            className="inline-flex items-center gap-1.5 font-medium hover:text-accent"
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: CATEGORIES[svc.category].token }}
                              aria-hidden
                            />
                            {serviceLabel(svc)}
                          </a>
                        ) : (
                          r.slug
                        )}
                      </td>
                      {r.cells.map((c, i) => (
                        <td key={i} className="px-4 py-2 text-fg-muted">
                          {c}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Answer({
  node,
}: {
  node: Extract<DecisionTree['nodes'][number], { kind: 'answer' }>
}) {
  const svc = serviceBySlug.get(node.slug)
  return (
    <div className="rounded-xl border border-ok/40 bg-ok-soft p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="ok">Answer</Badge>
        <h3 className="text-[17px] font-semibold tracking-tight">{node.headline}</h3>
      </div>
      <p className="mt-2 text-[14px] leading-relaxed">{node.because}</p>
      {node.watchOut ? (
        <p className="mt-3 border-t border-border pt-3 text-[13.5px] leading-relaxed text-warn">
          <strong className="font-semibold">Watch out:</strong> {node.watchOut}
        </p>
      ) : null}
      {svc ? (
        <a
          {...serviceLinkProps(svc.slug)}
          className="mt-3 inline-block text-[13px] font-medium text-accent hover:underline"
        >
          Open the {svc.name} card →
        </a>
      ) : null}
    </div>
  )
}
