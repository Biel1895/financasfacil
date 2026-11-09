import { cleanRule } from './records.js';
import { parseInstallmentClause } from '../domain/installments.js';
import { parseNaturalLanguageInput } from '../domain/natural-language.js';
import { buildBills } from '../domain/planning.js';
import { selectedPeriod } from '../state/selectors.js';

function parseGeneralInput(text) {
  const clauses = text
    .trim()
    .split(
      /;|,\s+(?=(?:comprei|paguei|gastei|recebi|ganhei|investi|aportei|apliquei)\b)|\s+e\s+(?=(?:comprei|paguei|gastei|recebi|ganhei|investi|aportei|apliquei)\b)/i,
    )
    .map((s) => s.trim())
    .filter(Boolean);
  return clauses.flatMap((clause) => {
    const installment = parseInstallmentClause(clause, selectedPeriod());
    return installment ? [installment] : parseNaturalLanguageInput(clause, selectedPeriod());
  });
}

function installmentDraftPlan(item, ruleId = 'plan_' + item.id) {
  if (!Number.isInteger(item.installments) || item.installments < 2 || item.installments > 120) {
    throw new Error('Informe de 2 a 120 parcelas.');
  }
  const rule = cleanRule({
    id: ruleId,
    description: item.description,
    amount: item.amount,
    startDate: item.date,
    type: 'expense',
    category: item.category,
    frequency: 'installment',
    totalInstallments: item.installments,
    cardName: item.cardName,
  });
  return { rule, bills: buildBills(rule) };
}

export { installmentDraftPlan, parseGeneralInput };
