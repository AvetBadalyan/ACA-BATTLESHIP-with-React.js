/**
 * Puppeteer script to capture screenshots of the Battleship game
 * for documentation and README purposes.
 * 
 * Run with: npx ts-node scripts/screenshots.ts
 * Or: npx tsx scripts/screenshots.ts
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '../src/assets/screenshots');
const BASE_URL = 'http://localhost:5173';

// Screen sizes for responsive testing
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1024, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page: Page, name: string): Promise<void> {
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`📸 Captured: ${name}.png`);
}

async function captureSetupPhase(page: Page): Promise<void> {
  console.log('\n🎮 Capturing Setup Phase...');
  
  // Initial setup screen
  await takeScreenshot(page, '01-setup-initial');
  
  // Select a ship
  await page.click('button:has-text("Carrier")');
  await delay(300);
  await takeScreenshot(page, '02-setup-ship-selected');
  
  // Hover over board to show preview
  const cells = await page.$$('[class*="cell"]');
  if (cells.length > 22) {
    await cells[22].hover();
    await delay(200);
    await takeScreenshot(page, '03-setup-ship-preview');
  }
  
  // Place ship
  if (cells.length > 22) {
    await cells[22].click();
    await delay(300);
  }
  
  // Click randomize to place all ships
  const randomizeBtn = await page.$('button:has-text("Randomize")');
  if (randomizeBtn) {
    await randomizeBtn.click();
    await delay(500);
    await takeScreenshot(page, '04-setup-ships-placed');
  }
}

async function captureGameplayPhase(page: Page): Promise<void> {
  console.log('\n⚔️ Capturing Gameplay Phase...');
  
  // Start the game
  const startBtn = await page.$('button:has-text("Start Battle")');
  if (startBtn) {
    await startBtn.click();
    await delay(800);
    await takeScreenshot(page, '05-gameplay-start');
  }
  
  // Make a few shots
  const enemyCells = await page.$$('[class*="boardWrapper"]:last-child [class*="cell"]');
  
  // First shot
  if (enemyCells.length > 15) {
    await enemyCells[15].click();
    await delay(1500); // Wait for animation and AI turn
    await takeScreenshot(page, '06-gameplay-shot');
  }
  
  // More shots
  for (let i = 0; i < 5; i++) {
    const idx = 20 + i * 10;
    if (enemyCells.length > idx) {
      await enemyCells[idx].click();
      await delay(2000);
    }
  }
  await takeScreenshot(page, '07-gameplay-progress');
}

async function captureResponsiveDesigns(browser: Browser): Promise<void> {
  console.log('\n📱 Capturing Responsive Designs...');
  
  for (const [device, viewport] of Object.entries(VIEWPORTS)) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await delay(500);
    
    // Randomize ships for consistent screenshots
    const randomizeBtn = await page.$('button:has-text("Randomize")');
    if (randomizeBtn) {
      await randomizeBtn.click();
      await delay(300);
    }
    
    await takeScreenshot(page, `responsive-${device}-setup`);
    
    // Start game and capture
    const startBtn = await page.$('button:has-text("Start Battle")');
    if (startBtn) {
      await startBtn.click();
      await delay(800);
      await takeScreenshot(page, `responsive-${device}-gameplay`);
    }
    
    await page.close();
  }
}

async function captureThemes(page: Page): Promise<void> {
  console.log('\n🌓 Capturing Theme Variants...');
  
  // Reset to setup
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await delay(500);
  
  // Randomize for visual appeal
  const randomizeBtn = await page.$('button:has-text("Randomize")');
  if (randomizeBtn) {
    await randomizeBtn.click();
    await delay(300);
  }
  
  // Dark theme (default)
  await takeScreenshot(page, 'theme-dark');
  
  // Toggle to light theme
  const themeBtn = await page.$('button[title*="light"]');
  if (themeBtn) {
    await themeBtn.click();
    await delay(300);
    await takeScreenshot(page, 'theme-light');
  }
}

async function main(): Promise<void> {
  console.log('🚀 Starting Battleship Screenshot Capture...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORTS.desktop);
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    
    // Capture main game phases
    await captureSetupPhase(page);
    await captureGameplayPhase(page);
    await captureThemes(page);
    
    await page.close();
    
    // Capture responsive designs
    await captureResponsiveDesigns(browser);
    
    console.log('\n✅ All screenshots captured successfully!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);
    
  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

main();
