const { prepareSuite, launchBrowser } = require('./support.cjs');
const siteDir = prepareSuite('balances');
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
async function values(total, month) {
  assert.equal((await page.locator('#totalBalanceValue').innerText()).trim(), total);
  assert.equal((await page.locator('#monthlyBalanceValue').innerText()).trim(), month);
}
(async () => {
  browser = await launchBrowser({ headless: true });
  const context = await browser.newContext({
    timezoneId: 'America/Bahia',
    viewport: { width: 1440, height: 1040 },
  });
  await context.route('https://fonts.googleapis.com/**', (r) => r.abort());
  await context.route('https://fonts.gstatic.com/**', (r) => r.abort());
  page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('file:///' + path.join(siteDir, 'login.html').replace(/\\/g, '/'));
  await page.locator('#tabRegisterBtn').click();
  await page.locator('#authName').fill('Teste dos saldos');
  await page.locator('#authIdentifier').fill('teste_saldos');
  await page.locator('#authPassword').fill('senha123');
  await page.locator('#btnAuthSubmit').click();
  await page.locator('#appWrapper').waitFor({ state: 'visible' });
  const dates = await page.evaluate(async () => {
    const now = new Date(),
      iso = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      today = iso(now),
      prior = iso(new Date(now.getFullYear(), now.getMonth() - 1, 10)),
      ancient = iso(new Date(now.getFullYear() - 2, 6, 10)),
      future = iso(new Date(now.getFullYear(), now.getMonth() + 1, 1)),
      key = FF_STATE.loggedAccount.accountKey;
    const entries = [
      ['ancient_income', 'income', 500, ancient],
      ['prior_income', 'income', 1000, prior],
      ['prior_expense', 'expense', 150, prior],
      ['current_income', 'income', 300, today],
      ['current_expense', 'expense', 200, today],
      ['prior_investment', 'investment', 100, prior],
      ['current_investment', 'investment', 50, today],
      ['refund_prior', 'expense', 100, today],
      ['future_income', 'income', 9999, future],
      ['future_expense', 'expense', 111, future],
      ['future_investment', 'investment', 15, future],
    ].map(([id, type, amount, date]) => ({
      id,
      type,
      amount,
      date,
      description: id,
      category:
        type === 'income'
          ? 'Outras Entradas'
          : type === 'investment'
            ? 'Outros Investimentos'
            : 'Outros Gastos',
      accountKey: key,
      entryKind: id === 'refund_prior' ? 'reversal' : 'normal',
      relatedTransactionId: id === 'refund_prior' ? 'prior_expense' : '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    await FF_LocalDB.putBulk('movimentacoes', entries);
    await FF_LocalDB.put('contas_programadas', {
      id: 'pending_future',
      description: 'Conta ainda pendente',
      type: 'expense',
      amount: 4444,
      category: 'Outros Gastos',
      dueDate: future,
      status: 'pending',
      accountKey: key,
    });
    return { today, prior, future };
  });
  await page.reload();
  await page.waitForFunction(() => FF_STATE.transactions.length === 11);
  await values('R$ 1.550,00', 'R$ 200,00');
  assert.match(
    await page.locator('.summary-card.investment .metric-caption').innerText(),
    /150,00/,
  );
  assert.match(
    await page.locator('.summary-card.balance .metric-label').innerText(),
    /Saldo total hoje/,
  );
  pass('Saldo total soma meses e anos anteriores; quadro separado mostra apenas o mês atual');
  await page.locator('#btnPrevMonth').click();
  await values('R$ 1.550,00', 'R$ 850,00');
  await page.locator('#btnNextMonth').click();
  await values('R$ 1.550,00', 'R$ 200,00');
  pass('Navegar por meses altera o saldo mensal e mantém o total atual estável');
  await page.locator('#btnNextMonth').click();
  await values('R$ 1.550,00', 'R$ 9.888,00');
  pass('Lançamentos futuros aparecem no mês correspondente e não antecipam o saldo total de hoje');
  await page.locator('#privacyButton').click();
  await values('R$ ••••', 'R$ ••••');
  await page.locator('#privacyButton').click();
  pass('Opção de ocultar valores protege tanto o total como o saldo mensal');
  await page.locator('[data-action="settings"]').filter({ visible: true }).first().click();
  await page.locator('#balanceModeSelect').selectOption('integrated');
  await page.locator('#settingsDialog [data-close]').click();
  await values('R$ 1.400,00', 'R$ 9.873,00');
  await page.locator('#btnCurrentMonth').click();
  await values('R$ 1.400,00', 'R$ 150,00');
  pass(
    'Preferência de descontar investimentos é aplicada aos dois saldos sem incluir aportes futuros',
  );
  await page.reload();
  await page.waitForFunction(() => FF_STATE.transactions.length === 11);
  await values('R$ 1.400,00', 'R$ 150,00');
  pass('Reabrir preserva a preferência e mantém os dois valores separados');
  await page.screenshot({ path: path.join(siteDir, 'saldo-total-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: path.join(siteDir, 'saldo-total-celular.png'), fullPage: true });
  await page.setViewportSize({ width: 320, height: 740 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  pass('Saldo total e mensal ficam legíveis em celular, inclusive em 320px');
  await page.setViewportSize({ width: 1440, height: 1040 });
  await page.locator('a[data-view="contas"]').filter({ visible: true }).first().click();
  await page.locator('#btnNextMonth').click();
  await page
    .locator('[data-action="pay-bill"][data-id="pending_future"]')
    .filter({ visible: true })
    .first()
    .click();
  await page.locator('#confirmSettlement').click();
  await page.locator('#settlementDialog').waitFor({ state: 'hidden' });
  await page.locator('#btnCurrentMonth').click();
  await values('-R$ 3.044,00', '-R$ 4.294,00');
  pass('Conta pendente só altera o total e o mês quando seu pagamento é confirmado');
  await page.locator('a[data-view="lancamentos"]').filter({ visible: true }).first().click();
  await page
    .locator('#transactionsListContainer [data-action="edit-tx"][data-id="current_expense"]')
    .click();
  await page.locator('#refundEditedTransaction').click();
  await page.locator('#refundAmount').fill('50');
  await page.locator('#confirmRefund').click();
  await page.locator('#refundDialog').waitFor({ state: 'hidden' });
  await values('-R$ 2.994,00', '-R$ 4.244,00');
  pass('Estorno atualiza o total e o resultado mensal com o mesmo valor e sem duplicar receita');
  await page.locator('#btnNextMonth').click();
  await page
    .locator('#transactionsListContainer [data-action="edit-tx"][data-id="future_income"]')
    .click();
  await page.locator('#manualDate').fill(dates.today);
  await page.locator('#manualSaveButton').click();
  await page.locator('#composerDialog').waitFor({ state: 'hidden' });
  await page.locator('#btnCurrentMonth').click();
  await values('R$ 7.005,00', 'R$ 5.755,00');
  pass('Editar uma movimentação futura para hoje recalcula corretamente os dois saldos');
  assert.equal(errors.length, 0, errors.join('\n'));
  pass('Nenhum erro JavaScript durante os novos fluxos');
  fs.writeFileSync(
    path.join(siteDir, 'balance-results.json'),
    JSON.stringify({ results, errors }, null, 2),
  );
})()
  .catch(async (error) => {
    console.error(error);
    results.push({ name: 'Falha', ok: false, error: error.stack });
    if (page) {
      await page
        .screenshot({ path: path.join(siteDir, 'balance-failure.png'), fullPage: true })
        .catch(() => {});
    }
    fs.writeFileSync(
      path.join(siteDir, 'balance-results.json'),
      JSON.stringify({ results, errors }, null, 2),
    );
    process.exitCode = 1;
  })
  .finally(async () => browser?.close());
