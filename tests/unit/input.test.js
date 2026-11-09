import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addMonths, isValidDate, parseAmount } from '../../src/js/domain/format.js';
import { parseInstallmentClause } from '../../src/js/domain/installments.js';
import { parseNaturalLanguageInput } from '../../src/js/domain/natural-language.js';
import { sanitizeTransaction } from '../../src/js/domain/records.js';

const period = { year: 2028, month: 1 };

test('valores brasileiros distinguem milhar e centavos e rejeitam entradas ambíguas', () => {
  assert.equal(parseAmount('R$ 1.234,56'), 1234.56);
  assert.equal(parseAmount('2800'), 2800);
  assert.equal(parseAmount('1.000'), 1000);
  assert.ok(Number.isNaN(parseAmount('12,345')));
  assert.ok(Number.isNaN(parseAmount('-10')));
});

test('texto com duas movimentações preserva centavos e usa o período recebido', () => {
  const parsed = parseNaturalLanguageInput('Gastei 10,50 no mercado e recebi 200 dia 29', period);
  assert.equal(parsed.length, 2);
  assert.deepEqual(
    parsed.map((entry) => [entry.type, entry.amount, entry.date]),
    [
      ['expense', 10.5, '2028-02-29'],
      ['income', 200, '2028-02-29'],
    ],
  );
});

test('compra parcelada preserva o número do produto e aceita quantidade por extenso', () => {
  const draft = parseInstallmentClause('Comprei um PS5 por 2800 em cinco vezes', period);
  assert.equal(draft.amount, 2800);
  assert.equal(draft.installments, 5);
  assert.match(draft.description, /PS5/);
  assert.match(draft.date, /^2028-02-/);
});

test('parcelamento diferencia total e valor por parcela e rejeita contradição', () => {
  assert.equal(parseInstallmentClause('Comprei uma TV em 5x de 560', period).amount, 2800);
  assert.throws(
    () => parseInstallmentClause('Comprei uma TV por 2800 em 5x de 500', period),
    /não confere/,
  );
  assert.throws(
    () => parseInstallmentClause('Comprei uma TV parcelada', period),
    /quantas parcelas/,
  );
  assert.throws(
    () => parseInstallmentClause('Comprei uma TV por 2800 em 121x', period),
    /120 parcelas/,
  );
});

test('datas preservam o dia desejado quando o mês seguinte permite', () => {
  assert.equal(addMonths('2028-01-31', 1), '2028-02-29');
  assert.equal(addMonths('2028-01-31', 2), '2028-03-31');
  assert.equal(isValidDate('2027-02-29'), false);
  assert.equal(isValidDate('2028-02-29'), true);
});

test('normalização preserva a conta e compatibiliza a categoria antiga', () => {
  const entry = sanitizeTransaction(
    {
      id: 'entry',
      type: 'expense',
      amount: 50,
      date: '2028-02-20',
      category: 'Lazer & Restaurantes',
      description: 'Viagem',
    },
    'isolated-account',
  );
  assert.equal(entry.accountKey, 'isolated-account');
  assert.equal(entry.category, 'Lazer & Viagens');
  assert.throws(
    () => sanitizeTransaction({ ...entry, date: '2028-02-31' }, 'isolated-account'),
    /data/,
  );
});
