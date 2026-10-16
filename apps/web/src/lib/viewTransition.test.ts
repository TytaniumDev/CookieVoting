import { afterEach, expect, it, vi } from 'vitest'
import { withViewTransition } from './viewTransition.ts'

afterEach(() => {
  Reflect.deleteProperty(document, 'startViewTransition')
})

it('runs the update inside a view transition where supported', () => {
  const startViewTransition = vi.fn<(update: () => void) => void>((update) => update())
  Object.defineProperty(document, 'startViewTransition', {
    value: startViewTransition,
    configurable: true,
  })
  const update = vi.fn<() => void>()
  withViewTransition(update)
  expect(startViewTransition).toHaveBeenCalledOnce()
  expect(update).toHaveBeenCalledOnce()
})

it('runs the update straight away elsewhere', () => {
  const update = vi.fn<() => void>()
  withViewTransition(update)
  expect(update).toHaveBeenCalledOnce()
})
