import { chromium } from 'playwright';
import path from 'path';

/**
 * Generates the hero image for the README.
 *
 * Usage:
 * 1. Start the dev server: npm run dev
 * 2. Run this script: node scripts/generate-hero.js
 */
(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2, // High DPI for better quality
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173...');
  try {
    // Navigate and wait for network to be idle
    await page.goto('http://localhost:5173');

    // Wait for the app to load. We can wait for a specific selector if we knew one,
    // but a timeout is safer for a generic "landing page" shot.
    console.log('Waiting for page to settle...');
    await page.waitForTimeout(5000);

    const outputPath = path.resolve('public/hero.png');
    console.log(`Taking screenshot to ${outputPath}...`);

    // Take a screenshot of the visible viewport
    await page.screenshot({ path: outputPath });

    console.log('Screenshot saved!');
  } catch (error) {
    console.error('Error generating hero image:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
