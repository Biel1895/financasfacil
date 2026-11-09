import { editorPaymentFields } from '../application/editing.js';
import { paymentChanges } from '../application/finance.js';
import { installmentDraftPlan, parseGeneralInput } from '../application/installments.js';
import { cleanTransaction } from '../application/records.js';
import { backupPayload } from '../data/backups.js';
import { commitEntities, duplicateOf } from '../data/repository.js';
import { assertDate, entryAmount } from '../domain/finance.js';
import {
  amountInput,
  amountOK,
  formatISO,
  getSafeDateForSelectedMonth,
  parseAmount,
  sanitizeCSVCell,
  today,
  uid,
} from '../domain/format.js';
import { account, state } from '../state/store.js';
import { $, categoryOptions, esc, icon, money } from './dom.js';
import { confirmAction, showError, toast } from './feedback.js';
import { renderInstallmentCard } from './installments.js';
import { savePreference } from './theme.js';
import { renderSettings } from './views.js';
import { Voice } from './voice.js';

function setComposerTab(tab) {
  Voice.stopVoiceRecording(true, false);
  state.inputSource = 'text';
  $('manualForm').hidden = tab !== 'manual';
  $('assistantPane').hidden = tab === 'manual';
  document.querySelectorAll('[data-compose]').forEach((b) => {
    const on = b.dataset.compose === tab;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  $('composerHelp').textContent =
    'Digite ou use o microfone para contar o que aconteceu. Confira antes de salvar.';
}

function openComposer(mode = 'text', bill = false) {
  account();
  $('composerError').hidden = true;
  $('composerTitle').textContent = bill ? 'Agendar uma conta' : 'Novo lançamento';
  $('editTransactionId').value = '';
  $('editBillId').value = '';
  $('manualForm').reset();
  document
    .querySelectorAll('input[name="manualType"]')
    .forEach((input) => (input.disabled = false));
  $('manualCategory').disabled = false;
  $('manualCancelledOption').hidden = true;
  $('refundEditedTransaction').hidden = true;
  $('manageEditedPurchase').hidden = true;
  $('manualPaymentDate').value = today();
  $('manualDate').value = formatISO(
    getSafeDateForSelectedMonth(state.selectedYear, state.selectedMonth),
  );
  $('manualCategory').innerHTML = categoryOptions('expense');
  $('scheduleFields').hidden = false;
  $('paymentStatusField').hidden = false;
  $('composerTabs').hidden = false;
  $('deleteEditedTransaction').hidden = true;
  $('manualDuplicateWarning').hidden = true;
  $('manualStatus').value = bill ? 'pending' : 'paid';
  $('manualSaveButton').innerHTML = icon('check') + (bill ? 'Agendar conta' : 'Salvar lançamento');
  updateScheduleFields();
  setComposerTab(bill ? 'manual' : mode);
  if (!$('composerDialog').open) {
    $('composerDialog').showModal();
  }
  $(bill || mode === 'manual' ? 'manualDescription' : 'commandInput').focus();
}

function updateScheduleFields() {
  const freq = $('manualFrequency').value,
    installment = freq === 'installment';
  $('installmentField').hidden = !installment;
  $('manualCardField').hidden = !installment;
  $('manualInstallments').required = installment;
  $('scheduleHint').hidden = freq === 'once';
  $('amountLabel').textContent = installment ? 'Valor total da compra (R$)' : 'Valor (R$)';
  $('dateLabel').textContent = freq === 'once' ? 'Data' : 'Primeiro vencimento';
  const amount = parseAmount($('manualAmount').value),
    n = Number($('manualInstallments').value);
  $('scheduleHint').textContent = installment
    ? amountOK(amount) && Number.isInteger(n) && n >= 2
      ? `${n} parcelas de aproximadamente ${money(amount / n)}. Os centavos serão distribuídos para manter o total exato.`
      : 'Informe o valor total da compra e o número de parcelas, de 2 a 120.'
    : 'Uma conta será criada a cada mês. Você poderá encerrar a recorrência quando quiser. Datas no fim do mês são ajustadas para o último dia disponível.';
  editorPaymentFields();
  $('amountHelp').textContent = installment
    ? 'Informe o total, e não o valor de uma parcela.'
    : 'Use vírgula para os centavos.';
}

async function prepareDraft(event) {
  event.preventDefault();
  if (state.isSubmittingCommand || state.busy) {
    return;
  }
  const text = $('commandInput').value.trim();
  if (!text) {
    $('commandInput').focus();
    return;
  }
  Voice.stopVoiceRecording(true, false);
  $('composerError').hidden = true;
  const items = parseGeneralInput(text);
  if (!items.length) {
    $('composerError').textContent =
      'Não identifiquei um valor. Experimente “Gastei 60 no mercado”.';
    $('composerError').hidden = false;
    return;
  }
  if (items.length > 30) {
    $('composerError').textContent = 'Envie até 30 lançamentos por vez para conferir com calma.';
    $('composerError').hidden = false;
    return;
  }
  state.draftItems = items;
  $('previewSource').textContent = state.inputSource === 'voice' ? 'Por voz' : 'Por texto';
  renderDraft();
  $('previewPanel').hidden = false;
  $('previewPanel').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function renderDraft() {
  $('draftList').innerHTML = state.draftItems
    .map((item, index) =>
      item.kind === 'installment'
        ? renderInstallmentCard(item, index)
        : /* HTML */ `<div class="draft-card" data-draft-id="${esc(item.id)}">
            <div class="draft-header">
              <strong>Lançamento ${index + 1}</strong
              ><button
                class="icon-button"
                data-action="remove-draft"
                data-id="${esc(item.id)}"
                aria-label="Remover lançamento ${index + 1}"
              >
                ${icon('x')}
              </button>
            </div>
            <label
              >Descrição<input
                data-draft-field="description"
                maxlength="140"
                required
                value="${esc(item.description)}"
            /></label>
            <div class="form-grid">
              <label
                >Valor (R$)<input
                  data-draft-field="amount"
                  inputmode="decimal"
                  required
                  value="${amountInput(item.amount)}" /></label
              ><label
                >Data<input data-draft-field="date" type="date" required value="${esc(item.date)}"
              /></label>
            </div>
            <div class="form-grid">
              <label
                >Tipo<select data-draft-field="type">
                  <option value="expense" ${item.type === 'expense' ? 'selected' : ''}>
                    Despesa
                  </option>
                  <option value="income" ${item.type === 'income' ? 'selected' : ''}>
                    Receita
                  </option>
                  <option value="investment" ${item.type === 'investment' ? 'selected' : ''}>
                    Investimento
                  </option>
                </select></label
              ><label
                >Categoria<select data-draft-field="category">
                  ${categoryOptions(item.type, item.category)}
                </select></label
              >
            </div>
            ${duplicateOf(item) ? '<p class="duplicate-warning">Já existe um lançamento com os mesmos dados. Confira se é uma repetição.</p>' : ''}
          </div>`,
    )
    .join('');
  $('confirmPreview').innerHTML =
    icon('check') +
    (state.draftItems.length > 1
      ? `Confirmar ${state.draftItems.length} registros`
      : state.draftItems[0]?.kind === 'installment'
        ? 'Confirmar parcelamento'
        : 'Confirmar lançamento');
}

function readDraft() {
  return [...document.querySelectorAll('[data-draft-id]')].map((card) => {
    const get = (field) => card.querySelector(`[data-draft-field="${field}"]`).value;
    if (!get('description').trim()) {
      throw new Error('Preencha a descrição de cada lançamento.');
    }
    const item = cleanTransaction({
      id: card.dataset.draftId,
      description: get('description').trim(),
      amount: parseAmount(get('amount')),
      type: get('type'),
      category: get('category'),
      date: get('date'),
      createdAt: Date.now(),
    });
    if (card.dataset.draftKind === 'installment') {
      item.kind = 'installment';
      item.installments = Number(get('installments'));
      item.cardName = get('cardName').trim().slice(0, 60);
      item.firstPaid = card.querySelector('[data-draft-field="firstPaid"]').checked;
      item.firstPaidDate = get('firstPaidDate');
      if (item.firstPaid) {
        assertDate(item.firstPaidDate);
      }
      installmentDraftPlan(item);
    }
    return item;
  });
}

async function confirmDraft() {
  if (state.isSubmittingCommand || !state.draftItems.length) {
    return;
  }
  state.isSubmittingCommand = true;
  $('confirmPreview').disabled = true;
  $('composerError').hidden = true;
  try {
    const items = readDraft();
    const fingerprints = new Set();
    let duplicate = false;
    for (const item of items) {
      const key = [
        item.description.trim().toLowerCase(),
        item.type,
        item.amount,
        item.date,
        item.kind || 'tx',
        item.installments || 0,
      ].join('|');
      const match =
        item.kind === 'installment'
          ? state.rules.some(
              (r) =>
                r.frequency === 'installment' &&
                r.description.toLowerCase() === item.description.toLowerCase() &&
                r.amount === item.amount &&
                r.startDate === item.date &&
                r.totalInstallments === item.installments,
            )
          : duplicateOf(item);
      if (fingerprints.has(key) || match) {
        duplicate = true;
      }
      fingerprints.add(key);
    }
    if (
      duplicate &&
      !(await confirmAction(
        'Há um possível lançamento repetido',
        'Encontramos descrição, valor, tipo e data iguais. Deseja salvar mesmo assim?',
        'Salvar mesmo assim',
      ))
    ) {
      return;
    }
    const changes = [];
    for (const item of items) {
      if (item.kind !== 'installment') {
        changes.push(['tx', item]);
        continue;
      }
      const { rule, bills } = installmentDraftPlan(item, uid('rule'));
      changes.push(['rules', rule], ...bills.map((b) => ['bills', b]));
      if (item.firstPaid) {
        changes.push(...paymentChanges(bills[0], item.firstPaidDate || today()));
      }
    }
    await commitEntities(changes);
    state.lastAddedIds = changes.filter(([entity]) => entity === 'tx').map(([, t]) => t.id);
    const parcelCount = items
      .filter((i) => i.kind === 'installment')
      .reduce((sum, i) => sum + i.installments, 0);
    state.draftItems = [];
    $('commandInput').value = '';
    $('previewPanel').hidden = true;
    $('draftList').replaceChildren();
    $('composerDialog').close();
    toast(
      parcelCount
        ? `Compra(s) confirmada(s). ${parcelCount} parcelas organizadas em Contas.`
        : `${items.length} lançamento(s) confirmado(s).`,
    );
  } catch (e) {
    showError(e);
  } finally {
    state.isSubmittingCommand = false;
    $('confirmPreview').disabled = false;
  }
}

function download(content, name, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  const parent = [...document.querySelectorAll('dialog[open]')].at(-1) || document.body;
  parent.append(link);
  link.click();
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 30000);
}

async function exportBackup() {
  download(
    JSON.stringify(backupPayload(), null, 2),
    `financas-backup-${today()}.json`,
    'application/json;charset=utf-8',
  );
  state.lastExport = Date.now();
  await savePreference();
  renderSettings();
  toast('Backup preparado para download.');
}

function exportCSV() {
  const header = [
    'Data',
    'Tipo',
    'Categoria',
    'Descricao',
    'Valor',
    'Natureza',
    'LancamentoOriginal',
  ];
  const rows = [...state.transactions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) =>
      [
        t.date,
        { income: 'Receita', expense: 'Despesa', investment: 'Investimento' }[t.type],
        t.category,
        t.description,
        amountInput(entryAmount(t)),
        t.entryKind === 'reversal' ? 'Estorno' : 'Lançamento',
        t.relatedTransactionId || '',
      ]
        .map((v) => sanitizeCSVCell(v))
        .join(';'),
    );
  download(
    '\uFEFF' + [header.join(';'), ...rows].join('\r\n'),
    `financas-extrato-${today()}.csv`,
    'text/csv;charset=utf-8',
  );
  toast('Extrato preparado para download.');
}

export {
  confirmDraft,
  download,
  exportBackup,
  exportCSV,
  openComposer,
  prepareDraft,
  setComposerTab,
  updateScheduleFields,
};
