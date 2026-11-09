import { cleanTransaction } from './records.js';
import {
  assertDate,
  calculateBalance,
  cents,
  isCancelled,
  sums,
  txForBill,
} from '../domain/finance.js';
import { amountOK, today, uid } from '../domain/format.js';
import { monthTransactions } from '../state/selectors.js';
import { state } from '../state/store.js';

function isBillPaid(bill) {
  return !isCancelled(bill) && Boolean(transactionForBill(bill));
}

function balanceValue(totals) {
  return calculateBalance(totals, state.balanceMode);
}

function balanceSummary() {
  const cutoff = today(),
    confirmed = state.transactions.filter((entry) => entry.date <= cutoff),
    totals = sums(confirmed);
  return {
    total: balanceValue(totals),
    month: balanceValue(sums(monthTransactions())),
    investmentToDate: totals.investment,
    cutoff,
  };
}

function transactionForBill(bill, transactions = state.transactions) {
  return transactions.find((t) => t.id === (bill.transactionId || txForBill(bill))) || null;
}

function reversalsFor(id, transactions = state.transactions) {
  return transactions.filter((t) => t.entryKind === 'reversal' && t.relatedTransactionId === id);
}

function refundableCents(tx, transactions = state.transactions, ignore = '') {
  return (
    cents(tx.amount) -
    reversalsFor(tx.id, transactions)
      .filter((t) => t.id !== ignore)
      .reduce((sum, t) => sum + cents(t.amount), 0)
  );
}

function billPaidDate(bill) {
  return transactionForBill(bill)?.date || '';
}

function billPaidAmount(bill) {
  return transactionForBill(bill)?.amount || 0;
}

function isPending(bill) {
  return !isCancelled(bill) && !isBillPaid(bill);
}

function reversalRecord(tx, amount, date, note = '') {
  if (tx.entryKind === 'reversal') {
    throw new Error('Edite ou exclua o estorno existente para corrigir seu valor.');
  }
  if (!amountOK(amount) || cents(amount) > refundableCents(tx)) {
    throw new Error('O estorno não pode ultrapassar o valor ainda disponível do lançamento.');
  }
  assertDate(date);
  if (date < tx.date) {
    throw new Error('A data do estorno não pode ser anterior ao lançamento original.');
  }
  return cleanTransaction({
    id: uid('rev'),
    type: tx.type,
    category: tx.category,
    amount,
    date,
    description: (note.trim() || 'Estorno: ' + tx.description).slice(0, 140),
    entryKind: 'reversal',
    relatedTransactionId: tx.id,
    createdAt: Date.now(),
  });
}

function paymentChanges(bill, date, amount = bill.amount) {
  assertDate(date);
  if (!isPending(bill)) {
    throw new Error('Esta parcela não está mais pendente. Atualize a lista.');
  }
  const tx = cleanTransaction({
    id: txForBill(bill),
    type: bill.type,
    category: bill.category,
    amount,
    date,
    description:
      bill.description +
      (bill.totalInstallments ? ` (${bill.installmentNumber}/${bill.totalInstallments})` : ''),
    createdAt: Date.now(),
  });
  return [
    ['tx', tx],
    [
      'bills',
      {
        ...bill,
        status: 'paid',
        transactionId: tx.id,
        paidAt: date,
        settledAmount: amount,
        cancelledAt: '',
      },
    ],
  ];
}

function updateLinkedBill(tx, bill) {
  return {
    ...bill,
    status: 'paid',
    type: tx.type,
    category: tx.category,
    paidAt: tx.date,
    settledAmount: tx.amount,
  };
}

export {
  balanceSummary,
  billPaidAmount,
  billPaidDate,
  isBillPaid,
  isPending,
  paymentChanges,
  refundableCents,
  reversalRecord,
  reversalsFor,
  transactionForBill,
  updateLinkedBill,
};
