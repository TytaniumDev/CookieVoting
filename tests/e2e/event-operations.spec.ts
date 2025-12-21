/**
 * E2E browser tests for event operations
 * Tests complete UI flows using Playwright
 */

import { test, expect } from '@playwright/test';
import { createEventViaUI, deleteEventViaUI, toggleEventStatus, getEventStatus } from './fixtures';

test.describe('Event Operations E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page and sign in as test user
    await page.goto('/');
    
    // Click "Sign in with Test User" button
    const signInButton = page.getByRole('button', { name: /sign in with test user/i });
    await signInButton.click();
    
    // Wait for redirect to /admin
    await page.waitForURL('**/admin', { timeout: 10000 });
    
    // Verify we're authenticated and on admin page
    await expect(page.locator('h1')).toContainText('Create Voting Event');
  });

  test('should sign in and redirect to admin page', async ({ page }) => {
    // Test is already signed in via beforeEach
    // Verify we're on the admin page
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('h1')).toContainText('Create Voting Event');
  });

  test('should create an event via UI', async ({ page }) => {
    const eventName = `E2E Test Event - ${Date.now()}`;
    
    // Fill in event name
    const eventNameInput = page.getByPlaceholder(/event name/i);
    await eventNameInput.fill(eventName);
    
    // Submit form
    const createButton = page.getByRole('button', { name: /create event/i });
    await createButton.click();
    
    // Wait for navigation to event dashboard
    await page.waitForURL(/\/admin\/[^/]+$/, { timeout: 10000 });
    
    // Verify we're on the event dashboard
    await expect(page.locator('h1')).toContainText(eventName);
    
    // Verify event appears in the events list when we go back
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${eventName}`)).toBeVisible();
  });

  test('should modify event status via UI', async ({ page }) => {
    const eventName = `E2E Test Event Status - ${Date.now()}`;
    
    // Create event
    await createEventViaUI(page, eventName);
    
    // Verify initial status is 'voting'
    let status = await getEventStatus(page);
    expect(status).toBe('voting');
    
    // Toggle to 'completed'
    status = await toggleEventStatus(page);
    expect(status).toBe('completed');
    
    // Verify status text updated
    await expect(page.locator('text=/status:/i')).toContainText('Voting Closed');
    
    // Toggle back to 'voting'
    status = await toggleEventStatus(page);
    expect(status).toBe('voting');
    
    // Verify status text updated
    await expect(page.locator('text=/status:/i')).toContainText('Voting Open');
  });

  test('should delete an event via UI', async ({ page }) => {
    const eventName = `E2E Test Event Delete - ${Date.now()}`;
    
    // Create event
    await createEventViaUI(page, eventName);
    
    // Navigate back to admin home
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Verify event is in the list
    await expect(page.locator(`text=${eventName}`)).toBeVisible();
    
    // Delete event
    await deleteEventViaUI(page, eventName);
    
    // Wait for event to be removed
    await page.waitForTimeout(1000); // Wait for animation and state update
    
    // Verify event is no longer in the list
    await expect(page.locator(`text=${eventName}`)).not.toBeVisible();
  });

  test('should complete full CRUD cycle via UI', async ({ page }) => {
    const eventName = `E2E Test Full Flow - ${Date.now()}`;
    
    // Create event
    await createEventViaUI(page, eventName);
    await expect(page.locator('h1')).toContainText(eventName);
    
    // Modify status
    let status = await toggleEventStatus(page);
    expect(status).toBe('completed');
    
    status = await toggleEventStatus(page);
    expect(status).toBe('voting');
    
    // Navigate to admin home
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Verify event is in list
    await expect(page.locator(`text=${eventName}`)).toBeVisible();
    
    // Delete event
    await deleteEventViaUI(page, eventName);
    
    // Verify event is deleted
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${eventName}`)).not.toBeVisible();
  });

  test('should show loading states during operations', async ({ page }) => {
    const eventName = `E2E Test Loading - ${Date.now()}`;
    
    // Fill in event name
    const eventNameInput = page.getByPlaceholder(/event name/i);
    await eventNameInput.fill(eventName);
    
    // Submit form
    const createButton = page.getByRole('button', { name: /create event/i });
    
    // Click and verify loading state appears
    await createButton.click();
    
    // Button should show "Creating..." or be disabled during creation
    // Note: This happens very quickly, so we might not catch it
    // But we can verify the button exists and form is disabled
    await expect(createButton).toBeDisabled().catch(() => {
      // If button is not disabled, check for "Creating..." text
      return expect(page.locator('text=/creating/i')).toBeVisible();
    });
    
    // Wait for navigation (creation complete)
    await page.waitForURL(/\/admin\/[^/]+$/, { timeout: 10000 });
  });

  test('should handle delete confirmation modal', async ({ page }) => {
    const eventName = `E2E Test Delete Modal - ${Date.now()}`;
    
    // Create event
    await createEventViaUI(page, eventName);
    
    // Navigate to admin home
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Find event card and click delete
    const eventCard = page.locator(`text=${eventName}`).locator('..').locator('..');
    const deleteButton = eventCard.getByRole('button', { name: /delete/i });
    await deleteButton.click();
    
    // Verify modal appears
    await expect(page.locator('text=/delete event/i')).toBeVisible();
    await expect(page.locator('text=/are you sure/i')).toBeVisible();
    
    // Cancel deletion
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await cancelButton.click();
    
    // Verify modal is closed and event still exists
    await expect(page.locator('text=/delete event/i')).not.toBeVisible();
    await expect(page.locator(`text=${eventName}`)).toBeVisible();
    
    // Now actually delete
    await deleteButton.click();
    const confirmButton = page.getByRole('button', { name: /^delete$/i });
    await confirmButton.click();
    
    // Verify event is deleted
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${eventName}`)).not.toBeVisible();
  });
});

