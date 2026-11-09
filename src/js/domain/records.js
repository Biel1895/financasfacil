import { CATEGORIES } from './categories.js';
import { normalizeEntry } from './finance.js';
import {
  amountOK,
  currentPeriod,
  formatISO,
  getSafeDateForSelectedMonth,
  isValidDate,
  normalizeCategory,
  sanitizeTransactionId,
  uid,
} from './format.js';

function validateAndSanitizeTransaction(rawItem, accountKey, period = currentPeriod()) {
  if (!rawItem || typeof rawItem !== 'object') {
    return null;
  }

  const validTypes = ['expense', 'income', 'investment'];
  const type = validTypes.includes(rawItem.type) ? rawItem.type : 'expense';

  const amountNum = Number(rawItem.amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0 || amountNum > 999999999.99) {
    return null;
  }
  const roundedAmount = Math.round(amountNum * 100) / 100;

  const description =
    String(rawItem.description || '')
      .trim()
      // eslint-disable-next-line no-control-regex -- Não permitir caracteres de controle na descrição salva.
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .slice(0, 140) || 'Movimentação';

  const allowedCategories = CATEGORIES[type] || CATEGORIES.expense;
  const rawCat = normalizeCategory(
    String(rawItem.category || '')
      .trim()
      .slice(0, 80),
  );
  const category = allowedCategories.some((c) => c.name === rawCat)
    ? rawCat
    : allowedCategories[allowedCategories.length - 1].name;

  const rawDate = String(rawItem.date || '').trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : formatISO(getSafeDateForSelectedMonth(period.year, period.month));

  return {
    id: sanitizeTransactionId(rawItem.id),
    accountKey,
    type,
    description,
    amount: roundedAmount,
    category,
    date,
    createdAt: Number.isFinite(Number(rawItem.createdAt)) ? Number(rawItem.createdAt) : Date.now(),
    updatedAt: Number.isFinite(Number(rawItem.updatedAt)) ? Number(rawItem.updatedAt) : Date.now(),
    syncedWithCloud: Boolean(rawItem.syncedWithCloud),
  };
}

function sanitizeTransaction(raw, key) {
  if (!raw || !isValidDate(raw.date) || !['expense', 'income', 'investment'].includes(raw.type)) {
    throw new Error('Confira a data e o tipo do lançamento.');
  }
  const item = validateAndSanitizeTransaction(raw, key);
  if (!item || !amountOK(item.amount)) {
    throw new Error('Informe um valor entre R$ 0,01 e R$ 999.999.999,99.');
  }
  return normalizeEntry(item, raw);
}

function sanitizeBill(raw, key) {
  if (
    !raw ||
    !amountOK(Number(raw.amount)) ||
    !isValidDate(raw.dueDate) ||
    !['expense', 'income', 'investment'].includes(raw.type)
  ) {
    throw new Error('Conta com valor, tipo ou vencimento inválido.');
  }
  const cats = CATEGORIES[raw.type],
    cancelled = raw.status === 'cancelled' || raw.transactionId === 'cancelled';
  const installmentNumber = Number(raw.installmentNumber) || 0,
    totalInstallments = Number(raw.totalInstallments) || 0;
  const sequence =
    Number(raw.sequence) ||
    installmentNumber ||
    (raw.ruleId && String(raw.id).startsWith(raw.ruleId + '_')
      ? Number(String(raw.id).slice(raw.ruleId.length + 1)) || 0
      : 0);
  if (
    !Number.isInteger(installmentNumber) ||
    !Number.isInteger(totalInstallments) ||
    installmentNumber < 0 ||
    totalInstallments < 0 ||
    totalInstallments > 120
  ) {
    throw new Error('A numeração das parcelas é inválida.');
  }
  return {
    id: sanitizeTransactionId(raw.id || uid('bill')),
    accountKey: key,
    description: String(raw.description || 'Conta')
      .trim()
      .slice(0, 140),
    amount: Math.round(Number(raw.amount) * 100) / 100,
    type: raw.type,
    cardName: String(raw.cardName || '')
      .trim()
      .slice(0, 60),
    category: cats.some((c) => c.name === normalizeCategory(raw.category))
      ? normalizeCategory(raw.category)
      : cats.at(-1).name,
    dueDate: raw.dueDate,
    status: cancelled ? 'cancelled' : raw.status === 'paid' ? 'paid' : 'pending',
    transactionId: cancelled ? '' : String(raw.transactionId || '').slice(0, 96),
    ruleId: String(raw.ruleId || '').slice(0, 96),
    installmentNumber,
    totalInstallments,
    sequence,
    paidAt: isValidDate(raw.paidAt) ? raw.paidAt : '',
    settledAmount:
      raw.settledAmount === null || raw.settledAmount === undefined
        ? null
        : Number(raw.settledAmount),
    cancelledAt: isValidDate(raw.cancelledAt) ? raw.cancelledAt : '',
    createdAt: Number(raw.createdAt) || Date.now(),
    updatedAt: Number(raw.updatedAt) || Date.now(),
    syncedWithCloud: Boolean(raw.syncedWithCloud),
  };
}

function sanitizeRule(raw, key) {
  if (
    !raw ||
    !amountOK(Number(raw.amount)) ||
    !isValidDate(raw.startDate) ||
    !['monthly', 'installment'].includes(raw.frequency) ||
    !['expense', 'income', 'investment'].includes(raw.type)
  ) {
    throw new Error('Recorrência inválida.');
  }
  const total = Number(raw.totalInstallments) || 0;
  if (
    raw.frequency === 'installment' &&
    (!Number.isInteger(total) || total < 2 || total > 120 || Math.round(raw.amount * 100) < total)
  ) {
    throw new Error('Confira o número de parcelas e o valor total.');
  }
  const cats = CATEGORIES[raw.type];
  return {
    id: sanitizeTransactionId(raw.id || uid('rule')),
    accountKey: key,
    description: String(raw.description || 'Conta recorrente')
      .trim()
      .slice(0, 140),
    amount: Math.round(Number(raw.amount) * 100) / 100,
    type: raw.type,
    cardName: String(raw.cardName || '')
      .trim()
      .slice(0, 60),
    category: cats.some((c) => c.name === normalizeCategory(raw.category))
      ? normalizeCategory(raw.category)
      : cats.at(-1).name,
    startDate: raw.startDate,
    frequency: raw.frequency,
    totalInstallments: total,
    disabledAfter: raw.disabledAfter && isValidDate(raw.disabledAfter) ? raw.disabledAfter : null,
    cancelledAt: isValidDate(raw.cancelledAt) ? raw.cancelledAt : '',
    createdAt: Number(raw.createdAt) || Date.now(),
    updatedAt: Number(raw.updatedAt) || Date.now(),
    syncedWithCloud: Boolean(raw.syncedWithCloud),
  };
}

function sanitizeEntity(entity, item, key) {
  return entity === 'tx'
    ? sanitizeTransaction(item, key)
    : entity === 'bills'
      ? sanitizeBill(item, key)
      : sanitizeRule(item, key);
}

export {
  sanitizeBill,
  sanitizeEntity,
  sanitizeRule,
  sanitizeTransaction,
  validateAndSanitizeTransaction,
};
