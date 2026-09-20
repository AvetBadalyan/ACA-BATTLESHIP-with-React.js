/**
 * Puppeteer script to capture screenshots of the Battleship game
 * for documentation and README purposes.
 *
 * Run with: node scripts/take-screenshots.js
 */

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, '../src/assets/screenshots');
const BASE_URL = 'http://localhost:5174';

// Screen sizes for responsive testing
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1024, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`📸 Captured: ${name}.png`);
}

async function main() {
  console.log('🚀 Starting Battleship Screenshot Capture...\n');

  // Ensure screenshots directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // Desktop screenshots
    console.log('\n🖥️ Capturing Desktop Views...');
    const page = await browser.newPage();
    await page.setViewport(VIEWPORTS.desktop);
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(1000);

    // 1. Initial setup screen
    await takeScreenshot(page, '01-setup-initial');

    // 2. Click on a ship to select it
    await page.evaluate(() => {
      const ships = document.querySelectorAll('[class*="shipItem"]');
      if (ships[0]) ships[0].click();
    });
    await delay(500);
    await takeScreenshot(page, '02-setup-ship-selected');

    // 3. Randomize placement
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const randomizeBtn = buttons.find((btn) => btn.textContent.includes('Randomize'));
      if (randomizeBtn) randomizeBtn.click();
    });
    await delay(800);
    await takeScreenshot(page, '03-setup-ships-placed');

    // 4. Start game
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find((btn) => btn.textContent.includes('Start Battle'));
      if (startBtn) startBtn.click();
    });
    await delay(1000);
    await takeScreenshot(page, '04-gameplay-start');

    // 5. Make some shots
    for (let i = 0; i < 3; i++) {
      await page.evaluate((index) => {
        // Find the enemy board (second board container)
        const boardSections = document.querySelectorAll('[class*="boardSection"]');
        if (boardSections[1]) {
          const cells = boardSections[1].querySelectorAll('[class*="cell"]');
          const positions = [15, 35, 55, 75, 23, 44, 66, 88];
          const cellIndex = positions[index] || index * 10;
          if (cells[cellIndex]) cells[cellIndex].click();
        }
      }, i);
      await delay(2500); // Wait for shot animation + AI turn
    }
    await takeScreenshot(page, '05-gameplay-progress');

    // 6. Theme toggle - light mode
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const themeBtn = buttons.find((btn) => btn.title && btn.title.includes('light'));
      if (themeBtn) themeBtn.click();
    });
    await delay(500);
    await takeScreenshot(page, '06-theme-light');

    // Toggle back to dark
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const themeBtn = buttons.find((btn) => btn.title && btn.title.includes('dark'));
      if (themeBtn) themeBtn.click();
    });
    await delay(300);

    await page.close();

    // Responsive screenshots
    console.log('\n📱 Capturing Responsive Views...');

    for (const [device, viewport] of Object.entries(VIEWPORTS)) {
      const responsivePage = await browser.newPage();
      await responsivePage.setViewport(viewport);
      await responsivePage.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
      await delay(800);

      // Randomize ships
      await responsivePage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const randomizeBtn = buttons.find((btn) => btn.textContent.includes('Randomize'));
        if (randomizeBtn) randomizeBtn.click();
      });
      await delay(500);

      await takeScreenshot(responsivePage, `responsive-${device}-setup`);

      // Start game
      await responsivePage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const startBtn = buttons.find((btn) => btn.textContent.includes('Start Battle'));
        if (startBtn) startBtn.click();
      });
      await delay(1000);

      await takeScreenshot(responsivePage, `responsive-${device}-gameplay`);

      await responsivePage.close();
      console.log(`  ✓ ${device} views captured`);
    }

    console.log('\n✅ All screenshots captured successfully!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);
  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

main();
