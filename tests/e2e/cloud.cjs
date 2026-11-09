const { prepareSuite, launchBrowser } = require('./support.cjs');
const siteDir = prepareSuite('cloud');
const siteUrl = 'https://financasfacil.example.test/';
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const remote = new Map(),
  results = [],
  errors = [];
let browser;
const fakeSDK = String.raw`
export function createClient(url, _key, { auth: { storage, flowType } }) {
  if (flowType !== 'pkce') throw new Error('O teste exige PKCE');
  const storageKey = 'mock-session';
  let session = JSON.parse(storage.getItem(storageKey));
  const listeners = new Set();
  const emit = (event) => { for (const listener of listeners) listener(event, session); };
  function saveSession(result, event) {
    session = result.data.session;
    storage.setItem(storageKey, JSON.stringify(session));
    emit(event);
  }
  function saveVerifier() {
    storage.setItem(storageKey + '-flow-mock-code-verifier', 'verifier');
  }
  async function api(input, signal) {
    const response = await fetch(url + '/mock', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...input, token: session?.access_token }),
      signal,
    });
    return response.json();
  }
  const auth = {
    getSession: async () => ({ data: { session }, error: null }),
    getUser: async () => api({ action: 'user' }),
    async signInWithPassword(credentials) {
      const result = await api({ action: 'login', credentials });
      if (!result.error) {
        saveSession(result, 'SIGNED_IN');
      }
      return result;
    },
    async signUp(credentials) {
      saveVerifier();
      return api({ action: 'signup', credentials });
    },
    async resetPasswordForEmail(email, options) {
      saveVerifier();
      return api({ action: 'reset', email, options });
    },
    async signInWithOAuth({ provider, options }) {
      saveVerifier();
      const result = await api({ action: 'oauth', provider, options });
      if (!result.error) {
        location.assign(options.redirectTo + '?code=' + result.data.code + '&sb_flow_id=mock');
      }
      return result;
    },
    async exchangeCodeForSession(code, { flowId } = {}) {
      const key = storageKey + '-flow-' + flowId + '-code-verifier';
      const verifier = storage.getItem(key);
      const result = await api({ action: 'exchange', code, verifier });
      storage.removeItem(key);
      if (!result.error) saveSession(result, result.data.redirectType === 'recovery' ? 'PASSWORD_RECOVERY' : 'SIGNED_IN');
      return result;
    },
    async updateUser(attributes) {
      const result = await api({ action: 'update-user', attributes });
      if (!result.error) {
        session.user = result.data.user;
        storage.setItem(storageKey, JSON.stringify(session));
        emit('USER_UPDATED');
      }
      return result;
    },
    async signOut() {
      session = null;
      storage.removeItem(storageKey);
      emit('SIGNED_OUT');
      return { error: null };
    },
    onAuthStateChange(listener) {
      listeners.add(listener);
      queueMicrotask(() => listener('INITIAL_SESSION', session));
      return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
    },
  };
  return {
    auth,
    from(table) {
      const query = { table };
      const builder = {
        upsert(rows, options) { Object.assign(query, { action: 'put', rows, options }); return builder; },
        select(columns) { Object.assign(query, { action: 'list', columns }); return builder; },
        eq(field, value) { query.owner = value; query.filter = field; return builder; },
        order() { return builder; },
        range(start, end) { Object.assign(query, { start, end }); return builder; },
        abortSignal(signal) { return api(query, signal); },
      };
      return builder;
    },
  };
}
`;
const users = new Map([
  ['pessoal@example.test', '11111111-1111-4111-8111-111111111111'],
  ['outra@example.test', '22222222-2222-4222-8222-222222222222'],
]);
const passwords = new Map([...users.keys()].map((email) => [email, 'senha123']));
const metadata = new Map();
const codes = new Map();
function mockUser(email) {
  return {
    id: users.get(email),
    email,
    user_metadata: metadata.get(email) ?? {},
    identities: [{ provider: 'email' }],
  };
}
function mockSession(email, redirectType = null) {
  const user = mockUser(email);
  return {
    data: { user, session: { user, access_token: 'mock-' + email }, redirectType },
    error: null,
  };
}
function pass(name) {
  results.push({ name, ok: true });
  console.log('OK', name);
}
async function context() {
  const c = await browser.newContext({ timezoneId: 'America/Bahia' });
  await c.addInitScript(() => {
    window.FF_SUPABASE_CONFIG = {
      url: 'https://testefinancas.supabase.co',
      publishableKey: 'sb_publishable_teste',
      authProviders: { google: true, apple: true },
    };
  });
  await c.route(siteUrl + '**', (route) => {
    const name = new URL(route.request().url()).pathname.slice(1) || 'index.html';
    if (!/^(?:[\w.]+|assets\/[\w.-]+)$/.test(name) || name.includes('..')) {
      return route.abort();
    }
    return route.fulfill({ path: path.join(siteDir, name) });
  });
  await c.route('https://fonts.googleapis.com/**', (r) => r.abort());
  await c.route('https://fonts.gstatic.com/**', (r) => r.abort());
  await c.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@*/+esm', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      headers: { 'access-control-allow-origin': '*' },
      body: fakeSDK,
    }),
  );
  await c.route('https://testefinancas.supabase.co/mock', async (route) => {
    const headers = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'POST,OPTIONS',
    };
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers, body: '' });
      return;
    }
    const query = route.request().postDataJSON();
    const email = [...users.keys()].find((address) => 'mock-' + address === query.token);
    const owner = users.get(email);
    let value = { data: null, error: { message: 'Acesso negado' } };
    if (query.action === 'login') {
      const address = query.credentials.email;
      if (users.has(address) && query.credentials.password === passwords.get(address)) {
        value = mockSession(address);
      }
    } else if (query.action === 'signup') {
      const { email: address, password, options } = query.credentials;
      assert.equal(options.emailRedirectTo, siteUrl);
      users.set(address, '33333333-3333-4333-8333-333333333333');
      passwords.set(address, password);
      metadata.set(address, options.data);
      codes.set('signup', { email: address, redirectType: null });
      value = { data: { user: mockUser(address), session: null }, error: null };
    } else if (query.action === 'reset') {
      assert.equal(query.options.redirectTo, siteUrl);
      codes.set('recovery', { email: query.email, redirectType: 'recovery' });
      value = { data: {}, error: null };
    } else if (query.action === 'oauth') {
      assert.equal(query.options.redirectTo, siteUrl);
      assert.ok(['google', 'apple'].includes(query.provider));
      codes.set(query.provider, { email: 'outra@example.test', redirectType: null });
      value = { data: { code: query.provider }, error: null };
    } else if (
      query.action === 'exchange' &&
      query.verifier === 'verifier' &&
      codes.has(query.code)
    ) {
      const auth = codes.get(query.code);
      codes.delete(query.code);
      value = mockSession(auth.email, auth.redirectType);
    } else if (query.action === 'user' && owner) {
      value = { data: { user: mockUser(email) }, error: null };
    } else if (query.action === 'update-user' && owner) {
      const { current_password: current, password, data } = query.attributes;
      if (current && current !== passwords.get(email)) {
        value = { data: null, error: { code: 'invalid_credentials' } };
      } else {
        if (password) {
          passwords.set(email, password);
        }
        if (data) {
          metadata.set(email, { ...metadata.get(email), ...data });
        }
        value = { data: { user: mockUser(email) }, error: null };
      }
    } else if (owner && query.table === 'ff_finance_records') {
      if (query.action === 'put' && query.rows.every((row) => row.owner_id === owner)) {
        assert.equal(query.options.onConflict, 'owner_id,entity,record_id');
        for (const row of query.rows) {
          const key = [row.owner_id, row.entity, row.record_id].join('/');
          const previous = remote.get(key);
          if (
            !previous ||
            row.updated_ms > previous.updated_ms ||
            (row.updated_ms === previous.updated_ms && row.revision > previous.revision)
          ) {
            remote.set(key, row);
          }
        }
        value = { data: null, error: null };
      } else if (query.action === 'list' && query.filter === 'owner_id' && query.owner === owner) {
        const rows = [...remote.entries()]
          .filter(([, row]) => row.owner_id === owner)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, row]) => row);
        value = { data: rows.slice(query.start, query.end + 1), error: null };
      }
    }
    await route.fulfill({ headers, contentType: 'application/json', body: JSON.stringify(value) });
  });
  return c;
}
async function logIn(page, email = 'pessoal@example.test') {
  await page.locator('#authIdentifier').fill(email);
  await page.locator('#authPassword').fill('senha123');
  await page.locator('#btnAuthSubmit').click();
  await page.locator('#appWrapper').waitFor({ state: 'visible' });
}
async function sync(p) {
  await p.locator('[data-action="settings"]').filter({ visible: true }).first().click();
  await p.locator('#btnForceSyncNow').click();
  await p.waitForFunction(() => !FF_STATE.syncBusy);
  await p.locator('#settingsDialog [data-close]').click();
}
async function manual(p, desc, amount) {
  await p.locator('[data-action="new"]').filter({ visible: true }).first().click();
  await p.locator('[data-compose="manual"]').click();
  await p.locator('#manualDescription').fill(desc);
  await p.locator('#manualAmount').fill(amount);
  await p.locator('#manualSaveButton').click();
  await p.locator('#composerDialog').waitFor({ state: 'hidden' });
}
(async () => {
  browser = await launchBrowser({ headless: true });
  const url = siteUrl + 'login.html';
  const c1 = await context(),
    p1 = await c1.newPage();
  p1.on('pageerror', (e) => errors.push(e.message));
  await p1.goto(siteUrl + '#error_code=otp_expired');
  await p1.locator('#authAlert').waitFor({ state: 'visible' });
  assert.equal(p1.url(), url);
  await p1.locator('#tabRegisterBtn').waitFor({ state: 'visible' });
  await p1.locator('#authIdentifier').fill('pessoal@example.test');
  await p1.locator('#authPassword').fill('incorreta');
  await p1.locator('#btnAuthSubmit').click();
  await p1.locator('#authAlert').waitFor({ state: 'visible' });
  assert.equal(await p1.locator('#appWrapper').isVisible(), false);
  await logIn(p1);
  await manual(p1, 'Lançamento sincronizado', '50,50');
  await p1.waitForFunction(() => FF_STATE.lastSync && FF_STATE.pendingCount === 0);
  assert([...remote.keys()].some((k) => k.includes('/tx/')));
  pass('Fila persistente envia o lançamento local para o adaptador da nuvem');
  const c2 = await context(),
    p2 = await c2.newPage();
  p2.on('pageerror', (e) => errors.push(e.message));
  await p2.goto(url);
  await logIn(p2);
  await p2.waitForFunction(() => FF_STATE.transactions.length === 1);
  assert.equal(await p2.evaluate(() => FF_STATE.transactions[0].amount), 50.5);
  pass('Segundo navegador autentica e recupera o mesmo lançamento');
  await p2.reload();
  await p2.locator('#appWrapper').waitFor({ state: 'visible' });
  const c3 = await context();
  const p3 = await c3.newPage();
  await p3.goto(url);
  await p3.locator('#authRememberMe').uncheck();
  await logIn(p3, 'outra@example.test');
  await p3.waitForFunction(() => FF_STATE.lastSync && !FF_STATE.syncBusy);
  assert.equal(await p3.evaluate(() => FF_STATE.transactions.length), 0);
  await p3.reload();
  await p3.locator('#authScreen').waitFor({ state: 'visible' });
  assert.equal(await p3.locator('#appWrapper').isVisible(), false);
  pass(
    'Sessão lembrada reabre, conta diferente tem dados isolados e sessão temporária expira ao recarregar',
  );
  const profileEmail = 'nova@example.test';
  await p3.locator('#tabRegisterBtn').click();
  await p3.locator('#authName').fill('Pessoa do cadastro');
  await p3.locator('#authIdentifier').fill(profileEmail);
  await p3.locator('#authPassword').fill('senhaCadastro');
  await p3.locator('#btnAuthSubmit').click();
  await p3.locator('#authNotice').waitFor({ state: 'visible' });
  assert.match(await p3.locator('#authNotice').innerText(), /confirmação/);
  await p3.goto(siteUrl + '?code=signup&sb_flow_id=mock');
  await p3.locator('#appWrapper').waitFor({ state: 'visible' });
  assert.equal(await p3.evaluate(() => FF_STATE.loggedAccount.displayName), 'Pessoa do cadastro');
  assert.ok(!p3.url().includes('code='));
  pass('Cadastro conserva o nome e abre a conta após confirmação por código PKCE');

  await p3.locator('[data-action="settings"]').filter({ visible: true }).first().click();
  await p3.locator('#profileName').fill('Nome atualizado');
  await p3.locator('#btnSaveProfile').click();
  await p3.waitForFunction(() => FF_STATE.loggedAccount.displayName === 'Nome atualizado');
  await p3.locator('#btnChangePassword').click();
  await p3.locator('#currentPassword').fill('senhaCadastro');
  await p3.locator('#newPassword').fill('senhaAlterada');
  await p3.locator('#newPasswordAgain').fill('senhaAlterada');
  await p3.locator('#btnSavePassword').click();
  await p3.locator('#changePasswordDialog').waitFor({ state: 'hidden' });
  assert.equal(passwords.get(profileEmail), 'senhaAlterada');
  await p3.waitForFunction(() => !FF_STATE.busy && !FF_STATE.syncBusy);
  await p3.locator('#btnLogout').click();
  await p3.locator('#btnForgotPassword').click();
  await p3.locator('#forgotEmail').fill(profileEmail);
  await p3.locator('#btnSendReset').click();
  await p3.locator('#authNotice').waitFor({ state: 'visible' });
  await p3.goto(siteUrl + '?code=recovery&sb_flow_id=mock');
  await p3.locator('#resetPasswordForm').waitFor({ state: 'visible' });
  assert.equal(await p3.locator('#appWrapper').isVisible(), false);
  assert.equal(await p3.evaluate(() => localStorage.getItem('mock-session')), null);
  await p3.locator('#resetPassword').fill('senhaRecuperada');
  await p3.locator('#resetPasswordAgain').fill('senhaRecuperada');
  await p3.locator('#btnResetPassword').click();
  await p3.locator('#appWrapper').waitFor({ state: 'visible' });
  assert.equal(passwords.get(profileEmail), 'senhaRecuperada');
  assert.equal(await p3.evaluate(() => FF_STATE.loggedAccount.displayName), 'Nome atualizado');
  pass('Perfil salva nome e senha, e recuperação aguarda nova senha antes de mostrar os dados');

  for (const provider of ['Google', 'Apple']) {
    const socialContext = await context();
    const social = await socialContext.newPage();
    await social.goto(url);
    await social.locator('#btnAuth' + provider).click();
    await social.locator('#appWrapper').waitFor({ state: 'visible' });
    assert.equal(
      await social.evaluate(() => FF_STATE.loggedAccount.identifier),
      'outra@example.test',
    );
    await socialContext.close();
  }
  pass('Google e Apple iniciam o provedor selecionado e retomam a conta no retorno simulado');

  await c1.setOffline(true);
  await manual(p1, 'Salvo sem conexão', '20,00');
  assert.equal(await p1.evaluate(() => FF_STATE.transactions.length), 2);
  assert((await p1.evaluate(() => FF_STATE.pendingCount)) > 0);
  assert.equal([...remote.keys()].filter((k) => k.includes('/tx/')).length, 1);
  pass('Sem conexão mantém lançamento e alteração na fila local');
  await c1.setOffline(false);
  await p1.waitForFunction(() => FF_STATE.pendingCount === 0 && !FF_STATE.syncBusy);
  await sync(p2);
  await p2.waitForFunction(() => FF_STATE.transactions.length === 2);
  pass('Reconexão envia pendência e outro navegador recupera os dados');
  const txId = await p1.evaluate(
    () => FF_STATE.transactions.find((t) => t.description === 'Lançamento sincronizado').id,
  );
  await p1.locator('a[data-view="lancamentos"]').filter({ visible: true }).click();
  await p1.locator(`#transactionsListContainer [data-action="edit-tx"][data-id="${txId}"]`).click();
  await p1.locator('#deleteEditedTransaction').click();
  await p1.locator('#confirmAccept').click();
  await p1.waitForFunction(
    () => FF_STATE.transactions.length === 1 && FF_STATE.pendingCount === 0 && !FF_STATE.syncBusy,
  );
  await sync(p2);
  await p2.waitForFunction(() => FF_STATE.transactions.length === 1);
  pass('Exclusão propaga por marcador e não reaparece no outro navegador');
  await p1.locator('a[data-view="contas"]').filter({ visible: true }).click();
  await p1.locator('[data-action="new-bill"]').filter({ visible: true }).first().click();
  await p1.locator('#manualDescription').fill('Recorrência na nuvem');
  await p1.locator('#manualAmount').fill('120,00');
  await p1.locator('#manualFrequency').selectOption('monthly');
  await p1.locator('#manualSaveButton').click();
  await p1.locator('#composerDialog').waitFor({ state: 'hidden' });
  await p1.waitForFunction(
    () => FF_STATE.rules.length === 1 && FF_STATE.pendingCount === 0 && !FF_STATE.syncBusy,
  );
  await sync(p2);
  await p2.waitForFunction(() => FF_STATE.rules.length === 1 && FF_STATE.bills.length > 0);
  assert.equal(await p2.evaluate(() => FF_STATE.transactions.length), 1);
  pass('Contas e recorrências também sincronizam sem alterar saldo pendente');
  assert.equal(errors.length, 0, errors.join('\n'));
  pass('Adaptador da nuvem não gerou erros JavaScript');
  fs.writeFileSync(
    path.join(siteDir, 'cloud-test-results.json'),
    JSON.stringify(
      {
        environment: 'Supabase simulado com duas contas e dados em memória',
        results,
        errors,
      },
      null,
      2,
    ),
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
    fs.writeFileSync(
      path.join(siteDir, 'cloud-test-results.json'),
      JSON.stringify({ results, error: e.stack, errors }, null, 2),
    );
  })
  .finally(async () => {
    await browser?.close();
  });
