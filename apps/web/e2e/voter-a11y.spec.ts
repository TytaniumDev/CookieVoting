import { createRequire } from 'node:module'
import { expect, test, type Page } from '@playwright/test'

// Every voter screen at the PRD's 375 px design width: no axe violations and no
// sideways scrolling. Data comes from firebase/scripts/seed.ts.

const axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js')

test.use({ viewport: { width: 375, height: 740 } })

async function checkScreen(page: Page, name: string) {
  await page.addScriptTag({ path: axePath })
  const violations = (await page.evaluate(
    "axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] }).then((r) => r.violations.map((v) => v.id + ': ' + v.nodes.map((n) => n.target.join(' ')).join(', ')))",
  )) as string[]
  expect(violations, `axe violations on the ${name} screen`).toEqual([])
  expect(
    await page.evaluate('document.documentElement.scrollWidth'),
    `${name} scrolls sideways`,
  ).toBeLessThanOrEqual(375)
}

test('every voter screen is accessible and fits 375 px', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile', 'One viewport is enough')

  await page.goto('/event/bake-off-2025')
  await page.getByRole('button', { name: 'Start voting' }).waitFor()
  await checkScreen(page, 'landing')

  await page.getByRole('button', { name: 'Start voting' }).click()
  for (const [n, place] of [
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
  ] as const) {
    await page.getByRole('button', { name: `Show cookie ${n}`, exact: true }).click()
    await page.getByRole('button', { name: new RegExp(`^${place} place`) }).click()
  }
  await page.getByRole('button', { name: 'Next category →' }).waitFor()
  await checkScreen(page, 'category')

  await page.goto('/event/bake-off-2024/results')
  // After the timed reveal, the winner's ornament is a button.
  await page
    .getByRole('button', { name: /1st place.*See its votes/ })
    .first()
    .waitFor()
  await checkScreen(page, 'results')
  // The ornaments sway forever; with reduced motion they hold still to be clicked.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page
    .getByRole('button', { name: /1st place.*See its votes/ })
    .first()
    .click()
  await page.getByRole('dialog').waitFor()
  await checkScreen(page, 'cookie votes')
  await page.getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: '📜 All results' }).click()
  await page.getByRole('heading', { name: 'Bakers', exact: true }).waitFor()
  await checkScreen(page, 'all results')
  await page
    .getByRole('button', { name: /See their cookies/ })
    .first()
    .click()
  await page
    .getByRole('dialog')
    .getByText(/of \d+ bakers/)
    .waitFor()
  await checkScreen(page, 'baker cookies')
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()

  await page.emulateMedia({ reducedMotion: null })
  await page.goto('/event/holiday-party-2026/results')
  await page.getByRole('heading', { name: "The results aren't out yet" }).waitFor()
  await checkScreen(page, 'results not out yet')

  await page.goto('/event/holiday-party-2026')
  await page.getByText("Voting isn't open yet").waitFor()
  await checkScreen(page, 'voting not open')

  await page.goto('/nope')
  await page.getByRole('heading', { name: 'Crumbs!' }).waitFor()
  await checkScreen(page, 'not found')
})
