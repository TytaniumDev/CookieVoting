import { expect, test } from '@playwright/test'

test('unknown routes show the 404 page', async ({ page }) => {
  await page.goto('/definitely-not-a-page')
  await expect(page.getByRole('heading', { name: /crumbs/i })).toBeVisible()
})

test('the web app manifest is linked and served, for Add to Home Screen', async ({
  page,
  request,
}) => {
  await page.goto('/event/bake-off-2025')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  const manifest = (await (await request.get(href ?? '')).json()) as Record<string, unknown>
  expect(manifest).toMatchObject({ name: 'Cookie Voting', display: 'standalone' })
  // No start_url: a voter's home-screen icon opens the event they added it from.
  expect(manifest).not.toHaveProperty('start_url')
})
