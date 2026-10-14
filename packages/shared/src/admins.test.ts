import { describe, expect, it } from 'vitest'
import { normaliseEmail } from './admins.ts'

describe('normaliseEmail', () => {
  it('trims and lowercases', () => {
    expect(normaliseEmail('  Mrs.Claus@Gmail.com ')).toBe('mrs.claus@gmail.com')
  })

  it('rejects things that are not email addresses', () => {
    for (const input of [
      '',
      'santa',
      'santa@',
      '@north.pole',
      'santa@northpole',
      'a b@c.d',
      'a/b@c.d',
    ])
      expect(normaliseEmail(input)).toBeNull()
  })
})
