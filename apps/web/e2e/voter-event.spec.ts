import { expect, test } from '@playwright/test'

// Data comes from firebase/scripts/seed.ts.
test('voter link shows the event from Firestore', async ({ page }) => {
  await page.goto('/event/bake-off-2025')
  await expect(page.getByText('Christmas Cookie Bake-Off 2025')).toBeVisible()
})

test('unknown events say so', async ({ page }) => {
  await page.goto('/event/no-such-event')
  await expect(page.getByRole('status').filter({ hasText: 'Event not found' })).toBeVisible()
})
