import { reportMonths } from './demo-data.js';
import { updateMoneyVisibility } from './value-visibility.js';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const shortMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });
const longMonth = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const axisNumber = new Intl.NumberFormat('pt-BR', { notation: 'compact' });
const series = [
  ['income', 'Receitas'],
  ['expense', 'Despesas'],
  ['investment', 'Investimentos'],
];
const sumCategories = (categories) =>
  Object.values(categories).reduce((sum, value) => sum + value, 0);
const monthDate = (month) => new Date(month + '-01T00:00:00Z');
const brl = (cents) => money.format(cents / 100);
const records = [...reportMonths]
  .sort((a, b) => a.month.localeCompare(b.month))
  .map((record) => ({
    ...record,
    totals: {
      income: record.income,
      expense: sumCategories(record.expense),
      investment: sumCategories(record.investment),
    },
  }));

function element(tag, content, className) {
  const node = document.createElement(tag);
  if (content) {
    node.textContent = content;
  }
  if (className) {
    node.className = className;
  }
  return node;
}

function totalCard(label, cents, seriesName) {
  const card = element('div', '', 'sum-box');
  card.append(element('p', label), element('p', brl(cents), 'money ' + (seriesName || '')));
  return card;
}

function periodTotals(visible) {
  return series.map(([key]) => visible.reduce((sum, item) => sum + item.totals[key], 0));
}

function renderTable(container, visible) {
  const table = element('table');
  const thead = table.createTHead().insertRow();
  for (const title of ['Mês', 'Receitas', 'Despesas', 'Investimentos', 'Saldo']) {
    const cell = element('th', title);
    cell.scope = 'col';
    thead.append(cell);
  }
  const tbody = table.createTBody();
  for (const item of visible) {
    const row = tbody.insertRow();
    const { income, expense, investment } = item.totals;
    const month = element('th', longMonth.format(monthDate(item.month)));
    month.scope = 'row';
    row.append(month);
    for (const value of [income, expense, investment, income - expense]) {
      row.append(element('td', brl(value), 'money'));
    }
  }
  container.replaceChildren(table);
}

function renderBreakdown(container, categories, seriesName) {
  const values = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const total = sumCategories(categories);
  container.replaceChildren();
  if (!values.length) {
    container.append(element('p', 'Sem registros no mês selecionado.', 'card-sub'));
    return;
  }
  for (const [label, value] of values) {
    const row = element('div', '', 'report-category');
    const heading = element('div', '', 'report-category-heading');
    const percent = total > 0 ? (value / total) * 100 : 0;
    heading.append(element('span', label), element('strong', brl(value), 'money'));
    const track = element('div', '', 'track');
    track.setAttribute('aria-hidden', 'true');
    const fill = element('i', '', 'report-category-fill series-' + seriesName);
    fill.style.width = Math.max(0, Math.min(percent, 100)) + '%';
    track.append(fill);
    row.append(heading, track);
    container.append(row);
  }
}

function initReport() {
  const report = document.getElementById('relatorio-exemplo');
  const spanInput = document.getElementById('reportSpan');
  const monthGroup = document.getElementById('reportMonths');
  const previous = document.getElementById('reportPrev');
  const next = document.getElementById('reportNext');
  const reset = document.getElementById('reportReset');
  const selection = document.getElementById('reportSelected');
  const range = document.getElementById('reportRange');
  const axis = document.getElementById('reportAxis');
  const totals = document.getElementById('reportTotals');
  const table = document.getElementById('reportTable');
  const expense = document.getElementById('reportExpenses');
  const investment = document.getElementById('reportInvestments');
  let end = records.length;
  let selected = records.at(-1);
  const span = () => Number(spanInput.value);
  const visible = () => records.slice(end - span(), end);

  function selectMonth(item) {
    selected = item;
    for (const button of monthGroup.children) {
      button.setAttribute('aria-pressed', String(button.dataset.month === item.month));
    }
    const { income, expense: spent, investment: invested } = item.totals;
    const heading = element('h4', longMonth.format(monthDate(item.month)));
    const details = element('div', '', 'sum-grid g4');
    details.append(
      totalCard('Receitas', income, 'income-text'),
      totalCard('Despesas', spent, 'expense-text'),
      totalCard('Investimentos', invested, 'invest-text'),
      totalCard('Saldo', income - spent),
    );
    selection.replaceChildren(heading, details);
    renderBreakdown(expense, item.expense, 'expense');
    renderBreakdown(investment, item.investment, 'investment');
    updateMoneyVisibility(report);
  }

  function renderPeriod() {
    const items = visible();
    const [income, spent, invested] = periodTotals(items);
    const maxValue = Math.max(...items.flatMap(({ totals: values }) => Object.values(values)));
    const limit = Math.max(100000, Math.ceil(maxValue / 100000) * 100000);
    const startLabel = longMonth.format(monthDate(items[0].month));
    const endLabel = longMonth.format(monthDate(items.at(-1).month));
    range.textContent = startLabel + ' a ' + endLabel;
    previous.disabled = end === span();
    next.disabled = end === records.length;
    reset.disabled = end === records.length;
    totals.replaceChildren(
      totalCard('Receitas no período', income, 'income-text'),
      totalCard('Despesas no período', spent, 'expense-text'),
      totalCard('Investimentos', invested, 'invest-text'),
      totalCard('Saldo do período', income - spent),
    );
    axis.replaceChildren(
      ...[1, 0.75, 0.5, 0.25, 0].map((fraction) =>
        element('span', 'R$ ' + axisNumber.format((limit * fraction) / 100), 'money'),
      ),
    );
    monthGroup.classList.toggle('wide-period', items.length > 6);
    monthGroup.replaceChildren(
      ...items.map((item) => {
        const date = monthDate(item.month);
        const button = element('button', '', 'report-month');
        button.type = 'button';
        button.dataset.month = item.month;
        button.setAttribute('aria-label', longMonth.format(date));
        button.title = longMonth.format(date);
        const bars = element('span', '', 'report-bars');
        bars.setAttribute('aria-hidden', 'true');
        for (const [key] of series) {
          const bar = element('i', '', 'report-bar series-' + key);
          bar.style.height = Math.max(0, (item.totals[key] / limit) * 100) + '%';
          bars.append(bar);
        }
        button.append(
          bars,
          element('span', shortMonth.format(date).replace('.', ''), 'report-month-label'),
        );
        button.addEventListener('click', () => selectMonth(item));
        return button;
      }),
    );
    renderTable(table, items);
    selectMonth(items.includes(selected) ? selected : items.at(-1));
  }

  spanInput.addEventListener('change', () => {
    end = Math.max(end, span());
    renderPeriod();
  });
  previous.addEventListener('click', () => {
    end = Math.max(span(), end - span());
    renderPeriod();
    if (previous.disabled) {
      next.focus();
    }
  });
  next.addEventListener('click', () => {
    end = Math.min(records.length, end + span());
    renderPeriod();
    if (next.disabled) {
      previous.focus();
    }
  });
  reset.addEventListener('click', () => {
    end = records.length;
    selected = records.at(-1);
    renderPeriod();
    previous.focus();
  });
  renderPeriod();
}

export { initReport };
