import { isValidDate } from './format.js';

function txForBill(bill) {
  return `paid_${bill.id}`.slice(0, 96);
}

const cents = (value) => Math.round(Number(value) * 100);

function entryAmount(entry) {
  return (entry.entryKind === 'reversal' ? -1 : 1) * entry.amount;
}

function normalizeEntry(item, raw) {
  const entryKind = raw.entryKind === 'reversal' ? 'reversal' : 'normal',
    relatedTransactionId = String(raw.relatedTransactionId || '').slice(0, 96);
  if (entryKind === 'reversal' && !relatedTransactionId) {
    throw new Error('O estorno precisa estar vinculado ao lançamento original.');
  }
  return {
    ...item,
    entryKind,
    relatedTransactionId: entryKind === 'reversal' ? relatedTransactionId : '',
    operationId: String(raw.operationId || '').slice(0, 96),
  };
}

function isCancelled(bill) {
  return bill.status === 'cancelled' || bill.transactionId === 'cancelled';
}

function assertDate(date) {
  if (!isValidDate(date)) {
    throw new Error('Informe uma data válida.');
  }
}

/** Divide um pagamento com desconto, mantendo a soma exata em centavos.
 * @param {number[]} amounts Valores originais das parcelas.
 * @param {number} target Total efetivamente pago em reais.
 * @returns {number[]} Um valor por parcela, na ordem original.
 */
function allocatePayment(amounts, target) {
  const values = amounts.map(cents),
    total = values.reduce((s, v) => s + v, 0),
    targetCents = cents(target),
    n = values.length;
  if (!n || targetCents < n || targetCents > total) {
    throw new Error('O desconto deve deixar pelo menos R$ 0,01 para cada parcela.');
  }
  if (targetCents === total) {
    return values.map((v) => v / 100);
  }
  const remaining = BigInt(targetCents - n),
    denominator = BigInt(total - n || 1);
  const shares = values.map((v, i) => {
    const product = BigInt(v - 1) * remaining;
    return { index: i, value: 1 + Number(product / denominator), remainder: product % denominator };
  });
  const left = targetCents - shares.reduce((s, v) => s + v.value, 0);
  const order = [...shares].sort((a, b) =>
    a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1,
  );
  for (let i = 0; i < left; i++) {
    order[i % order.length].value++;
  }
  return shares.map((v) => v.value / 100);
}

/** Valida os vínculos antes de importar ou alterar registros financeiros.
 * Não grava dados e não depende da conta aberta na interface.
 * @param {import('./types.js').FinancialData} payload
 * @param {{entryOnly?: boolean}} [options]
 */
function validateFinancialGraph(payload, options = {}) {
  const txs = new Map(payload.transactions.map((t) => [t.id, t])),
    rules = new Map(payload.rules.map((r) => [r.id, r]));
  const refunds = new Map();
  for (const tx of payload.transactions) {
    if (tx.entryKind !== 'reversal') {
      continue;
    }
    const original = txs.get(tx.relatedTransactionId);
    if (!original || original.entryKind === 'reversal' || original.id === tx.id) {
      throw new Error(`Estorno “${tx.description}” sem lançamento original válido.`);
    }
    if (tx.type !== original.type) {
      throw new Error(
        `O tipo do estorno de “${original.description}” não corresponde ao original.`,
      );
    }
    if (tx.date < original.date) {
      throw new Error(
        `A data do estorno de “${original.description}” é anterior à movimentação original.`,
      );
    }
    refunds.set(original.id, (refunds.get(original.id) || 0) + cents(tx.amount));
  }
  for (const [id, total] of refunds) {
    if (total > cents(txs.get(id).amount)) {
      throw new Error(
        `Os estornos de “${txs.get(id).description}” ultrapassam seu valor original.`,
      );
    }
  }
  if (options.entryOnly) {
    return;
  }
  const paidLinks = new Set(),
    occurrences = new Set();
  for (const bill of payload.bills) {
    if (bill.ruleId) {
      const rule = rules.get(bill.ruleId);
      if (!rule) {
        throw new Error(`A conta “${bill.description}” aponta para uma programação inexistente.`);
      }
      if (
        rule.frequency === 'installment' &&
        (!Number.isInteger(bill.installmentNumber) ||
          bill.installmentNumber < 1 ||
          bill.totalInstallments !== rule.totalInstallments ||
          bill.installmentNumber > bill.totalInstallments)
      ) {
        throw new Error(`Confira a numeração das parcelas de “${bill.description}”.`);
      }
      const occurrence =
        bill.ruleId + '|' + (bill.totalInstallments ? bill.installmentNumber : bill.id);
      if (occurrences.has(occurrence)) {
        throw new Error(`Existem parcelas repetidas na compra “${bill.description}”.`);
      }
      occurrences.add(occurrence);
    }
    if (isCancelled(bill)) {
      if (bill.transactionId && bill.transactionId !== 'cancelled') {
        throw new Error(`A conta cancelada “${bill.description}” ainda aponta para um pagamento.`);
      }
      continue;
    }
    if (bill.status === 'paid') {
      const tx = findBillTransaction(bill, payload.transactions);
      if (!tx || tx.entryKind === 'reversal') {
        throw new Error(
          `A conta “${bill.description}” está paga, mas seu lançamento não existe no backup nem na conta atual.`,
        );
      }
      if (tx.type !== bill.type) {
        throw new Error(`O pagamento de “${bill.description}” tem um tipo diferente da conta.`);
      }
      if (paidLinks.has(tx.id)) {
        throw new Error('O mesmo pagamento foi vinculado a mais de uma conta.');
      }
      paidLinks.add(tx.id);
      if (bill.paidAt && bill.paidAt !== tx.date) {
        throw new Error(
          `A data de pagamento de “${bill.description}” não confere com o lançamento.`,
        );
      }
      if (
        bill.settledAmount !== null &&
        bill.settledAmount !== undefined &&
        cents(bill.settledAmount) !== cents(tx.amount)
      ) {
        throw new Error(`O valor pago de “${bill.description}” não confere com o lançamento.`);
      }
    } else if (bill.transactionId || txs.has(txForBill(bill))) {
      throw new Error(
        `A conta “${bill.description}” está pendente, mas possui um pagamento vinculado.`,
      );
    }
  }
  for (const rule of payload.rules.filter((r) => r.frequency === 'installment')) {
    const numbers = new Set(
      payload.bills.filter((b) => b.ruleId === rule.id).map((b) => b.installmentNumber),
    );
    if (numbers.size !== rule.totalInstallments) {
      throw new Error(`A compra “${rule.description}” está com parcelas faltando no backup.`);
    }
  }
}

function sums(items) {
  const totals = items.reduce(
    (sum, t) => {
      sum[t.type] += cents(entryAmount(t));
      return sum;
    },
    { income: 0, expense: 0, investment: 0 },
  );
  return Object.fromEntries(Object.entries(totals).map(([type, value]) => [type, value / 100]));
}

function findBillTransaction(bill, transactions) {
  return transactions.find((t) => t.id === (bill.transactionId || txForBill(bill))) || null;
}

function calculateBalance(totals, mode = 'independent') {
  return (
    (cents(totals.income) -
      cents(totals.expense) -
      (mode === 'integrated' ? cents(totals.investment) : 0)) /
    100
  );
}

export {
  allocatePayment,
  assertDate,
  calculateBalance,
  cents,
  entryAmount,
  findBillTransaction,
  isCancelled,
  normalizeEntry,
  sums,
  txForBill,
  validateFinancialGraph,
};
