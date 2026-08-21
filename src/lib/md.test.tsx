import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { formatMd, refSlugs } from './md'

const html = (md: string) => render(<p>{formatMd(md)}</p>).container.innerHTML

describe('formatMd', () => {
  it('passes plain prose through untouched', () => {
    expect(html('Just words.')).toBe('<p>Just words.</p>')
  })

  it('handles bold, italic and code', () => {
    expect(html('a **b** c')).toContain('<strong>b</strong>')
    expect(html('a *b* c')).toContain('<em>b</em>')
    expect(html('a `b` c')).toContain('<code')
  })

  it('renders an external link that cannot be a tabnabbing vector', () => {
    const out = html('see [docs](https://example.com)')
    expect(out).toContain('href="https://example.com"')
    expect(out).toContain('rel="noreferrer"')
  })

  it('turns [[slug]] into a service reference with a real href', () => {
    expect(html('use [[s3]] for that')).toContain('href="/services/s3"')
  })

  it('turns a concept slug into a concept reference', () => {
    expect(html('a [[cidr]] block')).toContain('href="/concepts/cidr"')
  })

  it('shows the slug rather than nothing when it does not resolve', () => {
    // content:check fails this case, so it is a visible fallback, not a feature.
    expect(html('[[not-a-real-slug]]')).toContain('not-a-real-slug')
  })

  it('does not interpret html in the source', () => {
    expect(html('<script>x</script>')).not.toContain('<script>')
  })

  it('keeps text either side of several constructs in order', () => {
    const out = html('start **b** mid [[s3]] end')
    expect(out).toMatch(/start[\s\S]*<strong>b<\/strong>[\s\S]*mid[\s\S]*s3[\s\S]*end/)
  })
})

describe('refSlugs', () => {
  it('lists every reference so the checker can verify them', () => {
    expect(refSlugs('[[s3]] and [[vpc]] and [[s3]]')).toEqual(['s3', 'vpc', 's3'])
  })
  it('is empty for prose with no references', () => {
    expect(refSlugs('nothing here')).toEqual([])
  })
})
