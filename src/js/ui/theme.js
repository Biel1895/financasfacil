import { DB, STORE } from '../infrastructure/database.js';
import { account, state } from '../state/store.js';
import { $, icon } from './dom.js';

const themeMedia = window.matchMedia?.('(prefers-color-scheme: dark)');

function applyTheme(preference) {
  state.themePreference = preference;
  const effective = preference === 'auto' ? (themeMedia?.matches ? 'dark' : 'light') : preference;
  document.documentElement.dataset.theme = effective;
  document.documentElement.setAttribute('data-bs-theme', effective);
  $('themeSelect').value = preference;
  $('themeButton').innerHTML = icon(effective === 'dark' ? 'moon' : 'sun');
  $('authThemeButton').innerHTML = icon(effective === 'dark' ? 'moon' : 'sun');
}

async function savePreference() {
  const key = state.loggedAccount ? 'prefs_' + account() : 'guestPreferences';
  await DB.put(STORE.session, {
    key,
    theme: state.themePreference,
    balance: state.balanceMode,
    hide: state.hideValues,
    lastExport: state.lastExport,
  });
}

async function cycleTheme() {
  const order = ['auto', 'light', 'dark'];
  applyTheme(order[(order.indexOf(state.themePreference) + 1) % 3]);
  await savePreference();
}

export { applyTheme, cycleTheme, savePreference, themeMedia };
