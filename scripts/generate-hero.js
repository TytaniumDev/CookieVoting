
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function generateHero() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport size for a nice hero image
  await page.setViewportSize({ width: 1280, height: 720 });

  try {
    console.log('Navigating to http://localhost:5174...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });

    // Wait for the cookie icon to be visible (it has text-4rem class and is a span)
    // Looking at Home.tsx: <span className="text-[4rem] ...">🍪</span>
    // I'll wait for the text "Cookie Voting"
    console.log('Waiting for content to load...');
    await page.waitForSelector('h1:has-text("Cookie Voting")');

    // Give it a moment for animations (snowflakes) to settle or start
    await page.waitForTimeout(2000);

    const publicDir = path.resolve('public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }

    const outputPath = path.join(publicDir, 'hero.png');
    console.log(`Taking screenshot to ${outputPath}...`);

    await page.screenshot({ path: outputPath });
    console.log('Screenshot saved!');

  } catch (error) {
    console.error('Error generating hero image:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

generateHero();
