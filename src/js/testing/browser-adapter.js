import { forecastMonths } from '../application/forecast.js';
import { balanceSummary } from '../application/finance.js';
import { parseGeneralInput } from '../application/installments.js';
import { allocatePayment, entryAmount, validateFinancialGraph } from '../domain/finance.js';
import { addMonths, isValidDate, parseAmount } from '../domain/format.js';
import { parseNaturalLanguageInput } from '../domain/natural-language.js';
import { buildBills } from '../domain/planning.js';
import { DB } from '../infrastructure/database.js';
import { selectedPeriod } from '../state/selectors.js';
import { state } from '../state/store.js';
import { Voice } from '../ui/voice.js';

/** Test fixture access; no application module reads these window properties. */
export function installTestAdapter() {
  Object.assign(window, {
    FF_STATE: state,
    FF_LocalDB: DB,
    FF_Finance: {
      allocatePayment,
      entryAmount,
      validateFinancialGraph,
      balanceSummary,
      forecastMonths,
    },
    FF_Planning: { addMonths, buildBills, parseAmount, isValidDate, parseGeneralInput },
    FF_NLP: Object.assign(Voice, {
      parseNaturalLanguageInput: (text) => parseNaturalLanguageInput(text, selectedPeriod()),
    }),
  });
}
