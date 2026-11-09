const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const projectRoot = path.resolve(__dirname, '../..');

function prepareSuite(name) {
  const siteDir = path.join(projectRoot, 'test-results/e2e', name, 'site');
  fs.mkdirSync(siteDir, { recursive: true });
  for (const file of ['index.html', 'app.js', 'style.css', 'config.js']) {
    fs.copyFileSync(path.join(projectRoot, file), path.join(siteDir, file));
  }
  fs.cpSync(path.join(projectRoot, 'assets'), path.join(siteDir, 'assets'), { recursive: true });
  return siteDir;
}

async function launchBrowser(options) {
  const browser = await chromium.launch(options);
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (...args) => {
    const context = await newContext(...args);
    // Test-only state access is activated before the application script runs.
    await context.addInitScript(() => {
      window.__FF_ENABLE_TEST_API__ = true;
    });
    return context;
  };
  return browser;
}

module.exports = { projectRoot, prepareSuite, launchBrowser };
