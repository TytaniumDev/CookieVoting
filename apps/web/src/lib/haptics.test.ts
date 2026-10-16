import { afterEach, expect, it, vi } from 'vitest'
import { buzz } from './haptics.ts'

afterEach(() => {
  Reflect.deleteProperty(navigator, 'vibrate')
})

it('buzzes where the browser can vibrate', () => {
  const vibrate = vi.fn<(ms: number) => boolean>(() => true)
  Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
  buzz()
  expect(vibrate).toHaveBeenCalledWith(15)
})

it('does nothing where it cannot (iOS Safari)', () => {
  expect(() => buzz()).not.toThrow()
})
