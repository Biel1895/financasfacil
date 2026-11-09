import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  allocatePayment,
  calculateBalance,
  cents,
  sums,
  validateFinancialGraph,
} from '../../src/js/domain/finance.js';
import { buildBills } from '../../src/js/domain/planning.js';
import { sanitizeRule } from '../../src/js/domain/records.js';

const purchase = (overrides = {}) =>
  sanitizeRule(
    {
      id: 'purchase',
      description: 'Compra de teste',
      type: 'expense',
      amount: 100,
      category: 'Compras & Vestuário',
      startDate: '2028-01-31',
      frequency: 'installment',
      totalInstallments: 3,
      ...overrides,
    },
    'test-account',
  );
const original = {
  id: 'payment',
  type: 'expense',
  amount: 100,
  date: '2028-02-10',
  description: 'Compra',
};
const reversal = (overrides = {}) => ({
  id: 'refund',
  entryKind: 'reversal',
  relatedTransactionId: 'payment',
  type: 'expense',
  amount: 25,
  date: '2028-02-12',
  ...overrides,
});

test('parcelas conservam todos os centavos e o último dia válido de cada mês', () => {
  const bills = buildBills(purchase());
  assert.deepEqual(
    bills.map((bill) => bill.amount),
    [33.34, 33.33, 33.33],
  );
  assert.deepEqual(
    bills.map((bill) => bill.dueDate),
    ['2028-01-31', '2028-02-29', '2028-03-31'],
  );
  assert.equal(
    bills.reduce((sum, bill) => sum + cents(bill.amount), 0),
    10000,
  );
});

test('distribuição exata funciona de 2 até 120 parcelas sem criar parcela de valor zero', () => {
  for (let count = 2; count <= 120; count++) {
    const bills = buildBills(purchase({ amount: 2800.01, totalInstallments: count }));
    assert.equal(bills.length, count);
    assert.equal(
      bills.reduce((sum, bill) => sum + cents(bill.amount), 0),
      280001,
    );
    assert.ok(bills.every((bill) => cents(bill.amount) >= 1));
  }
});

test('antecipação com desconto conserva o valor pago e limita o desconto por parcela', () => {
  const allocated = allocatePayment([33.34, 33.33, 33.33], 90.01);
  assert.equal(
    allocated.reduce((sum, value) => sum + cents(value), 0),
    9001,
  );
  assert.ok(allocated.every((value, i) => value > 0 && value <= [33.34, 33.33, 33.33][i]));
  assert.throws(() => allocatePayment([1, 1], 0.01), /pelo menos/);
  assert.throws(() => allocatePayment([1, 1], 2.01), /desconto/);
});

test('recorrência encerrada não volta a criar vencimentos futuros', () => {
  const rule = purchase({ frequency: 'monthly', disabledAfter: '2028-03-01' });
  assert.deepEqual(
    buildBills(rule, '2028-12-31').map((bill) => bill.dueDate),
    ['2028-01-31', '2028-02-29'],
  );
  assert.deepEqual(buildBills({ ...rule, cancelledAt: '2028-01-01' }), []);
});

test('estorno reduz a despesa original e os dois modos de saldo mantêm os centavos', () => {
  const totals = sums([
    { type: 'income', amount: 0.3 },
    { type: 'expense', amount: 0.1 },
    { type: 'expense', amount: 0.1, entryKind: 'reversal' },
    { type: 'investment', amount: 0.2 },
  ]);
  assert.deepEqual(totals, { income: 0.3, expense: 0, investment: 0.2 });
  assert.equal(calculateBalance(totals), 0.3);
  assert.equal(calculateBalance(totals, 'integrated'), 0.1);
});

test('backup rejeita estornos sem original, acima do valor ou com data anterior', () => {
  const validate = (transactions) => validateFinancialGraph({ transactions, bills: [], rules: [] });
  assert.doesNotThrow(() => validate([original, reversal()]));
  assert.throws(() => validate([reversal()]), /original válido/);
  assert.throws(() => validate([original, reversal({ amount: 101 })]), /ultrapassam/);
  assert.throws(() => validate([original, reversal({ date: '2028-02-01' })]), /anterior/);
  assert.throws(() => validate([original, reversal({ type: 'income' })]), /tipo/);
});

test('backup exige vínculo único entre conta paga e lançamento correspondente', () => {
  const bill = {
    id: 'bill',
    status: 'paid',
    type: 'expense',
    description: 'Compra',
    transactionId: 'payment',
    paidAt: original.date,
    settledAmount: 100,
  };
  assert.doesNotThrow(() =>
    validateFinancialGraph({ transactions: [original], bills: [bill], rules: [] }),
  );
  assert.throws(
    () => validateFinancialGraph({ transactions: [], bills: [bill], rules: [] }),
    /não existe/,
  );
  assert.throws(
    () =>
      validateFinancialGraph({
        transactions: [original],
        bills: [bill, { ...bill, id: 'another' }],
        rules: [],
      }),
    /mais de uma/,
  );
  assert.throws(
    () =>
      validateFinancialGraph({
        transactions: [original],
        bills: [{ ...bill, settledAmount: 90 }],
        rules: [],
      }),
    /valor pago/,
  );
});

test('backup rejeita compras com parcelas faltantes ou repetidas', () => {
  const rule = purchase();
  const bills = buildBills(rule);
  assert.doesNotThrow(() => validateFinancialGraph({ transactions: [], bills, rules: [rule] }));
  assert.throws(
    () => validateFinancialGraph({ transactions: [], bills: bills.slice(1), rules: [rule] }),
    /faltando/,
  );
  assert.throws(
    () =>
      validateFinancialGraph({
        transactions: [],
        bills: [...bills, { ...bills[0], id: 'duplicate' }],
        rules: [rule],
      }),
    /repetidas/,
  );
});
