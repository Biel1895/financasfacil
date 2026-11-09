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
    await page.getByRole('heading', { level: 1, name: /Organize hoje/ }).waitFor();
    await page.getByRole('link', { name: 'Conhecer os planos' }).click();
    assert.equal(new URL(page.url()).hash, '#planos');
    await page.getByRole('heading', { name: 'Mensal', exact: true }).waitFor();
    await page.getByRole('heading', { name: 'Anual', exact: true }).waitFor();
    assert.equal(await page.locator('script[src="app.js"]').count(), 0);
    await page.getByRole('link', { name: 'Entrar', exact: true }).click();
    await page.locator('#authScreen').waitFor({ state: 'visible' });
    assert.match(page.url(), /login\.html$/);
    assert.equal(await page.locator('#authName').isVisible(), false);
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
    await page.goto(pathToFileURL(path.join(site, 'index.html')).href + '#lancamentos');
    await page.locator('#view-lancamentos').waitFor({ state: 'visible' });
    assert.match(page.url(), /login\.html#lancamentos$/);
    assert.deepEqual(errors, []);
    console.log('OK Página pública, acesso separado, link antigo e dados locais funcionam.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
