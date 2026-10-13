import { expect, test } from '@playwright/test'

// Data comes from firebase/scripts/seed.ts. Each test gets a fresh browser context, so
// a fresh anonymous voter.

test('a voter ranks every category and submits once', async ({ page }) => {
  await page.goto('/event/bake-off-2025')
  await expect(page.getByRole('heading', { name: 'Christmas Cookie Bake-Off 2025' })).toBeVisible()
  await page.getByRole('button', { name: 'Start voting' }).click()

  const categories = ['Gingerbread People', 'Stars', 'Candy Canes', 'Stockings', 'Trees', 'Cats']
  for (const [i, name] of categories.entries()) {
    await expect(page.getByRole('heading', { name })).toBeVisible()
    await expect(page.getByText(`Category ${i + 1} of ${categories.length}`)).toBeVisible()
    const next = page.getByRole('button', { name: /next category|review my votes/i })
    // Every category needs all three picks (owner decision Q3).
    await page.getByRole('button', { name: 'Cookie 3', exact: true }).click()
    await page.getByRole('button', { name: 'Cookie 1', exact: true }).click()
    await expect(next).toBeDisabled()
    await page.getByRole('button', { name: 'Cookie 2', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Cookie 3, your 1st pick' })).toBeVisible()
    await next.click()
  }

  await expect(page.getByRole('heading', { name: 'Check your votes' })).toBeVisible()
  await expect(page.getByRole('img', { name: '1st place' })).toHaveCount(categories.length)
  // Change one: back to Stars, swap the 3rd pick.
  await page.getByRole('button', { name: 'Change Stars' }).click()
  await page.getByRole('button', { name: 'Cookie 2, your 3rd pick' }).click()
  await page.getByRole('button', { name: 'Cookie 4', exact: true }).click()
  for (let i = 1; i < categories.length - 1; i++) {
    await page.getByRole('button', { name: /next category/i }).click()
  }
  await page.getByRole('button', { name: 'Review my votes' }).click()

  await page.getByRole('button', { name: 'Submit my votes' }).click()
  await expect(page.getByRole('heading', { name: 'Thanks for voting!' })).toBeVisible()

  // Same device later: still voted, no second ballot.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Thanks for voting!' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start voting' })).toBeHidden()
})

test('voting carries on after results open', async ({ page }) => {
  // Bake-off 2024 has results open; voting continues and the banner links to results.
  await page.goto('/event/bake-off-2024')
  await expect(page.getByText('Results are open')).toBeVisible()
  await page.getByRole('button', { name: 'Start voting' }).click()
  await expect(page.getByText('0 of 3 picked')).toBeVisible()
})

test('swiping moves between categories once the picks are in', async ({ page }) => {
  test.skip(!test.info().project.use.hasTouch, 'Swipes are for touch screens')
  await page.goto('/event/bake-off-2025')
  await page.getByRole('button', { name: 'Start voting' }).click()
  const swipe = async (fromX: number, toX: number) => {
    const section = page.getByRole('region', { name: /gingerbread people|stars/i })
    const box = (await section.boundingBox())!
    const at = (x: number) => ({
      pointerType: 'touch',
      pointerId: 7,
      clientX: box.x + x,
      clientY: box.y + 40,
      bubbles: true,
    })
    await section.dispatchEvent('pointerdown', at(fromX))
    await section.dispatchEvent('pointerup', at(toX))
  }
  await swipe(300, 50)
  // Not yet: no picks.
  await expect(page.getByRole('heading', { name: 'Gingerbread People' })).toBeVisible()
  for (const n of [1, 2, 3]) {
    await page.getByRole('button', { name: `Cookie ${n}`, exact: true }).click()
  }
  await swipe(300, 50)
  await expect(page.getByRole('heading', { name: 'Stars' })).toBeVisible()
  await swipe(50, 300)
  await expect(page.getByRole('heading', { name: 'Gingerbread People' })).toBeVisible()
})

test('voting not open yet', async ({ page }) => {
  await page.goto('/event/holiday-party-2026')
  await expect(page.getByText(/voting isn't open yet/i)).toBeVisible()
})

test('unknown events say so', async ({ page }) => {
  await page.goto('/event/no-such-event')
  await expect(page.getByRole('status').filter({ hasText: 'Event not found' })).toBeVisible()
})
