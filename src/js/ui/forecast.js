import { isPending } from '../application/finance.js';
import { forecastMonths } from '../application/forecast.js';
import { today } from '../domain/format.js';
import { state } from '../state/store.js';
import { $, esc, money } from './dom.js';

function renderForecast() {
  const months = forecastMonths();
  $('forecastSpan').value = String(state.forecastSpan === 12 ? 12 : 6);
  $('forecastCards').innerHTML = months
    .map(
      (month) =>
        /* HTML */ `<article class="forecast-card">
          <h3>${esc(month.label)}</h3>
          <dl>
            <div>
              <dt>Entradas previstas</dt>
              <dd>${money(month.income)}</dd>
            </div>
            <div>
              <dt>Saídas previstas</dt>
              <dd>${money(month.expense)}</dd>
            </div>
            <div>
              <dt>Aportes previstos</dt>
              <dd>${money(month.investment)}</dd>
            </div>
            <div class="forecast-pending">
              <dt>Ainda a pagar</dt>
              <dd>${money(month.pendingExpense)}</dd>
            </div>
            <div class="forecast-result ${month.result < 0 ? 'negative' : ''}">
              <dt>Resultado do mês</dt>
              <dd>${money(month.result)}</dd>
            </div>
          </dl>
          <p>
            ${month.income === 0 ? 'Nenhuma entrada registrada ou programada.' : 'Inclui movimentações registradas e contas programadas.'}
          </p>
        </article>`,
    )
    .join('');
  const overdue = state.bills
    .filter((b) => isPending(b) && b.dueDate < today() && b.type === 'expense')
    .reduce((sum, b) => sum + b.amount, 0);
  $('forecastNote').textContent =
    'Cada mês é independente, sem somar saldo anterior. A previsão usa apenas o que você registrou ou programou; não estima salário nem gastos ausentes.' +
    (overdue > 0 ? ` Há ${money(overdue)} em atraso, apresentados no mês do vencimento.` : '');
}

export { renderForecast };
