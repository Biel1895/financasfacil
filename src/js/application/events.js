import { enterAccount, handleAuth, logout, restoreOnlineSession, switchAuthTab } from './auth.js';
import { editorPaymentFields, openEditor, saveManual } from './editing.js';
import { isPending } from './finance.js';
import {
  cancelBill,
  cancelPurchase,
  deleteTransaction,
  openCancelPurchase,
  openPurchase,
  openRefund,
  openSettlement,
  operationSubmit,
  payBill,
  purchaseContext,
  refreshSettlement,
  savePurchase,
  saveRefund,
  saveSettlement,
  stopRule,
} from './operations.js';
import { ensurePlannedBills } from '../data/repository.js';
import { importBackup } from './restore.js';
import { normalizeAccountKey } from '../domain/format.js';
import { DB, STORE } from '../infrastructure/database.js';
import { Cloud, queueCloudSync, syncCloud } from '../services/cloud.js';
import { state } from '../state/store.js';
import {
  confirmDraft,
  download,
  exportBackup,
  exportCSV,
  openComposer,
  prepareDraft,
  setComposerTab,
  updateScheduleFields,
} from '../ui/composer.js';
import { $, categoryOptions, hydrateIcons, icon } from '../ui/dom.js';
import { finishConfirm, showError, toast } from '../ui/feedback.js';
import { renderForecast } from '../ui/forecast.js';
import { refreshInstallmentSummary } from '../ui/installments.js';
import {
  alignReportWindow,
  exportReportCSV,
  renderReports,
  resetReportPeriod,
  shiftReportPeriod,
} from '../ui/reports.js';
import { applyTheme, cycleTheme, savePreference, themeMedia } from '../ui/theme.js';
import {
  render,
  renderBills,
  renderSettings,
  renderStatement,
  renderSync,
  setView,
} from '../ui/views.js';
import { Voice } from '../ui/voice.js';

async function changeMonth(delta, absolute = null, options = {}) {
  const date = absolute || new Date(state.selectedYear, state.selectedMonth + delta, 1);
  if (date.getFullYear() < 1900 || date.getFullYear() > 2200) {
    return;
  }
  state.selectedYear = date.getFullYear();
  state.selectedMonth = date.getMonth();
  if (!options.keepReportWindow) {
    alignReportWindow();
  }
  render();
  if (state.view === 'contas' || state.view === 'inicio') {
    await ensurePlannedBills();
  }
}

async function runAction(button) {
  const action = button.dataset.action,
    id = button.dataset.id;
  if (action === 'new') {
    openComposer();
  } else if (action === 'new-bill') {
    openComposer('manual', true);
  } else if (action === 'settings') {
    renderSettings();
    $('settingsDialog').showModal();
  } else if (action === 'edit-tx') {
    openEditor(id);
  } else if (action === 'edit-bill') {
    openEditor(id, true);
  } else if (action === 'pay-bill') {
    await payBill(id);
  } else if (action === 'cancel-bill') {
    await cancelBill(id);
  } else if (action === 'stop-rule') {
    await stopRule(id);
  } else if (action === 'manage-rule') {
    openPurchase(id);
  } else if (action === 'remove-draft') {
    const remaining = state.draftItems.filter((t) => t.id !== id);
    state.draftItems = remaining;
    document.querySelector(`[data-draft-id="${CSS.escape(id)}"]`)?.remove();
    $('previewPanel').hidden = !remaining.length;
    $('confirmPreview').innerHTML =
      icon('check') +
      (remaining.length > 1
        ? `Confirmar ${remaining.length} registros`
        : remaining[0]?.kind === 'installment'
          ? 'Confirmar parcelamento'
          : 'Confirmar lançamento');
  } else if (action === 'download-snapshot') {
    const snapshot = state.snapshots.find((s) => s.id === id);
    if (snapshot) {
      download(
        JSON.stringify(snapshot.payload, null, 2),
        `financas-copia-${new Date(snapshot.createdAt).toISOString().slice(0, 10)}.json`,
        'application/json;charset=utf-8',
      );
    }
  } else if (action === 'chart-month') {
    await changeMonth(0, new Date(Number(button.dataset.year), Number(button.dataset.month), 1), {
      keepReportWindow: true,
    });
  } else if (action === 'report-period-prev') {
    await shiftReportPeriod(-1);
  } else if (action === 'report-period-next') {
    await shiftReportPeriod(1);
  } else if (action === 'report-today') {
    await resetReportPeriod();
  } else if (action === 'export-report') {
    exportReportCSV();
  }
}

function bindEvents() {
  $('tabLoginBtn').addEventListener('click', () => switchAuthTab('login'));
  $('tabRegisterBtn').addEventListener('click', () => switchAuthTab('register'));
  $('authForm').addEventListener('submit', handleAuth);
  $('btnTogglePassword').addEventListener('click', () => {
    const show = $('authPassword').type === 'password';
    $('authPassword').type = show ? 'text' : 'password';
    $('btnTogglePassword').setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
    $('btnTogglePassword').innerHTML = icon(show ? 'eye-off' : 'eye');
  });
  $('themeButton').addEventListener('click', () => cycleTheme().catch(showError));
  $('authThemeButton').addEventListener('click', () => cycleTheme().catch(showError));
  $('themeSelect').addEventListener('change', () => {
    applyTheme($('themeSelect').value);
    void savePreference().catch(showError);
  });
  themeMedia?.addEventListener('change', () => {
    if (state.themePreference === 'auto') {
      applyTheme('auto');
    }
  });
  $('balanceModeSelect').addEventListener('change', async () => {
    state.balanceMode = $('balanceModeSelect').value;
    render();
    try {
      await savePreference();
    } catch (e) {
      showError(e);
    }
  });
  $('privacyButton').addEventListener('click', () => {
    state.hideValues = !state.hideValues;
    render();
    void savePreference().catch(showError);
  });
  $('btnPrevMonth').addEventListener('click', () => changeMonth(-1).catch(showError));
  $('btnNextMonth').addEventListener('click', () => changeMonth(1).catch(showError));
  $('btnCurrentMonth').addEventListener('click', () => resetReportPeriod().catch(showError));
  $('reportSpan').addEventListener('change', () => {
    state.reportSpan = Number($('reportSpan').value) === 12 ? 12 : 6;
    alignReportWindow();
    renderReports();
  });
  $('forecastSpan').addEventListener('change', () => {
    state.forecastSpan = Number($('forecastSpan').value) === 12 ? 12 : 6;
    renderForecast();
  });
  $('trendChart').addEventListener('keydown', async (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      return;
    }
    const button = event.target.closest('.chart-month');
    if (!button) {
      return;
    }
    const items = [...$('trendChart').querySelectorAll('.chart-month')],
      target = items[items.indexOf(button) + (event.key === 'ArrowRight' ? 1 : -1)];
    if (!target) {
      return;
    }
    event.preventDefault();
    const year = target.dataset.year,
      month = target.dataset.month;
    try {
      await runAction(target);
      $('trendChart').querySelector(`[data-year="${year}"][data-month="${month}"]`)?.focus();
    } catch (e) {
      showError(e);
    }
  });
  $('searchInput').addEventListener('input', (event) => {
    state.searchQuery = event.target.value;
    renderStatement();
  });
  $('typeFilterTabs').addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (button) {
      state.filterType = button.dataset.filter;
      renderStatement();
    }
  });
  $('billFilterTabs').addEventListener('click', (event) => {
    const button = event.target.closest('[data-bill-filter]');
    if (button) {
      state.billFilter = button.dataset.billFilter;
      renderBills();
    }
  });
  $('composerTabs').addEventListener('click', (event) => {
    const button = event.target.closest('[data-compose]');
    if (button) {
      setComposerTab(button.dataset.compose);
    }
  });
  $('commandForm').addEventListener('submit', (event) => {
    try {
      void prepareDraft(event).catch(showError);
    } catch (e) {
      showError(e);
    }
  });
  $('commandInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      $('commandForm').requestSubmit();
      event.preventDefault();
    }
  });
  $('commandInput').addEventListener('input', () => {
    if (!state.isRecording) {
      state.inputSource = 'text';
    }
  });
  $('btnMic').addEventListener('click', () => {
    state.inputSource = 'voice';
    $('composerError').hidden = true;
  });
  $('cancelPreview').addEventListener('click', () => {
    state.draftItems = [];
    $('previewPanel').hidden = true;
    $('draftList').replaceChildren();
  });
  $('confirmPreview').addEventListener('click', confirmDraft);
  $('draftList').addEventListener('change', (event) => {
    if (event.target.dataset.draftField === 'type') {
      const card = event.target.closest('[data-draft-id]');
      card.querySelector('[data-draft-field="category"]').innerHTML = categoryOptions(
        event.target.value,
      );
    }
  });
  $('draftList').addEventListener('input', (event) => {
    const card = event.target.closest('[data-draft-kind="installment"]');
    if (card) {
      refreshInstallmentSummary(card);
    }
  });
  $('manualForm').addEventListener('submit', saveManual);
  document.querySelectorAll('input[name="manualType"]').forEach((input) =>
    input.addEventListener('change', () => {
      $('manualCategory').innerHTML = categoryOptions(input.value);
      if (input.value !== 'expense' && $('manualFrequency').value === 'installment') {
        $('manualFrequency').value = 'monthly';
      }
      updateScheduleFields();
    }),
  );
  for (const id of ['manualFrequency', 'manualInstallments', 'manualAmount']) {
    $(id).addEventListener('input', updateScheduleFields);
  }
  $('manualStatus').addEventListener('change', editorPaymentFields);
  $('refundEditedTransaction').addEventListener('click', () =>
    openRefund($('refundEditedTransaction').dataset.id),
  );
  $('manageEditedPurchase').addEventListener('click', () => {
    const id = $('manageEditedPurchase').dataset.id;
    $('composerDialog').close();
    openPurchase(id);
  });
  $('settlementForm').addEventListener('submit', (event) => operationSubmit(event, saveSettlement));
  $('settlementItems').addEventListener('change', refreshSettlement);
  $('settlementDiscount').addEventListener('input', refreshSettlement);
  $('refundForm').addEventListener('submit', (event) => operationSubmit(event, saveRefund));
  $('purchaseForm').addEventListener('submit', (event) => operationSubmit(event, savePurchase));
  $('cancelPurchaseForm').addEventListener('submit', (event) =>
    operationSubmit(event, cancelPurchase),
  );
  $('purchaseAdvance').addEventListener('click', () => {
    if (purchaseContext) {
      openSettlement(
        state.bills.filter((b) => b.ruleId === purchaseContext.id && isPending(b)).map((b) => b.id),
        true,
      );
    }
  });
  $('purchaseCancel').addEventListener('click', () => {
    if (purchaseContext) {
      openCancelPurchase(purchaseContext.id);
    }
  });
  $('deleteEditedTransaction').addEventListener('click', () =>
    deleteTransaction($('editTransactionId').value).catch(showError),
  );
  $('btnExportJSON').addEventListener('click', () => exportBackup().catch(showError));
  $('btnExportCSV').addEventListener('click', exportCSV);
  $('inputImportJSON').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    try {
      await importBackup(file);
    } catch (e) {
      showError(e);
    } finally {
      event.target.value = '';
    }
  });
  $('btnLogout').addEventListener('click', () => logout().catch(showError));
  $('btnForceSyncNow').addEventListener('click', () => syncCloud(true).catch(showError));
  $('confirmAccept').addEventListener('click', () => finishConfirm(true));
  $('confirmCancel').addEventListener('click', () => finishConfirm(false));
  $('confirmDialog').addEventListener('cancel', (event) => {
    event.preventDefault();
    finishConfirm(false);
  });
  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.addEventListener('click', (event) => {
      if (event.target.closest('[data-close]')) {
        if (dialog.id === 'confirmDialog') {
          finishConfirm(false);
        } else {
          dialog.close();
        }
      }
    });
    dialog.addEventListener('close', () => {
      if (dialog.id === 'composerDialog') {
        Voice.stopVoiceRecording(true, false);
      }
    });
    dialog.addEventListener('cancel', (event) => {
      if (state.busy || state.isSubmittingCommand) {
        event.preventDefault();
        toast('Aguarde o salvamento terminar.', 'warning');
      }
    });
  }
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (button) {
      if (button.disabled) {
        return;
      }
      const lock = ![
        'chart-month',
        'report-period-prev',
        'report-period-next',
        'report-today',
      ].includes(button.dataset.action);
      if (lock) {
        button.disabled = true;
      }
      try {
        await runAction(button);
      } catch (e) {
        showError(e);
      } finally {
        if (lock) {
          button.disabled = false;
        }
      }
      return;
    }
    const example = event.target.closest('[data-example]');
    if (example) {
      $('commandInput').value = example.dataset.example;
      state.inputSource = 'text';
      $('commandForm').requestSubmit();
    }
  });
  window.addEventListener('hashchange', () => {
    if (state.loggedAccount) {
      setView(location.hash.slice(1));
    }
  });
  window.addEventListener('online', () => {
    renderSync();
    if (Cloud.ready) {
      queueCloudSync();
    }
  });
  window.addEventListener('offline', renderSync);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.loggedAccount) {
      void ensurePlannedBills().then(render).catch(showError);
      if (Cloud.ready) {
        queueCloudSync();
      }
    }
  });
  window.addEventListener('beforeunload', (event) => {
    if (state.busy) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
}

async function boot() {
  hydrateIcons();
  applyTheme('auto');
  switchAuthTab('login');
  try {
    Voice.setupVoiceRecognition((message, type) => {
      toast(message, type === 'warning' ? 'warning' : 'success');
      if ($('composerDialog').open) {
        $('composerError').textContent = message;
        $('composerError').hidden = false;
      }
    });
  } catch (e) {
    console.warn('Ditado indisponível:', e);
    $('btnMic').disabled = true;
  }
  bindEvents();
  try {
    const [session, guest] = await Promise.all([
      DB.get(STORE.session, 'activeUser'),
      DB.get(STORE.session, 'guestPreferences'),
    ]);
    if (guest?.theme) {
      applyTheme(guest.theme);
    }
    if (Cloud.configured) {
      await restoreOnlineSession();
    } else if (session?.accountKey) {
      state.loggedAccount = {
        accountKey: normalizeAccountKey(session.accountKey),
        identifier: String(session.identifier || session.accountKey),
        displayName: String(session.displayName || session.identifier || 'Você'),
      };
      await enterAccount();
    }
    if (!state.loggedAccount) {
      $('authScreen').hidden = false;
      $('bootMessage').hidden = true;
    }
  } catch (e) {
    $('bootMessage').hidden = true;
    $('authScreen').hidden = false;
    $('authAlert').textContent =
      'Não foi possível abrir seus dados locais. Feche outras abas do sistema, verifique o armazenamento permitido no navegador e recarregue a página.';
    $('authAlert').hidden = false;
    console.error(e);
  }
}

export { boot, changeMonth };
