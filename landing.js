// GERADO por npm run build. Fontes em src/js/.
(() => {
  // src/js/services/auth-return.js
  var errorKeys = ["error", "error_code", "error_description"];
  var callbackKeys = ["code", "sb_flow_id", ...errorKeys];
  function readAuthReturn(url) {
    const fragment = new URLSearchParams(url.hash.slice(1));
    return {
      code: url.searchParams.get("code"),
      flowId: url.searchParams.get("sb_flow_id"),
      redirectError: errorKeys.some((key) => url.searchParams.has(key) || fragment.has(key))
    };
  }

  // src/js/domain/format.js
  function formatISO(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  function formatDateBR(isoStr) {
    if (!isoStr) {
      return "";
    }
    const parts = isoStr.split("-");
    if (parts.length !== 3) {
      return isoStr;
    }
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  function getSafeDateForSelectedMonth(year, monthIndex, preferredDay = null) {
    const maxDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const rawDay = preferredDay !== null ? preferredDay : (/* @__PURE__ */ new Date()).getDate();
    const safeDay = Math.min(Math.max(1, rawDay), maxDaysInMonth);
    return new Date(year, monthIndex, safeDay);
  }
  function sanitizeTransactionId(rawId) {
    const cleanId = String(rawId || "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 96);
    if (!cleanId) {
      return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    return cleanId;
  }
  function today() {
    return formatISO(/* @__PURE__ */ new Date());
  }
  function uid(prefix = "tx") {
    return `${prefix}_${Date.now()}_${crypto.getRandomValues(new Uint32Array(2)).join("_")}`;
  }
  function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
    const [y, m, d] = value.split("-").map(Number);
    return y >= 1900 && y <= 2200 && m >= 1 && m <= 12 && d >= 1 && d <= new Date(y, m, 0).getDate();
  }
  function addMonths(date, n) {
    const [y, m, d] = date.split("-").map(Number);
    const base = new Date(y, m - 1 + n, 1);
    return formatISO(
      new Date(
        base.getFullYear(),
        base.getMonth(),
        Math.min(d, new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate())
      )
    );
  }
  function dateLabel(date) {
    return (/* @__PURE__ */ new Date(date + "T12:00:00")).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
  }
  function parseAmount(value) {
    let s = String(value).trim().replace(/R\$|\s/g, "");
    if (s.includes(",")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, "");
    }
    if (!/^\d+(\.\d{1,2})?$/.test(s)) {
      return NaN;
    }
    return Math.round(Number(s) * 100) / 100;
  }
  function normalizeCategory(category) {
    return category === "Lazer & Restaurantes" ? "Lazer & Viagens" : category;
  }
  function amountOK(n) {
    return Number.isFinite(n) && n >= 0.01 && n <= 99999999999e-2;
  }
  function currentPeriod() {
    const now = /* @__PURE__ */ new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  // src/js/domain/natural-language.js
  function parseMonetaryValues(segment) {
    const text = segment.replace(/r\$\s*/gi, "").replace(/(\d+(?:[.,]\d+)?)\s*mil\b/gi, (_, n) => {
      const num = parseFloat(String(n).replace(",", "."));
      return !isNaN(num) ? String(num * 1e3) : n;
    }).replace(/\bdia\s+\d{1,2}\b/gi, " ").replace(/\b(?:no|na|de|do|da|pelo|pela|app)\s+99\b/gi, " app_transporte ");
    const regex = /\b\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?\b|\b\d+(?:[.,]\d{1,2})?\b/g;
    const matches = text.match(regex) || [];
    const values = [];
    for (const raw of matches) {
      let normalized = raw;
      if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(raw)) {
        normalized = raw.replace(/\./g, "").replace(",", ".");
      } else if (raw.includes(",")) {
        normalized = raw.replace(",", ".");
      }
      const num = parseFloat(normalized);
      if (!isNaN(num) && num > 0 && num <= 99999999999e-2) {
        values.push({ raw, value: Math.round(num * 100) / 100 });
      }
    }
    return values;
  }
  function detectTypeAndCategory(segment) {
    const lower = segment.toLowerCase();
    const hasExplicitExpenseVerb = /\b(gastei|paguei|comprei|custou|despesa|boleto|fatura)\b/i.test(
      lower
    );
    const hasExplicitIncomeVerb = /\b(recebi|ganhei|entrou|depositaram|me pagaram)\b/i.test(lower);
    const hasExplicitInvestVerb = /\b(investi|aportei|apliquei|guardei na reserva|guardei na caixinha)\b/i.test(lower);
    const investKeywords = [
      "investi",
      "investimento",
      "aporte",
      "aportei",
      "apliquei",
      "aplicação",
      "tesouro",
      "selic",
      "ipca",
      "cdb",
      "lci",
      "lca",
      "renda fixa",
      "fii",
      "fiis",
      "fundo imobiliario",
      "fundo imobiliário",
      "fi-infra",
      "ação",
      "ações",
      "acoes",
      "etf",
      "bolsa",
      "b3",
      "cripto",
      "bitcoin",
      "btc",
      "ethereum",
      "caixinha",
      "reserva",
      "poupança",
      "poupanca",
      "guardei"
    ];
    if (hasExplicitInvestVerb || !hasExplicitExpenseVerb && !hasExplicitIncomeVerb && investKeywords.some((k) => lower.includes(k))) {
      let category2 = "Renda Fixa (CDB / Tesouro)";
      if (/(fii|fiis|imobili|fi-infra)/i.test(lower)) {
        category2 = "FIIs & FI-Infra";
      } else if (/(a[cç][oõ]es|a[cç][aã]o|etf|bolsa|petr|vale|itub|bbas)/i.test(lower)) {
        category2 = "Ações & ETFs";
      } else if (/(cripto|bitcoin|btc|eth)/i.test(lower)) {
        category2 = "Criptomoedas";
      } else if (/(reserva|caixinha|poupan[cç]a|guardei)/i.test(lower)) {
        category2 = "Reserva & Caixinha";
      } else if (!/(tesouro|selic|cdb|lci|lca|renda fixa)/i.test(lower)) {
        category2 = "Outros Investimentos";
      }
      return { type: "investment", category: category2 };
    }
    const incomeKeywords = [
      "recebi",
      "ganhei",
      "salário",
      "salario",
      "pix recebido",
      "freela",
      "freelance",
      "cliente me pagou",
      "vendi",
      "dividendo",
      "dividendos",
      "rendimento",
      "lucro",
      "pró-labore"
    ];
    if (hasExplicitIncomeVerb || !hasExplicitExpenseVerb && incomeKeywords.some((k) => lower.includes(k))) {
      let category2 = "Outras Entradas";
      if (/(sal[aá]rio|pagamento|adiantamento|pr[oó]-labore|vale)/i.test(lower)) {
        category2 = "Salário & Pró-labore";
      } else if (/(freela|servi[cç]o|cliente|consultoria|projeto)/i.test(lower)) {
        category2 = "Serviços & Freelance";
      } else if (/(venda|vendi|comiss[aã]o|loja)/i.test(lower)) {
        category2 = "Vendas & Comércio";
      } else if (/(dividendo|rendimento|juros|aluguel recebido)/i.test(lower)) {
        category2 = "Rendimentos & Dividendos";
      }
      return { type: "income", category: category2 };
    }
    let category = "Outros Gastos";
    if (/(mercado|supermercado|feira|padaria|a[cç]ougue|hortifruti|atacad)/i.test(lower)) {
      category = "Alimentação & Mercado";
    } else if (/(restaurante|lanche|ifood|pizza|hamb[uú]rguer|almo[cç]o|jantar|caf[eé]|bar|cinema|passeio|lazer|viage(?:m|ns)|hotel|pousada|hospedagem|turismo|f[eé]rias|resort|passagem a[eé]rea)/i.test(
      lower
    )) {
      category = "Lazer & Viagens";
    } else if (/(aluguel|condom[ií]nio|luz|energia|[aá]gua|internet|g[aá]s|iptu|celular|conta)/i.test(lower)) {
      category = "Moradia & Contas";
    } else if (/(uber|99|gasolina|combust[ií]vel|etanol|[oó]leo|estacionamento|[oô]nibus|metr[oô]|ped[aá]gio|carro|moto)/i.test(
      lower
    )) {
      category = "Transporte & Combustível";
    } else if (/(farm[aá]cia|rem[eé]dio|m[eé]dico|consulta|exame|dentista|plano de sa[uú]de|academia)/i.test(
      lower
    )) {
      category = "Saúde & Farmácia";
    } else if (/(roupa|cal[cç]a|camisa|t[eê]nis|sapato|shopping|presente|amazon|shopee|mercado livre)/i.test(
      lower
    )) {
      category = "Compras & Vestuário";
    } else if (/(curso|faculdade|escola|livro|mensalidade)/i.test(lower)) {
      category = "Educação & Cursos";
    }
    return { type: "expense", category };
  }
  function cleanDescriptionFromSegment(segment, rawAmount, fallbackCategory) {
    let desc = segment.replace(rawAmount, "").replace(/r\$/gi, "").replace(/\b(reais|real|pila|conto|hoje|ontem|agora)\b/gi, "").replace(/^\s*(e|mas|tamb[eé]m|depois|a[ií])\s+/i, "").replace(
      /\b(gastei|paguei|comprei|investi|aportei|apliquei|guardei|recebi|ganhei|entrou|foi|deu|no|na|nos|nas|em|de|do|da|dos|das|com|para|pro|pra|um|uma)\b/gi,
      " "
    ).replace(/\s+/g, " ").trim();
    desc = desc.replace(/^[,.;:\-_]+|[,.;:\-_]+$/g, "").trim();
    if (!desc || desc.length < 2) {
      return fallbackCategory.split(" (")[0];
    }
    return (desc.charAt(0).toUpperCase() + desc.slice(1)).slice(0, 140);
  }
  function parseNaturalLanguageInput(fullText, period = currentPeriod()) {
    const cleaned = fullText.trim();
    if (!cleaned) {
      return [];
    }
    let preferredDay = (/* @__PURE__ */ new Date()).getDate();
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
    const rawSegments = cleaned.split(
      /(?:,(?!\d)|;|\s+e\s+(?=(?:gastei|paguei|comprei|investi|aportei|apliquei|guardei|recebi|ganhei|\d))|\s+tamb[eé]m\s+)/i
    ).map((s) => s.trim()).filter(Boolean);
    const results = [];
    let lastDetectedVerbContext = "";
    for (const seg of rawSegments) {
      const contextualSeg = /^(?:e\s+)?\d/.test(seg) && lastDetectedVerbContext ? `${lastDetectedVerbContext} ${seg}` : seg;
      if (/(investi|aportei|apliquei|guardei)/i.test(seg)) {
        lastDetectedVerbContext = "investi";
      } else if (/(recebi|ganhei)/i.test(seg)) {
        lastDetectedVerbContext = "recebi";
      } else if (/(gastei|paguei|comprei)/i.test(seg)) {
        lastDetectedVerbContext = "gastei";
      }
      const extractedValues = parseMonetaryValues(contextualSeg);
      if (extractedValues.length === 0) {
        continue;
      }
      const { type, category } = detectTypeAndCategory(contextualSeg);
      const amountObj = extractedValues[0];
      const description = cleanDescriptionFromSegment(seg, amountObj.raw, category);
      results.push({
        id: "tx_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8),
        description,
        amount: amountObj.value,
        type,
        category,
        date: dateISO,
        createdAt: Date.now()
      });
    }
    return results;
  }

  // src/js/domain/installments.js
  function parseGeneralInput(text, period = currentPeriod()) {
    const clauses = text.trim().split(
      /;|,\s+(?=(?:comprei|paguei|gastei|recebi|ganhei|investi|aportei|apliquei)\b)|\s+e\s+(?=(?:comprei|paguei|gastei|recebi|ganhei|investi|aportei|apliquei)\b)/i
    ).map((clause) => clause.trim()).filter(Boolean);
    return clauses.flatMap((clause) => {
      const installment = parseInstallmentClause(clause, period);
      return installment ? [installment] : parseNaturalLanguageInput(clause, period);
    });
  }
  function installmentCount(value) {
    if (/^\d+$/.test(value)) {
      return Number(value);
    }
    const parts = value.toLowerCase().split(/\s+e\s+/).map((v) => spokenCounts[v]);
    if (parts.some((v, i) => !v || i > 0 && v >= parts[i - 1])) {
      return NaN;
    }
    return parts.reduce((sum, v) => sum + v, 0);
  }
  function parseInstallmentClause(text, period = currentPeriod()) {
    const countWord = Object.keys(spokenCounts).sort((a, b) => b.length - a.length).join("|");
    const countToken = "(\\d{1,4}|(?:" + countWord + ")(?:\\s+e\\s+(?:" + countWord + ")){0,2})";
    const patterns = [
      new RegExp("\\b(?:em\\s+)?" + countToken + "\\s*(?:[x×](?!\\w)|(?:parcelas?|vezes)\\b)", "gi"),
      new RegExp("\\b(?:parcelad[oa]|dividid[oa])\\s+em\\s+" + countToken + "\\b", "gi")
    ];
    const matches = patterns.flatMap((pattern) => [...text.matchAll(pattern)]).sort((a, b) => a.index - b.index);
    const unique = matches.filter(
      (m, i) => !matches.slice(0, i).some((p) => m.index < p.index + p[0].length && p.index < m.index + m[0].length)
    );
    if (!unique.length) {
      if (/\bparcelad[oa]\b|\bparcelas\b/i.test(text)) {
        throw new Error(
          "Informe em quantas parcelas foi a compra. Ex.: “Comprei um PS5 por 2800 em 5x”."
        );
      }
      return null;
    }
    if (unique.length > 1) {
      throw new Error(
        "Separe cada compra parcelada com ponto e vírgula para conferir uma de cada vez."
      );
    }
    const countMatch = unique[0], count = installmentCount(countMatch[1]);
    if (!Number.isInteger(count) || count < 2 || count > 120) {
      throw new Error("A compra parcelada deve ter entre 2 e 120 parcelas.");
    }
    const ranges = [[countMatch.index, countMatch.index + countMatch[0].length]];
    const number = "(?:\\d{1,3}(?:\\.\\d{3})+(?:,\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)(?![\\d.,])";
    const following = text.slice(countMatch.index + countMatch[0].length);
    const perMatch = following.match(
      new RegExp("^\\s*(?:de\\s+)?(?:r\\$\\s*)?(" + number + ")(?!\\w)", "i")
    );
    let perAmount = null;
    if (perMatch) {
      perAmount = parseAmount(perMatch[1]);
      ranges.push([
        countMatch.index + countMatch[0].length,
        countMatch.index + countMatch[0].length + perMatch[0].length
      ]);
    }
    let date = formatISO(getSafeDateForSelectedMonth(period.year, period.month));
    const dueMatch = text.match(
      /\b(?:primeir[oa]\s+(?:parcela|vencimento)|a partir de|come[cç]ando(?:\s+em)?)\s*(?:no\s+dia\s*|dia\s*|em\s*)?(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}(?:\/\d{4})?|\d{1,2})(?!\d)/i
    );
    if (dueMatch) {
      const raw = dueMatch[1];
      if (raw.includes("-")) {
        date = raw;
      } else if (raw.includes("/")) {
        const [d, m, y] = raw.split("/").map(Number);
        date = `${y || period.year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      } else {
        date = formatISO(getSafeDateForSelectedMonth(period.year, period.month, Number(raw)));
      }
      if (!isValidDate(date)) {
        throw new Error("Confira a data do primeiro vencimento.");
      }
      ranges.push([dueMatch.index, dueMatch.index + dueMatch[0].length]);
    }
    const nextMonth = text.match(/\b(?:a partir do|come[cç]ando no|no)\s+m[eê]s que vem\b/i);
    if (nextMonth && !dueMatch) {
      date = addMonths(date, 1);
      ranges.push([nextMonth.index, nextMonth.index + nextMonth[0].length]);
    }
    let cardName = "";
    const cardMatch = text.match(
      /\b(?:no|pelo|com o)\s+cart[aã]o(?:\s+(?:de cr[eé]dito\s+)?([\p{L}][\p{L}\p{N} ._-]{0,45}?))?(?=\s+(?:em\s+\d|primeir[oa]\b|a partir\b)|[,;]|$)/iu
    );
    if (cardMatch) {
      cardName = (cardMatch[1] || "").trim();
      ranges.push([cardMatch.index, cardMatch.index + cardMatch[0].length]);
    }
    const blankRanges = () => {
      let result = text;
      for (const [start, end] of [...ranges].sort((a, b) => b[0] - a[0])) {
        result = result.slice(0, start) + " ".repeat(end - start) + result.slice(end);
      }
      return result;
    };
    const remaining = blankRanges();
    const totalPattern = new RegExp(
      "\\b(?:por|custou|valor(?:\\s+total)?(?:\\s+de)?|total(?:\\s+de)?)\\s*(?:r\\$\\s*)?(" + number + ")(?!\\w)",
      "i"
    );
    let totalMatch = remaining.match(totalPattern);
    let amount;
    if (!totalMatch) {
      totalMatch = remaining.match(new RegExp("r\\$\\s*(" + number + ")(?!\\w)", "i"));
    }
    if (totalMatch) {
      amount = parseAmount(totalMatch[1]);
      ranges.push([totalMatch.index, totalMatch.index + totalMatch[0].length]);
    } else if (perAmount !== null) {
      amount = Math.round(perAmount * count * 100) / 100;
    } else {
      const values = [
        ...remaining.matchAll(
          new RegExp("(?<![\\p{L}\\p{N}_.,])(" + number + ")(?![\\p{L}\\p{N}_.,])", "gu")
        )
      ];
      if (values.length !== 1) {
        throw new Error("Informe o valor total com “por”. Ex.: “Comprei uma TV por 2800 em 5x”.");
      }
      amount = parseAmount(values[0][1]);
      ranges.push([values[0].index, values[0].index + values[0][0].length]);
    }
    if (!amountOK(amount) || Math.round(amount * 100) < count) {
      throw new Error("Confira o valor total: cada parcela precisa ter pelo menos R$ 0,01.");
    }
    if (perAmount !== null && Math.abs(Math.round(amount * 100) - Math.round(perAmount * 100) * count) > count) {
      throw new Error("O total informado não confere com o valor das parcelas. Revise a frase.");
    }
    let description = blankRanges().replace(/\b(?:parcelad[oa]|dividid[oa])\b/gi, " ").replace(/^\s*(?:comprei|compra|paguei|gastei|adquiri)\s+(?:(?:um|uma|o|a)\s+)?/i, "").replace(/\b(?:hoje|agora|reais|real)\b/gi, " ").replace(/\s+/g, " ").replace(/(?:\b(?:por|em|de|no|na|com|e)\s*)+$/i, "").replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, "").trim();
    description = description.replace(/\bps\s*([345])\b/gi, "PS$1");
    if (!description) {
      description = "Compra parcelada";
    }
    description = (description[0].toUpperCase() + description.slice(1)).slice(0, 140);
    const detected = detectTypeAndCategory(text);
    if (detected.type !== "expense") {
      throw new Error(
        "O parcelamento automático é para compras. Para receitas ou investimentos recorrentes, use Preencher."
      );
    }
    const category = detected.category !== "Outros Gastos" ? detected.category : "Compras & Vestuário";
    return {
      id: uid("draft"),
      kind: "installment",
      description,
      type: "expense",
      amount,
      date,
      category,
      installments: count,
      cardName,
      firstPaid: false,
      firstPaidDate: today(),
      createdAt: Date.now()
    };
  }
  var spokenCounts = {
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
    mil: 1e3
  };

  // src/js/domain/categories.js
  var CATEGORIES = {
    expense: [
      { name: "Alimentação & Mercado", icon: "bi-cart4", color: "#ef4444", bg: "#fef2f2" },
      { name: "Moradia & Contas", icon: "bi-house-heart", color: "#f97316", bg: "#fff7ed" },
      {
        name: "Transporte & Combustível",
        icon: "bi-car-front-fill",
        color: "#eab308",
        bg: "#fefce8"
      },
      { name: "Saúde & Farmácia", icon: "bi-heart-pulse-fill", color: "#ec4899", bg: "#fdf2f8" },
      { name: "Lazer & Viagens", icon: "bi-cup-straw", color: "#8b5cf6", bg: "#f5f3ff" },
      { name: "Compras & Vestuário", icon: "bi-bag-heart-fill", color: "#06b6d4", bg: "#ecfeff" },
      { name: "Educação & Cursos", icon: "bi-book-half", color: "#3b82f6", bg: "#eff6ff" },
      { name: "Outros Gastos", icon: "bi-receipt", color: "#64748b", bg: "#f1f5f9" }
    ],
    investment: [
      {
        name: "Renda Fixa (CDB / Tesouro)",
        icon: "bi-shield-lock-fill",
        color: "#4f46e5",
        bg: "#eef2ff"
      },
      { name: "FIIs & FI-Infra", icon: "bi-buildings-fill", color: "#7c3aed", bg: "#f3e8ff" },
      { name: "Ações & ETFs", icon: "bi-graph-up-arrow", color: "#2563eb", bg: "#dbeafe" },
      { name: "Reserva & Caixinha", icon: "bi-safe2-fill", color: "#0d9488", bg: "#ccfbf1" },
      { name: "Criptomoedas", icon: "bi-currency-bitcoin", color: "#d97706", bg: "#fef3c7" },
      { name: "Outros Investimentos", icon: "bi-piggy-bank-fill", color: "#9333ea", bg: "#fae8ff" }
    ],
    income: [
      { name: "Salário & Pró-labore", icon: "bi-cash-stack", color: "#10b981", bg: "#ecfdf5" },
      { name: "Serviços & Freelance", icon: "bi-briefcase-fill", color: "#059669", bg: "#d1fae5" },
      { name: "Vendas & Comércio", icon: "bi-shop", color: "#0d9488", bg: "#ccfbf1" },
      { name: "Rendimentos & Dividendos", icon: "bi-graph-up", color: "#16a34a", bg: "#dcfce7" },
      { name: "Outras Entradas", icon: "bi-wallet-fill", color: "#22c55e", bg: "#f0fdf4" }
    ]
  };

  // src/js/domain/records.js
  function sanitizeBill(raw, key) {
    if (!raw || !amountOK(Number(raw.amount)) || !isValidDate(raw.dueDate) || !["expense", "income", "investment"].includes(raw.type)) {
      throw new Error("Conta com valor, tipo ou vencimento inválido.");
    }
    const cats = CATEGORIES[raw.type], cancelled = raw.status === "cancelled" || raw.transactionId === "cancelled";
    const installmentNumber = Number(raw.installmentNumber) || 0, totalInstallments = Number(raw.totalInstallments) || 0;
    const sequence = Number(raw.sequence) || installmentNumber || (raw.ruleId && String(raw.id).startsWith(raw.ruleId + "_") ? Number(String(raw.id).slice(raw.ruleId.length + 1)) || 0 : 0);
    if (!Number.isInteger(installmentNumber) || !Number.isInteger(totalInstallments) || installmentNumber < 0 || totalInstallments < 0 || totalInstallments > 120) {
      throw new Error("A numeração das parcelas é inválida.");
    }
    return {
      id: sanitizeTransactionId(raw.id || uid("bill")),
      accountKey: key,
      description: String(raw.description || "Conta").trim().slice(0, 140),
      amount: Math.round(Number(raw.amount) * 100) / 100,
      type: raw.type,
      cardName: String(raw.cardName || "").trim().slice(0, 60),
      category: cats.some((c) => c.name === normalizeCategory(raw.category)) ? normalizeCategory(raw.category) : cats.at(-1).name,
      dueDate: raw.dueDate,
      status: cancelled ? "cancelled" : raw.status === "paid" ? "paid" : "pending",
      transactionId: cancelled ? "" : String(raw.transactionId || "").slice(0, 96),
      ruleId: String(raw.ruleId || "").slice(0, 96),
      installmentNumber,
      totalInstallments,
      sequence,
      paidAt: isValidDate(raw.paidAt) ? raw.paidAt : "",
      settledAmount: raw.settledAmount === null || raw.settledAmount === void 0 ? null : Number(raw.settledAmount),
      cancelledAt: isValidDate(raw.cancelledAt) ? raw.cancelledAt : "",
      createdAt: Number(raw.createdAt) || Date.now(),
      updatedAt: Number(raw.updatedAt) || Date.now(),
      syncedWithCloud: Boolean(raw.syncedWithCloud)
    };
  }

  // src/js/domain/planning.js
  function buildBills(rule, horizon = addMonths(today(), 12)) {
    if (rule.cancelledAt) {
      return [];
    }
    const result = [];
    const totalCents = Math.round(rule.amount * 100);
    const start = rule.startDate.split("-").map(Number), end = horizon.split("-").map(Number);
    const n = rule.frequency === "installment" ? rule.totalInstallments : Math.max(0, (end[0] - start[0]) * 12 + end[1] - start[1] + 1);
    for (let i = 0; i < n; i++) {
      const due = addMonths(rule.startDate, i);
      if (due > "2200-12-31" || rule.frequency === "monthly" && due > horizon || rule.disabledAfter && due >= rule.disabledAfter) {
        break;
      }
      const cents = rule.frequency === "installment" ? Math.floor(totalCents / n) + (i < totalCents % n ? 1 : 0) : totalCents;
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
            status: "pending",
            ruleId: rule.id,
            sequence: i + 1,
            installmentNumber: rule.frequency === "installment" ? i + 1 : 0,
            totalInstallments: rule.frequency === "installment" ? n : 0,
            createdAt: rule.createdAt
          },
          rule.accountKey
        )
      );
    }
    return result;
  }

  // src/js/services/speech-recognition.js
  var messages = {
    "not-allowed": "Permita o uso do microfone no navegador para falar seus lançamentos.",
    "service-not-allowed": "O navegador bloqueou o ditado por voz. Verifique as permissões do microfone.",
    "audio-capture": "Nenhum microfone disponível. Verifique se ele está conectado.",
    "no-speech": "Não consegui ouvir a fala. Tente novamente ou digite o lançamento.",
    network: "O ditado por voz precisa de conexão. Verifique a internet ou digite o lançamento."
  };
  function createSpeechRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      return null;
    }
    const recognition = new Recognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = true;
    return recognition;
  }
  function speechTranscript(event) {
    return Array.from(event.results, (result) => result[0].transcript.trim()).join(" ");
  }
  function speechErrorMessage(code2) {
    return messages[code2] || "Não foi possível reconhecer o áudio. Tente novamente ou digite o lançamento.";
  }

  // src/js/landing/demo-voice.js
  function initDemoVoice(form, input, preview) {
    const button = document.getElementById("demoMic");
    const label = button.querySelector("span");
    const status = document.getElementById("demoMicStatus");
    const submit = form.querySelector('[type="submit"]');
    const recognition = createSpeechRecognition();
    let active = false;
    let transcript = "";
    let failed = false;
    function announce(message, error = false) {
      status.textContent = message;
      status.hidden = !message;
      status.classList.toggle("expense-text", error);
    }
    if (!recognition) {
      button.addEventListener("click", () => {
        announce(
          "O ditado por voz está indisponível neste navegador. Digite para testar o comando.",
          true
        );
      });
      return;
    }
    function finish() {
      active = false;
      button.disabled = false;
      input.readOnly = false;
      submit.disabled = false;
      button.setAttribute("aria-pressed", "false");
      label.textContent = "Usar microfone";
    }
    recognition.onstart = () => {
      if (!active || failed) {
        return;
      }
      button.disabled = false;
      button.setAttribute("aria-pressed", "true");
      label.textContent = "Parar e conferir";
      announce("Ouvindo… Fale o seu lançamento.");
    };
    recognition.onresult = (event) => {
      if (active && !failed) {
        transcript = speechTranscript(event);
        input.value = transcript;
      }
    };
    recognition.onerror = (event) => {
      failed = true;
      announce(
        event.error === "aborted" ? "" : speechErrorMessage(event.error),
        event.error !== "aborted"
      );
    };
    recognition.onend = () => {
      if (!active) {
        return;
      }
      finish();
      if (failed) {
        return;
      }
      if (!transcript) {
        announce(speechErrorMessage("no-speech"), true);
        return;
      }
      announce("Ditado concluído. Você pode editar a frase e gerar outra prévia.");
      preview();
    };
    button.addEventListener("click", () => {
      button.disabled = true;
      try {
        if (active) {
          announce("Concluindo o ditado…");
          recognition.stop();
          return;
        }
        active = true;
        failed = false;
        transcript = "";
        input.readOnly = true;
        submit.disabled = true;
        announce("Aguardando acesso ao microfone…");
        recognition.start();
      } catch {
        failed = true;
        finish();
        announce("Não foi possível usar o microfone. Verifique a permissão e tente novamente.", true);
      }
    });
    window.addEventListener("pagehide", () => {
      if (active) {
        failed = true;
        recognition.abort();
        finish();
      }
    });
  }

  // src/js/landing/value-visibility.js
  var originalValues = /* @__PURE__ */ new WeakMap();
  function updateMoneyVisibility(root = document) {
    const hidden = document.body.classList.contains("values-hidden");
    for (const amount of root.querySelectorAll(".money")) {
      if (hidden && !originalValues.has(amount)) {
        originalValues.set(amount, amount.textContent);
        amount.textContent = "R$ ••••";
      } else if (!hidden && originalValues.has(amount)) {
        amount.textContent = originalValues.get(amount);
        originalValues.delete(amount);
      }
    }
  }

  // src/js/landing/installment-demo.js
  var brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  var labels = { income: "Receita", expense: "Despesa", investment: "Investimento" };
  var numberToken = "(?:" + Object.keys(spokenCounts).join("|") + "|[0-9]+)";
  var spokenNumber = numberToken + "(?:\\s+(?:e\\s+)?" + numberToken + "){0,7}";
  var currencyWords = new RegExp(
    "(?<![\\w.,])(" + spokenNumber + ")\\s+(real|reais)\\b(?:\\s+e\\s+(" + spokenNumber + ")\\s+centavos?\\b)?",
    "gi"
  );
  var purchaseWords = new RegExp("(\\bpor\\s+)(" + spokenNumber + ")(?=\\s+em\\b)", "gi");
  function numberFromWords(value) {
    const parts = value.toLowerCase().split(/\s+(?:e\s+)?/);
    const subTotal = (words) => {
      if (words.length === 0) {
        return 0;
      }
      return words.length === 1 && /^\d+$/.test(words[0]) ? Number(words[0]) : installmentCount(words.join(" e "));
    };
    const thousand = parts.indexOf("mil");
    return thousand < 0 ? subTotal(parts) : (thousand === 0 ? 1 : subTotal(parts.slice(0, thousand))) * 1e3 + subTotal(parts.slice(thousand + 1));
  }
  function normalizeAmounts(text) {
    return text.replace(currencyWords, (match, value, currency, cents) => {
      const units = numberFromWords(value);
      const fraction = cents ? numberFromWords(cents) : 0;
      return Number.isSafeInteger(units) && Number.isInteger(fraction) && fraction < 100 ? `${units}${cents ? "," + String(fraction).padStart(2, "0") : ""} ${currency}` : match;
    }).replace(purchaseWords, (match, prefix, value) => {
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
    const card = element("article", "demo-movement", "");
    const heading = element("p", "preview-title", item.description);
    const detail = element(
      "p",
      "card-sub",
      [
        item.kind === "installment" ? "Compra parcelada" : labels[item.type],
        item.category,
        formatDateBR(item.date)
      ].join(" · ")
    );
    card.append(heading, detail);
    if (item.kind !== "installment") {
      card.append(element("p", "preview-total money", brl.format(item.amount)));
      return card;
    }
    const bills = buildBills({
      id: "demo",
      type: item.type,
      description: item.description,
      category: item.category,
      amount: item.amount,
      startDate: item.date,
      frequency: "installment",
      totalInstallments: item.installments
    });
    const list = element("ol", "parcelas", "");
    for (const bill of bills) {
      const row = document.createElement("li");
      row.append(
        element(
          "span",
          "",
          `Parcela ${bill.installmentNumber}/${bill.totalInstallments} · ${dateLabel(bill.dueDate)}`
        ),
        element("strong", "money", brl.format(bill.amount))
      );
      list.append(row);
    }
    const total = element("p", "preview-total", "Total da compra · ");
    total.append(element("span", "money", brl.format(item.amount)));
    card.append(list, total);
    return card;
  }
  function initInstallmentDemo() {
    const form = document.getElementById("installmentDemo");
    const input = document.getElementById("demoPhrase");
    const result = document.getElementById("demoResult");
    function preview() {
      try {
        if (input.value.length > input.maxLength) {
          throw new Error("Use uma frase de até 180 caracteres para testar o lançamento.");
        }
        const items = parseGeneralInput(normalizeAmounts(input.value));
        if (!items.length) {
          throw new Error("Inclua um valor no comando. Experimente “Gastei 40 reais no mercado”.");
        }
        result.replaceChildren(...items.map(renderMovement));
        updateMoneyVisibility(result);
      } catch (error) {
        result.replaceChildren(element("p", "expense-text", error.message));
      }
    }
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      preview();
    });
    preview();
    initDemoVoice(form, input, preview);
  }

  // src/js/landing/motion.js
  function initFeatureStrip() {
    const strip = document.querySelector(".feature-strip");
    const track = strip.querySelector(".feature-strip-track");
    const button = strip.querySelector(".feature-strip-toggle");
    const copy = track.firstElementChild.cloneNode(true);
    copy.removeAttribute("aria-label");
    copy.setAttribute("aria-hidden", "true");
    track.append(copy);
    strip.classList.add("feature-strip-moving");
    button.hidden = false;
    button.addEventListener("click", () => {
      const paused = strip.classList.toggle("is-paused");
      const action = paused ? "Continuar" : "Pausar";
      button.textContent = action;
      button.setAttribute("aria-label", action + " faixa de recursos");
    });
  }
  function initLandingMotion() {
    initFeatureStrip();
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const { target, isIntersecting } of entries) {
            if (isIntersecting) {
              target.classList.add("revealed");
              observer.unobserve(target);
            }
          }
        },
        { rootMargin: "0px 0px -28px 0px" }
      );
      for (const element3 of document.querySelectorAll("[data-reveal]")) {
        observer.observe(element3);
      }
      document.documentElement.classList.add("landing-reveal");
    }
    const canTilt = matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"
    );
    const preview = document.querySelector(".hero-mock");
    const panel = preview.querySelector(".mock-tilt");
    const reset = () => panel.style.removeProperty("--panel-transform");
    preview.addEventListener("pointermove", (event) => {
      if (!canTilt.matches || event.pointerType === "touch") {
        return;
      }
      const bounds = preview.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      panel.style.setProperty(
        "--panel-transform",
        `perspective(1000px) translate3d(${x * 28}px, ${y * 12}px, 0) rotateX(${-y * 12}deg) rotateY(${x * 16}deg)`
      );
    });
    preview.addEventListener("pointerleave", reset);
    canTilt.addEventListener("change", reset);
  }

  // src/js/landing/demo-data.js
  var reportMonths = [
    {
      month: "2025-11",
      income: 64500,
      expense: {
        "Moradia & Contas": 29028,
        "Alimentação & Mercado": 59283,
        "Lazer & Viagens": 17750,
        "Transporte & Combustível": 15150,
        "Saúde & Farmácia": 9990,
        "Educação & Cursos": 14900,
        "Compras & Vestuário": 6390
      },
      investment: {
        "Renda Fixa (CDB / Tesouro)": 14500,
        "Ações & ETFs": 18e3
      }
    },
    {
      month: "2026-01",
      income: 448e3,
      expense: {
        "Saúde & Farmácia": 15411,
        "Educação & Cursos": 14900,
        "Transporte & Combustível": 30510,
        "Alimentação & Mercado": 103321,
        "Lazer & Viagens": 23950,
        "Compras & Vestuário": 64940,
        "Moradia & Contas": 183834
      },
      investment: {
        "Renda Fixa (CDB / Tesouro)": 17900,
        "Reserva & Caixinha": 27e3
      }
    },
    {
      month: "2026-02",
      income: 503600,
      expense: {
        "Alimentação & Mercado": 108773,
        "Transporte & Combustível": 30265,
        "Saúde & Farmácia": 15984,
        "Moradia & Contas": 185237,
        "Lazer & Viagens": 148940,
        "Educação & Cursos": 14900,
        "Compras & Vestuário": 66215
      },
      investment: {
        "Reserva & Caixinha": 29500,
        "Renda Fixa (CDB / Tesouro)": 19600,
        "Ações & ETFs": 18e3
      }
    },
    {
      month: "2026-03",
      income: 513300,
      expense: {
        "Alimentação & Mercado": 114225,
        "Transporte & Combustível": 32345,
        "Saúde & Farmácia": 16557,
        "Moradia & Contas": 186640,
        "Lazer & Viagens": 25550,
        "Educação & Cursos": 14900,
        "Compras & Vestuário": 67490
      },
      investment: {
        "Reserva & Caixinha": 22e3,
        "Renda Fixa (CDB / Tesouro)": 21300
      }
    },
    {
      month: "2026-04",
      income: 448e3,
      expense: {
        "Alimentação & Mercado": 92417,
        "Transporte & Combustível": 117490,
        "Saúde & Farmácia": 14265,
        "Moradia & Contas": 181028,
        "Lazer & Viagens": 18900,
        "Educação & Cursos": 14900,
        "Compras & Vestuário": 62390
      },
      investment: {
        "Reserva & Caixinha": 24500,
        "Renda Fixa (CDB / Tesouro)": 14500
      }
    },
    {
      month: "2026-05",
      income: 619700,
      expense: {
        "Alimentação & Mercado": 97869,
        "Transporte & Combustível": 27655,
        "Saúde & Farmácia": 14838,
        "Moradia & Contas": 182431,
        "Lazer & Viagens": 22e3,
        "Educação & Cursos": 14900,
        "Compras & Vestuário": 7665
      },
      investment: {
        "Reserva & Caixinha": 27e3,
        "Renda Fixa (CDB / Tesouro)": 16200,
        "Ações & ETFs": 18e3
      }
    },
    {
      month: "2026-06",
      income: 474500,
      expense: {
        "Alimentação & Mercado": 103321,
        "Transporte & Combustível": 29735,
        "Saúde & Farmácia": 15411,
        "Moradia & Contas": 183834,
        "Lazer & Viagens": 25100,
        "Educação & Cursos": 14900,
        "Compras & Vestuário": 45189
      },
      investment: {
        "Reserva & Caixinha": 29500,
        "Renda Fixa (CDB / Tesouro)": 17900
      }
    },
    {
      month: "2026-07",
      income: 448e3,
      expense: {
        "Alimentação & Mercado": 108773,
        "Transporte & Combustível": 31815,
        "Saúde & Farmácia": 15984,
        "Moradia & Contas": 185237,
        "Lazer & Viagens": 102580,
        "Educação & Cursos": 14900,
        "Compras & Vestuário": 46464
      },
      investment: {
        "Reserva & Caixinha": 22e3,
        "Renda Fixa (CDB / Tesouro)": 19600
      }
    },
    {
      month: "2026-08",
      income: 493900,
      expense: {
        "Alimentação & Mercado": 114225,
        "Transporte & Combustível": 31570,
        "Saúde & Farmácia": 16557,
        "Moradia & Contas": 186640,
        "Lazer & Viagens": 26700,
        "Educação & Cursos": 14900,
        "Compras & Vestuário": 47739
      },
      investment: {
        "Reserva & Caixinha": 24500,
        "Renda Fixa (CDB / Tesouro)": 21300,
        "Ações & ETFs": 18e3
      }
    },
    {
      month: "2026-09",
      income: 503600,
      expense: {
        "Alimentação & Mercado": 92417,
        "Transporte & Combustível": 27125,
        "Saúde & Farmácia": 14265,
        "Moradia & Contas": 170038,
        "Lazer & Viagens": 20050,
        "Educação & Cursos": 14900,
        "Compras & Vestuário": 66639
      },
      investment: {
        "Reserva & Caixinha": 27e3,
        "Renda Fixa (CDB / Tesouro)": 14500
      }
    },
    {
      month: "2026-10",
      income: 513300,
      expense: {
        "Alimentação & Mercado": 97869,
        "Transporte & Combustível": 29205,
        "Saúde & Farmácia": 42338,
        "Moradia & Contas": 193421,
        "Lazer & Viagens": 23150,
        "Educação & Cursos": 14900,
        "Compras & Vestuário": 43914
      },
      investment: {
        "Reserva & Caixinha": 29500,
        "Renda Fixa (CDB / Tesouro)": 16200
      }
    },
    {
      month: "2026-11",
      income: 490500,
      expense: {
        "Alimentação & Mercado": 40812,
        "Transporte & Combustível": 11760,
        "Saúde & Farmácia": 5421,
        "Moradia & Contas": 152e3
      },
      investment: {
        "Reserva & Caixinha": 22e3
      }
    },
    {
      month: "2025-12",
      income: 647200,
      expense: {
        "Compras & Vestuário": 106335,
        "Alimentação & Mercado": 97869,
        "Transporte & Combustível": 28430,
        "Saúde & Farmácia": 14838,
        "Moradia & Contas": 182431,
        "Lazer & Viagens": 20850,
        "Educação & Cursos": 14900
      },
      investment: {
        "Reserva & Caixinha": 24500,
        "Renda Fixa (CDB / Tesouro)": 16200
      }
    }
  ];

  // src/js/landing/report.js
  var money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  var shortMonth = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });
  var longMonth = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
  var axisNumber = new Intl.NumberFormat("pt-BR", { notation: "compact" });
  var series = [
    ["income", "Receitas"],
    ["expense", "Despesas"],
    ["investment", "Investimentos"]
  ];
  var sumCategories = (categories) => Object.values(categories).reduce((sum, value) => sum + value, 0);
  var monthDate = (month) => /* @__PURE__ */ new Date(month + "-01T00:00:00Z");
  var brl2 = (cents) => money.format(cents / 100);
  var records = [...reportMonths].sort((a, b) => a.month.localeCompare(b.month)).map((record) => ({
    ...record,
    totals: {
      income: record.income,
      expense: sumCategories(record.expense),
      investment: sumCategories(record.investment)
    }
  }));
  function element2(tag, content, className) {
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
    const card = element2("div", "", "sum-box");
    card.append(element2("p", label), element2("p", brl2(cents), "money " + (seriesName || "")));
    return card;
  }
  function periodTotals(visible) {
    return series.map(([key]) => visible.reduce((sum, item) => sum + item.totals[key], 0));
  }
  function renderTable(container, visible) {
    const table = element2("table");
    const thead = table.createTHead().insertRow();
    for (const title of ["Mês", "Receitas", "Despesas", "Investimentos", "Saldo"]) {
      const cell = element2("th", title);
      cell.scope = "col";
      thead.append(cell);
    }
    const tbody = table.createTBody();
    for (const item of visible) {
      const row = tbody.insertRow();
      const { income, expense, investment } = item.totals;
      const month = element2("th", longMonth.format(monthDate(item.month)));
      month.scope = "row";
      row.append(month);
      for (const value of [income, expense, investment, income - expense]) {
        row.append(element2("td", brl2(value), "money"));
      }
    }
    container.replaceChildren(table);
  }
  function renderBreakdown(container, categories, seriesName) {
    const values = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    const total = sumCategories(categories);
    container.replaceChildren();
    if (!values.length) {
      container.append(element2("p", "Sem registros no mês selecionado.", "card-sub"));
      return;
    }
    for (const [label, value] of values) {
      const row = element2("div", "", "report-category");
      const heading = element2("div", "", "report-category-heading");
      const percent = total > 0 ? value / total * 100 : 0;
      heading.append(element2("span", label), element2("strong", brl2(value), "money"));
      const track = element2("div", "", "track");
      track.setAttribute("aria-hidden", "true");
      const fill = element2("i", "", "report-category-fill series-" + seriesName);
      fill.style.width = Math.max(0, Math.min(percent, 100)) + "%";
      track.append(fill);
      row.append(heading, track);
      container.append(row);
    }
  }
  function initReport() {
    const report = document.getElementById("relatorio-exemplo");
    const spanInput = document.getElementById("reportSpan");
    const monthGroup = document.getElementById("reportMonths");
    const previous = document.getElementById("reportPrev");
    const next = document.getElementById("reportNext");
    const reset = document.getElementById("reportReset");
    const selection = document.getElementById("reportSelected");
    const range = document.getElementById("reportRange");
    const axis = document.getElementById("reportAxis");
    const totals = document.getElementById("reportTotals");
    const table = document.getElementById("reportTable");
    const expense = document.getElementById("reportExpenses");
    const investment = document.getElementById("reportInvestments");
    let end = records.length;
    let selected = records.at(-1);
    const span = () => Number(spanInput.value);
    const visible = () => records.slice(end - span(), end);
    function selectMonth(item) {
      selected = item;
      for (const button of monthGroup.children) {
        button.setAttribute("aria-pressed", String(button.dataset.month === item.month));
      }
      const { income, expense: spent, investment: invested } = item.totals;
      const heading = element2("h4", longMonth.format(monthDate(item.month)));
      const details = element2("div", "", "sum-grid g4");
      details.append(
        totalCard("Receitas", income, "income-text"),
        totalCard("Despesas", spent, "expense-text"),
        totalCard("Investimentos", invested, "invest-text"),
        totalCard("Saldo", income - spent)
      );
      selection.replaceChildren(heading, details);
      renderBreakdown(expense, item.expense, "expense");
      renderBreakdown(investment, item.investment, "investment");
      updateMoneyVisibility(report);
    }
    function renderPeriod() {
      const items = visible();
      const [income, spent, invested] = periodTotals(items);
      const maxValue = Math.max(...items.flatMap(({ totals: values }) => Object.values(values)));
      const limit = Math.max(1e5, Math.ceil(maxValue / 1e5) * 1e5);
      const startLabel = longMonth.format(monthDate(items[0].month));
      const endLabel = longMonth.format(monthDate(items.at(-1).month));
      range.textContent = startLabel + " a " + endLabel;
      previous.disabled = end === span();
      next.disabled = end === records.length;
      reset.disabled = end === records.length;
      totals.replaceChildren(
        totalCard("Receitas no período", income, "income-text"),
        totalCard("Despesas no período", spent, "expense-text"),
        totalCard("Investimentos", invested, "invest-text"),
        totalCard("Saldo do período", income - spent)
      );
      axis.replaceChildren(
        ...[1, 0.75, 0.5, 0.25, 0].map(
          (fraction) => element2("span", "R$ " + axisNumber.format(limit * fraction / 100), "money")
        )
      );
      monthGroup.classList.toggle("wide-period", items.length > 6);
      monthGroup.replaceChildren(
        ...items.map((item) => {
          const date = monthDate(item.month);
          const button = element2("button", "", "report-month");
          button.type = "button";
          button.dataset.month = item.month;
          button.setAttribute("aria-label", longMonth.format(date));
          button.title = longMonth.format(date);
          const bars = element2("span", "", "report-bars");
          bars.setAttribute("aria-hidden", "true");
          for (const [key] of series) {
            const bar = element2("i", "", "report-bar series-" + key);
            bar.style.height = Math.max(0, item.totals[key] / limit * 100) + "%";
            bars.append(bar);
          }
          button.append(
            bars,
            element2("span", shortMonth.format(date).replace(".", ""), "report-month-label")
          );
          button.addEventListener("click", () => selectMonth(item));
          return button;
        })
      );
      renderTable(table, items);
      selectMonth(items.includes(selected) ? selected : items.at(-1));
    }
    spanInput.addEventListener("change", () => {
      end = Math.max(end, span());
      renderPeriod();
    });
    previous.addEventListener("click", () => {
      end = Math.max(span(), end - span());
      renderPeriod();
      if (previous.disabled) {
        next.focus();
      }
    });
    next.addEventListener("click", () => {
      end = Math.min(records.length, end + span());
      renderPeriod();
      if (next.disabled) {
        previous.focus();
      }
    });
    reset.addEventListener("click", () => {
      end = records.length;
      selected = records.at(-1);
      renderPeriod();
      previous.focus();
    });
    renderPeriod();
  }

  // src/js/ui/install-app.js
  function initInstallApp() {
    if (!document.querySelector('link[rel="manifest"]') || !("serviceWorker" in navigator)) {
      return;
    }
    const panel = document.querySelector("[data-install-panel]");
    const button = panel.querySelector("button");
    const guide = panel.querySelector("[data-install-guide]");
    const standalone = matchMedia("(display-mode: standalone)");
    const appleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    let installed = false;
    let promptEvent = null;
    function update() {
      panel.hidden = installed || standalone.matches || navigator.standalone || !promptEvent && !appleMobile;
    }
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      promptEvent = event;
      update();
    });
    window.addEventListener("appinstalled", () => {
      installed = true;
      promptEvent = null;
      update();
    });
    standalone.addEventListener("change", update);
    button.addEventListener("click", async () => {
      if (!promptEvent) {
        guide.hidden = !guide.hidden;
        button.setAttribute("aria-expanded", String(!guide.hidden));
        return;
      }
      const event = promptEvent;
      promptEvent = null;
      button.disabled = true;
      try {
        const choice = await event.prompt();
        installed = choice.outcome === "accepted";
      } catch (error) {
        console.warn("Não foi possível abrir a instalação:", error);
      } finally {
        button.disabled = false;
        update();
      }
    });
    update();
    void navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" }).catch((error) => console.warn("Não foi possível preparar o acesso offline:", error));
  }

  // src/js/landing.js
  var current = new URL(location.href);
  var { code, redirectError } = readAuthReturn(current);
  var oldAppBookmark = ["#inicio", "#lancamentos", "#contas", "#relatorios"].includes(current.hash);
  if (code || redirectError || oldAppBookmark) {
    const destination = new URL("login.html", current);
    for (const key of callbackKeys) {
      if (current.searchParams.has(key)) {
        destination.searchParams.set(key, current.searchParams.get(key));
      }
    }
    destination.hash = current.hash;
    location.replace(destination.href);
  } else {
    initLanding();
  }
  function initLanding() {
    const menu = document.getElementById("mobileMenu");
    const menuButton = document.getElementById("menuBtn");
    const menuIcon = document.querySelector("#menuIcon use");
    const eyeButton = document.getElementById("eyeBtn");
    const eyeIcon = document.querySelector("#eyeIcon use");
    function setMenu(open) {
      menu.hidden = !open;
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      menuIcon.setAttribute("href", open ? "#i-x" : "#i-menu");
    }
    menuButton.addEventListener("click", () => setMenu(menu.hidden));
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        setMenu(false);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !menu.hidden) {
        setMenu(false);
        menuButton.focus();
      }
    });
    eyeButton.addEventListener("click", () => {
      const hidden = document.body.classList.toggle("values-hidden");
      const label = hidden ? "Mostrar valores da demonstração" : "Ocultar valores da demonstração";
      eyeButton.setAttribute("aria-label", label);
      eyeButton.setAttribute("title", label);
      eyeButton.setAttribute("aria-pressed", String(hidden));
      eyeIcon.setAttribute("href", hidden ? "#i-eye-off" : "#i-eye");
      document.getElementById("reportHidden").hidden = !hidden;
      updateMoneyVisibility();
    });
    const search = document.getElementById("extratoSearch");
    const days = document.querySelectorAll("#extratoGrid .day-card");
    const empty = document.getElementById("extEmpty");
    const normalize = (value) => value.toLowerCase().normalize("NFD").replace(new RegExp("\\p{M}", "gu"), "");
    search.addEventListener("input", () => {
      const query = normalize(search.value.trim());
      let found = false;
      for (const day of days) {
        let matches = 0;
        for (const row of day.querySelectorAll(".ext-row")) {
          row.hidden = !normalize(row.dataset.s).includes(query);
          matches += Number(!row.hidden);
        }
        day.hidden = matches === 0;
        found ||= !day.hidden;
      }
      empty.hidden = found;
    });
    initInstallmentDemo();
    initReport();
    initLandingMotion();
    initInstallApp();
  }
})();
