import type { SVGProps } from 'react'

/**
 * Inline SVG icons rather than unicode glyphs: the glyph coverage for symbols
 * like ⑃ and ⚿ varies by platform and font, so half of them silently render as
 * a box or a circle. These always look the same.
 */

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
})

export const IconTarget = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="8" cy="8" r="6" />
    <circle cx="8" cy="8" r="2.25" />
  </svg>
)

export const IconLayers = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M8 1.75 14 5 8 8.25 2 5z" />
    <path d="M2.5 8.4 8 11.4l5.5-3" />
    <path d="M2.5 11.4 8 14.4l5.5-3" />
  </svg>
)

export const IconRoute = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="3.75" cy="12.25" r="1.75" />
    <circle cx="12.25" cy="3.75" r="1.75" />
    <path d="M3.75 10.5V6.25A2.5 2.5 0 0 1 6.25 3.75h4.25" />
    <path d="M12.25 5.5v4.25a2.5 2.5 0 0 1-2.5 2.5H5.5" />
  </svg>
)

export const IconList = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5.5 4h8M5.5 8h8M5.5 12h8" />
    <path d="M2.5 4h.01M2.5 8h.01M2.5 12h.01" />
  </svg>
)

export const IconKey = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="5" cy="5" r="2.75" />
    <path d="m7 7 6.5 6.5M11 11l-1.5 1.5M13.5 8.5 12 10" />
  </svg>
)

export const IconBranch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M8 2v3.5" />
    <path d="M8 5.5 4 9v4.5M8 5.5 12 9v4.5" />
    <circle cx="8" cy="2.25" r="1.25" />
    <circle cx="4" cy="13.75" r="1.25" />
    <circle cx="12" cy="13.75" r="1.25" />
  </svg>
)

export const IconRefresh = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M13.5 8a5.5 5.5 0 1 1-1.9-4.15" />
    <path d="M13.75 2v3.25H10.5" />
  </svg>
)

export const IconWrench = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M10.2 2.3a3.5 3.5 0 0 0 3.5 5.8l-8 8a1.75 1.75 0 0 1-2.5-2.5l8-8a3.5 3.5 0 0 1-1-3.3z" />
  </svg>
)

export const IconPaper = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="1.75" width="10" height="12.5" rx="1.5" />
    <path d="M5.75 5h4.5M5.75 8h4.5M5.75 11h2.5" />
  </svg>
)

export const IconChart = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M2.25 13.75h11.5" />
    <path d="M4.5 11V7M8 11V3.5M11.5 11V8.75" />
  </svg>
)

export const IconSliders = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 3v10M8 3v10M13 3v10" />
    <circle cx="3" cy="6" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="8" cy="10" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="13" cy="5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
)

export const IconExternal = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9 2h5v5M14 2 7.5 8.5" />
    <path d="M12 9.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3.5" />
  </svg>
)

export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m3 8.5 3.5 3.5L13 4.5" />
  </svg>
)

export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="7" cy="7" r="4.25" />
    <path d="m10.25 10.25 3.25 3.25" />
  </svg>
)

export const ICONS = {
  target: IconTarget,
  layers: IconLayers,
  route: IconRoute,
  list: IconList,
  key: IconKey,
  branch: IconBranch,
  refresh: IconRefresh,
  wrench: IconWrench,
  paper: IconPaper,
  chart: IconChart,
  sliders: IconSliders,
  external: IconExternal,
  check: IconCheck,
  search: IconSearch,
} as const

export type IconName = keyof typeof ICONS
