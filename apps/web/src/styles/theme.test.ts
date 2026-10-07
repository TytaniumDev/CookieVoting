import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast.ts'
import css from './theme.css?raw'

const tokens = new Map(
  [...css.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6});/gi)].map(([, name, hex]) => [
    name as string,
    hex as string,
  ]),
)

function color(name: string): string {
  const hex = tokens.get(name)
  if (!hex) throw new Error(`Missing token --color-${name}`)
  return hex
}

// [foreground, background] pairs that components render. Text needs 4.5:1
// (WCAG AA); UI parts that must be seen (borders, focus ring) need 3:1.
const textPairs: [string, string][] = [
  ['ink', 'background'],
  ['ink', 'surface'],
  ['ink', 'surface-muted'],
  ['ink-muted', 'background'],
  ['ink-muted', 'surface'],
  ['ink-muted', 'surface-muted'],
  ['primary', 'background'],
  ['primary', 'surface'],
  ['primary', 'surface-muted'],
  ['on-primary', 'primary'],
  ['on-primary', 'primary-hover'],
  ['on-primary-subtle', 'primary-subtle'],
  ['secondary', 'surface'],
  ['on-secondary', 'secondary'],
  ['on-secondary', 'secondary-hover'],
  ['on-secondary-subtle', 'secondary-subtle'],
  ['on-accent', 'accent'],
  ['on-accent', 'accent-hover'],
  ['on-accent-subtle', 'accent-subtle'],
  ['danger', 'surface'],
  ['danger', 'background'],
  ['on-danger', 'danger'],
  ['on-danger', 'danger-hover'],
  ['on-danger-subtle', 'danger-subtle'],
  ['on-success', 'success'],
  ['on-success-subtle', 'success-subtle'],
  ['on-warning-subtle', 'warning-subtle'],
  ['on-rank-1', 'rank-1'],
  ['on-rank-2', 'rank-2'],
  ['on-rank-3', 'rank-3'],
]

const uiPairs: [string, string][] = [
  ['border-strong', 'surface'],
  ['border-strong', 'background'],
  ['focus', 'background'],
  ['focus', 'surface'],
  ['primary', 'surface-muted'],
]

describe('theme tokens', () => {
  it.each(textPairs)('text %s on %s meets 4.5:1', (fg, bg) => {
    expect(contrastRatio(color(fg), color(bg))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(uiPairs)('UI %s on %s meets 3:1', (fg, bg) => {
    expect(contrastRatio(color(fg), color(bg))).toBeGreaterThanOrEqual(3)
  })
})
