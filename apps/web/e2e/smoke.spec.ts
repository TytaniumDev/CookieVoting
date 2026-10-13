import { expect, test } from '@playwright/test'

test('unknown routes show the 404 page', async ({ page }) => {
  await page.goto('/definitely-not-a-page')
  await expect(page.getByRole('heading', { name: /crumbs/i })).toBeVisible()
})
