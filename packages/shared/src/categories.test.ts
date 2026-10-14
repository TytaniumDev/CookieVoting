import { describe, expect, it } from 'vitest'
import { plateNames, suggestCategoryNames } from './categories.ts'

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

describe('plateNames', () => {
  it('numbers from 1 for a new event', () => {
    expect(plateNames(['Stars'], 2)).toEqual(['Plate 1', 'Plate 2'])
  })

  it('carries on after the highest plate number, whatever the case', () => {
    expect(plateNames(['Plate 1', ' plate  3', 'Plate 2b'], 1)).toEqual(['Plate 4'])
  })

  it('is never suggested for a later event', () => {
    expect(suggestCategoryNames(['Plate 1', 'Plate 1', 'Plates'], [], '')).toEqual(['Plates'])
  })
})
