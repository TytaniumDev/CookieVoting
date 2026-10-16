import { expect, test, type Locator, type Page } from '@playwright/test'

// Data comes from firebase/scripts/seed.ts: bake-off-2024 has results open and 20 ballots.

/** The results' last slide: every cookie of every category, in one list. */
async function openAllResults(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: '📜 All results' }).click()
  return page.getByRole('region', { name: 'All results' })
}

function cookieRows(page: Page, category: string): Locator {
  return page
    .getByRole('region', { name: 'All results' })
    .getByRole('region', { name: category })
    .getByRole('listitem')
}

async function pointsOf(row: Locator): Promise<number> {
  const match = /(\d+)\s+pts?\b/.exec(await row.innerText())
  if (!match) throw new Error(`No points in: ${await row.innerText()}`)
  return Number(match[1])
}

/** Every cookie's points in a category, added up. */
async function totalPoints(page: Page, category: string): Promise<number> {
  const points = await Promise.all((await cookieRows(page, category).all()).map(pointsOf))
  return points.reduce((sum, p) => sum + p, 0)
}

test('a new vote shows up in the results with Borda points', async ({ page }) => {
  // One project is enough, and running both at once would mix their votes into the totals.
  test.skip(test.info().project.name !== 'mobile', 'Changes shared seed data')
  await page.goto('/event/bake-off-2024/results')
  await expect(page.getByRole('heading', { name: /The results are in/ })).toBeVisible()
  await openAllResults(page)
  await expect(page.getByRole('heading', { name: 'Bakers', exact: true })).toBeVisible()
  await expect(cookieRows(page, 'Gingerbread')).toHaveCount(6)
  const before = await totalPoints(page, 'Gingerbread')

  // Not voted yet: the results offer a way in.
  await page.getByRole('link', { name: /Haven’t voted yet\? Vote now/ }).click()
  await page.getByRole('button', { name: 'Start voting' }).click()
  for (const category of ['Gingerbread', 'Mixed Shapes']) {
    await expect(page.getByRole('heading', { name: category })).toBeVisible()
    for (const [n, place] of [
      [1, '1st'],
      [2, '2nd'],
      [3, '3rd'],
    ] as const) {
      await page.getByRole('button', { name: `Show cookie ${n}`, exact: true }).click()
      await page.getByRole('button', { name: new RegExp(`^${place} place`) }).click()
    }
    await page.getByRole('button', { name: /next category|review my votes/i }).click()
  }
  await page.getByRole('button', { name: 'Submit my votes' }).click()

  // A late voter sees their picks first (read-only now), then opens the results,
  // which update live.
  await expect(page.getByRole('heading', { name: 'Thanks for voting!' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Your picks' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Change / })).toHaveCount(0)
  await page.getByRole('link', { name: 'View results' }).click()
  await expect(page).toHaveURL(/\/event\/bake-off-2024\/results$/)
  await openAllResults(page)
  // Each voter sees the cookies in their own order, so which cookie got which medal
  // isn't known here; the three medals add 3 + 2 + 1 points between them.
  await expect.poll(() => totalPoints(page, 'Gingerbread'), { timeout: 20_000 }).toBe(before + 6)
  await expect(page.getByRole('link', { name: /Vote now/ })).toBeHidden()

  // Coming back to the voting link later goes straight to the results.
  await page.goto('/event/bake-off-2024')
  await expect(page).toHaveURL(/\/event\/bake-off-2024\/results$/)
})

test('the winners are revealed as ornaments, and tapping one shows its votes', async ({ page }) => {
  await page.goto('/event/bake-off-2024/results')
  const slide = page.getByRole('region', { name: 'Gingerbread', exact: true }).first()
  await expect(page.getByText('And the winner is…')).toBeVisible({ timeout: 10_000 })
  // Once the timed reveal is over, every ornament is open and is a button.
  const winner = slide.getByRole('button', { name: /1st place.*See its votes/ }).first()
  await expect(winner).toBeVisible({ timeout: 10_000 })
  // The ornaments sway forever; with reduced motion they hold still to be clicked.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await winner.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText(/How the \d+ voters ranked it/)).toBeVisible()
  await expect(dialog.getByText('Not in their top 3')).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(dialog).toBeHidden()

  // The last slide lists every cookie; each one shows its votes too.
  const all = await openAllResults(page)
  await all
    .getByRole('button', { name: /See its votes/ })
    .first()
    .click()
  await expect(page.getByRole('dialog').getByText('1st place', { exact: true })).toBeVisible()
})

test('tapping a baker lists their cookies, and each cookie shows its votes', async ({ page }) => {
  await page.goto('/event/bake-off-2024/results')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const all = await openAllResults(page)
  const bakers = all.getByRole('region', { name: 'Bakers', exact: true })
  // The Bakers card comes first on All results.
  await expect(all.getByRole('heading').nth(1)).toHaveText('Bakers')
  const top = bakers.getByRole('listitem').first()
  const total = await pointsOf(top)
  await top.getByRole('button', { name: /See their cookies/ }).click()

  const baker = page.getByRole('dialog').filter({ hasText: /of \d+ bakers/ })
  await expect(baker.getByText(`${total} ${total === 1 ? 'pt' : 'pts'} in all`)).toBeVisible()
  // The baker's cookies add up to their total.
  const rows = await baker.getByRole('listitem').all()
  expect(rows.length).toBeGreaterThan(0)
  const points = await Promise.all(rows.map(pointsOf))
  expect(points.reduce((sum, p) => sum + p, 0)).toBe(total)

  // A piece of the points bar names its cookie.
  const piece = baker.getByRole('group').getByRole('button').first()
  await piece.click()
  await expect(baker.getByRole('listitem').first().getByRole('button')).toHaveClass(
    /bg-accent-subtle/,
  )

  // A cookie's votes open on top of the baker's list; closing them goes back to it.
  await baker
    .getByRole('button', { name: /See its votes/ })
    .first()
    .click()
  const votes = page.getByRole('dialog').filter({ hasText: 'Not in their top 3' })
  await expect(votes).toBeVisible()
  await votes.getByRole('button', { name: 'Close' }).click()
  await expect(votes).toBeHidden()
  await expect(baker).toBeVisible()
  await baker.getByRole('button', { name: 'Close' }).click()
  await expect(baker).toBeHidden()
})

test('on a phone the baker pop-up is a bottom sheet that drags down to close', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile', 'Touch drag is for phones')
  await page.goto('/event/bake-off-2024/results')
  const all = await openAllResults(page)
  await all
    .getByRole('region', { name: 'Bakers', exact: true })
    .getByRole('button', { name: /See their cookies/ })
    .first()
    .click()
  const baker = page.getByRole('dialog').filter({ hasText: /of \d+ bakers/ })
  await expect(baker).toBeVisible()
  // Sits on the bottom edge once it has slid up.
  const height = page.viewportSize()!.height
  await expect
    .poll(async () =>
      Math.round((await baker.boundingBox())!.y + (await baker.boundingBox())!.height),
    )
    .toBe(height)

  // Drags from the baker's name, via touch events (Chromium's CDP).
  const cdp = await page.context().newCDPSession(page)
  const name = (await baker.getByRole('heading', { level: 2 }).boundingBox())!
  const drag = async (distance: number) => {
    const x = name.x + 10
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y: name.y }],
    })
    for (let i = 1; i <= 10; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y: name.y + (distance * i) / 10 }],
      })
      await page.waitForTimeout(30)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  // A short pull springs back; a long one closes it.
  await drag(60)
  await page.waitForTimeout(400)
  await expect(baker).toBeVisible()
  await drag(240)
  await expect(baker).toBeHidden()
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
