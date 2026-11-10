import { autoSnapshot } from '../data/backups.js';
import { ensurePlannedBills, loadAccountData } from '../data/repository.js';
import {
  derivePbkdf2Hash,
  generateRandomSaltHex,
  passwordMatches,
} from '../infrastructure/credentials.js';
import { DB, STORE } from '../infrastructure/database.js';
import {
  Cloud,
  bindCloudUser,
  cloudProviderEnabled,
  rememberCloudSession,
  resumeCloudUser,
  sendCloudReset,
  signInCloud,
  signInWithCloudProvider,
  signOutCloud,
  signUpCloud,
  stopCloudSession,
  syncCloud,
  updateCloudUser,
} from '../services/cloud.js';
import { account, sessionLifecycle, state } from '../state/store.js';
import { $, icon } from '../ui/dom.js';
import { toast } from '../ui/feedback.js';
import { applyTheme } from '../ui/theme.js';
import { render, setView } from '../ui/views.js';
import { Voice } from '../ui/voice.js';
import { validateNewPassword } from './profile.js';

const authCopy = {
  login: ['Entre na sua conta', 'Informe seus dados de acesso.', 'Entrar'],
  register: ['Crie sua conta', 'Preencha seus dados para criar seu acesso.', 'Criar conta'],
  recover: [
    'Recupere o acesso',
    'Informe o e-mail cadastrado para receber um link.',
    'Enviar link',
  ],
  reset: [
    'Defina uma nova senha',
    'Escolha uma senha com pelo menos 8 caracteres.',
    'Salvar senha',
  ],
};
let recoverySession = null;
let authBusy = false;

function authMessage(message, success = false) {
  const alert = $('authAlert');
  const notice = $('authNotice');
  alert.hidden = success || !message;
  notice.hidden = !success || !message;
  (success ? notice : alert).textContent = message;
}

async function runAuth(button, action) {
  if (authBusy) {
    return;
  }
  authBusy = true;
  const controls = [
    'tabLoginBtn',
    'tabRegisterBtn',
    'btnAuthSubmit',
    'btnForgotPassword',
    'btnAuthGoogle',
    'btnAuthApple',
    'btnBackToLogin',
    'btnCancelReset',
  ];
  for (const id of controls) {
    $(id).disabled = true;
  }
  button.disabled = true;
  authMessage('');
  try {
    await action();
  } catch (error) {
    authMessage(error.message || 'Não foi possível concluir. Tente novamente.');
  } finally {
    authBusy = false;
    for (const id of controls) {
      $(id).disabled = false;
    }
    button.disabled = false;
    $('authSubmitText').textContent = authCopy[state.authMode][2];
  }
}

function switchAuthTab(mode) {
  const [title, subtitle, submit] = authCopy[mode];
  const register = mode === 'register';
  const normal = mode === 'login' || register;
  state.authMode = mode;
  $('authTitle').textContent = title;
  $('authSubtitle').textContent = subtitle;
  $('authAccountLinks').hidden = !normal;
  $('authRegisterLink').hidden = mode !== 'login';
  $('authLoginLink').hidden = !register;
  $('authForm').hidden = !normal;
  $('forgotPasswordForm').hidden = mode !== 'recover';
  $('resetPasswordForm').hidden = mode !== 'reset';
  $('registerNameGroup').hidden = !register;
  $('authName').required = register && Cloud.configured;
  $('authSubmitText').textContent = submit;
  $('authPassword').value = '';
  $('authPassword').type = 'password';
  $('authPassword').autocomplete = register ? 'new-password' : 'current-password';
  $('authPassword').minLength = register && Cloud.configured ? 8 : 4;
  $('authPassword').placeholder =
    register && Cloud.configured ? 'Pelo menos 8 caracteres' : 'Sua senha';
  $('btnTogglePassword').setAttribute('aria-label', 'Mostrar senha');
  $('btnTogglePassword').innerHTML = icon('eye');
  $('btnForgotPassword').hidden = mode !== 'login' || !Cloud.configured;
  const google = cloudProviderEnabled('google');
  const apple = cloudProviderEnabled('apple');
  $('btnAuthGoogle').hidden = !google;
  $('btnAuthApple').hidden = !apple;
  $('authSocial').hidden = !normal || (!google && !apple);
  authMessage('');
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
  $('skipContentLink').href = '#mainContent';
  document.title = 'Painel | FinançasFácil';
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
  $('skipContentLink').href = '#authTitle';
  document.title = 'Entrar | FinançasFácil';
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
  $('authIdentifierLabel').textContent = 'E-mail';
  $('authIdentifier').type = 'email';
  $('authIdentifier').placeholder = 'voce@exemplo.com';
  $('authStorageHint').hidden = true;
  if (!navigator.onLine) {
    authMessage('Você está sem conexão. Quando a internet voltar, recarregue para entrar.');
    return;
  }
  try {
    const { user, recovery, remember } = await resumeCloudUser();
    if (user && recovery) {
      recoverySession = { owner: user.id, remember };
      switchAuthTab('reset');
    } else if (user) {
      await enterOnlineAccount(user);
    }
  } catch (error) {
    stopCloudSession();
    state.loggedAccount = null;
    authMessage(
      error instanceof Error
        ? error.message
        : 'Não foi possível retomar a sessão online. Tente entrar novamente.',
    );
    console.warn(error);
  }
}

function bindAuthRecovery() {
  $('btnForgotPassword').addEventListener('click', () => {
    $('forgotEmail').value = $('authIdentifier').value;
    switchAuthTab('recover');
    $('forgotEmail').focus();
  });
  $('btnBackToLogin').addEventListener('click', () => {
    $('authIdentifier').value = $('forgotEmail').value;
    switchAuthTab('login');
    $('authIdentifier').focus();
  });
  $('forgotPasswordForm').addEventListener('submit', (event) => {
    event.preventDefault();
    void runAuth($('btnSendReset'), async () => {
      await sendCloudReset($('forgotEmail').value.trim(), $('authRememberMe').checked);
      authMessage(
        'Se esse e-mail estiver cadastrado, você receberá um link. Abra-o neste mesmo navegador.',
        true,
      );
    });
  });
  $('resetPasswordForm').addEventListener('submit', (event) => {
    event.preventDefault();
    void runAuth($('btnResetPassword'), async () => {
      if (!recoverySession) {
        throw new Error('Solicite um novo link de recuperação.');
      }
      const password = validateNewPassword($('resetPassword').value, $('resetPasswordAgain').value);
      const user = await updateCloudUser({ password }, recoverySession.owner);
      if (recoverySession.remember) {
        rememberCloudSession();
      }
      recoverySession = null;
      $('resetPasswordForm').reset();
      switchAuthTab('login');
      await enterOnlineAccount(user);
      toast('Sua senha foi redefinida.');
    });
  });
  $('btnCancelReset').addEventListener('click', () => {
    void runAuth($('btnCancelReset'), async () => {
      await signOutCloud();
      recoverySession = null;
      $('resetPasswordForm').reset();
      switchAuthTab('login');
      $('authIdentifier').focus();
    });
  });
  for (const [id, provider] of [
    ['btnAuthGoogle', 'google'],
    ['btnAuthApple', 'apple'],
  ]) {
    $(id).addEventListener('click', () => {
      void runAuth($(id), () => signInWithCloudProvider(provider, $('authRememberMe').checked));
    });
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
  await runAuth($('btnAuthSubmit'), async () => {
    $('authSubmitText').textContent = 'Aguarde…';
    if (Cloud.configured) {
      const remember = $('authRememberMe').checked;
      let user;
      if (state.authMode === 'register') {
        const name = $('authName').value.trim();
        if (!name || password.length < 8) {
          throw new Error('Informe seu nome e uma senha com pelo menos 8 caracteres.');
        }
        user = await signUpCloud(loginId, password, name, remember);
        if (!user) {
          switchAuthTab('login');
          authMessage(
            'Confira seu e-mail e abra o link de confirmação neste navegador. Depois, entre com sua senha.',
            true,
          );
          return;
        }
      } else {
        user = await signInCloud(loginId, password, remember);
      }
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
      const key = existing.accountKey;
      if (!(await passwordMatches(existing, password))) {
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
  });
}

export { bindAuthRecovery, enterAccount, handleAuth, logout, restoreOnlineSession, switchAuthTab };
