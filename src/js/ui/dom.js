import { CATEGORIES } from '../domain/categories.js';
import { escapeHTML, formatCurrency, normalizeCategory } from '../domain/format.js';
import { state } from '../state/store.js';

const $ = (id) => document.getElementById(id);

const paths = {
  wallet:
    'M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v11H5a3 3 0 0 1-3-3V6 M20 12h-5v5h5 M17 14.5h.01',
  home: 'm3 10 9-7 9 7 M5 9v12h5v-7h4v7h5V9',
  list: 'M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01',
  calendar:
    'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2 M7 14h3M14 14h3M7 18h3',
  chart: 'M4 3v18h17M8 16v-5M13 16V6M18 16V9',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12 M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  'eye-off':
    'm3 3 18 18 M10 5a11 11 0 0 1 12 7 17 17 0 0 1-3 4M6 6a19 19 0 0 0-4 6s3.5 7 10 7c2 0 4-1 5-2M10 10a3 3 0 0 0 4 4',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5',
  moon: 'M21 13A9 9 0 0 1 11 3 9 9 0 1 0 21 13',
  plus: 'M12 5v14M5 12h14',
  x: 'm6 6 12 12M6 18 18 6',
  'arrow-right': 'M4 12h16m-6-6 6 6-6 6',
  'chevron-right': 'm9 5 7 7-7 7',
  'chevron-left': 'm15 5-7 7 7 7',
  'arrow-up': 'M12 20V4m-6 6 6-6 6 6',
  'arrow-down': 'M12 4v16m-6-6 6 6 6-6',
  check: 'm5 12 4 4L19 6',
  shield: 'm12 3 9 4v6c0 5-9 9-9 9s-9-4-9-9V7Z m-4 9 3 3 5-6',
  sparkles: 'm12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z',
  mic: 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8',
  stop: 'M6 6h12v12H6Z',
  message: 'M21 16a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z M7 8h10M7 12h7',
  edit: 'm15 4 5 5M4 20l5-1L21 7l-5-5L4 14Z',
  search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 6 6',
  cloud: 'M6 18a5 5 0 0 1-1-10A7 7 0 0 1 18 7a5.5 5.5 0 0 1 0 11H6',
  refresh: 'M3 10a9 9 0 0 1 16-5l2 2M21 3v4h-4M21 14a9 9 0 0 1-16 5l-2-2M3 21v-4h4',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  upload: 'M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
  card: 'M3 4h18v16H3ZM3 9h18M7 15h3',
  repeat: 'm17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4M21 13v3a2 2 0 0 1-2 2H3',
  alert: 'm12 3 10 18H2ZM12 9v5M12 17h.01',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l4 2',
  bag: 'M5 7h14l2 14H3ZM8 9V6a4 4 0 0 1 8 0v3',
  leaf: 'M20 3S5 2 4 12s11 12 16-9ZM5 20 16 8',
  undo: 'M9 4 3 10l6 6M3 10h11a6 6 0 0 1 0 12',
};

function icon(name) {
  return /* HTML */ `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="${paths[name] || paths.wallet}" />
  </svg>`;
}

function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    el.innerHTML = icon(el.dataset.icon);
  });
}

function esc(s) {
  return escapeHTML(s);
}

function money(n) {
  return state.hideValues ? 'R$ ••••' : formatCurrency(n);
}

function categoryOptions(type, selected) {
  return CATEGORIES[type]
    .map(
      (c) =>
        /* HTML */ `<option
          value="${esc(c.name)}"
          ${c.name === normalizeCategory(selected) ? ' selected' : ''}
        >
          ${esc(c.name)}
        </option>`,
    )
    .join('');
}

function emptyState(name, title, text, action = '', label = 'Novo lançamento') {
  return /* HTML */ `<div class="empty-state">
    <span class="empty-icon">${icon(name)}</span>
    <h3>${esc(title)}</h3>
    <p>${esc(text)}</p>
    ${action ? /* HTML */ `<button class="button secondary" data-action="${esc(action)}">${icon('plus')}${esc(label)}</button>` : ''}
  </div>`;
}

export { $, categoryOptions, emptyState, esc, hydrateIcons, icon, money };
