import { describe, it, expect } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { questions } from '@/content'
import { QuestionCard } from './QuestionCard'

/**
 * The only component test in the repo, and it earns its place: the whole bank
 * is authored with the correct option first, so if the shuffle stops reaching
 * the rendered list every question becomes answerable by picking A. That is not
 * visible from an engine test.
 */
const q = questions.find((x) => x.type === 'single' && x.options.length === 4)!

const optionTexts = () =>
  screen.getAllByRole('button', { pressed: false }).map((b) => b.textContent ?? '')

describe('QuestionCard option order', () => {
  it('does not render the correct option first for every question', () => {
    const singles = questions.filter((x) => x.type === 'single')
    let firstIsCorrect = 0
    for (const question of singles.slice(0, 60)) {
      render(
        <QuestionCard
          question={question}
          chosen={[]}
          onChoose={() => {}}
          revealed
          shuffleSeed="session-abc"
        />,
      )
      // With `revealed`, the correct option is the one carrying its `why`.
      const first = screen.getAllByRole('button')[0]
      if (first.textContent?.includes(question.options.find((o) => o.correct)!.text)) {
        firstIsCorrect += 1
      }
      cleanup()
    }
    expect(firstIsCorrect).toBeLessThan(30)
  })

  it('labels options A, B, C… by position, not by content id', () => {
    render(
      <QuestionCard
        question={q}
        chosen={[]}
        onChoose={() => {}}
        revealed={false}
        shuffleSeed="s1"
      />,
    )
    const letters = screen
      .getAllByRole('button')
      .map((b) => b.textContent?.[0])
      .filter((c) => c && /[A-Z]/.test(c))
    expect(letters).toEqual(['A', 'B', 'C', 'D'])
    cleanup()
  })

  it('renders the same order for the same seed and a different one otherwise', () => {
    render(
      <QuestionCard
        question={q}
        chosen={[]}
        onChoose={() => {}}
        revealed={false}
        shuffleSeed="s1"
      />,
    )
    const first = optionTexts()
    cleanup()
    render(
      <QuestionCard
        question={q}
        chosen={[]}
        onChoose={() => {}}
        revealed={false}
        shuffleSeed="s1"
      />,
    )
    expect(optionTexts()).toEqual(first)
    cleanup()

    const orders = new Set<string>()
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      render(
        <QuestionCard
          question={q}
          chosen={[]}
          onChoose={() => {}}
          revealed={false}
          shuffleSeed={seed}
        />,
      )
      orders.add(optionTexts().join('|'))
      cleanup()
    }
    expect(orders.size).toBeGreaterThan(1)
  })
})
