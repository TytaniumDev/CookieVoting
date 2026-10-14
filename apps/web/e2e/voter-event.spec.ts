import { expect, test, type Page } from '@playwright/test'

// Data comes from firebase/scripts/seed.ts. Each test gets a fresh browser context, so
// a fresh anonymous voter.

/** Shows `cookie` (by its thumbnail) and gives it the medal for `place` ('1st', '2nd', '3rd'). */
async function giveMedal(page: Page, cookie: number, place: string) {
  await page.getByRole('button', { name: new RegExp(`^Show cookie ${cookie}\\b`) }).click()
  await page
    .getByRole('group', { name: `Give cookie ${cookie} a medal` })
    .getByRole('button', { name: new RegExp(`^${place} place`) })
    .click()
}

test('a voter ranks every category and submits once', async ({ page }) => {
  await page.goto('/event/bake-off-2025')
  await expect(page.getByRole('heading', { name: 'Christmas Cookie Bake-Off 2025' })).toBeVisible()
  await page.getByRole('button', { name: 'Start voting' }).click()

  const categories = ['Gingerbread People', 'Stars', 'Candy Canes', 'Stockings', 'Trees', 'Cats']
  for (const [i, name] of categories.entries()) {
    await expect(page.getByRole('heading', { name })).toBeVisible()
    await expect(page.getByText(`Category ${i + 1} of ${categories.length}`)).toBeVisible()
    const next = page.getByRole('button', { name: /next category|review my votes|to go on/i })
    // Every category needs all three medals (owner decision Q3), in any order.
    await giveMedal(page, 1, '2nd')
    await giveMedal(page, 3, '1st')
    await expect(next).toBeDisabled()
    await expect(next).toHaveText('Give out 1 more medal to go on')
    await giveMedal(page, 2, '3rd')
    await expect(page.getByRole('button', { name: 'Show cookie 3, your 1st place' })).toBeVisible()
    await next.click()
  }

  await expect(page.getByRole('heading', { name: 'Check your votes' })).toBeVisible()
  await expect(page.getByRole('img', { name: '1st place' })).toHaveCount(categories.length)
  // Change one: back to Stars, move the 3rd place medal to cookie 4.
  await page.getByRole('button', { name: 'Change Stars' }).click()
  await giveMedal(page, 4, '3rd')
  await expect(page.getByRole('button', { name: 'Show cookie 2', exact: true })).toBeVisible()
  for (let i = 1; i < categories.length - 1; i++) {
    await page.getByRole('button', { name: /next category/i }).click()
  }
  await page.getByRole('button', { name: 'Review my votes' }).click()

  await page.getByRole('button', { name: 'Submit my votes' }).click()
  // The waiting room: one of three scenes at random, then the voter's picks.
  await expect(page.getByRole('heading', { name: 'Your picks' })).toBeVisible()
  await expect(page.getByRole('img', { name: '1st place' })).toHaveCount(categories.length)

  // Same device later: still voted, no second ballot.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Your picks' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start voting' })).toBeHidden()
})

test('a voter changes a category from the waiting room', async ({ page }) => {
  await page.goto('/event/bake-off-2025')
  await page.getByRole('button', { name: 'Start voting' }).click()
  const categories = ['Gingerbread People', 'Stars', 'Candy Canes', 'Stockings', 'Trees', 'Cats']
  for (const name of categories) {
    await expect(page.getByRole('heading', { name })).toBeVisible()
    await giveMedal(page, 1, '1st')
    await giveMedal(page, 2, '2nd')
    await giveMedal(page, 3, '3rd')
    await page.getByRole('button', { name: /next category|review my votes/i }).click()
  }
  await page.getByRole('button', { name: 'Submit my votes' }).click()
  // The review screen has a "Change Stars" too; wait for the waiting room.
  await expect(page.getByRole('heading', { name: 'Your picks' })).toBeVisible()

  const stars = page.getByRole('button', { name: 'Change Stars' })
  await expect(stars.getByRole('img', { name: 'Cookie 4' })).toBeHidden()
  await stars.click()
  await expect(page.getByText('Change your picks')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Stars' })).toBeVisible()
  // The sent picks are there to change: move 3rd place to cookie 4.
  await expect(page.getByRole('button', { name: 'Show cookie 3, your 3rd place' })).toBeVisible()
  await giveMedal(page, 4, '3rd')
  // Saving goes straight back to the waiting room: the ballot's start page never flashes
  // up while the change is on its way to the server.
  await page.evaluate(`
    new MutationObserver(() => {
      const buttons = [...document.querySelectorAll('button')]
      if (buttons.some((b) => b.textContent === 'Start voting')) {
        document.body.dataset.flashedBallot = 'true'
      }
    }).observe(document.body, { childList: true, subtree: true })
  `)
  await page.getByRole('button', { name: 'Save my picks' }).click()

  await expect(page.getByRole('heading', { name: 'Your picks' })).toBeVisible()
  await expect(page.locator('body')).not.toHaveAttribute('data-flashed-ballot', 'true')
  await expect(
    page.getByRole('button', { name: 'Change Stars' }).getByRole('img', { name: 'Cookie 4' }),
  ).toBeVisible()
  // Saved on the server, not just on screen.
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Change Stars' }).getByRole('img', { name: 'Cookie 4' }),
  ).toBeVisible()

  // Back leaves a category unchanged.
  await page.getByRole('button', { name: 'Change Trees' }).click()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Your picks' })).toBeVisible()
})

test('voting carries on after results open', async ({ page }) => {
  // Bake-off 2024 has results open; voting continues and the banner links to results.
  await page.goto('/event/bake-off-2024')
  await expect(page.getByText('Results are open')).toBeVisible()
  await page.getByRole('button', { name: 'Start voting' }).click()
  await expect(page.getByRole('button', { name: 'Give out all 3 medals to go on' })).toBeDisabled()
})

test('scrolling the photo moves between cookies', async ({ page }) => {
  await page.goto('/event/bake-off-2025')
  await page.getByRole('button', { name: 'Start voting' }).click()
  await expect(page.getByRole('group', { name: 'Give cookie 1 a medal' })).toBeVisible()
  // The photos are a snapping row that scrolls sideways (a swipe on phones); the
  // thumbnails and medal buttons follow it. Arrow keys scroll it the same way.
  await page.getByRole('region', { name: 'Cookies' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('group', { name: 'Give cookie 2 a medal' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Show cookie 2' })).toHaveAttribute(
    'aria-current',
    'true',
  )
  await page.getByRole('button', { name: 'Next cookie' }).click()
  await expect(page.getByRole('group', { name: 'Give cookie 3 a medal' })).toBeVisible()
  await page.getByRole('button', { name: 'Previous cookie' }).click()
  await expect(page.getByRole('group', { name: 'Give cookie 2 a medal' })).toBeVisible()
})

test('voting not open yet', async ({ page }) => {
  await page.goto('/event/holiday-party-2026')
  await expect(page.getByText(/voting isn't open yet/i)).toBeVisible()
})

test('unknown events say so', async ({ page }) => {
  await page.goto('/event/no-such-event')
  await expect(page.getByRole('status').filter({ hasText: 'Event not found' })).toBeVisible()
})
