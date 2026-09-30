import { expect, test } from '@playwright/test'

test('voter link opens the voting page', async ({ page }) => {
  await page.goto('/event/demo-event')
  await expect(page.getByRole('heading', { name: /let's vote/i })).toBeVisible()
})

test('unknown routes show the 404 page', async ({ page }) => {
  await page.goto('/definitely-not-a-page')
  await expect(page.getByRole('heading', { name: /crumbs/i })).toBeVisible()
})
