import type { Page } from '@playwright/test'

/**
 * Reloads once the page's Firestore writes have reached the server. The app shows its
 * own writes straight away, so a plain reload can drop one still in flight.
 */
export async function reloadWhenSaved(page: Page) {
  // Emulator builds expose this helper (src/lib/firebase.ts).
  await page.evaluate(() =>
    (globalThis as unknown as { writesSavedForTests: () => Promise<void> }).writesSavedForTests(),
  )
  await page.reload()
}
