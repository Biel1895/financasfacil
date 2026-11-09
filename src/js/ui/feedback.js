import { $, esc, icon } from './dom.js';

let toastTimer;

let confirmResolve = null;

function toast(message, type = 'success', action = null) {
  const root = $('toastRegion');
  if (!root) {
    return;
  }
  clearTimeout(toastTimer);
  const opened = [...document.querySelectorAll('dialog[open]')].at(-1);
  (opened || document.body).append(root);
  root.innerHTML = /* HTML */ `<div
    class="toast ${type}"
    role="${type === 'error' ? 'alert' : 'status'}"
  >
    ${icon(type === 'success' ? 'check' : 'alert')}<span>${esc(message)}</span>${action ? '<button class="text-button" id="toastAction">Desfazer</button>' : ''}<button
      class="icon-button"
      id="toastDismiss"
      aria-label="Fechar aviso"
    >
      ${icon('x')}
    </button>
  </div>`;
  $('toastDismiss').onclick = () => root.replaceChildren();
  if (action) {
    $('toastAction').onclick = async () => {
      root.replaceChildren();
      try {
        await action();
      } catch (e) {
        showError(e);
      }
    };
  }
  toastTimer = setTimeout(() => root.replaceChildren(), action ? 15000 : 6500);
}

function showError(e) {
  console.error(e);
  const message =
    e?.name === 'QuotaExceededError'
      ? 'O armazenamento deste navegador está cheio. Exporte um backup e libere espaço.'
      : e?.message || 'Não foi possível concluir. Tente novamente.';
  toast(message, 'error');
  if ($('composerDialog').open) {
    $('composerError').textContent = message;
    $('composerError').hidden = false;
  }
}

function confirmAction(title, message, button = 'Confirmar', danger = false) {
  if (confirmResolve) {
    confirmResolve(false);
  }
  $('confirmTitle').textContent = title;
  $('confirmMessage').textContent = message;
  $('confirmAccept').textContent = button;
  $('confirmAccept').className = 'button ' + (danger ? 'danger' : 'primary');
  $('confirmDialog').showModal();
  return new Promise((resolve) => {
    confirmResolve = resolve;
  });
}

function finishConfirm(value) {
  const resolve = confirmResolve;
  confirmResolve = null;
  $('confirmDialog').close();
  resolve?.(value);
}

export { confirmAction, finishConfirm, showError, toast };
