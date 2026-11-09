import {
  addMonths,
  amountOK,
  currentPeriod,
  formatISO,
  getSafeDateForSelectedMonth,
  isValidDate,
  parseAmount,
  today,
  uid,
} from './format.js';
import { detectTypeAndCategory } from './natural-language.js';

function installmentCount(value) {
  if (/^\d+$/.test(value)) {
    return Number(value);
  }
  const parts = value
    .toLowerCase()
    .split(/\s+e\s+/)
    .map((v) => spokenCounts[v]);
  if (parts.some((v, i) => !v || (i > 0 && v >= parts[i - 1]))) {
    return NaN;
  }
  return parts.reduce((sum, v) => sum + v, 0);
}

function parseInstallmentClause(text, period = currentPeriod()) {
  const countWord = Object.keys(spokenCounts)
    .sort((a, b) => b.length - a.length)
    .join('|');
  const countToken = '(\\d{1,4}|(?:' + countWord + ')(?:\\s+e\\s+(?:' + countWord + ')){0,2})';
  const patterns = [
    new RegExp('\\b(?:em\\s+)?' + countToken + '\\s*(?:[x×](?!\\w)|(?:parcelas?|vezes)\\b)', 'gi'),
    new RegExp('\\b(?:parcelad[oa]|dividid[oa])\\s+em\\s+' + countToken + '\\b', 'gi'),
  ];
  const matches = patterns
    .flatMap((pattern) => [...text.matchAll(pattern)])
    .sort((a, b) => a.index - b.index);
  const unique = matches.filter(
    (m, i) =>
      !matches
        .slice(0, i)
        .some((p) => m.index < p.index + p[0].length && p.index < m.index + m[0].length),
  );
  if (!unique.length) {
    if (/\bparcelad[oa]\b|\bparcelas\b/i.test(text)) {
      throw new Error(
        'Informe em quantas parcelas foi a compra. Ex.: “Comprei um PS5 por 2800 em 5x”.',
      );
    }
    return null;
  }
  if (unique.length > 1) {
    throw new Error(
      'Separe cada compra parcelada com ponto e vírgula para conferir uma de cada vez.',
    );
  }
  const countMatch = unique[0],
    count = installmentCount(countMatch[1]);
  if (!Number.isInteger(count) || count < 2 || count > 120) {
    throw new Error('A compra parcelada deve ter entre 2 e 120 parcelas.');
  }
  const ranges = [[countMatch.index, countMatch.index + countMatch[0].length]];
  const number = '(?:\\d{1,3}(?:\\.\\d{3})+(?:,\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)(?![\\d.,])';
  const following = text.slice(countMatch.index + countMatch[0].length);
  const perMatch = following.match(
    new RegExp('^\\s*(?:de\\s+)?(?:r\\$\\s*)?(' + number + ')(?!\\w)', 'i'),
  );
  let perAmount = null;
  if (perMatch) {
    perAmount = parseAmount(perMatch[1]);
    ranges.push([
      countMatch.index + countMatch[0].length,
      countMatch.index + countMatch[0].length + perMatch[0].length,
    ]);
  }
  let date = formatISO(getSafeDateForSelectedMonth(period.year, period.month));
  const dueMatch = text.match(
    /\b(?:primeir[oa]\s+(?:parcela|vencimento)|a partir de|come[cç]ando(?:\s+em)?)\s*(?:no\s+dia\s*|dia\s*|em\s*)?(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}(?:\/\d{4})?|\d{1,2})(?!\d)/i,
  );
  if (dueMatch) {
    const raw = dueMatch[1];
    if (raw.includes('-')) {
      date = raw;
    } else if (raw.includes('/')) {
      const [d, m, y] = raw.split('/').map(Number);
      date = `${y || period.year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    } else {
      date = formatISO(getSafeDateForSelectedMonth(period.year, period.month, Number(raw)));
    }
    if (!isValidDate(date)) {
      throw new Error('Confira a data do primeiro vencimento.');
    }
    ranges.push([dueMatch.index, dueMatch.index + dueMatch[0].length]);
  }
  const nextMonth = text.match(/\b(?:a partir do|come[cç]ando no|no)\s+m[eê]s que vem\b/i);
  if (nextMonth && !dueMatch) {
    date = addMonths(date, 1);
    ranges.push([nextMonth.index, nextMonth.index + nextMonth[0].length]);
  }
  let cardName = '';
  const cardMatch = text.match(
    /\b(?:no|pelo|com o)\s+cart[aã]o(?:\s+(?:de cr[eé]dito\s+)?([\p{L}][\p{L}\p{N} ._-]{0,45}?))?(?=\s+(?:em\s+\d|primeir[oa]\b|a partir\b)|[,;]|$)/iu,
  );
  if (cardMatch) {
    cardName = (cardMatch[1] || '').trim();
    ranges.push([cardMatch.index, cardMatch.index + cardMatch[0].length]);
  }
  const blankRanges = () => {
    let result = text;
    for (const [start, end] of [...ranges].sort((a, b) => b[0] - a[0])) {
      result = result.slice(0, start) + ' '.repeat(end - start) + result.slice(end);
    }
    return result;
  };
  const remaining = blankRanges();
  const totalPattern = new RegExp(
    '\\b(?:por|custou|valor(?:\\s+total)?(?:\\s+de)?|total(?:\\s+de)?)\\s*(?:r\\$\\s*)?(' +
      number +
      ')(?!\\w)',
    'i',
  );
  let totalMatch = remaining.match(totalPattern);
  let amount;
  if (!totalMatch) {
    totalMatch = remaining.match(new RegExp('r\\$\\s*(' + number + ')(?!\\w)', 'i'));
  }
  if (totalMatch) {
    amount = parseAmount(totalMatch[1]);
    ranges.push([totalMatch.index, totalMatch.index + totalMatch[0].length]);
  } else if (perAmount !== null) {
    amount = Math.round(perAmount * count * 100) / 100;
  } else {
    const values = [
      ...remaining.matchAll(
        new RegExp('(?<![\\p{L}\\p{N}_.,])(' + number + ')(?![\\p{L}\\p{N}_.,])', 'gu'),
      ),
    ];
    if (values.length !== 1) {
      throw new Error('Informe o valor total com “por”. Ex.: “Comprei uma TV por 2800 em 5x”.');
    }
    amount = parseAmount(values[0][1]);
    ranges.push([values[0].index, values[0].index + values[0][0].length]);
  }
  if (!amountOK(amount) || Math.round(amount * 100) < count) {
    throw new Error('Confira o valor total: cada parcela precisa ter pelo menos R$ 0,01.');
  }
  if (
    perAmount !== null &&
    Math.abs(Math.round(amount * 100) - Math.round(perAmount * 100) * count) > count
  ) {
    throw new Error('O total informado não confere com o valor das parcelas. Revise a frase.');
  }
  let description = blankRanges()
    .replace(/\b(?:parcelad[oa]|dividid[oa])\b/gi, ' ')
    .replace(/^\s*(?:comprei|compra|paguei|gastei|adquiri)\s+(?:(?:um|uma|o|a)\s+)?/i, '')
    .replace(/\b(?:hoje|agora|reais|real)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(?:\b(?:por|em|de|no|na|com|e)\s*)+$/i, '')
    .replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '')
    .trim();
  description = description.replace(/\bps\s*([345])\b/gi, 'PS$1');
  if (!description) {
    description = 'Compra parcelada';
  }
  description = (description[0].toUpperCase() + description.slice(1)).slice(0, 140);
  const detected = detectTypeAndCategory(text);
  if (detected.type !== 'expense') {
    throw new Error(
      'O parcelamento automático é para compras. Para receitas ou investimentos recorrentes, use Preencher.',
    );
  }
  const category =
    detected.category !== 'Outros Gastos' ? detected.category : 'Compras & Vestuário';
  return {
    id: uid('draft'),
    kind: 'installment',
    description,
    type: 'expense',
    amount,
    date,
    category,
    installments: count,
    cardName,
    firstPaid: false,
    firstPaidDate: today(),
    createdAt: Date.now(),
  };
}

const spokenCounts = {
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  três: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  catorze: 14,
  quatorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
  cem: 100,
  cento: 100,
  duzentos: 200,
  trezentos: 300,
  quatrocentos: 400,
  quinhentos: 500,
  seiscentos: 600,
  setecentos: 700,
  oitocentos: 800,
  novecentos: 900,
  mil: 1000,
};

export { installmentCount, parseInstallmentClause, spokenCounts };
