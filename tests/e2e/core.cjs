const { prepareSuite, launchBrowser, projectRoot } = require('./support.cjs');
const siteDir = prepareSuite('core');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const results = [];
let browser, page;
const errors = [];
function pass(name) {
  results.push({ name, ok: true });
  console.log('OK', name);
}
async function count(n) {
  await page.waitForFunction((n) => FF_STATE.transactions.length === n, n);
}
async function closeDialog() {
  await page.locator('#composerDialog [data-close]').first().click();
}
async function newManual(bill = false) {
  await page
    .locator(bill ? '[data-action="new-bill"]' : '[data-action="new"]')
    .filter({ visible: true })
    .first()
    .click();
  if (!bill) {
    await page.locator('[data-compose="manual"]').click();
  }
}
async function fillManual(description, amount, date) {
  await page.locator('#manualDescription').fill(description);
  await page.locator('#manualAmount').fill(amount);
  await page.locator('#manualDate').fill(date);
}
async function waitDialogClosed() {
  await page.locator('#composerDialog').waitFor({ state: 'hidden' });
}
(async () => {
  const url = 'file:///' + siteDir.replace(/\\/g, '/');
  fs.writeFileSync(path.join(siteDir, 'seed.html'), '<!doctype html><title>seed</title>');
  fs.mkdirSync(path.join(siteDir, 'downloads'), { recursive: true });
  browser = await launchBrowser({ headless: true, downloadsPath: path.join(siteDir, 'downloads') });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1040 },
    timezoneId: 'America/Bahia',
    acceptDownloads: true,
  });
  page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
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
  await page.goto(url + '/seed.html');
  const seeded = await page.evaluate(async () => {
    const req = indexedDB.open('FinancasFacilMultiDeviceDB', 3);
    await new Promise((resolve, reject) => {
      req.onupgradeneeded = () => {
        for (const [name, key] of [
          ['movimentacoes', 'id'],
          ['usuarios_cache', 'accountKey'],
          ['sessao_ativa', 'key'],
          ['exclusoes_pendentes', 'id'],
        ]) {
          req.result.createObjectStore(name, { keyPath: key });
        }
      };
      req.onsuccess = resolve;
      req.onerror = reject;
    });
    const db = req.result;
    const now = new Date(),
      date = new Date(now.getFullYear(), now.getMonth(), 1),
      prev = new Date(now.getFullYear(), now.getMonth() - 1, 10);
    const iso = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const key = 'usuario_existente',
      salt = 'test-salt',
      base = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('senha123'),
        { name: 'PBKDF2' },
        false,
        ['deriveBits'],
      ),
      bits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode(key + '::' + salt),
          iterations: 100000,
          hash: 'SHA-256',
        },
        base,
        256,
      );
    const hash = [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
    const user = {
      accountKey: key,
      identifier: key,
      displayName: 'Gabriel Teste',
      salt,
      kdf: 'PBKDF2-SHA256',
      passwordHash: hash,
    };
    const items = [
      ['old_salary', 'income', 5000, 'Salário', 'Salário & Pró-labore', iso(date)],
      ['old_market', 'expense', 250, 'Mercado', 'Alimentação & Mercado', iso(date)],
      ['old_power', 'expense', 120, 'Energia', 'Moradia & Contas', iso(date)],
      ['old_invest', 'investment', 500, 'Tesouro Selic', 'Renda Fixa (CDB / Tesouro)', iso(date)],
      ['prev_market', 'expense', 400, 'Viagem anterior', 'Lazer & Restaurantes', iso(prev)],
      ['prev_salary', 'income', 4500, 'Salário anterior', 'Salário & Pró-labore', iso(prev)],
    ].map(([id, type, amount, description, category, date]) => ({
      id,
      type,
      amount,
      description,
      category,
      date,
      accountKey: key,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncedWithCloud: false,
    }));
    const tx = db.transaction(['usuarios_cache', 'sessao_ativa', 'movimentacoes'], 'readwrite');
    tx.objectStore('usuarios_cache').put(user);
    tx.objectStore('sessao_ativa').put({
      key: 'activeUser',
      accountKey: key,
      identifier: key,
      displayName: user.displayName,
    });
    for (const item of items) {
      tx.objectStore('movimentacoes').put(item);
    }
    tx.objectStore('movimentacoes').put({
      ...items[0],
      id: 'other_user_tx',
      accountKey: 'outra_conta',
      amount: 123,
    });
    await new Promise((r) => (tx.oncomplete = r));
    db.close();
    return { today: iso(now), month: iso(date).slice(0, 7) };
  });
  await page.goto(url + '/index.html');
  await page.locator('#appWrapper').waitFor({ state: 'visible' });
  await count(6);
  assert.equal(await page.evaluate(async () => (await FF_LocalDB.open()).version), 4);
  assert.equal(await page.locator('#monthlyBalanceValue').innerText(), 'R$ 4.630,00');
  pass('Migração v3 → v4 preserva conta, senha, sessão e seis registros antigos');
  assert.match(await page.locator('#syncStatusText').innerText(), /Salvo neste aparelho/);
  pass('Modo local não informa sincronização inexistente');
  assert.equal(await page.locator('[data-compose]').count(), 2);
  assert.equal(await page.locator('[data-compose="voice"]').count(), 0);
  assert.equal(
    await page.evaluate(() => FF_STATE.transactions.find((t) => t.id === 'prev_market').category),
    'Lazer & Viagens',
  );
  assert.equal(
    await page.evaluate(
      () => FF_NLP.parseNaturalLanguageInput('Paguei 500 de hospedagem na viagem')[0].category,
    ),
    'Lazer & Viagens',
  );
  pass('Duas abas, microfone na primeira e categoria antiga reconhecida como Lazer & Viagens');
  await page.screenshot({ path: path.join(siteDir, 'desktop-inicio.png'), fullPage: true });
  await page.locator('[data-action="new"]').filter({ visible: true }).first().click();
  await page.locator('#commandInput').fill('Gastei 89,90 no supermercado hoje');
  await page.locator('#btnSubmitCommand').click();
  await page.locator('#previewPanel').waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => FF_STATE.transactions.length), 6);
  assert.equal(await page.locator('[data-draft-field="amount"]').inputValue(), '89,90');
  await page.locator('[data-draft-field="description"]').fill('Supermercado conferido');
  await page.locator('#confirmPreview').click();
  await count(7);
  await waitDialogClosed();
  pass('Texto com vírgula só salva após prévia e permite corrigir descrição');
  await page.locator('[data-action="new"]').filter({ visible: true }).first().click();
  await page.locator('#btnMic').click();
  await page.evaluate(() =>
    FF_NLP.recognition.onresult({
      resultIndex: 0,
      results: [[{ transcript: 'Recebi 80 de vendas' }]],
    }),
  );
  await page.locator('#btnStopVoiceBanner').click();
  await page.locator('#previewPanel').waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => FF_STATE.transactions.length), 7);
  await page.locator('#confirmPreview').click();
  await count(8);
  await waitDialogClosed();
  pass('Áudio simulado cria prévia ao parar e aguarda confirmação');
  await page.locator('a[data-view="contas"]').filter({ visible: true }).first().click();
  await newManual(true);
  await fillManual('Aluguel recorrente', '1200,00', '2026-01-31');
  await page.locator('#manualFrequency').selectOption('monthly');
  await page.locator('#manualSaveButton').click();
  await waitDialogClosed();
  const monthly = await page.evaluate(() =>
    FF_STATE.bills.filter((b) => b.description === 'Aluguel recorrente').map((b) => b.dueDate),
  );
  assert(monthly.includes('2026-02-28'));
  assert(monthly.includes('2026-03-31'));
  assert.equal(await page.evaluate(() => FF_STATE.transactions.length), 8);
  pass('Recorrência mensal ajusta 31/01 para 28/02 e volta a 31/03, sem alterar saldo');
  await newManual(true);
  await fillManual('Compra parcelada teste', '100,00', seeded.today);
  await page.locator('#manualFrequency').selectOption('installment');
  await page.locator('#manualInstallments').fill('3');
  await page.locator('#manualSaveButton').click();
  await waitDialogClosed();
  const installments = await page.evaluate(() =>
    FF_STATE.bills
      .filter((b) => b.description === 'Compra parcelada teste')
      .sort((a, b) => a.installmentNumber - b.installmentNumber),
  );
  assert.equal(installments.length, 3);
  assert.equal(
    installments.reduce((s, b) => s + Math.round(b.amount * 100), 0),
    10000,
  );
  assert.deepEqual(
    installments.map((b) => b.amount),
    [33.34, 33.33, 33.33],
  );
  pass('Parcelamento divide R$ 100 em 3 e mantém a soma exata dos centavos');
  const first = installments[0];
  await page.locator(`[data-action="pay-bill"][data-id="${first.id}"]`).first().click();
  await page.locator('#confirmSettlement').click();
  await count(9);
  assert.equal(
    await page.evaluate((id) => FF_STATE.bills.find((b) => b.id === id).status, first.id),
    'paid',
  );
  pass('Marcar conta como paga cria exatamente um lançamento vinculado');
  await page.locator('[data-bill-filter="paid"]').click();
  assert.match(await page.locator('#billsList').innerText(), /Compra parcelada teste/);
  pass('Agenda separa a vencer, atrasadas e pagas');
  await page.locator('a[data-view="lancamentos"]').filter({ visible: true }).first().click();
  const newTx = await page.evaluate(
    () => FF_STATE.transactions.find((t) => t.description === 'Supermercado conferido').id,
  );
  await page
    .locator(`#transactionsListContainer [data-action="edit-tx"][data-id="${newTx}"]`)
    .first()
    .click();
  await page.locator('#manualAmount').fill('91,20');
  await page.locator('#manualSaveButton').click();
  await waitDialogClosed();
  assert.equal(
    await page.evaluate((id) => FF_STATE.transactions.find((t) => t.id === id).amount, newTx),
    91.2,
  );
  pass('Edição de lançamento aceita centavos em português');
  await page
    .locator(`#transactionsListContainer [data-action="edit-tx"][data-id="${newTx}"]`)
    .first()
    .click();
  await page.locator('#deleteEditedTransaction').click();
  await page.locator('#confirmAccept').click();
  await count(8);
  await page.locator('#toastAction').click();
  await count(9);
  pass('Exclusão tem confirmação e permite desfazer');
  await page.locator('[data-filter="income"]').click();
  assert.equal(await page.locator('#transactionsListContainer .transaction-row').count(), 2);
  await page.locator('[data-filter="all"]').click();
  await page.locator('#searchInput').fill('Supermercado conferido');
  assert.equal(await page.locator('#transactionsListContainer .transaction-row').count(), 1);
  await page.locator('#searchInput').fill('');
  pass('Busca e filtros funcionam no extrato agrupado por dia');
  await page.locator('a[data-view="relatorios"]').filter({ visible: true }).first().click();
  assert.equal(await page.locator('#trendTable tbody tr').count(), 6);
  assert.match(await page.locator('#reportInsights').innerText(), /mês anterior/);
  await page.screenshot({ path: path.join(siteDir, 'desktop-relatorios.png'), fullPage: true });
  pass('Relatórios com seis meses, tabela acessível, comparação e categorias');
  await page.locator('#privacyButton').click();
  assert.equal(await page.locator('#privacyButton').getAttribute('aria-pressed'), 'true');
  assert(!/R\$\s*[0-9]/.test(await page.locator('#view-relatorios').innerText()));
  pass('Privacidade oculta valores dos relatórios, tabelas e descrições');
  await page.locator('#privacyButton').click();
  // Falha de gravação não deve confirmar nem apagar o formulário.
  await newManual();
  await fillManual('Falha simulada', '12,50', seeded.today);
  await page.evaluate(() => {
    window._commit = FF_LocalDB.commit;
    FF_LocalDB.commit = async () => {
      throw new Error('Falha simulada de armazenamento');
    };
  });
  await page.locator('#manualSaveButton').click();
  await page.locator('#composerError').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#manualDescription').inputValue(), 'Falha simulada');
  assert.equal(await page.evaluate(() => FF_STATE.transactions.length), 9);
  await page.evaluate(() => {
    FF_LocalDB.commit = window._commit;
    delete window._commit;
  });
  await closeDialog();
  pass('Falha ao salvar mantém dados preenchidos e não informa sucesso');
  // Exportação real via evento de download do navegador.
  await page.locator('[data-action="settings"]').filter({ visible: true }).first().click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#btnExportJSON').click();
  const download = await downloadPromise;
  const downloadPath = path.join(siteDir, 'backup-test.json');
  const exported = await page.evaluate(
    async (url) => await (await fetch(url)).text(),
    download.url(),
  );
  fs.writeFileSync(downloadPath, exported);
  const backup = JSON.parse(exported);
  assert.equal(backup.schemaVersion, 3);
  assert.equal(backup.transactions.length, 9);
  assert(backup.bills.length >= 3 && backup.rules.length === 2);
  assert.equal(backup.passwordHash, undefined);
  pass('Exportação gera JSON com lançamentos, contas e regras, sem senha');
  await page.locator('#settingsDialog [data-close]').click();
  await page.reload();
  await count(9);
  assert.equal(await page.evaluate(() => FF_STATE.rules.length), 2);
  pass('Recarregar restaura lançamentos, recorrências e parcelas sem duplicar');
  // Cancelar uma ocorrência e encerrar a recorrência mantém histórico.
  await page.locator('a[data-view="contas"]').filter({ visible: true }).first().click();
  await page.locator('[data-bill-filter="all"]').click();
  const cancelId = installments[1].id;
  await page.locator('#btnNextMonth').click();
  await page.locator(`[data-action="cancel-bill"][data-id="${cancelId}"]`).click();
  await page.locator('#confirmAccept').click();
  await page.waitForFunction(
    (id) => FF_STATE.bills.find((b) => b.id === id).status === 'cancelled',
    cancelId,
  );
  await page.reload();
  await count(9);
  assert.equal(
    await page.evaluate((id) => FF_STATE.bills.filter((b) => b.id === id).length, cancelId),
    1,
  );
  pass('Ocorrência cancelada não reaparece após reabrir');
  await page.locator('a[data-view="contas"]').filter({ visible: true }).first().click();
  const recurringId = await page.evaluate(
    () => FF_STATE.rules.find((r) => r.frequency === 'monthly').id,
  );
  await page.locator(`[data-action="stop-rule"][data-id="${recurringId}"]`).click();
  await page.locator('#confirmAccept').click();
  await page.waitForFunction(
    (id) => FF_STATE.rules.find((r) => r.id === id).disabledAfter,
    recurringId,
  );
  assert.equal(await page.evaluate(() => FF_STATE.transactions.length), 9);
  pass('Encerrar recorrência preserva histórico de lançamentos');
  // Restaura uma cópia antiga por mesclagem, não adiciona cópias repetidas dos mesmos IDs.
  await page.locator('[data-action="settings"]').filter({ visible: true }).first().click();
  await page.locator('#inputImportJSON').setInputFiles(downloadPath);
  await page.locator('#confirmAccept').click();
  await page.waitForFunction(
    () =>
      !FF_STATE.busy && FF_STATE.rules.some((r) => r.frequency === 'monthly' && !r.disabledAfter),
  );
  assert.equal(await page.evaluate(() => FF_STATE.transactions.length), 9);
  pass('Restauração mescla os mesmos IDs e cria cópia antes de importar');
  await page.locator('#settingsDialog [data-close]').click();
  // Senha da conta antiga continua funcionando, e outra conta não vê seus registros.
  await page.locator('[data-action="settings"]').filter({ visible: true }).first().click();
  await page.locator('#btnLogout').click();
  await page.locator('#authScreen').waitFor({ state: 'visible' });
  await page.locator('#authIdentifier').fill('usuario_existente');
  await page.locator('#authPassword').fill('senha123');
  await page.locator('#btnAuthSubmit').click();
  await page.locator('#appWrapper').waitFor({ state: 'visible' });
  await count(9);
  pass('Senha PBKDF2 existente continua válida após atualização');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('a[data-view="inicio"]').filter({ visible: true }).first().click();
  await page.screenshot({ path: path.join(siteDir, 'mobile-inicio.png'), fullPage: true });
  assert(await page.locator('.bottom-nav').isVisible());
  assert(await page.locator('.mobile-fab').isVisible());
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  pass('Celular: navegação inferior e botão novo acessíveis, sem rolagem horizontal');
  await page.locator('a[data-view="contas"]').filter({ visible: true }).first().click();
  await page.screenshot({ path: path.join(siteDir, 'mobile-contas.png'), fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.locator('.mobile-fab').click();
  await page.locator('#commandInput').fill('Gastei 1.000,50 no mercado e investi 500 na reserva');
  await page.locator('#btnSubmitCommand').click();
  await page.screenshot({ path: path.join(siteDir, 'mobile-previa.png'), fullPage: true });
  assert.equal(await page.locator('.draft-card').count(), 2);
  assert.equal(await page.locator('[data-draft-field="amount"]').first().inputValue(), '1000,50');
  pass('Prévia no celular mantém dois lançamentos e reconhece milhar com centavos');
  await closeDialog();
  await page.locator('[data-action="settings"]').filter({ visible: true }).first().click();
  await page.locator('#themeSelect').selectOption('dark');
  await page.locator('#settingsDialog [data-close]').click();
  await page.locator('a[data-view="inicio"]').filter({ visible: true }).first().click();
  await page.screenshot({ path: path.join(siteDir, 'mobile-escuro.png'), fullPage: true });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  pass('Tema escuro aplicado e preferência persistida');
  await page.setViewportSize({ width: 320, height: 740 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: path.join(siteDir, 'mobile-320.png'), fullPage: true });
  pass('Layout comporta tela estreita de 320px');

  // Confirmação de duplicado e cancelamento conservam a prévia sem gravar.
  await page.locator('.mobile-fab').click();
  await page.locator('#commandInput').fill('Gastei 91,20 no Supermercado conferido hoje');
  await page.locator('#btnSubmitCommand').click();
  await page.locator('#confirmPreview').click();
  await page.locator('#confirmDialog').waitFor({ state: 'visible' });
  await page.locator('#confirmCancel').click();
  assert.equal(await page.evaluate(() => FF_STATE.transactions.length), 9);
  await closeDialog();
  pass('Possível duplicado exige confirmação; cancelar não grava');
  // Mesmo navegador, outra conta e restauração: nenhum registro da conta antiga é sobrescrito.
  await page.locator('[data-action="settings"]').filter({ visible: true }).first().click();
  await page.locator('#btnLogout').click();
  await page.locator('#tabRegisterBtn').click();
  await page.locator('#authName').fill('Segunda conta');
  await page.locator('#authIdentifier').fill('segunda_conta');
  await page.locator('#authPassword').fill('outrasenha');
  await page.locator('#btnAuthSubmit').click();
  await page.locator('#appWrapper').waitFor({ state: 'visible' });
  await count(0);
  assert.equal(await page.evaluate(() => FF_STATE.bills.length), 0);
  assert.equal(await page.evaluate(() => FF_STATE.snapshots.length), 0);
  pass('Nova conta no mesmo navegador não enxerga dados nem cópias da conta anterior');
  await page.locator('[data-action="settings"]').filter({ visible: true }).first().click();
  await page.locator('#inputImportJSON').setInputFiles(downloadPath);
  await page.locator('#confirmAccept').click();
  await count(9);
  await page.waitForFunction(() => !FF_STATE.busy);
  const protectedCounts = await page.evaluate(async () => {
    const all = await FF_LocalDB.getAll(FF_LocalDB.STORE_TX);
    return [
      all.filter((t) => t.accountKey === 'usuario_existente').length,
      all.filter((t) => t.accountKey === FF_STATE.loggedAccount.accountKey).length,
    ];
  });
  assert.deepEqual(protectedCounts, [9, 9]);
  assert.equal(
    await page.evaluate(
      () => FF_STATE.bills.filter((b) => b.description === 'Compra parcelada teste').length,
    ),
    3,
  );
  pass('Importação em outra conta remapeia IDs sem sobrescrever registros ou duplicar parcelas');
  const invalidFile = {
    name: 'invalido.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        transactions: [{ id: 'x', type: 'expense', amount: -50, date: '2026-11-04' }],
      }),
    ),
  };
  await page.locator('#inputImportJSON').setInputFiles(invalidFile);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => FF_STATE.transactions.length), 9);
  pass('Backup inválido é rejeitado antes de alterar os dados');
  await page.locator('#settingsDialog [data-close]').click();
  // A versão anterior pode abrir o banco atualizado sem apagar as tabelas novas.
  const restoreDir = path.join(siteDir, 'restore-test');
  fs.mkdirSync(restoreDir, { recursive: true });
  for (const name of ['app.js', 'style.css', 'index.html', 'config.js']) {
    fs.copyFileSync(
      path.join(projectRoot, 'tests/fixtures/previous-version', name),
      path.join(restoreDir, name),
    );
  }
  await context.route('https://cdn.jsdelivr.net/**', (r) => r.abort());
  await page.goto(url + '/restore-test/index.html');
  await page.waitForFunction(() => window.FF_STATE?.transactions.length === 9);
  assert.equal(await page.evaluate(async () => (await FF_LocalDB.open()).version), 4);
  pass('Backup da versão anterior abre com compatibilidade sem apagar o banco atualizado');

  assert.equal(errors.length, 0, errors.join('\n'));
  pass('Nenhum erro JavaScript não tratado durante os fluxos');
  // Arquivos abertos diretamente, sem servidor, também inicializam.
  const fileContext = await browser.newContext();
  await fileContext.route('https://fonts.googleapis.com/**', (r) => r.abort());
  const filePage = await fileContext.newPage();
  const fileErrors = [];
  filePage.on('pageerror', (e) => fileErrors.push(e.message));
  await filePage.goto('file:///' + path.join(siteDir, 'index.html').replace(/\\/g, '/'));
  await filePage.locator('#authScreen').waitFor({ state: 'visible' });
  assert.equal(fileErrors.length, 0);
  pass('Abertura direta do index.html funciona sem servidor');
  await fileContext.close();
  fs.writeFileSync(
    path.join(siteDir, 'test-results.json'),
    JSON.stringify({ results, errors }, null, 2),
  );
  console.log('TOTAL', results.length, 'verificações passaram.');
})()
  .catch(async (e) => {
    console.error(e);
    results.push({ name: 'Falha', ok: false, error: e.stack });
    if (page) {
      try {
        await page.screenshot({ path: path.join(siteDir, 'failure.png'), fullPage: true });
      } catch {
        // Uma falha ao capturar a tela não deve esconder a falha original do teste.
      }
    }
    fs.writeFileSync(
      path.join(siteDir, 'test-results.json'),
      JSON.stringify({ results, errors }, null, 2),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
  });
