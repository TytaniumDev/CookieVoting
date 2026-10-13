import { expect, test, type Locator, type Page } from '@playwright/test'

// Data comes from firebase/scripts/seed.ts: bake-off-2024 has results open and 20 ballots.

function cookieRow(page: Page, category: string, cookie: number): Locator {
  return page
    .getByRole('region', { name: category })
    .getByRole('listitem')
    .filter({ has: page.getByText(`Cookie #${cookie}`, { exact: true }) })
}

async function pointsOf(row: Locator): Promise<number> {
  const match = /(\d+)\s+pts?\b/.exec(await row.innerText())
  if (!match) throw new Error(`No points in: ${await row.innerText()}`)
  return Number(match[1])
}

test('a new vote shows up in the results with Borda points', async ({ page }) => {
  // One project is enough, and running both at once would mix their votes into the totals.
  test.skip(test.info().project.name !== 'mobile', 'Changes shared seed data')
  await page.goto('/event/bake-off-2024/results')
  await expect(page.getByRole('heading', { name: 'Results 🏆' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Top bakers' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Gingerbread' }).getByRole('listitem')).toHaveCount(
    6,
  )
  const before = await Promise.all(
    [1, 2, 3].map((n) => pointsOf(cookieRow(page, 'Gingerbread', n))),
  )

  await page.goto('/event/bake-off-2024')
  await page.getByRole('button', { name: 'Start voting' }).click()
  for (const category of ['Gingerbread', 'Mixed Shapes']) {
    await expect(page.getByRole('heading', { name: category })).toBeVisible()
    for (const n of [1, 2, 3]) {
      await page.getByRole('button', { name: `Cookie ${n}`, exact: true }).click()
    }
    await page.getByRole('button', { name: /next category|review my votes/i }).click()
  }
  await page.getByRole('button', { name: 'Submit my votes' }).click()

  // Voters who have voted go straight to the results, which update live.
  await expect(page).toHaveURL(/\/event\/bake-off-2024\/results$/)
  for (const [i, gain] of [3, 2, 1].entries()) {
    await expect
      .poll(() => pointsOf(cookieRow(page, 'Gingerbread', i + 1)), { timeout: 20_000 })
      .toBe(before[i]! + gain)
  }
})

test('results say when they are not out yet', async ({ page }) => {
  await page.goto('/event/bake-off-2025/results')
  await expect(page.getByRole('heading', { name: "The results aren't out yet" })).toBeVisible()
  await page.getByRole('link', { name: 'Go vote' }).click()
  await expect(page.getByRole('button', { name: 'Start voting' })).toBeVisible()

  await page.goto('/event/holiday-party-2026/results')
  await expect(page.getByRole('heading', { name: "The results aren't out yet" })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Go vote' })).toBeHidden()
})

test('results for an unknown event say so', async ({ page }) => {
  await page.goto('/event/no-such-event/results')
  await expect(page.getByText('Event not found')).toBeVisible()
})
