import {
  isBillPaid,
  paymentChanges,
  refundableCents,
  reversalsFor,
  transactionForBill,
  updateLinkedBill,
} from './finance.js';
import { cleanRule, cleanTransaction } from './records.js';
import { commitEntities, duplicateOf } from '../data/repository.js';
import {
  assertDate,
  cents,
  isCancelled,
  txForBill,
  validateFinancialGraph,
} from '../domain/finance.js';
import {
  addMonths,
  amountInput,
  amountOK,
  isValidDate,
  parseAmount,
  today,
  uid,
} from '../domain/format.js';
import { buildBills } from '../domain/planning.js';
import { mergedFinancialState } from '../state/selectors.js';
import { state } from '../state/store.js';
import { openComposer } from '../ui/composer.js';
import { $, categoryOptions, icon, money } from '../ui/dom.js';
import { confirmAction, showError, toast } from '../ui/feedback.js';

function editorPaymentFields() {
  const billId = $('editBillId').value,
    txId = $('editTransactionId').value,
    status = $('manualStatus').value,
    frequency = $('manualFrequency').value;
  const show = !txId && status === 'paid' && (Boolean(billId) || frequency !== 'once');
  $('manualActualFields').hidden = !show;
  $('manualPaymentDate').required = show;
  $('manualSettledField').hidden = !billId || !show;
  $('manualPaidAmount').required = Boolean(billId) && show;
}

function openEditor(id, isBill = false) {
  const item = isBill
    ? state.bills.find((b) => b.id === id)
    : state.transactions.find((t) => t.id === id);
  if (!item) {
    return;
  }
  openComposer('manual');
  $('composerTitle').textContent = isBill
    ? 'Editar conta / parcela'
    : item.entryKind === 'reversal'
      ? 'Editar estorno'
      : 'Editar lançamento';
  $('composerTabs').hidden = true;
  $('editTransactionId').value = isBill ? '' : item.id;
  $('editBillId').value = isBill ? item.id : '';
  document.querySelector(`input[name="manualType"][value="${item.type}"]`).checked = true;
  $('manualDescription').value = item.description;
  $('manualAmount').value = amountInput(item.amount);
  $('manualDate').value = isBill ? item.dueDate : item.date;
  $('manualCategory').innerHTML = categoryOptions(item.type, item.category);
  $('scheduleFields').hidden = true;
  $('paymentStatusField').hidden = !isBill;
  $('manualCancelledOption').hidden = !isBill;
  const tx = isBill ? transactionForBill(item) : item,
    bill = isBill ? item : state.bills.find((b) => b.transactionId === id),
    rule = bill && state.rules.find((r) => r.id === bill.ruleId);
  if (isBill) {
    $('manualStatus').value = isCancelled(item)
      ? 'cancelled'
      : isBillPaid(item)
        ? 'paid'
        : 'pending';
    $('manualPaymentDate').value = tx?.date || today();
    $('manualPaidAmount').value = amountInput(tx?.amount || item.amount);
  }
  $('manualSaveButton').innerHTML = icon('check') + 'Salvar alterações';
  $('deleteEditedTransaction').hidden = isBill;
  $('amountLabel').textContent = isBill ? 'Valor do vencimento (R$)' : 'Valor do lançamento (R$)';
  $('dateLabel').textContent = isBill ? 'Vencimento' : 'Data da movimentação';
  $('amountHelp').textContent = isBill
    ? 'Vencimento e pagamento são datas separadas. Esta edição vale para esta conta.'
    : item.entryKind === 'reversal'
      ? 'O estorno mantém vínculo com o original. Você pode corrigir descrição, data e valor.'
      : 'As alterações refletem somente no mês da data informada.';
  $('refundEditedTransaction').hidden =
    !tx || tx.entryKind === 'reversal' || refundableCents(tx) <= 0;
  $('refundEditedTransaction').dataset.id = tx?.id || '';
  $('manageEditedPurchase').hidden = !rule;
  $('manageEditedPurchase').dataset.id = rule?.id || '';
  if (!isBill && item.entryKind === 'reversal') {
    document
      .querySelectorAll('input[name="manualType"]')
      .forEach((input) => (input.disabled = true));
    $('manualCategory').disabled = true;
  }
  editorPaymentFields();
}

function editEntryChanges(previous, item) {
  let revised = cleanTransaction({ ...previous, ...item, createdAt: previous.createdAt });
  const changes = [];
  if (previous.entryKind === 'reversal') {
    const original = state.transactions.find((t) => t.id === previous.relatedTransactionId);
    if (!original) {
      throw new Error('O lançamento original deste estorno não foi encontrado.');
    }
    if (cents(revised.amount) > refundableCents(original, state.transactions, previous.id)) {
      throw new Error('O estorno ultrapassa o valor disponível do original.');
    }
    revised = { ...revised, type: original.type, category: original.category };
  } else {
    const refunds = reversalsFor(previous.id);
    if (refunds.reduce((sum, r) => sum + cents(r.amount), 0) > cents(revised.amount)) {
      throw new Error(
        'O valor original não pode ser menor que a soma dos estornos. Corrija os estornos antes.',
      );
    }
    changes.push(
      ...refunds.map((r) => ['tx', { ...r, type: revised.type, category: revised.category }]),
    );
    const bill = state.bills.find((b) => b.transactionId === revised.id);
    if (bill) {
      changes.push([
        'bills',
        {
          ...updateLinkedBill(revised, bill),
          description: revised.description.replace(/\s+\(\d+\/\d+\)$/, ''),
        },
      ]);
    }
  }
  changes.push(['tx', revised]);
  validateFinancialGraph(mergedFinancialState(changes), { entryOnly: true });
  return changes;
}

async function saveManual(event) {
  event.preventDefault();
  if ($('manualSaveButton').disabled) {
    return;
  }
  $('manualSaveButton').disabled = true;
  $('composerError').hidden = true;
  try {
    const type = document.querySelector('input[name="manualType"]:checked').value,
      description = $('manualDescription').value.trim(),
      amount = parseAmount($('manualAmount').value),
      date = $('manualDate').value,
      category = $('manualCategory').value,
      editTx = $('editTransactionId').value,
      editBill = $('editBillId').value,
      frequency = $('manualFrequency').value,
      status = $('manualStatus').value;
    if (!description || !amountOK(amount) || !isValidDate(date)) {
      throw new Error('Preencha a descrição, uma data válida e um valor maior que zero.');
    }
    const item = {
      id: editTx || uid('tx'),
      description,
      type,
      amount,
      date,
      category,
      createdAt: Date.now(),
    };
    if (
      !editBill &&
      duplicateOf(item, editTx) &&
      !(await confirmAction(
        'Possível lançamento repetido',
        'Já existe um lançamento com os mesmos dados. Deseja continuar?',
        'Salvar mesmo assim',
      ))
    ) {
      return;
    }
    if (editTx) {
      const previous = state.transactions.find((t) => t.id === editTx);
      if (!previous) {
        throw new Error('Este lançamento não está mais disponível.');
      }
      await commitEntities(editEntryChanges(previous, item));
    } else if (editBill) {
      const previous = state.bills.find((b) => b.id === editBill);
      if (!previous) {
        throw new Error('Esta conta não está mais disponível.');
      }
      const previousTx = transactionForBill(previous),
        changes = [],
        deletes = [];
      let bill = { ...previous, description, type, amount, category, dueDate: date, status };
      if (status === 'paid') {
        const paymentDate = $('manualPaymentDate').value,
          paidAmount = parseAmount($('manualPaidAmount').value);
        assertDate(paymentDate);
        if (!amountOK(paidAmount)) {
          throw new Error('Informe o valor efetivamente pago.');
        }
        const tx = cleanTransaction({
          ...(previousTx || {}),
          id: previousTx?.id || txForBill(previous),
          description:
            description +
            (previous.totalInstallments
              ? ` (${previous.installmentNumber}/${previous.totalInstallments})`
              : ''),
          type,
          category,
          amount: paidAmount,
          date: paymentDate,
          createdAt: previousTx?.createdAt || Date.now(),
        });
        if (previousTx) {
          const edited = editEntryChanges(previousTx, tx);
          changes.push(...edited.filter(([entity]) => entity === 'tx'));
        } else {
          changes.push(['tx', tx]);
        }
        bill = {
          ...bill,
          transactionId: tx.id,
          paidAt: paymentDate,
          settledAmount: paidAmount,
          cancelledAt: '',
        };
      } else {
        if (previousTx) {
          if (
            !(await confirmAction(
              'Alterar a situação do pagamento?',
              `O lançamento de ${money(previousTx.amount)} e seus estornos serão removidos para deixar a conta ${status === 'cancelled' ? 'cancelada' : 'pendente'}.`,
              'Confirmar alteração',
            ))
          ) {
            return;
          }
          deletes.push(
            ['tx', previousTx.id],
            ...reversalsFor(previousTx.id).map((r) => ['tx', r.id]),
          );
        }
        bill = {
          ...bill,
          transactionId: '',
          paidAt: '',
          settledAmount: null,
          cancelledAt: status === 'cancelled' ? today() : '',
        };
      }
      changes.push(['bills', bill]);
      await commitEntities(changes, deletes);
    } else if (frequency !== 'once') {
      if (type !== 'expense' && frequency === 'installment') {
        throw new Error('Use parcelamento para uma despesa.');
      }
      if (
        state.rules.some(
          (r) =>
            !r.disabledAfter &&
            !r.cancelledAt &&
            r.description.toLowerCase() === description.toLowerCase() &&
            r.amount === amount &&
            r.startDate === date,
        ) &&
        !(await confirmAction(
          'Programação semelhante',
          'Já existe uma programação com os mesmos dados. Deseja criar outra?',
          'Criar outra',
        ))
      ) {
        return;
      }
      const rule = cleanRule({
        id: uid('rule'),
        description,
        type,
        amount,
        category,
        startDate: date,
        frequency,
        totalInstallments: frequency === 'installment' ? Number($('manualInstallments').value) : 0,
        cardName: frequency === 'installment' ? $('manualCardName').value.trim() : '',
      });
      const horizon =
          addMonths(date, 12) > addMonths(today(), 12)
            ? addMonths(date, 12)
            : addMonths(today(), 12),
        bills = buildBills(rule, horizon),
        changes = [['rules', rule], ...bills.map((b) => ['bills', b])];
      if (status === 'paid' && bills.length) {
        changes.push(...paymentChanges(bills[0], $('manualPaymentDate').value));
      }
      await commitEntities(changes);
    } else if (status === 'pending') {
      await commitEntities([
        [
          'bills',
          {
            id: uid('bill'),
            description,
            type,
            amount,
            category,
            dueDate: date,
            status: 'pending',
            createdAt: Date.now(),
          },
        ],
      ]);
    } else {
      await commitEntities([['tx', item]]);
    }
    $('composerDialog').close();
    toast(
      editTx || editBill
        ? 'Alterações salvas, com os vínculos preservados.'
        : frequency !== 'once'
          ? 'Programação criada.'
          : 'Lançamento registrado.',
    );
  } catch (error) {
    showError(error);
  } finally {
    $('manualSaveButton').disabled = false;
  }
}

export { editorPaymentFields, openEditor, saveManual };
