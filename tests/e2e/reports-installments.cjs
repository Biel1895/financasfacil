const { prepareSuite, launchBrowser } = require('./support.cjs');
const siteDir = prepareSuite('reports-installments');
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');

const results = [],
  errors = [];
let browser, page;
const pass = (name) => {
  results.push({ name, ok: true });
  console.log('OK', name);
};
const uiFile = 'file:///' + path.join(siteDir, 'login.html').replace(/\\/g, '/');
async function openText(text) {
  await page.locator('[data-action="new"]').filter({ visible: true }).first().click();
  await page.locator('#commandInput').fill(text);
  await page.locator('#btnSubmitCommand').click();
  await page.locator('#previewPanel').waitFor({ state: 'visible' });
}
async function closeComposer() {
  await page.locator('#composerDialog [data-close]').first().click();
}
async function waitSaved() {
  await page.locator('#composerDialog').waitFor({ state: 'hidden' });
  await page.waitForFunction(() => !FF_STATE.busy && !FF_STATE.isSubmittingCommand);
}
async function counts() {
  return page.evaluate(() => ({
    tx: FF_STATE.transactions.length,
    bills: FF_STATE.bills.length,
    rules: FF_STATE.rules.length,
  }));
}
(async () => {
  browser = await launchBrowser({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1040 },
    timezoneId: 'America/Bahia',
    acceptDownloads: true,
  });
  await context.route('https://fonts.googleapis.com/**', (r) => r.abort());
  await context.route('https://fonts.gstatic.com/**', (r) => r.abort());
  await context.addInitScript(() => {
    window.SpeechRecognition = class {
      start() {
        this.active = true;
        this.onstart?.();
      }
      stop() {
        if (!this.active) {
          return;
        }
        this.active = false;
        setTimeout(() => this.onend?.(), 0);
      }
    };
  });
  page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(uiFile);
  await page.locator('#tabRegisterBtn').click();
  await page.locator('#authName').fill('Teste Relatórios');
  await page.locator('#authIdentifier').fill('teste_relatorios_parcelas');
  await page.locator('#authPassword').fill('senha123');
  await page.locator('#btnAuthSubmit').click();
  await page.locator('#appWrapper').waitFor({ state: 'visible' });
  await page.evaluate(async () => {
    const key = FF_STATE.loggedAccount.accountKey,
      now = new Date(),
      items = [];
    for (let i = 0; i < 18; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 5),
        date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-05`;
      for (const [type, amount, category] of [
        ['income', 5000 + i * 10, 'Salário & Pró-labore'],
        ['expense', 400 + i * 5, 'Alimentação & Mercado'],
        ['investment', 200, 'Renda Fixa (CDB / Tesouro)'],
      ]) {
        items.push({
          id: `seed_${i}_${type}`,
          accountKey: key,
          type,
          amount,
          description: 'Teste ' + type,
          category,
          date,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
    await FF_LocalDB.putBulk(FF_LocalDB.STORE_TX, items);
  });
  await page.reload();
  await page.waitForFunction(() => FF_STATE.transactions.length === 54);
  await page.locator('a[data-view="relatorios"]').filter({ visible: true }).first().click();
  const before = await page
    .locator('.chart-month')
    .evaluateAll((items) => items.map((e) => [e.dataset.year, e.dataset.month].join('-')));
  await page.locator('.chart-month').first().click();
  assert.deepEqual(
    await page
      .locator('.chart-month')
      .evaluateAll((items) => items.map((e) => [e.dataset.year, e.dataset.month].join('-'))),
    before,
  );
  await page.locator('.chart-month').last().click();
  assert.equal(await page.locator('.chart-month[aria-pressed="true"]').count(), 1);
  pass(
    'Clicar em mês antigo mantém os meses seguintes e permite selecionar o mais recente sem recarregar',
  );
  const initial = await page.locator('#reportRangeLabel').innerText();
  for (let i = 0; i < 4; i++) {
    await page.locator('#reportPrev').click();
  }
  for (let i = 0; i < 4; i++) {
    await page.locator('#reportNext').click();
  }
  assert.equal(await page.locator('#reportRangeLabel').innerText(), initial);
  assert(await page.locator('#reportNext').isEnabled());
  pass('Navegação de períodos volta e avança repetidamente sem travar');
  await page.locator('.chart-month').first().click();
  const oldMonth = await page.evaluate(() => FF_STATE.selectedYear * 12 + FF_STATE.selectedMonth);
  await page.locator('#btnNextMonth').click();
  assert.equal(
    await page.evaluate(() => FF_STATE.selectedYear * 12 + FF_STATE.selectedMonth),
    oldMonth + 1,
  );
  await page.locator('#btnPrevMonth').click();
  assert.equal(
    await page.evaluate(() => FF_STATE.selectedYear * 12 + FF_STATE.selectedMonth),
    oldMonth,
  );
  pass('Setas globais de mês também continuam funcionando após navegar pelo gráfico');
  await page.locator('#reportPrev').click();
  await page.locator('#reportToday').click();
  const current = await page.evaluate(() => {
    const d = new Date();
    return [d.getFullYear(), d.getMonth()];
  });
  assert.deepEqual(
    await page.evaluate(() => [FF_STATE.selectedYear, FF_STATE.selectedMonth]),
    current,
  );
  pass('Botão Mês atual restaura o mês e o período do gráfico');
  await page.locator('#reportSpan').selectOption('12');
  assert.equal(await page.locator('#trendTable tbody tr').count(), 12);
  assert.equal(await page.locator('.chart-month').count(), 12);
  const tableTotals = await page.locator('#reportPeriodTotals').innerText();
  assert.match(tableTotals, /Receitas no período/);
  assert.match(tableTotals, /Saldo do período/);
  pass('Relatório alterna entre 6 e 12 meses e mostra totais do período');
  await page.locator('.chart-month').first().focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('.chart-month').nth(1).getAttribute('aria-pressed'), 'true');
  pass('Gráfico permite navegar entre meses pelo teclado');
  await page.locator('#privacyButton').click();
  assert(!/R\$\s*\d/.test(await page.locator('#view-relatorios').innerText()));
  await page.locator('#privacyButton').click();
  pass('Novos resumos e totais respeitam a privacidade dos valores');
  const dp = page.waitForEvent('download');
  await page.locator('[data-action="export-report"]').click();
  const download = await dp;
  const csv = await page.evaluate(async (url) => await (await fetch(url)).text(), download.url());
  assert.equal(csv.trim().split(/\r?\n/).length, 13);
  assert.match(csv, /Receitas;Despesas;Investimentos;Saldo/);
  pass('Exportação do relatório inclui somente o período escolhido e o saldo por mês');
  await page.screenshot({
    path: path.join(siteDir, 'relatorios-novo-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.locator('#reportNext').isVisible());
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.locator('.chart-month').last().scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(siteDir, 'relatorios-novo-celular.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 740 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  pass('Relatório de 12 meses cabe em telas de 320px com rolagem apenas dentro do gráfico');
  await page.setViewportSize({ width: 1440, height: 1040 });
  await page.locator('#reportToday').click();
  await page.locator('#reportSpan').selectOption('6');
  const cases = [
    ['comprei um ps5 por 2800 em 5x', 2800, 5, 'PS5'],
    ['Comprei uma TV 55 por 2800 em 5 parcelas', 2800, 5, 'TV 55'],
    ['Comprei um notebook por 5.999,99 em 10x', 5999.99, 10, 'Notebook'],
    ['Comprei uma cadeira em 5x de 560', 2800, 5, 'Cadeira'],
    ['Comprei um PS5 por 2800 parcelado em 5', 2800, 5, 'PS5'],
    ['Comprei um PS5 por 2800 em cinco vezes', 2800, 5, 'PS5'],
    ['Comprei uma TV por 2400 em vinte e quatro parcelas', 2400, 24, 'TV'],
    ['Comprei uma TV por 3600 em trinta e seis vezes', 3600, 36, 'TV'],
  ];
  for (const [text, total, n, description] of cases) {
    const parsed = await page.evaluate((text) => FF_Planning.parseGeneralInput(text), text);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].kind, 'installment');
    assert.equal(parsed[0].amount, total);
    assert.equal(parsed[0].installments, n);
    assert.equal(parsed[0].description, description);
  }
  pass(
    'Reconhecimento distingue PS5 e TV 55 do valor, aceita total, valor da parcela e quantidade por extenso',
  );
  for (const text of [
    'Comprei um PS5 por 2800 em 0x',
    'Comprei um PS5 por 2800 em 121x',
    'Comprei um PS5 por 2800 em cento e trinta parcelas',
    'Comprei um PS5 por 2800 parcelado',
    'Comprei um PS5 por 2800 em 5x de 100',
  ]) {
    assert(
      await page.evaluate((text) => {
        try {
          FF_Planning.parseGeneralInput(text);
          return false;
        } catch {
          return true;
        }
      }, text),
    );
  }
  pass('Parcelamentos inválidos ou inconsistentes são rejeitados antes de gravar');
  const baseline = await counts();
  await openText('comprei um ps5 por 2800 em 5x');
  assert.equal(await page.locator('[data-draft-field="amount"]').inputValue(), '2800,00');
  assert.equal(await page.locator('[data-draft-field="installments"]').inputValue(), '5');
  assert.match(await page.locator('[data-installment-summary]').innerText(), /560,00/);
  assert.deepEqual(await counts(), baseline);
  await page.locator('[data-draft-field="date"]').fill('2027-01-31');
  await page.locator('[data-draft-field="cardName"]').fill('Cartão de teste');
  await page.locator('.installment-details summary').click();
  await page.screenshot({
    path: path.join(siteDir, 'parcelamento-automatico.png'),
    fullPage: true,
  });
  await page.locator('#confirmPreview').click();
  await waitSaved();
  const plan = await page.evaluate(() =>
    FF_STATE.bills
      .filter((b) => b.description === 'PS5')
      .sort((a, b) => a.installmentNumber - b.installmentNumber),
  );
  assert.equal(plan.length, 5);
  assert.deepEqual(
    plan.map((b) => b.amount),
    [560, 560, 560, 560, 560],
  );
  assert.deepEqual(
    plan.map((b) => b.dueDate),
    ['2027-01-31', '2027-02-28', '2027-03-31', '2027-04-30', '2027-05-31'],
  );
  assert(plan.every((b) => b.status === 'pending' && b.cardName === 'Cartão de teste'));
  assert.equal((await counts()).tx, baseline.tx);
  pass(
    'Frase do PS5 cria cinco contas de R$ 560, com cartão e vencimentos corretos, sem descontar R$ 2800 do saldo',
  );
  await openText('Comprei um livro por 100 em 3x');
  await page.locator('[data-draft-field="firstPaid"]').check();
  await page.locator('#confirmPreview').click();
  await waitSaved();
  const paid = await page.evaluate(() => ({
    tx: FF_STATE.transactions.find((t) => t.description === 'Livro (1/3)'),
    bills: FF_STATE.bills.filter((b) => b.description === 'Livro'),
  }));
  assert.equal(paid.tx.amount, 33.34);
  assert.deepEqual(paid.bills.map((b) => b.amount).sort(), [33.33, 33.33, 33.34]);
  assert.equal(paid.bills.filter((b) => b.status === 'paid').length, 1);
  pass('Primeira parcela paga registra só a parcela e distribui os centavos sem perder o total');
  await openText('Comprei uma TV por 1500 em 3x; gastei 20 no mercado');
  assert.equal(await page.locator('.draft-card').count(), 2);
  await page.locator('.installment-draft [data-draft-field="installments"]').fill('0');
  await page
    .locator('.draft-card:not(.installment-draft) [data-draft-field="amount"]')
    .fill('22,50');
  await page.locator('.installment-draft [data-action="remove-draft"]').click();
  assert.equal(await page.locator('.draft-card').count(), 1);
  await page.locator('#confirmPreview').click();
  await waitSaved();
  assert(
    await page.evaluate(() =>
      FF_STATE.transactions.some((t) => t.amount === 22.5 && t.description === 'Mercado'),
    ),
  );
  pass('Compra parcelada pode ser removida da prévia sem perder as edições dos outros lançamentos');
  await page.locator('[data-action="new"]').filter({ visible: true }).first().click();
  await page.locator('#btnMic').click();
  await page.evaluate(() =>
    FF_NLP.recognition.onresult({
      resultIndex: 0,
      results: [[{ transcript: 'Comprei uma mesa por 900 em três vezes' }]],
    }),
  );
  await page.locator('#btnStopVoiceBanner').click();
  await page.locator('.installment-draft').waitFor({ state: 'visible' });
  assert.equal(await page.locator('[data-draft-field="installments"]').inputValue(), '3');
  await page.locator('#confirmPreview').click();
  await waitSaved();
  assert.equal(
    await page.evaluate(() => FF_STATE.bills.filter((b) => b.description === 'Mesa').length),
    3,
  );
  pass('Áudio simulado também reconhece parcelamento na aba geral');
  await openText('Comprei um sofá por 3000 em 6x no cartão Nubank');
  assert.equal(await page.locator('[data-draft-field="cardName"]').inputValue(), 'Nubank');
  const noSave = await counts();
  await page.evaluate(() => {
    window.originalCommit = FF_LocalDB.commit;
    FF_LocalDB.commit = async () => {
      throw new Error('Falha controlada');
    };
  });
  await page.locator('#confirmPreview').click();
  await page.locator('#composerError').waitFor({ state: 'visible' });
  assert.deepEqual(await counts(), noSave);
  assert.equal(await page.locator('[data-draft-field="amount"]').inputValue(), '3000,00');
  await page.evaluate(() => (FF_LocalDB.commit = window.originalCommit));
  await closeComposer();
  pass('Falha de armazenamento não cria parcelas parciais e conserva a prévia');
  const persisted = await counts();
  await page.reload();
  await page.waitForFunction((n) => FF_STATE.transactions.length === n, persisted.tx);
  assert.deepEqual(await counts(), persisted);
  assert.equal(
    await page.evaluate(() => FF_STATE.rules.find((r) => r.description === 'PS5').cardName),
    'Cartão de teste',
  );
  pass('Parcelas e cartão persistem após reabrir sem duplicar');
  assert.equal(errors.length, 0, errors.join('\n'));
  pass('Nenhum erro JavaScript não tratado nos novos fluxos');
  fs.writeFileSync(
    path.join(siteDir, 'reports-parcels-results.json'),
    JSON.stringify({ results, errors }, null, 2),
  );
})()
  .catch(async (error) => {
    console.error(error);
    results.push({ name: 'Falha', ok: false, error: error.stack });
    if (page) {
      await page
        .screenshot({ path: path.join(siteDir, 'reports-parcels-failure.png'), fullPage: true })
        .catch(() => {});
    }
    fs.writeFileSync(
      path.join(siteDir, 'reports-parcels-results.json'),
      JSON.stringify({ results, errors }, null, 2),
    );
    process.exitCode = 1;
  })
  .finally(async () => browser?.close());
