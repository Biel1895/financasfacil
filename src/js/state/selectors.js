import { isCancelled } from '../domain/finance.js';
import { state } from './store.js';

function isoMonth(y = state.selectedYear, m = state.selectedMonth) {
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

function monthTransactions(offset = 0) {
  const date = new Date(state.selectedYear, state.selectedMonth + offset, 1);
  const prefix = isoMonth(date.getFullYear(), date.getMonth());
  return state.transactions.filter((t) => t.date.startsWith(prefix));
}

function realBills() {
  return state.bills.filter((b) => !isCancelled(b));
}

function selectedPeriod() {
  return { year: state.selectedYear, month: state.selectedMonth };
}

function mergedFinancialState(changes = [], deletions = []) {
  const maps = {
    tx: new Map(state.transactions.map((t) => [t.id, t])),
    bills: new Map(state.bills.map((b) => [b.id, b])),
    rules: new Map(state.rules.map((r) => [r.id, r])),
  };
  for (const [entity, item] of changes) {
    maps[entity].set(item.id, item);
  }
  for (const [entity, id] of deletions) {
    maps[entity].delete(id);
  }
  return {
    transactions: [...maps.tx.values()],
    bills: [...maps.bills.values()],
    rules: [...maps.rules.values()],
  };
}

export { isoMonth, mergedFinancialState, monthTransactions, realBills, selectedPeriod };
