import { changeMonth } from '../application/events.js';
import { entryAmount, sums } from '../domain/finance.js';
import { amountInput, monthIndex, reportDate, sanitizeCSVCell } from '../domain/format.js';
import { isoMonth, monthTransactions } from '../state/selectors.js';
import { state } from '../state/store.js';
import { download } from './composer.js';
import { $, esc, icon, money } from './dom.js';
import { toast } from './feedback.js';
import { renderBreakdown } from './views.js';

function reportBounds() {
  const span = state.reportSpan === 12 ? 12 : 6;
  const selected = monthIndex(state.selectedYear, state.selectedMonth);
  const end = Math.max(
    monthIndex(1900, span - 1),
    Math.min(monthIndex(2200, 11), state.reportWindowEnd ?? selected),
  );
  state.reportWindowEnd = end;
  return { start: end - span + 1, end, span };
}

function alignReportWindow() {
  const selected = monthIndex(state.selectedYear, state.selectedMonth),
    range = reportBounds();
  if (selected < range.start) {
    state.reportWindowEnd = selected + range.span - 1;
  } else if (selected > range.end) {
    state.reportWindowEnd = selected;
  }
  reportBounds();
}

function reportTrend() {
  const { start, span } = reportBounds();
  return Array.from({ length: span }, (_, i) => {
    const date = reportDate(start + i),
      year = date.getFullYear(),
      month = date.getMonth(),
      prefix = isoMonth(year, month);
    const amounts = sums(state.transactions.filter((t) => t.date.startsWith(prefix)));
    return {
      year,
      month,
      prefix,
      name: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      full: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      ...amounts,
      balance:
        amounts.income -
        amounts.expense -
        (state.balanceMode === 'integrated' ? amounts.investment : 0),
    };
  });
}

async function shiftReportPeriod(direction) {
  const { start, end, span } = reportBounds(),
    offset = monthIndex(state.selectedYear, state.selectedMonth) - start;
  state.reportWindowEnd = Math.max(
    monthIndex(1900, span - 1),
    Math.min(monthIndex(2200, 11), end + direction * span),
  );
  const next = reportBounds();
  await changeMonth(0, reportDate(next.start + Math.max(0, Math.min(span - 1, offset))), {
    keepReportWindow: true,
  });
}

async function resetReportPeriod() {
  state.reportWindowEnd = monthIndex(new Date().getFullYear(), new Date().getMonth());
  await changeMonth(0, new Date(), { keepReportWindow: true });
}

function renderReports() {
  const month = monthTransactions(),
    current = sums(month),
    previous = sums(monthTransactions(-1));
  const difference = current.expense - previous.expense;
  const categories = Object.entries(
    month
      .filter((t) => t.type === 'expense')
      .reduce((a, t) => {
        a[t.category] = (a[t.category] || 0) + entryAmount(t);
        return a;
      }, {}),
  )
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);
  const compare =
    !current.expense && !previous.expense
      ? 'Os gastos dos dois meses aparecerão aqui quando você começar a registrar.'
      : !previous.expense
        ? `Você registrou ${money(current.expense)} em despesas. O mês anterior ainda não tem gastos para comparar.`
        : Math.abs(difference) < 0.005
          ? 'Seus gastos foram iguais aos do mês anterior.'
          : `Você gastou ${money(Math.abs(difference))} ${difference > 0 ? 'a mais' : 'a menos'} que no mês anterior${state.hideValues ? '' : ` (${Math.round((Math.abs(difference) / previous.expense) * 100)}%)`}.`;
  const balance =
    current.income -
    current.expense -
    (state.balanceMode === 'integrated' ? current.investment : 0);
  const insights = [
    ['chart', 'Em relação ao mês anterior', compare],
    [
      'bag',
      categories.length ? 'Sua maior categoria de gasto' : 'Conheça seus gastos',
      categories.length
        ? `${categories[0][0]} concentrou ${money(categories[0][1])} das despesas deste mês.`
        : 'Classifique seus lançamentos para descobrir para onde o dinheiro vai.',
    ],
    [
      'leaf',
      'Espaço para o futuro',
      `Seu saldo do mês é ${money(balance)}. Os aportes do mês somam ${money(current.investment)}${state.balanceMode === 'independent' ? ' e estão separados desse saldo' : ''}.`,
    ],
  ];
  $('reportInsights').innerHTML = insights
    .map(
      ([name, title, text]) =>
        /* HTML */ `<article class="insight-card">
          ${icon(name)}
          <h3>${esc(title)}</h3>
          <p>${esc(text)}</p>
        </article>`,
    )
    .join('');
  const { start, end, span } = reportBounds(),
    trend = reportTrend(),
    rangeLabel = trend[0].full + ' a ' + trend.at(-1).full;
  $('reportRangeLabel').textContent =
    trend[0].name + '/' + trend[0].year + ' — ' + trend.at(-1).name + '/' + trend.at(-1).year;
  $('reportRangeLabel').setAttribute('aria-label', rangeLabel);
  $('reportSpan').value = String(span);
  const now = monthIndex(new Date().getFullYear(), new Date().getMonth());
  $('reportEyebrow').textContent =
    end === now
      ? span === 6
        ? 'OS ÚLTIMOS SEIS MESES'
        : 'OS ÚLTIMOS DOZE MESES'
      : 'PERÍODO EM ANÁLISE';
  $('reportPrev').disabled = start <= monthIndex(1900, 0);
  $('reportNext').disabled = end >= monthIndex(2200, 11);
  const totals = trend.reduce(
    (sum, t) => ({
      income: sum.income + t.income,
      expense: sum.expense + t.expense,
      investment: sum.investment + t.investment,
      balance: sum.balance + t.balance,
    }),
    { income: 0, expense: 0, investment: 0, balance: 0 },
  );
  $('reportPeriodTotals').innerHTML = [
    ['income', 'Receitas no período', totals.income],
    ['expense', 'Despesas no período', totals.expense],
    ['investment', 'Investimentos', totals.investment],
    ['balance', 'Saldo do período', totals.balance],
  ]
    .map(
      ([cls, label, amount]) =>
        /* HTML */ `<div class="report-total ${cls}">
          <span>${label}</span><strong class="money">${money(amount)}</strong>
        </div>`,
    )
    .join('');
  const max = Math.max(
      1,
      ...trend.flatMap((t) => [Math.abs(t.income), Math.abs(t.expense), Math.abs(t.investment)]),
    ),
    hasNegative = trend.some((t) => t.income < 0 || t.expense < 0 || t.investment < 0);
  $('trendChart').style.gridTemplateColumns = `repeat(${span},minmax(0,1fr))`;
  $('trendChart').classList.toggle('twelve-months', span === 12);
  $('trendChart').innerHTML = trend
    .map((t) => {
      const selected = t.year === state.selectedYear && t.month === state.selectedMonth;
      return /* HTML */ `<button
        class="chart-month ${selected ? 'selected' : ''}"
        data-action="chart-month"
        data-year="${t.year}"
        data-month="${t.month}"
        aria-pressed="${selected}"
        aria-label="${esc(t.full)}, receitas ${money(t.income)}, despesas ${money(t.expense)}, investimentos ${money(t.investment)}"
      >
        <span class="chart-bars ${hasNegative ? 'diverging' : ''}" aria-hidden="true"
          ><span
            class="bar income ${t.income < 0 ? 'negative' : ''}"
            style="height:${t.income ? Math.max(1, Math.round((Math.abs(t.income) / max) * (hasNegative ? 50 : 100))) : 0}%"
          ></span
          ><span
            class="bar expense ${t.expense < 0 ? 'negative' : ''}"
            style="height:${t.expense ? Math.max(1, Math.round((Math.abs(t.expense) / max) * (hasNegative ? 50 : 100))) : 0}%"
          ></span
          ><span
            class="bar investment ${t.investment < 0 ? 'negative' : ''}"
            style="height:${t.investment ? Math.max(1, Math.round((Math.abs(t.investment) / max) * (hasNegative ? 50 : 100))) : 0}%"
          ></span></span
        ><strong>${esc(t.name)}</strong><span>${t.year}</span>
      </button>`;
    })
    .join('');
  const selectedLabel = new Date(state.selectedYear, state.selectedMonth, 1).toLocaleDateString(
    'pt-BR',
    { month: 'long', year: 'numeric' },
  );
  $('reportSelection').innerHTML = /* HTML */ `<strong>${esc(selectedLabel)}</strong
    ><span>Receitas <b class="money">${money(current.income)}</b></span
    ><span>Despesas <b class="money">${money(current.expense)}</b></span
    ><span>Aportes <b class="money">${money(current.investment)}</b></span
    ><span>Saldo <b class="money">${money(balance)}</b></span>`;
  $('trendTable').innerHTML = /* HTML */ `<table>
    <caption class="sr-only">
      Movimentações de ${esc(rangeLabel)}
    </caption>
    <thead>
      <tr>
        <th scope="col">Mês</th>
        <th scope="col">Receitas</th>
        <th scope="col">Despesas</th>
        <th scope="col">Investimentos</th>
        <th scope="col">Saldo</th>
      </tr>
    </thead>
    <tbody>
      ${trend
        .map(
          (t) =>
            /* HTML */ `<tr
              class="${t.year === state.selectedYear && t.month === state.selectedMonth ? 'selected-row' : ''}"
            >
              <th scope="row">${esc(t.full)}</th>
              <td>${money(t.income)}</td>
              <td>${money(t.expense)}</td>
              <td>${money(t.investment)}</td>
              <td>${money(t.balance)}</td>
            </tr>`,
        )
        .join('')}
    </tbody>
  </table>`;
  renderBreakdown(
    'expense',
    month.filter((t) => t.type === 'expense'),
    current.expense,
    'expenseBreakdownList',
    'panelExpenseTotalBadge',
  );
  renderBreakdown(
    'investment',
    month.filter((t) => t.type === 'investment'),
    current.investment,
    'investBreakdownList',
    'panelInvestTotalBadge',
  );
}

function exportReportCSV() {
  const trend = reportTrend(),
    headers = ['Mes', 'Receitas', 'Despesas', 'Investimentos', 'Saldo'];
  const rows = trend.map((t) =>
    [
      t.prefix,
      amountInput(t.income),
      amountInput(t.expense),
      amountInput(t.investment),
      amountInput(t.balance),
    ]
      .map((value) => sanitizeCSVCell(value))
      .join(';'),
  );
  download(
    '\uFEFF' + [headers.join(';'), ...rows].join('\r\n'),
    `financas-relatorio-${trend[0].prefix}-a-${trend.at(-1).prefix}.csv`,
    'text/csv;charset=utf-8',
  );
  toast('Relatório do período preparado para download.');
}

export { alignReportWindow, exportReportCSV, renderReports, resetReportPeriod, shiftReportPeriod };
