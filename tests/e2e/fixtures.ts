/**
 * Playwright fixtures and helper functions for E2E tests
 */

import { test as base, type Page } from '@playwright/test';

/**
 * Extended test context with authenticated page
 */
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to home page
    await page.goto('/');
    
    // Click "Sign in with Test User" button
    const signInButton = page.getByRole('button', { name: /sign in with test user/i });
    await signInButton.click();
    
    // Wait for redirect to /admin
    await page.waitForURL('**/admin', { timeout: 10000 });
    
    // Verify we're on the admin page
    await page.waitForSelector('h1:has-text("Create Voting Event")', { timeout: 5000 });
    
    // Use the authenticated page
    // eslint-disable-next-line react-hooks/rules-of-hooks -- 'use' is a Playwright fixture, not a React hook
    await use(page);
  },
});

/**
 * Helper to create an event via UI
 */
export async function createEventViaUI(page: Page, eventName: string): Promise<string> {
  // Fill in event name
  const eventNameInput = page.getByPlaceholder(/event name/i);
  await eventNameInput.fill(eventName);
  
  // Submit form
  const createButton = page.getByRole('button', { name: /create event/i });
  await createButton.click();
  
  // Wait for navigation to event dashboard
  await page.waitForURL(/\/admin\/[^/]+$/, { timeout: 10000 });
  
  // Extract event ID from URL
  const url = page.url();
  const eventIdMatch = url.match(/\/admin\/([^/]+)$/);
  if (!eventIdMatch) {
    throw new Error('Could not extract event ID from URL');
  }
  
  return eventIdMatch[1];
}

/**
 * Helper to delete an event via UI
 */
export async function deleteEventViaUI(page: Page, eventName: string): Promise<void> {
  // Navigate to admin home if not already there
  if (!page.url().includes('/admin') || page.url().includes('/admin/')) {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  }
  
  // Find the event card
  const eventCard = page.locator(`text=${eventName}`).locator('..').locator('..');
  
  // Click delete button
  const deleteButton = eventCard.getByRole('button', { name: /delete/i });
  await deleteButton.click();
  
  // Confirm deletion in modal
  const confirmButton = page.getByRole('button', { name: /^delete$/i });
  await confirmButton.click();
  
  // Wait for event to be removed (check for "Deleting..." state to disappear)
  await page.waitForTimeout(500); // Wait for fade-out animation
}

/**
 * Helper to wait for navigation
 */
export async function waitForNavigation(page: Page, urlPattern: string | RegExp, timeout: number = 10000): Promise<void> {
  if (typeof urlPattern === 'string') {
    await page.waitForURL(urlPattern, { timeout });
  } else {
    await page.waitForURL(urlPattern, { timeout });
  }
}

/**
 * Helper to get event status from dashboard
 */
export async function getEventStatus(page: Page): Promise<'voting' | 'completed'> {
  const statusText = await page.locator('text=/status:/i').textContent();
  if (statusText?.includes('Voting Open')) {
    return 'voting';
  } else if (statusText?.includes('Voting Closed')) {
    return 'completed';
  }
  throw new Error('Could not determine event status');
}

/**
 * Helper to toggle event status via UI
 */
export async function toggleEventStatus(page: Page): Promise<'voting' | 'completed'> {
  // Find the status toggle button
  const toggleButton = page.getByRole('button', { name: /close voting|reopen voting/i });
  await toggleButton.click();
  
  // Wait for status to update
  await page.waitForTimeout(500);
  
  // Return new status
  return await getEventStatus(page);
}

