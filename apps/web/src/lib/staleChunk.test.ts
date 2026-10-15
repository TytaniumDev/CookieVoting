import { describe, expect, it, vi } from 'vitest'
import { isChunkLoadError, loadChunk, reloadOnce } from './staleChunk.ts'

function memoryStorage() {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  }
}

describe('isChunkLoadError', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://x/assets/AdminHomePage-Cg3K8Ayn.js',
    'error loading dynamically imported module: https://x/assets/a.js',
    'Importing a module script failed.',
    'Unable to preload CSS for /assets/a.css',
  ])('recognises %s', (message) => {
    expect(isChunkLoadError(new TypeError(message))).toBe(true)
  })

  it('ignores other errors', () => {
    expect(isChunkLoadError(new Error('permission-denied'))).toBe(false)
    expect(isChunkLoadError('Failed to fetch dynamically imported module')).toBe(false)
  })
})

describe('reloadOnce', () => {
  it('reloads the first time', () => {
    const reload = vi.fn<() => void>()
    expect(reloadOnce(memoryStorage(), reload, 1_000_000)).toBe(true)
    expect(reload).toHaveBeenCalledOnce()
  })

  it("doesn't loop when the reload didn't help", () => {
    const storage = memoryStorage()
    const reload = vi.fn<() => void>()
    reloadOnce(storage, reload, 1_000_000)
    expect(reloadOnce(storage, reload, 1_005_000)).toBe(false)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('reloads again after a later deploy', () => {
    const storage = memoryStorage()
    const reload = vi.fn<() => void>()
    reloadOnce(storage, reload, 1_000_000)
    expect(reloadOnce(storage, reload, 5_000_000)).toBe(true)
    expect(reload).toHaveBeenCalledTimes(2)
  })
})

describe('loadChunk', () => {
  const stale = new TypeError('Failed to fetch dynamically imported module: /assets/a.js')

  it('returns the module', async () => {
    await expect(loadChunk(async () => 'page')).resolves.toBe('page')
  })

  it('reloads instead of failing when the chunk is gone', async () => {
    const reload = vi.fn<() => boolean>(() => true)
    let settled = false
    void loadChunk(() => Promise.reject(stale), reload).finally(() => (settled = true))
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(reload).toHaveBeenCalledOnce()
    expect(settled).toBe(false)
  })

  it('fails when reloading already did not help', async () => {
    await expect(
      loadChunk(
        () => Promise.reject(stale),
        () => false,
      ),
    ).rejects.toBe(stale)
  })

  it('fails on other errors without reloading', async () => {
    const reload = vi.fn<() => boolean>(() => true)
    const error = new Error('boom')
    await expect(loadChunk(() => Promise.reject(error), reload)).rejects.toBe(error)
    expect(reload).not.toHaveBeenCalled()
  })
})
