import { dateLabel, formatDateBR } from '../domain/format.js';
import { installmentCount, parseGeneralInput, spokenCounts } from '../domain/installments.js';
import { buildBills } from '../domain/planning.js';
import { initDemoVoice } from './demo-voice.js';
import { updateMoneyVisibility } from './value-visibility.js';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const labels = { income: 'Receita', expense: 'Despesa', investment: 'Investimento' };
const numberToken = '(?:' + Object.keys(spokenCounts).join('|') + '|[0-9]+)';
const spokenNumber = numberToken + '(?:\\s+(?:e\\s+)?' + numberToken + '){0,7}';
const currencyWords = new RegExp(
  '(?<![\\w.,])(' +
    spokenNumber +
    ')\\s+(real|reais)\\b(?:\\s+e\\s+(' +
    spokenNumber +
    ')\\s+centavos?\\b)?',
  'gi',
);
const purchaseWords = new RegExp('(\\bpor\\s+)(' + spokenNumber + ')(?=\\s+em\\b)', 'gi');

function numberFromWords(value) {
  const parts = value.toLowerCase().split(/\s+(?:e\s+)?/);
  const subTotal = (words) => {
    if (words.length === 0) {
      return 0;
    }
    return words.length === 1 && /^\d+$/.test(words[0])
      ? Number(words[0])
      : installmentCount(words.join(' e '));
  };
  const thousand = parts.indexOf('mil');
  return thousand < 0
    ? subTotal(parts)
    : (thousand === 0 ? 1 : subTotal(parts.slice(0, thousand))) * 1000 +
        subTotal(parts.slice(thousand + 1));
}

function normalizeAmounts(text) {
  return text
    .replace(currencyWords, (match, value, currency, cents) => {
      const units = numberFromWords(value);
      const fraction = cents ? numberFromWords(cents) : 0;
      return Number.isSafeInteger(units) && Number.isInteger(fraction) && fraction < 100
        ? `${units}${cents ? ',' + String(fraction).padStart(2, '0') : ''} ${currency}`
        : match;
    })
    .replace(purchaseWords, (match, prefix, value) => {
      const units = numberFromWords(value);
      return Number.isSafeInteger(units) ? prefix + units : match;
    });
}

function element(tag, className, content) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = content;
  return node;
}

function renderMovement(item) {
  const card = element('article', 'demo-movement', '');
  const heading = element('p', 'preview-title', item.description);
  const detail = element(
    'p',
    'card-sub',
    [
      item.kind === 'installment' ? 'Compra parcelada' : labels[item.type],
      item.category,
      formatDateBR(item.date),
    ].join(' · '),
  );
  card.append(heading, detail);
  if (item.kind !== 'installment') {
    card.append(element('p', 'preview-total money', brl.format(item.amount)));
    return card;
  }

  const bills = buildBills({
    id: 'demo',
    type: item.type,
    description: item.description,
    category: item.category,
    amount: item.amount,
    startDate: item.date,
    frequency: 'installment',
    totalInstallments: item.installments,
  });
  const list = element('ol', 'parcelas', '');
  for (const bill of bills) {
    const row = document.createElement('li');
    row.append(
      element(
        'span',
        '',
        `Parcela ${bill.installmentNumber}/${bill.totalInstallments} · ${dateLabel(bill.dueDate)}`,
      ),
      element('strong', 'money', brl.format(bill.amount)),
    );
    list.append(row);
  }
  const total = element('p', 'preview-total', 'Total da compra · ');
  total.append(element('span', 'money', brl.format(item.amount)));
  card.append(list, total);
  return card;
}

function initInstallmentDemo() {
  const form = document.getElementById('installmentDemo');
  const input = document.getElementById('demoPhrase');
  const result = document.getElementById('demoResult');

  function preview() {
    try {
      if (input.value.length > input.maxLength) {
        throw new Error('Use uma frase de até 180 caracteres para testar o lançamento.');
      }
      const items = parseGeneralInput(normalizeAmounts(input.value));
      if (!items.length) {
        throw new Error('Inclua um valor no comando. Experimente “Gastei 40 reais no mercado”.');
      }
      result.replaceChildren(...items.map(renderMovement));
      updateMoneyVisibility(result);
    } catch (error) {
      result.replaceChildren(element('p', 'expense-text', error.message));
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    preview();
  });
  preview();
  initDemoVoice(form, input, preview);
}

export { initInstallmentDemo };
