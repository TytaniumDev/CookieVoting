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
