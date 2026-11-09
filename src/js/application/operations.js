import {
  billPaidAmount,
  billPaidDate,
  isBillPaid,
  isPending,
  paymentChanges,
  refundableCents,
  reversalRecord,
  reversalsFor,
  transactionForBill,
} from './finance.js';
import { cleanRule } from './records.js';
import { commitEntities } from '../data/repository.js';
import { allocatePayment, assertDate, cents, isCancelled } from '../domain/finance.js';
import { amountInput, dateLabel, formatDateBR, parseAmount, today } from '../domain/format.js';
import { buildBills } from '../domain/planning.js';
import { account, state } from '../state/store.js';
import { $, categoryOptions, esc, money } from '../ui/dom.js';
import { confirmAction, showError, toast } from '../ui/feedback.js';

let settlementContext = null;

let refundContext = null;

let purchaseContext = null;

let cancelContext = null;

function clearOperationError(dialog) {
  const node = dialog.querySelector('[data-operation-error]');
  if (node) {
    node.hidden = true;
    node.textContent = '';
  }
}

async function operationSubmit(event, work) {
  event.preventDefault();
  const form = event.currentTarget,
    button = form.querySelector('button[type="submit"]');
  if (button.disabled) {
    return;
  }
  button.disabled = true;
  clearOperationError(form.closest('dialog'));
  try {
    await work();
  } catch (error) {
    console.error(error);
    const node = form.querySelector('[data-operation-error]');
    if (node) {
      node.textContent = error.message || 'Não foi possível salvar.';
      node.hidden = false;
    } else {
      showError(error);
    }
  } finally {
    button.disabled = false;
  }
}

function payBill(id) {
  openSettlement([id]);
}

function openSettlement(ids, bulk = false) {
  const bills = ids
    .map((id) => state.bills.find((b) => b.id === id))
    .filter((b) => b && isPending(b));
  if (!bills.length) {
    toast('Não há parcelas pendentes para pagar.', 'warning');
    return;
  }
  settlementContext = { accountKey: account(), ids: bills.map((b) => b.id), bulk };
  $('settlementTitle').textContent = bulk
    ? 'Antecipar parcelas'
    : bills[0].type === 'income'
      ? 'Confirmar recebimento'
      : 'Confirmar pagamento';
  $('settlementDate').value = today();
  $('settlementDate').max = today();
  $('settlementDiscount').value = '0,00';
  $('settlementDiscountField').hidden = !bulk;
  $('settlementItems').innerHTML = bills
    .map(
      (b) =>
        /* HTML */ `<label class="operation-item checkbox"
          ><input
            type="checkbox"
            data-settle-id="${esc(b.id)}"
            checked
            ${bulk ? '' : 'hidden'}
          /><span
            >${esc(b.description)}${b.totalInstallments ? ` · ${b.installmentNumber}/${b.totalInstallments}` : ''}<small
              >Vencimento: ${formatDateBR(b.dueDate)}</small
            ></span
          ><strong>${money(b.amount)}</strong></label
        >`,
    )
    .join('');
  clearOperationError($('settlementDialog'));
  refreshSettlement();
  $('settlementDialog').showModal();
}

function refreshSettlement() {
  const selected = [...$('settlementItems').querySelectorAll('input:checked')].map((input) =>
    state.bills.find((b) => b.id === input.dataset.settleId),
  );
  const total = selected.reduce((s, b) => s + cents(b.amount), 0) / 100,
    discount = parseAmount($('settlementDiscount').value) || 0;
  $('settlementSummary').textContent =
    `${selected.length} parcela(s) · original ${money(total)} · pagamento ${money(Math.max(0, total - discount))}`;
}

async function saveSettlement() {
  if (!settlementContext || account() !== settlementContext.accountKey) {
    throw new Error('Sua sessão mudou.');
  }
  const ids = [...$('settlementItems').querySelectorAll('input:checked')].map(
      (i) => i.dataset.settleId,
    ),
    bills = ids.map((id) => state.bills.find((b) => b.id === id));
  if (!bills.length || bills.some((b) => !b || !isPending(b))) {
    throw new Error('Escolha parcelas que ainda estejam pendentes.');
  }
  const date = $('settlementDate').value;
  assertDate(date);
  if (date > today()) {
    throw new Error('A data do pagamento não pode estar no futuro.');
  }
  const discount = settlementContext.bulk ? parseAmount($('settlementDiscount').value) : 0,
    total = bills.reduce((s, b) => s + cents(b.amount), 0) / 100;
  if (!Number.isFinite(discount) || discount < 0) {
    throw new Error('Confira o desconto.');
  }
  const shares = allocatePayment(
    bills.map((b) => b.amount),
    Math.round((total - discount) * 100) / 100,
  );
  const changes = bills.flatMap((bill, i) => paymentChanges(bill, date, shares[i]));
  await commitEntities(changes);
  $('settlementDialog').close();
  toast(
    bills.length > 1
      ? 'Parcelas antecipadas na data escolhida.'
      : 'Pagamento registrado na data escolhida.',
  );
}

async function deleteTransaction(id) {
  const tx = state.transactions.find((t) => t.id === id);
  if (!tx) {
    return;
  }
  const reversals = tx.entryKind === 'reversal' ? [] : reversalsFor(id);
  const linked = state.bills.find((b) => b.transactionId === id);
  if (
    !(await confirmAction(
      'Excluir lançamento?',
      `${tx.description}, ${money(tx.amount)}.${reversals.length ? ' Os estornos vinculados também serão excluídos.' : ''} Você poderá desfazer por alguns instantes.`,
      'Excluir',
      true,
    ))
  ) {
    return;
  }
  const rule = linked && state.rules.find((r) => r.id === linked.ruleId);
  const changes = linked
    ? [
        [
          'bills',
          {
            ...linked,
            status: rule?.cancelledAt ? 'cancelled' : 'pending',
            transactionId: '',
            paidAt: '',
            settledAmount: null,
          },
        ],
      ]
    : [];
  await commitEntities(changes, [['tx', id], ...reversals.map((r) => ['tx', r.id])]);
  $('composerDialog').close();
  const key = account();
  toast('Lançamento excluído.', 'success', async () => {
    if (account() !== key) {
      throw new Error('Entre na mesma conta para desfazer.');
    }
    await commitEntities([
      ['tx', tx],
      ...reversals.map((r) => ['tx', r]),
      ...(linked ? [['bills', linked]] : []),
    ]);
    toast('Lançamento e vínculos recuperados.');
  });
}

async function cancelBill(id) {
  const bill = state.bills.find((b) => b.id === id);
  if (!bill) {
    return;
  }
  if (isBillPaid(bill)) {
    openRefund(transactionForBill(bill).id);
    return;
  }
  if (
    !(await confirmAction(
      'Cancelar esta conta?',
      `${bill.description}, vencimento em ${dateLabel(bill.dueDate)}. As demais parcelas serão mantidas.`,
      'Cancelar conta',
      true,
    ))
  ) {
    return;
  }
  await commitEntities([
    [
      'bills',
      {
        ...bill,
        status: 'cancelled',
        transactionId: '',
        paidAt: '',
        settledAmount: null,
        cancelledAt: today(),
      },
    ],
  ]);
  const key = account();
  toast('Conta cancelada.', 'success', async () => {
    if (account() !== key) {
      throw new Error('Entre na mesma conta para desfazer.');
    }
    await commitEntities([['bills', bill]]);
    toast('Conta recuperada.');
  });
}

async function stopRule(id) {
  const rule = state.rules.find((r) => r.id === id);
  if (!rule) {
    return;
  }
  if (
    !(await confirmAction(
      'Encerrar esta recorrência?',
      `As contas pendentes de “${rule.description}” a partir de hoje serão canceladas. O histórico pago e os vencimentos antigos serão mantidos.`,
      'Encerrar',
      true,
    ))
  ) {
    return;
  }
  const changes = state.bills
    .filter((b) => b.ruleId === id && isPending(b) && b.dueDate >= today())
    .map((b) => ['bills', { ...b, status: 'cancelled', transactionId: '', cancelledAt: today() }]);
  await commitEntities([['rules', { ...rule, disabledAfter: today() }], ...changes]);
  toast('Recorrência encerrada.');
}

function openRefund(id) {
  const tx = state.transactions.find((t) => t.id === id);
  if (!tx || tx.entryKind === 'reversal') {
    return;
  }
  const left = refundableCents(tx);
  if (left <= 0) {
    toast('Este lançamento já foi totalmente estornado.', 'warning');
    return;
  }
  const bill = state.bills.find((b) => b.transactionId === tx.id),
    rule = bill && state.rules.find((r) => r.id === bill.ruleId);
  refundContext = {
    accountKey: account(),
    id,
    ruleId: rule?.frequency === 'installment' ? rule.id : '',
  };
  $('refundDescription').textContent =
    `${tx.description} · disponível para estorno: ${money(left / 100)}. O valor será devolvido ao mesmo tipo de movimentação, sem virar uma nova receita.`;
  $('refundAmount').value = amountInput(left / 100);
  $('refundDate').value = today();
  $('refundDate').max = today();
  $('refundNote').value = '';
  $('refundCancelRemaining').checked = false;
  $('refundCancelField').hidden =
    !rule ||
    rule.frequency !== 'installment' ||
    !state.bills.some((b) => b.ruleId === rule.id && isPending(b));
  clearOperationError($('refundDialog'));
  $('refundDialog').showModal();
}

async function saveRefund() {
  if (!refundContext || refundContext.accountKey !== account()) {
    throw new Error('Sua sessão mudou.');
  }
  const tx = state.transactions.find((t) => t.id === refundContext.id);
  if (!tx) {
    throw new Error('Lançamento não encontrado.');
  }
  const date = $('refundDate').value;
  if (date > today()) {
    throw new Error('Informe a data em que o estorno aconteceu.');
  }
  const reversal = reversalRecord(
    tx,
    parseAmount($('refundAmount').value),
    date,
    $('refundNote').value,
  );
  const changes = [['tx', reversal]];
  if ($('refundCancelRemaining').checked && refundContext.ruleId) {
    const rule = state.rules.find((r) => r.id === refundContext.ruleId);
    changes.push(
      ['rules', { ...rule, cancelledAt: date, disabledAfter: rule.startDate }],
      ...state.bills
        .filter((b) => b.ruleId === rule.id && isPending(b))
        .map((b) => ['bills', { ...b, status: 'cancelled', cancelledAt: date, transactionId: '' }]),
    );
  }
  await commitEntities(changes);
  $('refundDialog').close();
  $('composerDialog').close();
  toast('Estorno registrado, preservando o lançamento original.');
}

function openPurchase(id) {
  const rule = state.rules.find((r) => r.id === id);
  if (!rule) {
    return;
  }
  purchaseContext = { accountKey: account(), id };
  clearOperationError($('purchaseDialog'));
  renderPurchase(true);
  if (!$('purchaseDialog').open) {
    $('purchaseDialog').showModal();
  }
}

function renderPurchase(reset = false) {
  if (!purchaseContext) {
    return;
  }
  const rule = state.rules.find((r) => r.id === purchaseContext.id);
  if (!rule) {
    return;
  }
  const bills = state.bills
      .filter((b) => b.ruleId === rule.id)
      .sort(
        (a, b) => a.dueDate.localeCompare(b.dueDate) || a.installmentNumber - b.installmentNumber,
      ),
    pending = bills.filter(isPending),
    settled = bills.some((b) => isBillPaid(b) || isCancelled(b));
  $('purchaseTitle').textContent = rule.description;
  $('purchaseInfo').textContent =
    `${rule.frequency === 'installment' ? rule.totalInstallments + ' parcelas' : 'Recorrência mensal'} · ${pending.length} pendente(s), ${money(pending.reduce((s, b) => s + b.amount, 0))}${rule.cancelledAt ? ' · programação cancelada' : ''}`;
  if (reset) {
    $('purchaseDescription').value = rule.description;
    $('purchaseCategory').innerHTML = categoryOptions(rule.type, rule.category);
    $('purchaseAmount').value = amountInput(rule.amount);
    $('purchaseCount').value = rule.totalInstallments || 2;
    $('purchaseStart').value = rule.startDate;
  }
  $('purchaseStructure').hidden = rule.frequency !== 'installment';
  for (const id of ['purchaseAmount', 'purchaseCount', 'purchaseStart']) {
    $(id).disabled = settled || Boolean(rule.cancelledAt);
  }
  $('purchaseEditHint').textContent = settled
    ? 'Para preservar o histórico, ajuste valores e datas individualmente no botão Editar de cada parcela. Descrição e categoria podem ser alteradas para a compra inteira.'
    : 'Você pode ajustar o total, a quantidade e o primeiro vencimento antes de pagar ou cancelar parcelas.';
  $('purchaseBills').innerHTML = bills
    .map(
      (b) =>
        /* HTML */ `<div class="purchase-bill">
          <div>
            <strong
              >${b.totalInstallments ? `${b.installmentNumber}/${b.totalInstallments} · ` : ''}${formatDateBR(b.dueDate)}</strong
            ><span
              >${isCancelled(b) ? 'Cancelada' : isBillPaid(b) ? 'Paga em ' + formatDateBR(billPaidDate(b)) : 'Pendente'}
              · ${money(isBillPaid(b) ? billPaidAmount(b) : b.amount)}</span
            >
          </div>
          <button class="button quiet" type="button" data-action="edit-bill" data-id="${esc(b.id)}">
            Editar
          </button>
        </div>`,
    )
    .join('');
  $('purchaseAdvance').hidden = rule.frequency !== 'installment' || !pending.length;
  $('purchaseCancel').disabled = Boolean(rule.cancelledAt) && !pending.length;
}

async function savePurchase() {
  const rule = state.rules.find((r) => r.id === purchaseContext?.id);
  if (!rule || purchaseContext.accountKey !== account()) {
    throw new Error('Compra não encontrada.');
  }
  const description = $('purchaseDescription').value.trim();
  if (!description) {
    throw new Error('Informe a descrição da compra.');
  }
  const category = $('purchaseCategory').value,
    bills = state.bills.filter((b) => b.ruleId === rule.id),
    changes = [];
  let revised = { ...rule, description, category };
  const canRestructure =
    rule.frequency === 'installment' &&
    !rule.cancelledAt &&
    !bills.some((b) => isBillPaid(b) || isCancelled(b));
  const deletes = [];
  if (canRestructure) {
    revised = cleanRule({
      ...revised,
      amount: parseAmount($('purchaseAmount').value),
      totalInstallments: Number($('purchaseCount').value),
      startDate: $('purchaseStart').value,
    });
    const generated = buildBills(revised);
    changes.push(...generated.map((b) => ['bills', b]));
    const ids = new Set(generated.map((b) => b.id));
    deletes.push(...bills.filter((b) => !ids.has(b.id)).map((b) => ['bills', b.id]));
  } else {
    for (const bill of bills) {
      changes.push(['bills', { ...bill, description, category }]);
      const tx = transactionForBill(bill);
      if (tx) {
        changes.push([
          'tx',
          {
            ...tx,
            description:
              description +
              (bill.totalInstallments
                ? ` (${bill.installmentNumber}/${bill.totalInstallments})`
                : ''),
            category,
          },
        ]);
        for (const rev of reversalsFor(tx.id)) {
          changes.push(['tx', { ...rev, category }]);
        }
      }
    }
  }
  await commitEntities([['rules', revised], ...changes], deletes);
  renderPurchase(true);
  toast('Compra atualizada.');
}

function openCancelPurchase(id) {
  const rule = state.rules.find((r) => r.id === id);
  if (!rule) {
    return;
  }
  const bills = state.bills.filter((b) => b.ruleId === id),
    pending = bills.filter(isPending),
    paid = bills.map((b) => transactionForBill(b)).filter(Boolean);
  const total = paid.reduce((sum, tx) => sum + refundableCents(tx), 0) / 100;
  cancelContext = { accountKey: account(), id };
  $('cancelPurchaseText').textContent =
    `Cancelar ${pending.length} conta(s) pendente(s) de “${rule.description}”, somando ${money(pending.reduce((sum, b) => sum + b.amount, 0))}. Os pagamentos anteriores continuam no histórico.`;
  $('cancelPurchaseDate').value = today();
  $('cancelPurchaseDate').max = today();
  $('cancelPurchaseRefund').checked = false;
  $('cancelPurchaseRefundField').hidden = total <= 0;
  $('cancelPurchaseRefundLabel').textContent =
    `Já recebi a devolução dos valores pagos (${money(total)}) e quero registrar os estornos.`;
  clearOperationError($('cancelPurchaseDialog'));
  $('cancelPurchaseDialog').showModal();
}

async function cancelPurchase() {
  const rule = state.rules.find((r) => r.id === cancelContext?.id);
  if (!rule || cancelContext.accountKey !== account()) {
    throw new Error('Compra não encontrada.');
  }
  const date = $('cancelPurchaseDate').value;
  assertDate(date);
  if (date > today()) {
    throw new Error('Informe uma data de cancelamento que já aconteceu.');
  }
  const bills = state.bills.filter((b) => b.ruleId === rule.id),
    changes = [
      ['rules', { ...rule, cancelledAt: date, disabledAfter: rule.startDate }],
      ...bills.filter(isPending).map((b) => [
        'bills',
        {
          ...b,
          status: 'cancelled',
          transactionId: '',
          cancelledAt: date,
          paidAt: '',
          settledAmount: null,
        },
      ]),
    ];
  if ($('cancelPurchaseRefund').checked) {
    for (const bill of bills) {
      const tx = transactionForBill(bill);
      if (tx && refundableCents(tx) > 0) {
        changes.push(['tx', reversalRecord(tx, refundableCents(tx) / 100, date)]);
      }
    }
  }
  await commitEntities(changes);
  $('cancelPurchaseDialog').close();
  renderPurchase();
  toast('Compra cancelada. O histórico foi preservado.');
}

export {
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
  renderPurchase,
  savePurchase,
  saveRefund,
  saveSettlement,
  stopRule,
};
