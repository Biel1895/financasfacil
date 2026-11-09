import { autoSnapshot } from '../data/backups.js';
import { ensurePlannedBills, loadAccountData } from '../data/repository.js';
import {
  derivePbkdf2Hash,
  generateRandomSaltHex,
  sha256Hash,
} from '../infrastructure/credentials.js';
import { DB, STORE } from '../infrastructure/database.js';
import {
  Cloud,
  bindCloudUser,
  resumeCloudUser,
  signInCloud,
  signOutCloud,
  stopCloudSession,
  syncCloud,
} from '../services/cloud.js';
import { account, sessionLifecycle, state } from '../state/store.js';
import { $ } from '../ui/dom.js';
import { toast } from '../ui/feedback.js';
import { applyTheme } from '../ui/theme.js';
import { render, setView } from '../ui/views.js';
import { Voice } from '../ui/voice.js';

function switchAuthTab(mode) {
  state.authMode = mode;
  $('registerNameGroup').hidden = mode !== 'register';
  $('tabRegisterBtn').classList.toggle('active', mode === 'register');
  $('tabLoginBtn').classList.toggle('active', mode === 'login');
  $('authSubmitText').textContent =
    mode === 'register' ? 'Criar minha conta' : 'Entrar na minha conta';
  $('authPassword').autocomplete = mode === 'register' ? 'new-password' : 'current-password';
  $('authAlert').hidden = true;
}

async function enterAccount() {
  sessionLifecycle.generation++;
  const key = account();
  await loadAccountData();
  const [prefs, theme, lastSync] = await Promise.all([
    DB.get(STORE.session, `prefs_${key}`),
    DB.get(STORE.session, 'themePreference'),
    DB.get(STORE.session, `lastSync_${key}`),
  ]);
  state.hideValues = Boolean(prefs?.hide);
  state.balanceMode = prefs?.balance === 'integrated' ? 'integrated' : 'independent';
  state.lastExport = prefs?.lastExport || null;
  state.lastSync = lastSync?.time || null;
  applyTheme(prefs?.theme || theme?.mode || 'auto');
  await ensurePlannedBills();
  $('authScreen').hidden = true;
  $('appWrapper').hidden = false;
  $('bootMessage').hidden = true;
  setView(location.hash.slice(1) || 'inicio', false);
  render();
  void autoSnapshot().catch(console.warn);
  if (Cloud.ready) {
    void syncCloud();
  }
}

async function logout() {
  if (state.busy || state.syncBusy) {
    toast('Aguarde a operação terminar antes de sair.', 'warning');
    return;
  }
  if (Cloud.ready) {
    await signOutCloud();
  }
  await clearAccount();
}

async function clearAccount() {
  if (!state.loggedAccount) {
    return;
  }
  sessionLifecycle.generation++;
  stopCloudSession();
  if (!Cloud.configured) {
    await DB.delete(STORE.session, 'activeUser');
  }
  Voice.stopVoiceRecording(true, false);
  state.loggedAccount = null;
  state.transactions = [];
  state.bills = [];
  state.rules = [];
  state.snapshots = [];
  state.draftItems = [];
  state.syncError = '';
  state.saveError = '';
  state.hideValues = false;
  state.lastSync = null;
  state.pendingCount = 0;
  state.filterType = 'all';
  state.searchQuery = '';
  state.billFilter = 'pending';
  for (const dialog of document.querySelectorAll('dialog[open]')) {
    dialog.close();
  }
  $('commandInput').value = '';
  $('draftList').replaceChildren();
  $('previewPanel').hidden = true;
  $('searchInput').value = '';
  $('appWrapper').hidden = true;
  $('authScreen').hidden = false;
  switchAuthTab('login');
  history.replaceState(null, '', location.pathname + location.search);
  $('authIdentifier').focus();
  toast('Você saiu da sua conta.');
}

async function enterOnlineAccount(user) {
  state.loggedAccount = bindCloudUser(user, () => void clearAccount().catch(console.error));
  await enterAccount();
}

async function restoreOnlineSession() {
  $('tabLoginBtn').parentElement.hidden = true;
  $('authIdentifierLabel').textContent = 'E-mail';
  $('authIdentifier').type = 'email';
  $('authIdentifier').placeholder = 'Seu e-mail cadastrado no Supabase';
  $('authStorageHint').textContent =
    'Entre com a conta criada no Supabase para sincronizar seus lançamentos.';
  try {
    const user = await resumeCloudUser();
    if (user) {
      await enterOnlineAccount(user);
    }
  } catch (error) {
    stopCloudSession();
    state.loggedAccount = null;
    $('authAlert').textContent =
      'Não foi possível retomar a sessão online. Tente entrar novamente.';
    $('authAlert').hidden = false;
    console.warn(error);
  }
}

function loginIdentifier(value) {
  return String(value || '')
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

function accountMatches(user, identifier) {
  return loginIdentifier(user.loginId || user.identifier || user.accountKey) === identifier;
}

async function localAccountByIdentifier(identifier) {
  const users = (await DB.getAll(STORE.users)).filter((user) => accountMatches(user, identifier));
  if (users.length > 1) {
    throw new Error(
      'Há mais de uma conta com esse usuário. Use um identificador diferente para evitar acessar uma conta incorreta.',
    );
  }
  return users[0] || null;
}

async function addUniqueLocalAccount(user) {
  const db = await DB.open();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE.users, 'readwrite'),
      store = tx.objectStore(STORE.users),
      request = store.getAll();
    let duplicate = false;
    request.onsuccess = () => {
      if (request.result.some((existing) => accountMatches(existing, user.loginId))) {
        duplicate = true;
        tx.abort();
      } else {
        store.add(user);
      }
    };
    tx.oncomplete = resolve;
    tx.onabort = () =>
      reject(
        new Error(
          duplicate ? 'Esta conta já existe. Use Entrar.' : 'Não foi possível criar a conta.',
        ),
      );
    tx.onerror = () => reject(tx.error);
  });
}

async function handleAuth(event) {
  event.preventDefault();
  $('authAlert').hidden = true;
  if (Date.now() < state.lockoutUntil) {
    $('authAlert').textContent = 'Aguarde alguns segundos antes de tentar novamente.';
    $('authAlert').hidden = false;
    return;
  }
  const identifier = $('authIdentifier').value.trim(),
    password = $('authPassword').value,
    loginId = loginIdentifier(identifier);
  if (!loginId || loginId.length > 80 || password.length < 4 || password.length > 128) {
    return;
  }
  $('btnAuthSubmit').disabled = true;
  $('authSubmitText').textContent = 'Aguarde…';
  try {
    if (Cloud.configured) {
      const user = await signInCloud(loginId, password, $('authRememberMe').checked);
      await enterOnlineAccount(user);
      $('authPassword').value = '';
      toast('Você entrou na sua conta online.');
      return;
    }
    let existing = await localAccountByIdentifier(loginId);
    if (state.authMode === 'register') {
      if (existing) {
        throw new Error('Esta conta já existe. Use a opção Entrar.');
      }
      const accountKey = 'acct_' + crypto.randomUUID().replace(/-/g, ''),
        salt = generateRandomSaltHex();
      existing = {
        accountKey,
        loginId,
        identifier: identifier.toLocaleLowerCase('pt-BR'),
        displayName: ($('authName').value.trim() || identifier.split('@')[0]).slice(0, 60),
        salt,
        kdf: 'PBKDF2-SHA256',
        passwordHash: await derivePbkdf2Hash(password, `${accountKey}::${salt}`),
        createdAt: Date.now(),
      };
      await addUniqueLocalAccount(existing);
    } else {
      if (!existing) {
        throw new Error(
          'Conta não encontrada. Confira o usuário ou crie sua conta neste aparelho.',
        );
      }
      const key = existing.accountKey,
        candidate =
          existing.kdf === 'PBKDF2-SHA256'
            ? await derivePbkdf2Hash(password, `${key}::${existing.salt}`)
            : await sha256Hash(`${key}::${password}`);
      if (candidate !== existing.passwordHash) {
        state.failedLoginAttempts++;
        if (state.failedLoginAttempts >= 5) {
          state.lockoutUntil = Date.now() + 15000;
        }
        throw new Error('Usuário ou senha incorretos.');
      }
      existing.loginId = loginId;
      if (existing.kdf !== 'PBKDF2-SHA256') {
        existing.salt = generateRandomSaltHex();
        existing.kdf = 'PBKDF2-SHA256';
        existing.passwordHash = await derivePbkdf2Hash(password, `${key}::${existing.salt}`);
      }
      await DB.put(STORE.users, existing);
    }
    state.failedLoginAttempts = 0;
    state.loggedAccount = {
      accountKey: existing.accountKey,
      identifier: existing.identifier,
      displayName: existing.displayName || identifier,
    };
    if ($('authRememberMe').checked) {
      await DB.put(STORE.session, { key: 'activeUser', ...state.loggedAccount });
    } else {
      await DB.delete(STORE.session, 'activeUser');
    }
    await enterAccount();
    $('authPassword').value = '';
    toast(`Bem-vindo(a), ${state.loggedAccount.displayName.split(' ')[0]}.`);
  } catch (error) {
    $('authAlert').textContent = error.message || 'Não foi possível entrar. Tente novamente.';
    $('authAlert').hidden = false;
  } finally {
    $('btnAuthSubmit').disabled = false;
    $('authSubmitText').textContent =
      state.authMode === 'register' ? 'Criar minha conta' : 'Entrar na minha conta';
  }
}

export { enterAccount, handleAuth, logout, restoreOnlineSession, switchAuthTab };
