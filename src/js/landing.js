import { callbackKeys, readAuthReturn } from './services/auth-return.js';
import { initInstallmentDemo } from './landing/installment-demo.js';
import { initLandingMotion } from './landing/motion.js';
import { initReport } from './landing/report.js';
import { updateMoneyVisibility } from './landing/value-visibility.js';
import { initInstallApp } from './ui/install-app.js';

const current = new URL(location.href);
const { code, redirectError } = readAuthReturn(current);
const oldAppBookmark = ['#inicio', '#lancamentos', '#contas', '#relatorios'].includes(current.hash);

// O Supabase continua voltando à URL inicial já configurada no projeto.
if (code || redirectError || oldAppBookmark) {
  const destination = new URL('login.html', current);
  for (const key of callbackKeys) {
    if (current.searchParams.has(key)) {
      destination.searchParams.set(key, current.searchParams.get(key));
    }
  }
  destination.hash = current.hash;
  location.replace(destination.href);
} else {
  initLanding();
}

function initLanding() {
  const menu = document.getElementById('mobileMenu');
  const menuButton = document.getElementById('menuBtn');
  const menuIcon = document.querySelector('#menuIcon use');
  const eyeButton = document.getElementById('eyeBtn');
  const eyeIcon = document.querySelector('#eyeIcon use');

  function setMenu(open) {
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menuIcon.setAttribute('href', open ? '#i-x' : '#i-menu');
  }

  menuButton.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      setMenu(false);
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hidden) {
      setMenu(false);
      menuButton.focus();
    }
  });

  eyeButton.addEventListener('click', () => {
    const hidden = document.body.classList.toggle('values-hidden');
    const label = hidden ? 'Mostrar valores da demonstração' : 'Ocultar valores da demonstração';
    eyeButton.setAttribute('aria-label', label);
    eyeButton.setAttribute('title', label);
    eyeButton.setAttribute('aria-pressed', String(hidden));
    eyeIcon.setAttribute('href', hidden ? '#i-eye-off' : '#i-eye');
    document.getElementById('reportHidden').hidden = !hidden;
    updateMoneyVisibility();
  });

  const search = document.getElementById('extratoSearch');
  const days = document.querySelectorAll('#extratoGrid .day-card');
  const empty = document.getElementById('extEmpty');
  const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  search.addEventListener('input', () => {
    const query = normalize(search.value.trim());
    let found = false;
    for (const day of days) {
      let matches = 0;
      for (const row of day.querySelectorAll('.ext-row')) {
        row.hidden = !normalize(row.dataset.s).includes(query);
        matches += Number(!row.hidden);
      }
      day.hidden = matches === 0;
      found ||= !day.hidden;
    }
    empty.hidden = found;
  });

  initInstallmentDemo();
  initReport();
  initLandingMotion();
  initInstallApp();
}
