import { enqueueWork } from '../data/repository.js';
import {
  derivePbkdf2Hash,
  generateRandomSaltHex,
  passwordMatches,
} from '../infrastructure/credentials.js';
import { DB, STORE } from '../infrastructure/database.js';
import { Cloud, updateCloudUser } from '../services/cloud.js';
import { account, state } from '../state/store.js';
import { $ } from '../ui/dom.js';
import { showError, toast } from '../ui/feedback.js';
import { render, renderSettings, renderSync } from '../ui/views.js';

function validateNewPassword(password, confirmation) {
  if (password.length < 8 || password.length > 128) {
    throw new Error('Use entre 8 e 128 caracteres na nova senha.');
  }
  if (password !== confirmation) {
    throw new Error('As duas senhas precisam ser iguais.');
  }
  return password;
}

async function runProfileAction(button, action, onError = showError) {
  if (button.disabled) {
    return;
  }
  button.disabled = true;
  state.busy++;
  renderSync();
  try {
    if (Cloud.configured && !Cloud.ready) {
      throw new Error('Sua sessão expirou. Entre novamente para continuar.');
    }
    await action();
  } catch (error) {
    onError(error);
  } finally {
    state.busy--;
    button.disabled = false;
    renderSync();
  }
}

async function saveProfileName() {
  const key = account();
  const name = $('profileName').value.trim().slice(0, 60);
  if (!name) {
    throw new Error('Informe o nome que deseja exibir.');
  }
  if (Cloud.configured) {
    await updateCloudUser({ data: { display_name: name } }, Cloud.owner);
  } else {
    await enqueueWork(async () => {
      const user = await DB.get(STORE.users, key);
      if (!user) {
        throw new Error('Sua conta local precisa ser aberta novamente.');
      }
      const active = await DB.get(STORE.session, 'activeUser');
      const puts = [[STORE.users, { ...user, displayName: name }]];
      if (active?.accountKey === key) {
        puts.push([STORE.session, { ...active, displayName: name }]);
      }
      await DB.commit(puts);
    });
  }
  if (state.loggedAccount?.accountKey === key) {
    state.loggedAccount.displayName = name;
    $('profileName').value = name;
    render();
    renderSettings();
    toast('Seu nome foi atualizado.');
  }
}

async function savePassword() {
  const key = account();
  const current = $('currentPassword').value;
  const password = validateNewPassword($('newPassword').value, $('newPasswordAgain').value);
  if (Cloud.configured) {
    await updateCloudUser({ password, ...(current && { current_password: current }) }, Cloud.owner);
  } else {
    await enqueueWork(async () => {
      const user = await DB.get(STORE.users, key);
      if (!user || !(await passwordMatches(user, current))) {
        throw new Error('Confira a senha atual e tente novamente.');
      }
      const salt = generateRandomSaltHex();
      const passwordHash = await derivePbkdf2Hash(password, `${key}::${salt}`);
      await DB.put(STORE.users, { ...user, salt, passwordHash, kdf: 'PBKDF2-SHA256' });
    });
  }
  $('changePasswordDialog').close();
  toast('Sua senha foi alterada.');
}

function bindProfileEvents() {
  $('profileForm').addEventListener('submit', (event) => {
    event.preventDefault();
    void runProfileAction($('btnSaveProfile'), saveProfileName);
  });
  $('btnChangePassword').addEventListener('click', () => {
    const requiresPassword = !Cloud.configured || state.loggedAccount.needsCurrentPassword;
    $('currentPasswordGroup').hidden = !requiresPassword;
    $('currentPassword').required = Boolean(requiresPassword);
    $('changePasswordForm').reset();
    $('changePasswordAlert').hidden = true;
    $('changePasswordDialog').showModal();
  });
  $('changePasswordForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const alert = $('changePasswordAlert');
    alert.hidden = true;
    void runProfileAction($('btnSavePassword'), savePassword, (error) => {
      alert.textContent = error.message;
      alert.hidden = false;
    });
  });
  $('changePasswordDialog').addEventListener('close', () => $('changePasswordForm').reset());
}

export { bindProfileEvents, validateNewPassword };
