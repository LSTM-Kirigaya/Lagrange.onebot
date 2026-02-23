const { chromium } = require('playwright');

(async () => {
  try {
    console.log('Attempting to launch Chromium...');
    const browser = await chromium.launch();
    console.log('Chromium launched successfully!');
    
    const page = await browser.newPage();
    await page.goto('https://google.com');
    console.log('Navigated to google.com');
    
    const title = await page.title();
    console.log('Page title:', title);
    
    await browser.close();
    console.log('Browser closed.');
  } catch (error) {
    console.error('Error:', error.message);
  }
})();