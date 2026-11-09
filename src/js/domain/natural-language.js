import { currentPeriod, formatISO, getSafeDateForSelectedMonth } from './format.js';

function parseMonetaryValues(segment) {
  const text = segment
    .replace(/r\$\s*/gi, '')
    .replace(/(\d+(?:[.,]\d+)?)\s*mil\b/gi, (_, n) => {
      const num = parseFloat(String(n).replace(',', '.'));
      return !isNaN(num) ? String(num * 1000) : n;
    })
    .replace(/\bdia\s+\d{1,2}\b/gi, ' ')
    .replace(/\b(?:no|na|de|do|da|pelo|pela|app)\s+99\b/gi, ' app_transporte ');

  const regex = /\b\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?\b|\b\d+(?:[.,]\d{1,2})?\b/g;
  const matches = text.match(regex) || [];

  const values = [];
  for (const raw of matches) {
    let normalized = raw;
    if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(raw)) {
      normalized = raw.replace(/\./g, '').replace(',', '.');
    } else if (raw.includes(',')) {
      normalized = raw.replace(',', '.');
    }
    const num = parseFloat(normalized);
    if (!isNaN(num) && num > 0 && num <= 999999999.99) {
      values.push({ raw, value: Math.round(num * 100) / 100 });
    }
  }
  return values;
}

function detectTypeAndCategory(segment) {
  const lower = segment.toLowerCase();

  const hasExplicitExpenseVerb = /\b(gastei|paguei|comprei|custou|despesa|boleto|fatura)\b/i.test(
    lower,
  );
  const hasExplicitIncomeVerb = /\b(recebi|ganhei|entrou|depositaram|me pagaram)\b/i.test(lower);
  const hasExplicitInvestVerb =
    /\b(investi|aportei|apliquei|guardei na reserva|guardei na caixinha)\b/i.test(lower);

  const investKeywords = [
    'investi',
    'investimento',
    'aporte',
    'aportei',
    'apliquei',
    'aplicação',
    'tesouro',
    'selic',
    'ipca',
    'cdb',
    'lci',
    'lca',
    'renda fixa',
    'fii',
    'fiis',
    'fundo imobiliario',
    'fundo imobiliário',
    'fi-infra',
    'ação',
    'ações',
    'acoes',
    'etf',
    'bolsa',
    'b3',
    'cripto',
    'bitcoin',
    'btc',
    'ethereum',
    'caixinha',
    'reserva',
    'poupança',
    'poupanca',
    'guardei',
  ];

  if (
    hasExplicitInvestVerb ||
    (!hasExplicitExpenseVerb &&
      !hasExplicitIncomeVerb &&
      investKeywords.some((k) => lower.includes(k)))
  ) {
    let category = 'Renda Fixa (CDB / Tesouro)';
    if (/(fii|fiis|imobili|fi-infra)/i.test(lower)) {
      category = 'FIIs & FI-Infra';
    } else if (/(a[cç][oõ]es|a[cç][aã]o|etf|bolsa|petr|vale|itub|bbas)/i.test(lower)) {
      category = 'Ações & ETFs';
    } else if (/(cripto|bitcoin|btc|eth)/i.test(lower)) {
      category = 'Criptomoedas';
    } else if (/(reserva|caixinha|poupan[cç]a|guardei)/i.test(lower)) {
      category = 'Reserva & Caixinha';
    } else if (!/(tesouro|selic|cdb|lci|lca|renda fixa)/i.test(lower)) {
      category = 'Outros Investimentos';
    }
    return { type: 'investment', category };
  }

  const incomeKeywords = [
    'recebi',
    'ganhei',
    'salário',
    'salario',
    'pix recebido',
    'freela',
    'freelance',
    'cliente me pagou',
    'vendi',
    'dividendo',
    'dividendos',
    'rendimento',
    'lucro',
    'pró-labore',
  ];

  if (
    hasExplicitIncomeVerb ||
    (!hasExplicitExpenseVerb && incomeKeywords.some((k) => lower.includes(k)))
  ) {
    let category = 'Outras Entradas';
    if (/(sal[aá]rio|pagamento|adiantamento|pr[oó]-labore|vale)/i.test(lower)) {
      category = 'Salário & Pró-labore';
    } else if (/(freela|servi[cç]o|cliente|consultoria|projeto)/i.test(lower)) {
      category = 'Serviços & Freelance';
    } else if (/(venda|vendi|comiss[aã]o|loja)/i.test(lower)) {
      category = 'Vendas & Comércio';
    } else if (/(dividendo|rendimento|juros|aluguel recebido)/i.test(lower)) {
      category = 'Rendimentos & Dividendos';
    }
    return { type: 'income', category };
  }

  let category = 'Outros Gastos';
  if (/(mercado|supermercado|feira|padaria|a[cç]ougue|hortifruti|atacad)/i.test(lower)) {
    category = 'Alimentação & Mercado';
  } else if (
    /(restaurante|lanche|ifood|pizza|hamb[uú]rguer|almo[cç]o|jantar|caf[eé]|bar|cinema|passeio|lazer|viage(?:m|ns)|hotel|pousada|hospedagem|turismo|f[eé]rias|resort|passagem a[eé]rea)/i.test(
      lower,
    )
  ) {
    category = 'Lazer & Viagens';
  } else if (
    /(aluguel|condom[ií]nio|luz|energia|[aá]gua|internet|g[aá]s|iptu|celular|conta)/i.test(lower)
  ) {
    category = 'Moradia & Contas';
  } else if (
    /(uber|99|gasolina|combust[ií]vel|etanol|[oó]leo|estacionamento|[oô]nibus|metr[oô]|ped[aá]gio|carro|moto)/i.test(
      lower,
    )
  ) {
    category = 'Transporte & Combustível';
  } else if (
    /(farm[aá]cia|rem[eé]dio|m[eé]dico|consulta|exame|dentista|plano de sa[uú]de|academia)/i.test(
      lower,
    )
  ) {
    category = 'Saúde & Farmácia';
  } else if (
    /(roupa|cal[cç]a|camisa|t[eê]nis|sapato|shopping|presente|amazon|shopee|mercado livre)/i.test(
      lower,
    )
  ) {
    category = 'Compras & Vestuário';
  } else if (/(curso|faculdade|escola|livro|mensalidade)/i.test(lower)) {
    category = 'Educação & Cursos';
  }

  return { type: 'expense', category };
}

function cleanDescriptionFromSegment(segment, rawAmount, fallbackCategory) {
  let desc = segment
    .replace(rawAmount, '')
    .replace(/r\$/gi, '')
    .replace(/\b(reais|real|pila|conto|hoje|ontem|agora)\b/gi, '')
    .replace(/^\s*(e|mas|tamb[eé]m|depois|a[ií])\s+/i, '')
    .replace(
      /\b(gastei|paguei|comprei|investi|aportei|apliquei|guardei|recebi|ganhei|entrou|foi|deu|no|na|nos|nas|em|de|do|da|dos|das|com|para|pro|pra|um|uma)\b/gi,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();

  desc = desc.replace(/^[,.;:\-_]+|[,.;:\-_]+$/g, '').trim();

  if (!desc || desc.length < 2) {
    return fallbackCategory.split(' (')[0];
  }
  return (desc.charAt(0).toUpperCase() + desc.slice(1)).slice(0, 140);
}

function parseNaturalLanguageInput(fullText, period = currentPeriod()) {
  const cleaned = fullText.trim();
  if (!cleaned) {
    return [];
  }

  let preferredDay = new Date().getDate();
  const explicitDayMatch = cleaned.match(/\bdia\s+(\d{1,2})\b/i);
  if (explicitDayMatch) {
    preferredDay = parseInt(explicitDayMatch[1], 10);
  }
  const baseDate = getSafeDateForSelectedMonth(period.year, period.month, preferredDay);
  if (/\bontem\b/i.test(cleaned) && !explicitDayMatch) {
    const prevDay = Math.max(1, baseDate.getDate() - 1);
    baseDate.setDate(prevDay);
  }
  const dateISO = formatISO(baseDate);

  const rawSegments = cleaned
    .split(
      /(?:,(?!\d)|;|\s+e\s+(?=(?:gastei|paguei|comprei|investi|aportei|apliquei|guardei|recebi|ganhei|\d))|\s+tamb[eé]m\s+)/i,
    )
    .map((s) => s.trim())
    .filter(Boolean);

  const results = [];
  let lastDetectedVerbContext = '';

  for (const seg of rawSegments) {
    const contextualSeg =
      /^(?:e\s+)?\d/.test(seg) && lastDetectedVerbContext
        ? `${lastDetectedVerbContext} ${seg}`
        : seg;

    if (/(investi|aportei|apliquei|guardei)/i.test(seg)) {
      lastDetectedVerbContext = 'investi';
    } else if (/(recebi|ganhei)/i.test(seg)) {
      lastDetectedVerbContext = 'recebi';
    } else if (/(gastei|paguei|comprei)/i.test(seg)) {
      lastDetectedVerbContext = 'gastei';
    }

    const extractedValues = parseMonetaryValues(contextualSeg);
    if (extractedValues.length === 0) {
      continue;
    }

    const { type, category } = detectTypeAndCategory(contextualSeg);
    const amountObj = extractedValues[0];
    const description = cleanDescriptionFromSegment(seg, amountObj.raw, category);

    results.push({
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      description,
      amount: amountObj.value,
      type,
      category,
      date: dateISO,
      createdAt: Date.now(),
    });
  }

  return results;
}

export {
  cleanDescriptionFromSegment,
  detectTypeAndCategory,
  parseMonetaryValues,
  parseNaturalLanguageInput,
};
