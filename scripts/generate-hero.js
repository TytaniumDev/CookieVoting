import { chromium } from 'playwright';

async function generateHero() {
  console.log('Launching browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2, // High DPI for better quality
  });
  const page = await context.newPage();

  const url = 'http://localhost:5173';
  console.log(`Navigating to ${url}...`);
  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    // Maybe wait a bit more for animations
    await page.waitForTimeout(2000);

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'public/hero.png' });
    console.log('Hero image saved to public/hero.png');
  } catch (error) {
    console.error('Failed to generate hero image:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

generateHero();
