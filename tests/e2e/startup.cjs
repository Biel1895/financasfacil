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
    await context.addInitScript(() => {
      window.demoTranscript = 'Gastei quarenta reais e cinquenta centavos no mercado';
      window.demoVoiceError = '';
      window.SpeechRecognition = class {
        start() {
          queueMicrotask(() => {
            if (window.demoVoiceError) {
              this.onerror?.({ error: window.demoVoiceError });
              this.onend?.();
              return;
            }
            this.onstart?.();
            this.onresult?.({ results: [[{ transcript: window.demoTranscript }]] });
          });
        }
        stop() {
          queueMicrotask(() => this.onend?.());
        }
        abort() {
          this.onend?.();
        }
      };
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(pathToFileURL(path.join(site, 'index.html')).href);
    await page.getByRole('heading', { level: 1, name: /Organize hoje/ }).waitFor();
    await page.getByRole('link', { name: 'Ver planos', exact: true }).click();
    assert.equal(new URL(page.url()).hash, '#planos');
    await page.getByRole('heading', { name: 'Plano Mensal', exact: true }).waitFor();
    await page.getByRole('heading', { name: 'Plano Anual', exact: true }).waitFor();
    assert.match(await page.locator('#planos').innerText(), /R\$ 9,00[\s\S]*R\$ 90,00/);
    assert.equal(await page.locator('#reportMonths .report-bar').count(), 18);
    assert.ok(
      await page
        .locator('#reportMonths .report-bar')
        .first()
        .evaluate((bar) => bar.getBoundingClientRect().height > 0),
    );
    const latestRange = await page.locator('#reportRange').innerText();
    assert.equal(latestRange, 'junho de 2026 a novembro de 2026');
    await page.locator('#reportPrev').click();
    assert.notEqual(await page.locator('#reportRange').innerText(), latestRange);
    await page.locator('#reportNext').click();
    assert.equal(await page.locator('#reportRange').innerText(), latestRange);
    await page.locator('#reportSpan').selectOption('12');
    assert.equal(await page.locator('#reportMonths .report-bar').count(), 36);
    await page.locator('#reportMonths button[data-month="2026-06"]').click();
    assert.match(await page.locator('#reportSelected').innerText(), /junho de 2026/i);
    await page.getByText('Ver os valores em tabela').click();
    assert.equal(await page.locator('#reportTable tbody tr').count(), 12);
    assert.equal(await page.getByRole('button', { name: 'Exportar CSV de exemplo' }).count(), 0);
    await page.locator('#eyeBtn').click();
    const hiddenAmount = 'R$ ••••';
    assert.equal(await page.locator('.dash .stat-value').first().innerText(), hiddenAmount);
    await page.locator('#reportSpan').selectOption('6');
    assert.ok(
      (await page.locator('#reportTotals .money').allTextContents()).every(
        (amount) => amount === hiddenAmount,
      ),
    );
    assert.ok(
      (await page.locator('#reportTable .money').allTextContents()).every(
        (amount) => amount === hiddenAmount,
      ),
    );
    await page.locator('#demoPhrase').fill('Comprei um monitor por 900 em 3x');
    await page.getByRole('button', { name: 'Ver prévia' }).click();
    assert.equal(await page.locator('#demoResult li').count(), 3);
    assert.equal(await page.locator('#demoResult li .money').first().innerText(), hiddenAmount);
    assert.match(await page.locator('#demoResult .preview-total').innerText(), /Total da compra/);
    await page.locator('#eyeBtn').click();
    assert.match(await page.locator('#demoResult').innerText(), /R\$\s*300,00/);
    await page.getByRole('button', { name: 'Usar microfone' }).click();
    await page.getByRole('button', { name: 'Parar e conferir' }).click();
    assert.equal(
      await page.locator('#demoPhrase').inputValue(),
      'Gastei quarenta reais e cinquenta centavos no mercado',
    );
    assert.match(await page.locator('#demoResult').innerText(), /Despesa[\s\S]*R\$\s*40,50/);
    await page.evaluate(() => {
      window.demoTranscript = 'Comprei um PS5 por dois mil e oitocentos em cinco vezes';
    });
    await page.getByRole('button', { name: 'Usar microfone' }).click();
    await page.getByRole('button', { name: 'Parar e conferir' }).click();
    assert.equal(await page.locator('#demoResult li').count(), 5);
    assert.match(await page.locator('#demoResult').innerText(), /R\$\s*560,00/);
    await page.evaluate(() => {
      window.demoVoiceError = 'not-allowed';
    });
    await page.getByRole('button', { name: 'Usar microfone' }).click();
    assert.match(await page.locator('#demoMicStatus').innerText(), /Permita o uso do microfone/);
    assert.equal(await page.locator('#demoPhrase').isEditable(), true);
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
