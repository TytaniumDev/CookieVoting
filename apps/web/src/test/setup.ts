import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest globals are off, so Testing Library can't unmount between tests by itself.
afterEach(cleanup)

// jsdom has no layout, so no ResizeObserver (AppLayout measures its app bar).
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
