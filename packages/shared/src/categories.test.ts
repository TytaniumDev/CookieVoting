import { describe, expect, it } from 'vitest'
import { suggestCategoryNames } from './categories.ts'

const past = [
  'Gingerbread',
  'Sugar Cookies',
  'gingerbread',
  'Stars',
  'Gingerbread',
  'Sugar cookies',
  'Bars',
]

describe('suggestCategoryNames', () => {
  it('ranks names by how often they were used, ignoring case', () => {
    expect(suggestCategoryNames(past, [], '')).toEqual([
      'Gingerbread',
      'Sugar cookies',
      'Bars',
      'Stars',
    ])
  })

  it('shows the most common spelling', () => {
    expect(suggestCategoryNames(past, [], 'ginger')).toEqual(['Gingerbread'])
  })

  it("leaves out names the event already has and those that don't match", () => {
    expect(suggestCategoryNames(past, ['  gingerbread '], 's')).toEqual([
      'Sugar cookies',
      'Bars',
      'Stars',
    ])
  })

  it('caps the number of suggestions', () => {
    expect(suggestCategoryNames(past, [], '', 2)).toHaveLength(2)
  })
})
