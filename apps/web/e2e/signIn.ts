import { expect, type Page } from '@playwright/test'

// Data comes from firebase/scripts/seed.ts; admin@example.com and elf@example.com are
// on the admin list.
export async function signInAs(page: Page, email: string) {
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
