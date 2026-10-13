import { expect, test, type Page } from '@playwright/test'

// Data comes from firebase/scripts/seed.ts; admin@example.com is on the admin list.
async function signInAs(page: Page, email: string) {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible()
  // Emulator builds expose this helper (src/lib/auth.ts) instead of the Google popup.
  await page.evaluate(
    (e) =>
      (
        globalThis as unknown as { signInForTests: (email: string) => Promise<void> }
      ).signInForTests(e),
    email,
  )
}

test('people who are not admins are turned away', async ({ page }) => {
  await signInAs(page, 'grinch@example.com')
  await expect(page.getByText('Not on the admin list')).toBeVisible()
  await page.getByRole('button', { name: /sign out/i }).click()
  await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible()
})

test('an admin creates an event and manages its bakers', async ({ page }, testInfo) => {
  const eventName = `E2E Bake-Off ${testInfo.project.name} ${Date.now()}`
  const newBaker = `Zed ${testInfo.project.name} ${Date.now()}`

  await signInAs(page, 'admin@example.com')
  await expect(page.getByRole('heading', { name: 'Your events' })).toBeVisible()
  await expect(page.getByRole('link', { name: /christmas cookie bake-off 2025/i })).toBeVisible()

  await page.getByRole('link', { name: 'New event' }).click()
  await page.getByLabel('Event name').fill(eventName)
  await page.getByRole('button', { name: 'Create event' }).click()

  await expect(page.getByRole('heading', { name: eventName })).toBeVisible()
  await expect(page.getByRole('button', { name: /^bakers/i })).toHaveAttribute(
    'aria-current',
    'step',
  )

  // Add an existing baker from the global list.
  await page.getByLabel('Name').fill('ann')
  await page.getByRole('button', { name: 'Add Ann' }).click()
  await expect(page.getByRole('button', { name: 'Remove Ann' })).toBeVisible()

  // Create a brand-new baker.
  await page.getByLabel('Name').fill(newBaker)
  await page.getByRole('button', { name: `Create “${newBaker}”` }).click()
  await expect(page.getByRole('button', { name: `Remove ${newBaker}` })).toBeVisible()

  // Remove one from the event.
  await page.getByRole('button', { name: 'Remove Ann' }).click()
  await expect(page.getByRole('button', { name: 'Remove Ann' })).toBeHidden()

  // The dashboard shows the next step.
  await page.getByRole('link', { name: /all events/i }).click()
  await expect(page.getByRole('link', { name: new RegExp(eventName) })).toContainText(
    'Next: Categories',
  )
})

test('an admin adds categories with plate photos', async ({ page }, testInfo) => {
  const eventName = `E2E Categories ${testInfo.project.name} ${Date.now()}`
  await signInAs(page, 'admin@example.com')
  await page.getByRole('link', { name: 'New event' }).click()
  await page.getByLabel('Event name').fill(eventName)
  await page.getByRole('button', { name: 'Create event' }).click()
  await page.getByRole('button', { name: /^categories/i }).click()
  // The stepper scrolls sideways on phones; the page itself must not.
  expect(await page.evaluate('document.documentElement.scrollWidth')).toBeLessThanOrEqual(
    page.viewportSize()?.width ?? 0,
  )

  // A name typed by hand, and one suggested from past events (seeded).
  await page.getByLabel('Category name').fill('Thumbprints')
  await page.getByRole('button', { name: 'Add category' }).click()
  await page.getByRole('button', { name: '+ Candy Canes' }).click()
  const headings = page.getByRole('list', { name: 'Categories' }).getByRole('heading')
  await expect(headings).toHaveText(['Thumbprints', 'Candy Canes'])

  // Upload a real 12 MP phone photo; it's shrunk and stored, then shown.
  await page
    .getByLabel('Add photo for Thumbprints')
    .setInputFiles('../../fixtures/plates/5-cookies_PXL_20251215_000827596.jpg')
  await expect(page.getByRole('button', { name: /replace photo for thumbprints/i })).toBeAttached()
  await expect(page.getByText('Needs a photo', { exact: true })).toHaveCount(1)

  // Reorder with the keyboard: lift Candy Canes, move it up, drop.
  // dnd-kit announces each step in a live region; wait for it so keys aren't dropped.
  const announcer = page.locator('[id^="DndLiveRegion"]')
  await page.getByRole('button', { name: 'Reorder Candy Canes' }).focus()
  await page.keyboard.press('Space')
  await expect(announcer).toContainText('Candy Canes moved to position 2')
  await page.keyboard.press('ArrowUp')
  await expect(announcer).toContainText('Candy Canes moved to position 1')
  await page.keyboard.press('Space')
  await expect(announcer).toContainText('Candy Canes dropped at position 1')
  await expect(headings).toHaveText(['Candy Canes', 'Thumbprints'])
  await page.reload()
  await expect(headings).toHaveText(['Candy Canes', 'Thumbprints'])

  // Delete asks first.
  await page.getByRole('button', { name: 'Delete Candy Canes' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(headings).toHaveText(['Thumbprints'])
})
