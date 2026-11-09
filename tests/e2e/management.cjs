const { prepareSuite, launchBrowser } = require('./support.cjs');
const siteDir = prepareSuite('management');
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
const appURL = 'file:///' + path.join(siteDir, 'login.html').replace(/\\/g, '/');
async function openSettings() {
  await page.locator('[data-action="settings"]').filter({ visible: true }).first().click();
}
async function closeSettings() {
  await page.locator('#settingsDialog [data-close]').click();
}
async function view(name) {
  await page.locator(`a[data-view="${name}"]`).filter({ visible: true }).first().click();
}
async function saved() {
  await page.locator('#composerDialog').waitFor({ state: 'hidden' });
  await page.waitForFunction(() => !FF_STATE.busy);
}
async function text(value) {
  await page.locator('[data-action="new"]').filter({ visible: true }).first().click();
  await page.locator('#commandInput').fill(value);
  await page.locator('#btnSubmitCommand').click();
  await page.locator('#previewPanel').waitFor({ state: 'visible' });
}
async function editTx(id) {
  await view('lancamentos');
  await page.locator(`#transactionsListContainer [data-action="edit-tx"][data-id="${id}"]`).click();
}
async function count() {
  return page.evaluate(() => [
    FF_STATE.transactions.length,
    FF_STATE.bills.length,
    FF_STATE.rules.length,
  ]);
}
async function confirmPay(id, date) {
  await page
    .locator(`[data-action="pay-bill"][data-id="${id}"]`)
    .filter({ visible: true })
    .first()
    .click();
  await page.locator('#settlementDate').fill(date);
  await page.locator('#confirmSettlement').click();
  await page.locator('#settlementDialog').waitFor({ state: 'hidden' });
}
(async () => {
  browser = await launchBrowser({ headless: true });
  const context = await browser.newContext({
    timezoneId: 'America/Bahia',
    viewport: { width: 1440, height: 1100 },
    acceptDownloads: true,
  });
  await context.route('https://fonts.googleapis.com/**', (r) => r.abort());
  await context.route('https://fonts.gstatic.com/**', (r) => r.abort());
  page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  fs.writeFileSync(path.join(siteDir, 'seed.html'), '<!doctype html>');
  await page.goto('file:///' + path.join(siteDir, 'seed.html').replace(/\\/g, '/'));
  const dates = await page.evaluate(async () => {
    const open = indexedDB.open('FinancasFacilMultiDeviceDB', 3);
    await new Promise((resolve, reject) => {
      open.onupgradeneeded = () => {
        for (const [name, key] of [
          ['movimentacoes', 'id'],
          ['usuarios_cache', 'accountKey'],
          ['sessao_ativa', 'key'],
          ['exclusoes_pendentes', 'id'],
        ]) {
          open.result.createObjectStore(name, { keyPath: key });
        }
      };
      open.onsuccess = resolve;
      open.onerror = reject;
    });
    const db = open.result,
      now = new Date(),
      prev = new Date(now.getFullYear(), now.getMonth() - 1, 10),
      iso = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      today = iso(now),
      prior = iso(prev),
      key = 'jo_o',
      salt = 'salt-teste';
    const base = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('senha-antiga'),
        { name: 'PBKDF2' },
        false,
        ['deriveBits'],
      ),
      bytes = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode(key + '::' + salt),
          iterations: 100000,
          hash: 'SHA-256',
        },
        base,
        256,
      ),
      passwordHash = [...new Uint8Array(bytes)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    const tx = db.transaction(
      ['usuarios_cache', 'sessao_ativa', 'movimentacoes', 'exclusoes_pendentes'],
      'readwrite',
    );
    tx.objectStore('usuarios_cache').put({
      accountKey: key,
      identifier: 'joão',
      displayName: 'João legado',
      salt,
      passwordHash,
      kdf: 'PBKDF2-SHA256',
    });
    tx.objectStore('sessao_ativa').put({
      key: 'activeUser',
      accountKey: key,
      identifier: 'joão',
      displayName: 'João legado',
    });
    for (const [id, type, amount, date, category] of [
      ['prior_income', 'income', 1000, prior, 'Outras Entradas'],
      ['current_expense', 'expense', 200, today, 'Outros Gastos'],
    ]) {
      tx.objectStore('movimentacoes').put({
        id,
        type,
        amount,
        date,
        category,
        description: id,
        accountKey: key,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    await new Promise((r) => (tx.oncomplete = r));
    db.close();
    return { today, prior };
  });
  await page.goto(appURL);
  await page.waitForFunction(() => FF_STATE.transactions.length === 2);
  assert.equal(await page.locator('#monthlyBalanceValue').innerText(), '-R$ 200,00');
  assert.equal(await page.evaluate(() => FF_STATE.loggedAccount.accountKey), 'jo_o');
  pass('Conta antiga preservada e saldo mensal consultável separadamente do total');
  await page.evaluate(async ({ prior }) => {
    await FF_LocalDB.put('contas_programadas', {
      id: 'old_due',
      accountKey: FF_STATE.loggedAccount.accountKey,
      type: 'expense',
      category: 'Outros Gastos',
      description: 'Vencimento antigo',
      amount: 100,
      dueDate: prior,
      status: 'pending',
    });
  }, dates);
  await page.reload();
  await page.waitForFunction(() => FF_STATE.bills.length === 1);
  await confirmPay('old_due', dates.today);
  await view('contas');
  await page.locator('[data-bill-filter="paid"]').click();
  assert.equal(await page.locator('#billsList .bill-row').count(), 1);
  assert.match(await page.locator('#billSummary .success').innerText(), /100,00/);
  pass('Conta vencida no mês anterior aparece em pagos no mês real do pagamento');
  const oldTx = await page.evaluate(
    () => FF_STATE.bills.find((b) => b.id === 'old_due').transactionId,
  );
  await editTx(oldTx);
  await page.locator('#manualDate').fill(dates.prior);
  await page.locator('#manualAmount').fill('90,00');
  await page.locator('#manualSaveButton').click();
  await saved();
  assert.equal(await page.evaluate(() => FF_STATE.bills[0].paidAt), dates.prior);
  assert.equal(await page.evaluate(() => FF_STATE.bills[0].settledAmount), 90);
  assert.equal(await page.locator('#monthlyBalanceValue').innerText(), '-R$ 200,00');
  pass('Edição do pagamento atualiza data e valor na conta sem carregar saldo anterior');
  await view('contas');
  await page.locator('#btnPrevMonth').click();
  await page.locator('[data-bill-filter="paid"]').click();
  await page.locator('[data-action="edit-bill"][data-id="old_due"]').click();
  await page.locator('#manualPaymentDate').fill(dates.today);
  await page.locator('#manualPaidAmount').fill('85,00');
  await page.locator('#manualSaveButton').click();
  await saved();
  await page.locator('#btnCurrentMonth').click();
  assert.match(await page.locator('#billSummary .success').innerText(), /85,00/);
  pass('Uma conta paga pode ser editada diretamente com vencimento e pagamento separados');
  await text('Comprei um PS5 por 2800 em 5x');
  await page.locator('#confirmPreview').click();
  await saved();
  const ruleId = await page.evaluate(() => FF_STATE.rules.find((r) => r.description === 'PS5').id);
  await view('contas');
  await page.locator('[data-action="new-bill"]').filter({ visible: true }).first().click();
  await page.locator('input[name="manualType"][value="income"]').check();
  await page.locator('#manualDescription').fill('Salário programado');
  await page.locator('#manualAmount').fill('5000');
  await page.locator('#manualFrequency').selectOption('monthly');
  await page.locator('#manualSaveButton').click();
  await saved();
  const forecast = await page.evaluate(() => FF_Finance.forecastMonths());
  assert.equal(forecast[0].result, 4155);
  assert.equal(forecast[1].result, 4440);
  assert.equal(await page.locator('#monthlyBalanceValue').innerText(), '-R$ 285,00');
  pass('Previsão usa receitas programadas e parcelas, sem acumular resultados entre meses');
  await page.locator('#forecastSpan').selectOption('12');
  assert.equal(await page.locator('.forecast-card').count(), 12);
  await page.screenshot({ path: path.join(siteDir, 'previsao-desktop.png'), fullPage: true });
  pass('Previsão permite seis ou doze meses mantendo o saldo realizado separado');
  await page.locator(`[data-action="manage-rule"][data-id="${ruleId}"]`).first().click();
  await page.locator('#purchaseAmount').fill('2900');
  await page.locator('#savePurchase').click();
  await page.waitForFunction(
    () => FF_STATE.rules.find((r) => r.description === 'PS5').amount === 2900,
  );
  assert(
    await page.evaluate(() =>
      FF_STATE.bills.filter((b) => b.description === 'PS5').every((b) => b.amount === 580),
    ),
  );
  pass('Compra ainda pendente permite editar o total e recalcular todas as parcelas');
  const firstBill = await page.evaluate(
    (id) => FF_STATE.bills.find((b) => b.ruleId === id && b.installmentNumber === 1).id,
    ruleId,
  );
  await page.locator(`#purchaseBills [data-action="edit-bill"][data-id="${firstBill}"]`).click();
  await page.locator('#manualDate').fill(dates.prior);
  await page.locator('#manualAmount').fill('600');
  await page.locator('#manualSaveButton').click();
  await saved();
  assert.equal(
    await page.evaluate((id) => FF_STATE.bills.find((b) => b.id === id).amount, firstBill),
    600,
  );
  pass('Uma parcela individual permite editar valor e vencimento sem alterar as demais');
  await page.locator('#purchaseAdvance').click();
  for (const checkbox of await page.locator('[data-settle-id]').all()) {
    await checkbox.uncheck();
  }
  const futureIds = await page.evaluate(
    (id) =>
      FF_STATE.bills
        .filter((b) => b.ruleId === id && [2, 3].includes(b.installmentNumber))
        .map((b) => b.id),
    ruleId,
  );
  for (const id of futureIds) {
    await page.locator(`[data-settle-id="${id}"]`).check();
  }
  await page.locator('#settlementDiscount').fill('60');
  await page.locator('#confirmSettlement').click();
  await page.locator('#settlementDialog').waitFor({ state: 'hidden' });
  const advanced = await page.evaluate(
    (ids) =>
      FF_STATE.bills
        .filter((b) => ids.includes(b.id))
        .map((b) => ({ paidAt: b.paidAt, settled: b.settledAmount, amount: b.amount })),
    futureIds,
  );
  assert.deepEqual(
    advanced.map((b) => b.settled),
    [550, 550],
  );
  assert(advanced.every((b) => b.paidAt === dates.today && b.amount === 580));
  pass('Antecipação seleciona parcelas, distribui desconto exato e preserva os vencimentos');
  await page.locator('#purchaseDialog [data-close]').click();
  const sourceId = await page.evaluate(
    (id) => FF_STATE.bills.find((b) => b.id === id).transactionId,
    futureIds[0],
  );
  await editTx(sourceId);
  await page.locator('#refundEditedTransaction').click();
  await page.locator('#refundAmount').fill('200');
  await page.locator('#confirmRefund').click();
  await page.locator('#refundDialog').waitFor({ state: 'hidden' });
  await page.locator('#composerDialog').waitFor({ state: 'hidden' });
  assert.equal(
    await page.evaluate(
      () => FF_STATE.transactions.filter((t) => t.entryKind === 'reversal').length,
    ),
    1,
  );
  assert.equal(await page.locator('#monthlyBalanceValue').innerText(), '-R$ 1.185,00');
  pass('Estorno parcial reduz a despesa sem ser contado como nova receita');
  await editTx(sourceId);
  await page.locator('#manualAmount').fill('150');
  await page.locator('#manualSaveButton').click();
  await page.locator('#composerError').waitFor({ state: 'visible' });
  assert.equal(
    await page.evaluate((id) => FF_STATE.transactions.find((t) => t.id === id).amount, sourceId),
    550,
  );
  await page.locator('#manualAmount').fill('600');
  await page.locator('#manualSaveButton').click();
  await saved();
  pass('Edição preserva estornos e impede reduzir o original abaixo do valor já devolvido');
  const revId = await page.evaluate(
    () => FF_STATE.transactions.find((t) => t.entryKind === 'reversal').id,
  );
  await editTx(revId);
  await page.locator('#manualAmount').fill('100');
  await page.locator('#manualDescription').fill('Devolução corrigida');
  await page.locator('#manualSaveButton').click();
  await saved();
  assert.equal(
    await page.evaluate((id) => FF_STATE.transactions.find((t) => t.id === id).amount, revId),
    100,
  );
  pass('Estorno também pode ser editado mantendo o vínculo com o original');
  await view('contas');
  await page.locator(`[data-action="manage-rule"][data-id="${ruleId}"]`).first().click();
  await page.locator('#purchaseCancel').click();
  assert.equal(await page.locator('#cancelPurchaseRefund').isChecked(), false);
  await page.locator('#cancelPurchaseRefund').check();
  await page.locator('#confirmCancelPurchase').click();
  await page.locator('#cancelPurchaseDialog').waitFor({ state: 'hidden' });
  assert.equal(
    await page.evaluate(
      (id) => FF_STATE.bills.filter((b) => b.ruleId === id && b.status === 'cancelled').length,
      ruleId,
    ),
    3,
  );
  assert.equal(await page.locator('#monthlyBalanceValue').innerText(), '-R$ 285,00');
  assert(
    await page.evaluate(
      (id) => Boolean(FF_STATE.rules.find((r) => r.id === id).cancelledAt),
      ruleId,
    ),
  );
  await page.locator('#purchaseDialog [data-close]').click();
  pass(
    'Cancelamento remove compromissos pendentes e pode estornar o que já foi devolvido, preservando histórico',
  );
  await view('lancamentos');
  await page.locator('#btnPrevMonth').click();
  await page
    .locator('#transactionsListContainer [data-action="edit-tx"][data-id="prior_income"]')
    .click();
  await page.locator('#refundEditedTransaction').click();
  await page.locator('#refundAmount').fill('100');
  await page.locator('#confirmRefund').click();
  await page.locator('#refundDialog').waitFor({ state: 'hidden' });
  await page.locator('#composerDialog').waitFor({ state: 'hidden' });
  await page.locator('#btnCurrentMonth').click();
  assert.equal(await page.locator('#monthlyBalanceValue').innerText(), '-R$ 385,00');
  await view('relatorios');
  assert.equal(await page.locator('.bar.income.negative').count(), 1);
  assert((await page.locator('.chart-bars.diverging').count()) > 0);
  await page.screenshot({ path: path.join(siteDir, 'estornos-relatorio.png'), fullPage: true });
  await view('contas');
  pass(
    'Estorno de receita antiga afeta apenas o mês da devolução e aparece com sinal correto no gráfico',
  );
  const before = await count();
  await page.reload();
  await page.waitForFunction((n) => FF_STATE.transactions.length === n, before[0]);
  assert.deepEqual(await count(), before);
  await page.evaluate(() =>
    FF_Finance.validateFinancialGraph({
      transactions: FF_STATE.transactions,
      bills: FF_STATE.bills,
      rules: FF_STATE.rules,
    }),
  );
  pass('Reabrir preserva cancelamentos, antecipações e estornos sem recriar parcelas');
  await openSettings();
  const dp = page.waitForEvent('download');
  await page.locator('#btnExportJSON').click();
  const download = await dp,
    backup = JSON.parse(
      await page.evaluate(async (url) => await (await fetch(url)).text(), download.url()),
    );
  assert.equal(backup.schemaVersion, 3);
  assert(backup.transactions.some((t) => t.entryKind === 'reversal'));
  const orphan = {
    schemaVersion: 3,
    transactions: [],
    bills: [
      {
        id: 'invalid_paid',
        description: 'Sem vínculo',
        type: 'expense',
        category: 'Outros Gastos',
        amount: 500,
        dueDate: dates.today,
        status: 'paid',
        transactionId: 'inexistente',
      },
    ],
    rules: [],
  };
  await page.locator('#inputImportJSON').setInputFiles({
    name: 'invalido.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(orphan)),
  });
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#confirmDialog').isVisible(), false);
  assert.deepEqual(await count(), before);
  assert.match(await page.locator('#toastRegion').innerText(), /não existe/);
  pass(
    'Backup com conta paga sem lançamento é rejeitado antes da confirmação e de qualquer gravação',
  );
  const badRefund = structuredClone(backup);
  badRefund.transactions.find((t) => t.entryKind === 'reversal').amount = 999999;
  await page.locator('#inputImportJSON').setInputFiles({
    name: 'estorno-invalido.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(badRefund)),
  });
  await page.waitForTimeout(100);
  assert.deepEqual(await count(), before);
  assert.match(await page.locator('#toastRegion').innerText(), /ultrapassam/);
  pass('Backup com estorno maior que o original também é rejeitado');
  await page.locator('#inputImportJSON').setInputFiles({
    name: 'coerente.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.locator('#confirmAccept').click();
  await page.waitForFunction(() => !FF_STATE.busy);
  assert.deepEqual(await count(), before);
  await closeSettings();
  pass('Backup coerente restaura por mesclagem sem duplicar pagamentos ou estornos');
  await page.setViewportSize({ width: 390, height: 844 });
  await view('contas');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: path.join(siteDir, 'previsao-celular.png'), fullPage: true });
  await page.locator('#privacyButton').click();
  assert(!/R\$\s*\d/.test(await page.locator('#forecastCards').innerText()));
  await page.locator('#privacyButton').click();
  pass('Previsão funciona no celular e respeita a opção de ocultar valores');
  await openSettings();
  await page.locator('#btnLogout').click();
  await page.locator('#tabRegisterBtn').click();
  await page.locator('#authIdentifier').fill('jo_o');
  await page.locator('#authPassword').fill('senha-nova');
  await page.locator('#btnAuthSubmit').click();
  await page.locator('#appWrapper').waitFor({ state: 'visible' });
  const newKey = await page.evaluate(() => FF_STATE.loggedAccount.accountKey);
  assert.match(newKey, /^acct_/);
  assert.notEqual(newKey, 'jo_o');
  assert.deepEqual(await count(), [0, 0, 0]);
  pass('João antigo e jo_o novo recebem identidades distintas, sem misturar dados');
  await openSettings();
  await page.locator('#inputImportJSON').setInputFiles({
    name: 'restaurar-em-outra-conta.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.locator('#confirmAccept').click();
  await page.waitForFunction((n) => FF_STATE.transactions.length === n, before[0]);
  await page.waitForFunction(() => !FF_STATE.busy);
  await page.evaluate(() =>
    FF_Finance.validateFinancialGraph({
      transactions: FF_STATE.transactions,
      bills: FF_STATE.bills,
      rules: FF_STATE.rules,
    }),
  );
  const ownership = await page.evaluate(async () => {
    const all = await FF_LocalDB.getAll(FF_LocalDB.STORE_TX);
    return {
      old: all.filter((t) => t.accountKey === 'jo_o').length,
      current: all.filter((t) => t.accountKey === FF_STATE.loggedAccount.accountKey).length,
    };
  });
  assert.equal(ownership.old, before[0]);
  assert.equal(ownership.current, before[0]);
  await closeSettings();
  pass('Restaurar estornos em outra conta remapeia todos os vínculos e preserva a conta anterior');

  await openSettings();
  await page.locator('#btnLogout').click();
  await page.locator('#authIdentifier').fill('JOA\u0303O');
  await page.locator('#authPassword').fill('senha-antiga');
  await page.locator('#btnAuthSubmit').click();
  await page.locator('#appWrapper').waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => FF_STATE.loggedAccount.accountKey), 'jo_o');
  assert.deepEqual(await count(), before);
  pass(
    'Login antigo continua válido com acentos em formato equivalente e diferenças de maiúsculas',
  );
  assert.equal(errors.length, 0, errors.join('\n'));
  pass('Nenhum erro JavaScript não tratado nos novos fluxos');
  fs.writeFileSync(
    path.join(siteDir, 'management-results.json'),
    JSON.stringify({ results, errors }, null, 2),
  );
})()
  .catch(async (error) => {
    console.error(error);
    results.push({ name: 'Falha', ok: false, error: error.stack });
    if (page) {
      await page
        .screenshot({ path: path.join(siteDir, 'management-failure.png'), fullPage: true })
        .catch(() => {});
    }
    fs.writeFileSync(
      path.join(siteDir, 'management-results.json'),
      JSON.stringify({ results, errors }, null, 2),
    );
    process.exitCode = 1;
  })
  .finally(async () => browser?.close());
