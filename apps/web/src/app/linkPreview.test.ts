/// <reference types="node" />
// Reads index.html and public/ from disk, so this test needs Node's fs.
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Link previews come from index.html alone: crawlers don't run the app.
const webDir = join(import.meta.dirname, '../../')
const html = readFileSync(`${webDir}index.html`, 'utf8')
const doc = new DOMParser().parseFromString(html, 'text/html')
const meta = (key: string) =>
  doc.querySelector(`meta[property="${key}"], meta[name="${key}"]`)?.getAttribute('content')

/** A PNG's width and height, from its IHDR chunk. */
function pngSize(path: string) {
  const bytes = readFileSync(path)
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

describe('link preview tags', () => {
  it('describe the app for Open Graph and Twitter cards', () => {
    expect(meta('og:title')).toBe('Cookie Voting')
    expect(meta('og:description')).toBeTruthy()
    expect(meta('twitter:card')).toBe('summary_large_image')
  })

  it('point og:image at an absolute URL of a 1200×630 PNG in public/', () => {
    const image = new URL(meta('og:image') ?? '')
    expect(image.protocol).toBe('https:')
    expect(pngSize(`${webDir}public${image.pathname}`)).toEqual({ width: 1200, height: 630 })
    expect(meta('og:image:width')).toBe('1200')
    expect(meta('og:image:height')).toBe('630')
  })

  it('link icons that exist', () => {
    const touch = doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href') ?? ''
    expect(pngSize(`${webDir}public${touch}`)).toEqual({ width: 180, height: 180 })
    const icon = doc.querySelector('link[rel="icon"]')?.getAttribute('href') ?? ''
    expect(existsSync(`${webDir}public${icon}`)).toBe(true)
  })
})
