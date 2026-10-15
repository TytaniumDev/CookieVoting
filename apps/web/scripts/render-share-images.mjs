// Draws the images link previews and home screens use, from the design tokens:
//   public/og-image.png         1200×630 card shown by iMessage, Signal, WhatsApp, Slack…
//   public/apple-touch-icon.png 180×180 icon for iOS (home screen, and iMessage when a
//                               page has no og:image)
//   public/favicon.svg          the browser tab icon
//
// Run after changing the palette or the drawing, then commit the files it writes:
//   npm run share-images -w @cookie-voting/web
// Uses Playwright's Chromium (or CHROMIUM_PATH, see CLAUDE.md).
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const webDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(webDir, 'public')
const require = createRequire(import.meta.url)

/** The --color-* tokens from theme.css, so the images follow a re-skin. */
const tokens = Object.fromEntries(
  [
    ...readFileSync(join(webDir, 'src/styles/theme.css'), 'utf8').matchAll(
      /--color-([\w-]+):\s*(#[0-9a-f]{3,8});/gi,
    ),
  ].map(([, name, value]) => [name, value]),
)
const c = (name) => {
  const value = tokens[name]
  if (!value) throw new Error(`No --color-${name} in theme.css`)
  return value
}

/** Inlined as data URLs: a page set from a string may not load file:// fonts. */
const fontUrl = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(dirname(require.resolve(`${pkg}/package.json`)), 'files', file)).toString('base64')}`

/** The chocolate-chip cookie from Spinner, with its first bite taken. viewBox 0 0 48 48. */
function cookie({ stroke = 2 } = {}) {
  const chips = [
    'M15 15.5c1.4-.8 3 .2 2.8 1.7-.2 1.4-2 2-3 1-.8-.8-.7-2.1.2-2.7z',
    'M27 12c1.3-.5 2.6.6 2.3 1.9-.3 1.2-1.8 1.6-2.7.8-.7-.7-.5-2.3.4-2.7z',
    'M32 24.5c1.5-.5 2.9.8 2.4 2.2-.4 1.2-2.1 1.5-3 .5-.7-.9-.4-2.3.6-2.7z',
    'M20 25c1.2-.6 2.6.3 2.5 1.6-.1 1.3-1.7 1.9-2.6 1-.8-.7-.7-2.1.1-2.6z',
    'M13 30c1.4-.4 2.6.8 2.2 2.1-.4 1.2-2 1.4-2.8.5-.6-.8-.4-2.2.6-2.6z',
    'M25 34c1.3-.5 2.6.5 2.4 1.8-.3 1.3-1.9 1.7-2.8.8-.7-.7-.5-2.2.4-2.6z',
  ]
  return `<defs><mask id="bite" maskUnits="userSpaceOnUse" x="-4" y="-4" width="56" height="56">
      <rect x="-4" y="-4" width="56" height="56" fill="#fff"/>
      <g fill="#000"><circle cx="40" cy="9" r="6"/><circle cx="44" cy="15" r="5"/><circle cx="35" cy="5" r="4.5"/></g>
    </mask></defs>
    <g mask="url(#bite)">
      <circle cx="24" cy="24" r="20" fill="${c('dough')}" stroke="${c('gingerbread-shade')}" stroke-width="${stroke}"/>
      <g fill="${c('ink')}">${chips.map((d) => `<path d="${d}"/>`).join('')}</g>
    </g>`
}

/** Snow dots at fixed, pseudo-random spots so every run draws the same card. */
function snow(width, height, count) {
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  return Array.from({ length: count }, () => {
    const r = 2 + rand() * 4
    return `<circle cx="${(rand() * width).toFixed(1)}" cy="${(rand() * height).toFixed(1)}" r="${r.toFixed(1)}" opacity="${(0.25 + rand() * 0.45).toFixed(2)}"/>`
  }).join('')
}

function medal(rank, cx, cy) {
  return `<g transform="translate(${cx} ${cy})">
      <path d="M-22 -70 L-8 -30 L8 -30 L22 -70 Z" fill="${c('secondary')}"/>
      <path d="M-8 -70 L0 -48 L8 -70 Z" fill="${c('primary-hover')}"/>
      <circle r="38" fill="${c(`rank-${rank}`)}" stroke="${c('snow')}" stroke-width="5"/>
      <text y="16" text-anchor="middle" font-family="Fredoka Variable" font-weight="600" font-size="46" fill="${c(`on-rank-${rank}`)}">${rank}</text>
    </g>`
}

const page = (width, height, body) => `<!doctype html><html><head><style>
  @font-face { font-family: 'Fredoka Variable'; font-weight: 300 700; src: url(${fontUrl('@fontsource-variable/fredoka', 'fredoka-latin-wght-normal.woff2')}) format('woff2'); }
  @font-face { font-family: 'Nunito Variable'; font-weight: 200 1000; src: url(${fontUrl('@fontsource-variable/nunito', 'nunito-latin-wght-normal.woff2')}) format('woff2'); }
  html, body { margin: 0; width: ${width}px; height: ${height}px; overflow: hidden; }
  svg { display: block; }
</style></head><body>${body}</body></html>`

// The link card: the winning cookie on a plate with its gold medal, silver and bronze
// either side. iMessage shows the page title under it and Signal can crop it toward a
// square, so the cookie sits in the middle and the wordmark is a bonus.
const card = page(
  1200,
  630,
  `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="glow" cx="50%" cy="42%" r="45%">
        <stop offset="0" stop-color="${c('glow')}" stop-opacity="0.55"/>
        <stop offset="1" stop-color="${c('glow')}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="${c('primary')}"/>
    <g fill="${c('snow')}">${snow(1200, 630, 90)}</g>
    <circle cx="600" cy="262" r="300" fill="url(#glow)"/>
    <circle cx="600" cy="250" r="168" fill="${c('background')}" stroke="${c('accent')}" stroke-width="10"/>
    <svg x="468" y="118" width="264" height="264" viewBox="0 0 48 48" overflow="visible">${cookie()}</svg>
    ${medal(2, 330, 290)}
    ${medal(3, 870, 290)}
    ${medal(1, 732, 372)}
    <text x="600" y="530" text-anchor="middle" font-family="Fredoka Variable" font-weight="600" font-size="92" fill="${c('on-primary')}">Cookie Voting</text>
    <text x="600" y="584" text-anchor="middle" font-family="Nunito Variable" font-weight="700" font-size="34" fill="${c('accent-subtle')}">Taste, rank your top three, crown the best baker</text>
  </svg>`,
)

// iOS rounds the corners itself and needs an opaque square.
const touchIcon = page(
  180,
  180,
  `<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
    <rect width="180" height="180" fill="${c('primary')}"/>
    <svg x="22" y="22" width="136" height="136" viewBox="0 0 48 48" overflow="visible">${cookie({ stroke: 2.5 })}</svg>
  </svg>`,
)

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${cookie({ stroke: 3 }).replace(/\s*\n\s*/g, '')}</svg>\n`

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
try {
  for (const [file, html, width, height] of [
    ['og-image.png', card, 1200, 630],
    ['apple-touch-icon.png', touchIcon, 180, 180],
  ]) {
    const tab = await browser.newPage({ viewport: { width, height } })
    await tab.setContent(html, { waitUntil: 'load' })
    await tab.evaluate(() => document.fonts.ready)
    await tab.screenshot({ path: join(publicDir, file) })
    await tab.close()
  }
} finally {
  await browser.close()
}
writeFileSync(join(publicDir, 'favicon.svg'), favicon)
console.log('Wrote og-image.png, apple-touch-icon.png and favicon.svg to apps/web/public')
