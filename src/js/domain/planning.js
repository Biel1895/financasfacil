import { addMonths, today } from './format.js';
import { sanitizeBill } from './records.js';

/** Projeta vencimentos a partir do primeiro dia desejado, sem gravar no banco.
 * Janeiro/31 gera fevereiro/28 ou 29 e volta a março/31.
 * @param {import('./types.js').RecurrenceRule} rule
 * @param {string} [horizon] Limite inclusivo para recorrências mensais.
 * @returns {import('./types.js').Bill[]}
 */
function buildBills(rule, horizon = addMonths(today(), 12)) {
  if (rule.cancelledAt) {
    return [];
  }
  const result = [];
  const totalCents = Math.round(rule.amount * 100);
  const start = rule.startDate.split('-').map(Number),
    end = horizon.split('-').map(Number);
  const n =
    rule.frequency === 'installment'
      ? rule.totalInstallments
      : Math.max(0, (end[0] - start[0]) * 12 + end[1] - start[1] + 1);
  for (let i = 0; i < n; i++) {
    const due = addMonths(rule.startDate, i);
    if (
      due > '2200-12-31' ||
      (rule.frequency === 'monthly' && due > horizon) ||
      (rule.disabledAfter && due >= rule.disabledAfter)
    ) {
      break;
    }
    const cents =
      rule.frequency === 'installment'
        ? Math.floor(totalCents / n) + (i < totalCents % n ? 1 : 0)
        : totalCents;
    result.push(
      sanitizeBill(
        {
          id: `${rule.id}_${i + 1}`,
          description: rule.description,
          amount: cents / 100,
          type: rule.type,
          category: rule.category,
          cardName: rule.cardName,
          dueDate: due,
          status: 'pending',
          ruleId: rule.id,
          sequence: i + 1,
          installmentNumber: rule.frequency === 'installment' ? i + 1 : 0,
          totalInstallments: rule.frequency === 'installment' ? n : 0,
          createdAt: rule.createdAt,
        },
        rule.accountKey,
      ),
    );
  }
  return result;
}

export { buildBills };
