'use client'
import { useEffect, useRef } from 'react'
import { openService } from '@/lib/service-peek'

/**
 * Binds "s" to the services on screen right now — the ones a question, a card
 * or a decision tree node points at — and cycles through them on repeat
 * presses. One key, no mouse, no lost place: that is the whole interaction for
 * "what is that thing again?" while you are mid-drill.
 */
export function useServicePeekKey(slugs: readonly string[], enabled = true): void {
  const next = useRef(0)
  const list = slugs.join(',')

  useEffect(() => {
    next.current = 0
  }, [list])

  useEffect(() => {
    if (!enabled || !slugs.length) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 's' || e.metaKey || e.ctrlKey || e.altKey) return
      const el = document.activeElement
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el as HTMLElement | null)?.isContentEditable
      ) {
        return
      }
      e.preventDefault()
      openService(slugs[next.current % slugs.length])
      next.current += 1
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, list, slugs])
}
