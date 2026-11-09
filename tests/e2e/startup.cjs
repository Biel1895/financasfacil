const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const { prepareSuite } = require('./support.cjs');

(async () => {
  const site = prepareSuite('startup');
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.route('https://fonts.googleapis.com/**', (route) => route.abort());
    await context.route('https://fonts.gstatic.com/**', (route) => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(pathToFileURL(path.join(site, 'index.html')).href);
    await page.locator('#authScreen').waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => 'FF_STATE' in window), false);
    assert.equal(await page.evaluate(() => 'FF_LocalDB' in window), false);
    await page.locator('#tabRegisterBtn').click();
    await page.locator('#authName').fill('Verificação normal');
    await page.locator('#authIdentifier').fill('startup-normal');
    await page.locator('#authPassword').fill('senha123');
    await page.locator('#btnAuthSubmit').click();
    await page.locator('#appWrapper').waitFor({ state: 'visible' });
    await page.locator('[data-action="new"]').filter({ visible: true }).first().click();
    await page.locator('#commandInput').fill('Recebi 100 de freela');
    await page.locator('#btnSubmitCommand').click();
    await page.locator('#confirmPreview').click();
    await page.locator('#composerDialog').waitFor({ state: 'hidden' });
    assert.match(await page.locator('#totalBalanceValue').innerText(), /100,00/);
    await page.reload();
    await page.locator('#appWrapper').waitFor({ state: 'visible' });
    assert.match(await page.locator('#totalBalanceValue').innerText(), /100,00/);
    assert.deepEqual(errors, []);
    console.log('OK Uso normal salva e reabre sem depender dos globais de teste.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
