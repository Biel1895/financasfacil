import { isPending } from './finance.js';
import { sums } from '../domain/finance.js';
import { formatISO, monthIndex, reportDate } from '../domain/format.js';
import { buildBills } from '../domain/planning.js';
import { isoMonth } from '../state/selectors.js';
import { state } from '../state/store.js';

function projectedBills(endDate) {
  const known = new Set(state.bills.map((b) => b.id)),
    occurrences = new Set(
      state.bills
        .filter((b) => b.ruleId)
        .map(
          (b) =>
            b.ruleId + '|' + (b.totalInstallments ? b.installmentNumber : b.sequence || b.dueDate),
        ),
    );
  const future = state.rules
    .flatMap((rule) => buildBills(rule, endDate))
    .filter(
      (b) =>
        !known.has(b.id) &&
        !occurrences.has(
          b.ruleId + '|' + (b.totalInstallments ? b.installmentNumber : b.sequence || b.dueDate),
        ),
    );
  return [...state.bills, ...future];
}

function forecastMonths() {
  const now = new Date(),
    start = Math.max(
      monthIndex(now.getFullYear(), now.getMonth()),
      monthIndex(state.selectedYear, state.selectedMonth),
    ),
    span = state.forecastSpan === 12 ? 12 : 6;
  const end = reportDate(Math.min(monthIndex(2200, 11), start + span - 1)),
    horizon = formatISO(new Date(end.getFullYear(), end.getMonth() + 1, 0)),
    bills = projectedBills(horizon);
  return Array.from({ length: Math.min(span, monthIndex(2200, 11) - start + 1) }, (_, i) => {
    const date = reportDate(start + i),
      prefix = isoMonth(date.getFullYear(), date.getMonth()),
      realized = sums(state.transactions.filter((t) => t.date.startsWith(prefix))),
      pending = bills.filter((b) => isPending(b) && b.dueDate.startsWith(prefix));
    const scheduled = pending.reduce(
      (sum, b) => {
        sum[b.type] += b.amount;
        return sum;
      },
      { income: 0, expense: 0, investment: 0 },
    );
    const income = realized.income + scheduled.income,
      expense = realized.expense + scheduled.expense,
      investment = realized.investment + scheduled.investment;
    return {
      prefix,
      label: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      income,
      expense,
      investment,
      pendingExpense: scheduled.expense,
      installments: pending
        .filter((b) => b.totalInstallments)
        .reduce((sum, b) => sum + b.amount, 0),
      result: income - expense - (state.balanceMode === 'integrated' ? investment : 0),
    };
  });
}

export { forecastMonths };
