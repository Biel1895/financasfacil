// GERADO por npm run build. Fontes em src/js/.
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/js/domain/format.js
  function formatCurrency(val) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val || 0);
  }
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
  function getSafeDateForSelectedMonth(year, monthIndex2, preferredDay = null) {
    const maxDaysInMonth = new Date(year, monthIndex2 + 1, 0).getDate();
    const rawDay = preferredDay !== null ? preferredDay : (/* @__PURE__ */ new Date()).getDate();
    const safeDay = Math.min(Math.max(1, rawDay), maxDaysInMonth);
    return new Date(year, monthIndex2, safeDay);
  }
  function escapeHTML(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function sanitizeCSVCell(value) {
    let str = String(value ?? "").replace(/"/g, '""');
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str}"`;
  }
  function normalizeAccountKey(identifier) {
    return String(identifier || "").trim().toLowerCase().replace(/[^a-z0-9._@-]/g, "_").slice(0, 80);
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
  function amountInput(n) {
    return Number(n).toFixed(2).replace(".", ",");
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
  function monthIndex(year, month) {
    return year * 12 + month;
  }
  function reportDate(index) {
    return new Date(Math.floor(index / 12), index % 12, 1);
  }
  function currentPeriod() {
    const now = /* @__PURE__ */ new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  // src/js/infrastructure/lifecycle.js
  var listeners = /* @__PURE__ */ new Map();
  function onLifecycle(event, listener) {
    if (!listeners.has(event)) {
      listeners.set(event, /* @__PURE__ */ new Set());
    }
    listeners.get(event).add(listener);
    return () => listeners.get(event)?.delete(listener);
  }
  function publish(event, payload) {
    for (const listener of listeners.get(event) || []) {
      listener(payload);
    }
  }

  // src/js/infrastructure/database.js
  var STORE = {
    tx: "movimentacoes",
    users: "usuarios_cache",
    session: "sessao_ativa",
    tombs: "exclusoes_pendentes",
    bills: "contas_programadas",
    rules: "regras_recorrentes",
    outbox: "fila_sincronizacao",
    backups: "copias_diarias"
  };
  var DB = {
    IDB_NAME: "FinancasFacilMultiDeviceDB",
    IDB_VERSION: 4,
    STORE_TX: STORE.tx,
    STORE_USERS: STORE.users,
    STORE_SESSION: STORE.session,
    STORE_TOMBSTONES: STORE.tombs,
    cached: null,
    open() {
      if (this.cached) {
        return this.cached;
      }
      this.cached = new Promise((resolve, reject) => {
        const request = indexedDB.open(this.IDB_NAME, this.IDB_VERSION);
        request.onupgradeneeded = () => {
          const conn = request.result;
          for (const [name, store] of Object.entries(STORE)) {
            if (!conn.objectStoreNames.contains(store)) {
              conn.createObjectStore(store, {
                keyPath: name === "users" ? "accountKey" : name === "session" ? "key" : "id"
              });
            }
          }
        };
        request.onsuccess = () => {
          const conn = request.result;
          conn.onversionchange = () => {
            conn.close();
            this.cached = null;
            publish("notice", ["Há uma versão nova. Recarregue a página para continuar.", "warning"]);
          };
          conn.onclose = () => {
            this.cached = null;
          };
          resolve(conn);
        };
        request.onerror = () => {
          this.cached = null;
          reject(
            new Error(
              "Não foi possível abrir seus dados. Verifique o armazenamento permitido pelo navegador."
            )
          );
        };
        request.onblocked = () => {
          publish("notice", [
            "Feche outras abas do FinançasFácil para atualizar o armazenamento.",
            "warning"
          ]);
        };
      });
      return this.cached;
    },
    async read(store, key, all = false) {
      const conn = await this.open();
      return new Promise((resolve, reject) => {
        const tx = conn.transaction(store, "readonly");
        const req = all ? tx.objectStore(store).getAll() : tx.objectStore(store).get(key);
        req.onsuccess = () => resolve(req.result ?? (all ? [] : null));
        req.onerror = () => reject(req.error);
        tx.onabort = () => reject(tx.error);
      });
    },
    get(store, key) {
      return this.read(store, key);
    },
    getAll(store) {
      return this.read(store, null, true);
    },
    async commit(puts = [], deletes = []) {
      const names = [.../* @__PURE__ */ new Set([...puts.map((p) => p[0]), ...deletes.map((p) => p[0])])];
      if (!names.length) {
        return;
      }
      const conn = await this.open();
      return new Promise((resolve, reject) => {
        const tx = conn.transaction(names, "readwrite");
        try {
          for (const [s, item] of puts) {
            tx.objectStore(s).put(item);
          }
          for (const [s, id] of deletes) {
            tx.objectStore(s).delete(id);
          }
        } catch (e) {
          tx.abort();
          reject(e);
          return;
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error("Falha ao salvar no aparelho."));
        tx.onabort = () => reject(tx.error || new Error("Gravação cancelada."));
      });
    },
    put(s, item) {
      return this.commit([[s, item]]);
    },
    putBulk(s, items) {
      return this.commit(items.map((v) => [s, v]));
    },
    delete(s, id) {
      return this.commit([], [[s, id]]);
    }
  };

  // src/js/state/store.js
  var sessionLifecycle = { generation: 0 };
  var todayDate = /* @__PURE__ */ new Date();
  var state = {
    authMode: "login",
    loggedAccount: null,
    themePreference: "auto",
    balanceMode: "independent",
    selectedYear: todayDate.getFullYear(),
    selectedMonth: todayDate.getMonth(),
    filterType: "all",
    searchQuery: "",
    transactions: [],
    bills: [],
    rules: [],
    snapshots: [],
    isRecording: false,
    isSubmittingCommand: false,
    draftItems: [],
    inputSource: "text",
    billFilter: "pending",
    view: "inicio",
    hideValues: false,
    busy: 0,
    syncBusy: false,
    reportSpan: 6,
    reportWindowEnd: null,
    syncError: "",
    saveError: "",
    lastSync: null,
    lastExport: null,
    pendingCount: 0,
    lastAddedIds: [],
    failedLoginAttempts: 0,
    lockoutUntil: 0,
    undo: null
  };
  function account() {
    if (!state.loggedAccount) {
      throw new Error("Entre na sua conta para continuar.");
    }
    return state.loggedAccount.accountKey;
  }

  // src/js/data/backups.js
  var snapshotBusy = false;
  function backupPayload() {
    return {
      application: "FinancasFacil",
      schemaVersion: 3,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      account: account(),
      transactions: state.transactions,
      bills: state.bills,
      rules: state.rules
    };
  }
  async function autoSnapshot(force = false) {
    if (snapshotBusy) {
      if (force) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return autoSnapshot(true);
      }
      return;
    }
    if (!state.loggedAccount || !force && !state.transactions.length && !state.bills.length) {
      return;
    }
    const key = account(), id = force ? uid("snapshot") : `daily_${key}_${today()}`;
    if (!force && state.snapshots.some((s) => s.id === id)) {
      return;
    }
    snapshotBusy = true;
    try {
      const snap = {
        id,
        accountKey: key,
        createdAt: Date.now(),
        label: force ? "Antes da restauração" : "Cópia diária",
        payload: backupPayload()
      };
      const all = [snap, ...state.snapshots.filter((s) => s.id !== id)].sort(
        (a, b) => b.createdAt - a.createdAt
      );
      await DB.commit(
        [[STORE.backups, snap]],
        all.slice(7).map((s) => [STORE.backups, s.id])
      );
      if (state.loggedAccount?.accountKey === key) {
        state.snapshots = all.slice(0, 7);
        publish("backups:changed");
      }
    } finally {
      snapshotBusy = false;
    }
  }

  // src/js/domain/finance.js
  function txForBill(bill) {
    return `paid_${bill.id}`.slice(0, 96);
  }
  var cents = (value) => Math.round(Number(value) * 100);
  function entryAmount(entry) {
    return (entry.entryKind === "reversal" ? -1 : 1) * entry.amount;
  }
  function normalizeEntry(item, raw) {
    const entryKind = raw.entryKind === "reversal" ? "reversal" : "normal", relatedTransactionId = String(raw.relatedTransactionId || "").slice(0, 96);
    if (entryKind === "reversal" && !relatedTransactionId) {
      throw new Error("O estorno precisa estar vinculado ao lançamento original.");
    }
    return {
      ...item,
      entryKind,
      relatedTransactionId: entryKind === "reversal" ? relatedTransactionId : "",
      operationId: String(raw.operationId || "").slice(0, 96)
    };
  }
  function isCancelled(bill) {
    return bill.status === "cancelled" || bill.transactionId === "cancelled";
  }
  function assertDate(date) {
    if (!isValidDate(date)) {
      throw new Error("Informe uma data válida.");
    }
  }
  function allocatePayment(amounts, target) {
    const values = amounts.map(cents), total = values.reduce((s, v) => s + v, 0), targetCents = cents(target), n = values.length;
    if (!n || targetCents < n || targetCents > total) {
      throw new Error("O desconto deve deixar pelo menos R$ 0,01 para cada parcela.");
    }
    if (targetCents === total) {
      return values.map((v) => v / 100);
    }
    const remaining = BigInt(targetCents - n), denominator = BigInt(total - n || 1);
    const shares = values.map((v, i) => {
      const product = BigInt(v - 1) * remaining;
      return { index: i, value: 1 + Number(product / denominator), remainder: product % denominator };
    });
    const left = targetCents - shares.reduce((s, v) => s + v.value, 0);
    const order = [...shares].sort(
      (a, b) => a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1
    );
    for (let i = 0; i < left; i++) {
      order[i % order.length].value++;
    }
    return shares.map((v) => v.value / 100);
  }
  function validateFinancialGraph(payload, options = {}) {
    const txs = new Map(payload.transactions.map((t) => [t.id, t])), rules = new Map(payload.rules.map((r) => [r.id, r]));
    const refunds = /* @__PURE__ */ new Map();
    for (const tx of payload.transactions) {
      if (tx.entryKind !== "reversal") {
        continue;
      }
      const original = txs.get(tx.relatedTransactionId);
      if (!original || original.entryKind === "reversal" || original.id === tx.id) {
        throw new Error(`Estorno “${tx.description}” sem lançamento original válido.`);
      }
      if (tx.type !== original.type) {
        throw new Error(
          `O tipo do estorno de “${original.description}” não corresponde ao original.`
        );
      }
      if (tx.date < original.date) {
        throw new Error(
          `A data do estorno de “${original.description}” é anterior à movimentação original.`
        );
      }
      refunds.set(original.id, (refunds.get(original.id) || 0) + cents(tx.amount));
    }
    for (const [id, total] of refunds) {
      if (total > cents(txs.get(id).amount)) {
        throw new Error(
          `Os estornos de “${txs.get(id).description}” ultrapassam seu valor original.`
        );
      }
    }
    if (options.entryOnly) {
      return;
    }
    const paidLinks = /* @__PURE__ */ new Set(), occurrences = /* @__PURE__ */ new Set();
    for (const bill of payload.bills) {
      if (bill.ruleId) {
        const rule = rules.get(bill.ruleId);
        if (!rule) {
          throw new Error(`A conta “${bill.description}” aponta para uma programação inexistente.`);
        }
        if (rule.frequency === "installment" && (!Number.isInteger(bill.installmentNumber) || bill.installmentNumber < 1 || bill.totalInstallments !== rule.totalInstallments || bill.installmentNumber > bill.totalInstallments)) {
          throw new Error(`Confira a numeração das parcelas de “${bill.description}”.`);
        }
        const occurrence = bill.ruleId + "|" + (bill.totalInstallments ? bill.installmentNumber : bill.id);
        if (occurrences.has(occurrence)) {
          throw new Error(`Existem parcelas repetidas na compra “${bill.description}”.`);
        }
        occurrences.add(occurrence);
      }
      if (isCancelled(bill)) {
        if (bill.transactionId && bill.transactionId !== "cancelled") {
          throw new Error(`A conta cancelada “${bill.description}” ainda aponta para um pagamento.`);
        }
        continue;
      }
      if (bill.status === "paid") {
        const tx = findBillTransaction(bill, payload.transactions);
        if (!tx || tx.entryKind === "reversal") {
          throw new Error(
            `A conta “${bill.description}” está paga, mas seu lançamento não existe no backup nem na conta atual.`
          );
        }
        if (tx.type !== bill.type) {
          throw new Error(`O pagamento de “${bill.description}” tem um tipo diferente da conta.`);
        }
        if (paidLinks.has(tx.id)) {
          throw new Error("O mesmo pagamento foi vinculado a mais de uma conta.");
        }
        paidLinks.add(tx.id);
        if (bill.paidAt && bill.paidAt !== tx.date) {
          throw new Error(
            `A data de pagamento de “${bill.description}” não confere com o lançamento.`
          );
        }
        if (bill.settledAmount !== null && bill.settledAmount !== void 0 && cents(bill.settledAmount) !== cents(tx.amount)) {
          throw new Error(`O valor pago de “${bill.description}” não confere com o lançamento.`);
        }
      } else if (bill.transactionId || txs.has(txForBill(bill))) {
        throw new Error(
          `A conta “${bill.description}” está pendente, mas possui um pagamento vinculado.`
        );
      }
    }
    for (const rule of payload.rules.filter((r) => r.frequency === "installment")) {
      const numbers = new Set(
        payload.bills.filter((b) => b.ruleId === rule.id).map((b) => b.installmentNumber)
      );
      if (numbers.size !== rule.totalInstallments) {
        throw new Error(`A compra “${rule.description}” está com parcelas faltando no backup.`);
      }
    }
  }
  function sums(items) {
    const totals = items.reduce(
      (sum, t) => {
        sum[t.type] += cents(entryAmount(t));
        return sum;
      },
      { income: 0, expense: 0, investment: 0 }
    );
    return Object.fromEntries(Object.entries(totals).map(([type, value]) => [type, value / 100]));
  }
  function findBillTransaction(bill, transactions) {
    return transactions.find((t) => t.id === (bill.transactionId || txForBill(bill))) || null;
  }
  function calculateBalance(totals, mode = "independent") {
    return (cents(totals.income) - cents(totals.expense) - (mode === "integrated" ? cents(totals.investment) : 0)) / 100;
  }

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
  function validateAndSanitizeTransaction(rawItem, accountKey, period = currentPeriod()) {
    if (!rawItem || typeof rawItem !== "object") {
      return null;
    }
    const validTypes = ["expense", "income", "investment"];
    const type = validTypes.includes(rawItem.type) ? rawItem.type : "expense";
    const amountNum = Number(rawItem.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0 || amountNum > 99999999999e-2) {
      return null;
    }
    const roundedAmount = Math.round(amountNum * 100) / 100;
    const description = String(rawItem.description || "").trim().replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 140) || "Movimentação";
    const allowedCategories = CATEGORIES[type] || CATEGORIES.expense;
    const rawCat = normalizeCategory(
      String(rawItem.category || "").trim().slice(0, 80)
    );
    const category = allowedCategories.some((c) => c.name === rawCat) ? rawCat : allowedCategories[allowedCategories.length - 1].name;
    const rawDate = String(rawItem.date || "").trim();
    const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : formatISO(getSafeDateForSelectedMonth(period.year, period.month));
    return {
      id: sanitizeTransactionId(rawItem.id),
      accountKey,
      type,
      description,
      amount: roundedAmount,
      category,
      date,
      createdAt: Number.isFinite(Number(rawItem.createdAt)) ? Number(rawItem.createdAt) : Date.now(),
      updatedAt: Number.isFinite(Number(rawItem.updatedAt)) ? Number(rawItem.updatedAt) : Date.now(),
      syncedWithCloud: Boolean(rawItem.syncedWithCloud)
    };
  }
  function sanitizeTransaction(raw, key) {
    if (!raw || !isValidDate(raw.date) || !["expense", "income", "investment"].includes(raw.type)) {
      throw new Error("Confira a data e o tipo do lançamento.");
    }
    const item = validateAndSanitizeTransaction(raw, key);
    if (!item || !amountOK(item.amount)) {
      throw new Error("Informe um valor entre R$ 0,01 e R$ 999.999.999,99.");
    }
    return normalizeEntry(item, raw);
  }
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
  function sanitizeRule(raw, key) {
    if (!raw || !amountOK(Number(raw.amount)) || !isValidDate(raw.startDate) || !["monthly", "installment"].includes(raw.frequency) || !["expense", "income", "investment"].includes(raw.type)) {
      throw new Error("Recorrência inválida.");
    }
    const total = Number(raw.totalInstallments) || 0;
    if (raw.frequency === "installment" && (!Number.isInteger(total) || total < 2 || total > 120 || Math.round(raw.amount * 100) < total)) {
      throw new Error("Confira o número de parcelas e o valor total.");
    }
    const cats = CATEGORIES[raw.type];
    return {
      id: sanitizeTransactionId(raw.id || uid("rule")),
      accountKey: key,
      description: String(raw.description || "Conta recorrente").trim().slice(0, 140),
      amount: Math.round(Number(raw.amount) * 100) / 100,
      type: raw.type,
      cardName: String(raw.cardName || "").trim().slice(0, 60),
      category: cats.some((c) => c.name === normalizeCategory(raw.category)) ? normalizeCategory(raw.category) : cats.at(-1).name,
      startDate: raw.startDate,
      frequency: raw.frequency,
      totalInstallments: total,
      disabledAfter: raw.disabledAfter && isValidDate(raw.disabledAfter) ? raw.disabledAfter : null,
      cancelledAt: isValidDate(raw.cancelledAt) ? raw.cancelledAt : "",
      createdAt: Number(raw.createdAt) || Date.now(),
      updatedAt: Number(raw.updatedAt) || Date.now(),
      syncedWithCloud: Boolean(raw.syncedWithCloud)
    };
  }
  function sanitizeEntity(entity, item, key) {
    return entity === "tx" ? sanitizeTransaction(item, key) : entity === "bills" ? sanitizeBill(item, key) : sanitizeRule(item, key);
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
      const cents2 = rule.frequency === "installment" ? Math.floor(totalCents / n) + (i < totalCents % n ? 1 : 0) : totalCents;
      result.push(
        sanitizeBill(
          {
            id: `${rule.id}_${i + 1}`,
            description: rule.description,
            amount: cents2 / 100,
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

  // src/js/state/selectors.js
  function isoMonth(y = state.selectedYear, m = state.selectedMonth) {
    return `${y}-${String(m + 1).padStart(2, "0")}`;
  }
  function monthTransactions(offset = 0) {
    const date = new Date(state.selectedYear, state.selectedMonth + offset, 1);
    const prefix = isoMonth(date.getFullYear(), date.getMonth());
    return state.transactions.filter((t) => t.date.startsWith(prefix));
  }
  function realBills() {
    return state.bills.filter((b) => !isCancelled(b));
  }
  function selectedPeriod() {
    return { year: state.selectedYear, month: state.selectedMonth };
  }
  function mergedFinancialState(changes = [], deletions = []) {
    const maps = {
      tx: new Map(state.transactions.map((t) => [t.id, t])),
      bills: new Map(state.bills.map((b) => [b.id, b])),
      rules: new Map(state.rules.map((r) => [r.id, r]))
    };
    for (const [entity, item] of changes) {
      maps[entity].set(item.id, item);
    }
    for (const [entity, id] of deletions) {
      maps[entity].delete(id);
    }
    return {
      transactions: [...maps.tx.values()],
      bills: [...maps.bills.values()],
      rules: [...maps.rules.values()]
    };
  }

  // src/js/data/repository.js
  var entities = { tx: STORE.tx, bills: STORE.bills, rules: STORE.rules };
  var mutationQueue = Promise.resolve();
  function enqueueWork(work) {
    const next = mutationQueue.then(work, work);
    mutationQueue = next.catch(() => {
    });
    return next;
  }
  async function loadAccountData() {
    const key = account(), generation = sessionLifecycle.generation;
    const [tx, bills, rules, backups, jobs] = await Promise.all([
      DB.getAll(STORE.tx),
      DB.getAll(STORE.bills),
      DB.getAll(STORE.rules),
      DB.getAll(STORE.backups),
      DB.getAll(STORE.outbox)
    ]);
    if (generation !== sessionLifecycle.generation) {
      return;
    }
    let invalid = 0;
    const read = (list, entity) => list.filter((v) => v.accountKey === key).flatMap((v) => {
      try {
        return [sanitizeEntity(entity, v, key)];
      } catch {
        invalid++;
        return [];
      }
    });
    state.transactions = read(tx, "tx");
    state.bills = read(bills, "bills");
    state.rules = read(rules, "rules");
    state.snapshots = backups.filter((v) => v.accountKey === key).sort((a, b) => b.createdAt - a.createdAt);
    state.pendingCount = jobs.filter((v) => v.accountKey === key).length;
    if (invalid) {
      publish("notice", [
        `${invalid} registro(s) antigo(s) inválido(s) foram preservados no armazenamento, mas não são exibidos.`,
        "warning"
      ]);
    }
  }
  function commitEntities(changes = [], deletions = [], options = {}) {
    const key = account(), generation = sessionLifecycle.generation;
    const task = async () => {
      if (generation !== sessionLifecycle.generation) {
        throw new Error("Sua sessão mudou. Entre novamente para continuar.");
      }
      state.busy++;
      state.saveError = "";
      publish("save:state");
      try {
        const now = Date.now(), puts = [], dels = [];
        for (const [entity, raw] of changes) {
          const item = sanitizeEntity(
            entity,
            { ...raw, updatedAt: now, syncedWithCloud: false },
            key
          );
          const existing = await DB.get(entities[entity], item.id);
          if (existing && existing.accountKey !== key) {
            throw new Error("Este registro pertence a outra conta e não pode ser alterado.");
          }
          puts.push(
            [entities[entity], item],
            [
              STORE.outbox,
              {
                id: `${entity}_${item.id}`,
                recordId: item.id,
                entity,
                kind: "put",
                accountKey: key,
                data: item,
                revision: uid("job"),
                updatedAt: now
              }
            ]
          );
        }
        for (const [entity, id] of deletions) {
          const existing = await DB.get(entities[entity], id);
          if (existing && existing.accountKey !== key) {
            throw new Error("Este registro pertence a outra conta.");
          }
          dels.push([entities[entity], id]);
          puts.push([
            STORE.outbox,
            {
              id: `${entity}_${id}`,
              recordId: id,
              entity,
              kind: "delete",
              accountKey: key,
              revision: uid("job"),
              updatedAt: now
            }
          ]);
        }
        if (options.validateGraph) {
          validateFinancialGraph(
            mergedFinancialState(
              changes.map(([entity, item]) => [entity, sanitizeEntity(entity, item, key)]),
              deletions
            )
          );
        }
        await DB.commit(puts, dels);
        await loadAccountData();
        publish("data:changed");
        if (!options.skipBackup) {
          publish("backup:request");
        }
        publish("sync:request");
      } catch (e) {
        state.saveError = "Falha ao salvar — tente novamente";
        throw e;
      } finally {
        state.busy--;
        publish("save:state");
      }
    };
    return enqueueWork(task);
  }
  async function ensurePlannedBills() {
    if (!state.loggedAccount) {
      return;
    }
    const keys = new Set(state.bills.map((b) => b.id)), occurrences = new Set(
      state.bills.filter((b) => b.ruleId).map(
        (b) => `${b.ruleId}|${b.totalInstallments ? b.installmentNumber : b.sequence || b.dueDate}`
      )
    );
    const horizon = addMonths(isoMonth() + "-01", 12) > addMonths(today(), 12) ? addMonths(isoMonth() + "-01", 12) : addMonths(today(), 12);
    const changes = state.rules.flatMap((r) => buildBills(r, horizon)).filter(
      (b) => !keys.has(b.id) && !occurrences.has(
        `${b.ruleId}|${b.totalInstallments ? b.installmentNumber : b.sequence || b.dueDate}`
      )
    ).map((b) => ["bills", b]);
    if (changes.length) {
      await commitEntities(changes, [], { skipBackup: true });
    }
  }
  function duplicateOf(item, ignoreId = "") {
    return state.transactions.find(
      (t) => t.id !== ignoreId && t.date === item.date && t.type === item.type && Math.round(t.amount * 100) === Math.round(item.amount * 100) && t.description.trim().toLocaleLowerCase("pt-BR") === item.description.trim().toLocaleLowerCase("pt-BR")
    );
  }

  // src/js/infrastructure/credentials.js
  async function sha256Hash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  async function derivePbkdf2Hash(password, saltHex, iterations = 1e5) {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: encoder.encode(saltHex),
        iterations,
        hash: "SHA-256"
      },
      baseKey,
      256
    );
    const hashArray = Array.from(new Uint8Array(derivedBits));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function generateRandomSaltHex(byteLength = 16) {
    const randomBytes = new Uint8Array(byteLength);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  async function passwordMatches(user, password) {
    const hash = user.kdf === "PBKDF2-SHA256" ? await derivePbkdf2Hash(password, `${user.accountKey}::${user.salt}`) : await sha256Hash(`${user.accountKey}::${password}`);
    return hash === user.passwordHash;
  }

  // src/js/infrastructure/deadline.js
  function deadline(promise, ms = 1e4) {
    let timer;
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("A conexão demorou. Seus dados continuam salvos neste aparelho.")),
          ms
        );
      })
    ]).finally(() => clearTimeout(timer));
  }

  // src/js/ui/dom.js
  var $ = (id) => document.getElementById(id);
  var paths = {
    wallet: "M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v11H5a3 3 0 0 1-3-3V6 M20 12h-5v5h5 M17 14.5h.01",
    home: "m3 10 9-7 9 7 M5 9v12h5v-7h4v7h5V9",
    list: "M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01",
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2 M7 14h3M14 14h3M7 18h3",
    chart: "M4 3v18h17M8 16v-5M13 16V6M18 16V9",
    settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12 M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
    "eye-off": "m3 3 18 18 M10 5a11 11 0 0 1 12 7 17 17 0 0 1-3 4M6 6a19 19 0 0 0-4 6s3.5 7 10 7c2 0 4-1 5-2M10 10a3 3 0 0 0 4 4",
    sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5",
    moon: "M21 13A9 9 0 0 1 11 3 9 9 0 1 0 21 13",
    plus: "M12 5v14M5 12h14",
    x: "m6 6 12 12M6 18 18 6",
    "arrow-right": "M4 12h16m-6-6 6 6-6 6",
    "chevron-right": "m9 5 7 7-7 7",
    "chevron-left": "m15 5-7 7 7 7",
    "arrow-up": "M12 20V4m-6 6 6-6 6 6",
    "arrow-down": "M12 4v16m-6-6 6 6 6-6",
    check: "m5 12 4 4L19 6",
    shield: "m12 3 9 4v6c0 5-9 9-9 9s-9-4-9-9V7Z m-4 9 3 3 5-6",
    sparkles: "m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z",
    mic: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8",
    stop: "M6 6h12v12H6Z",
    message: "M21 16a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z M7 8h10M7 12h7",
    edit: "m15 4 5 5M4 20l5-1L21 7l-5-5L4 14Z",
    search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 6 6",
    cloud: "M6 18a5 5 0 0 1-1-10A7 7 0 0 1 18 7a5.5 5.5 0 0 1 0 11H6",
    refresh: "M3 10a9 9 0 0 1 16-5l2 2M21 3v4h-4M21 14a9 9 0 0 1-16 5l-2-2M3 21v-4h4",
    download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
    upload: "M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4",
    trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
    card: "M3 4h18v16H3ZM3 9h18M7 15h3",
    repeat: "m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4M21 13v3a2 2 0 0 1-2 2H3",
    alert: "m12 3 10 18H2ZM12 9v5M12 17h.01",
    clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l4 2",
    bag: "M5 7h14l2 14H3ZM8 9V6a4 4 0 0 1 8 0v3",
    leaf: "M20 3S5 2 4 12s11 12 16-9ZM5 20 16 8",
    undo: "M9 4 3 10l6 6M3 10h11a6 6 0 0 1 0 12"
  };
  function icon(name) {
    return (
      /* HTML */
      `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="${paths[name] || paths.wallet}" />
  </svg>`
    );
  }
  function hydrateIcons(root = document) {
    root.querySelectorAll("[data-icon]").forEach((el) => {
      el.innerHTML = icon(el.dataset.icon);
    });
  }
  function esc(s) {
    return escapeHTML(s);
  }
  function money(n) {
    return state.hideValues ? "R$ ••••" : formatCurrency(n);
  }
  function categoryOptions(type, selected) {
    return CATEGORIES[type].map(
      (c) => (
        /* HTML */
        `<option
          value="${esc(c.name)}"
          ${c.name === normalizeCategory(selected) ? " selected" : ""}
        >
          ${esc(c.name)}
        </option>`
      )
    ).join("");
  }
  function emptyState(name, title, text, action = "", label = "Novo lançamento") {
    return (
      /* HTML */
      `<div class="empty-state">
    <span class="empty-icon">${icon(name)}</span>
    <h3>${esc(title)}</h3>
    <p>${esc(text)}</p>
    ${action ? (
        /* HTML */
        `<button class="button secondary" data-action="${esc(action)}">${icon("plus")}${esc(label)}</button>`
      ) : ""}
  </div>`
    );
  }

  // src/js/ui/feedback.js
  var toastTimer;
  var confirmResolve = null;
  function toast(message, type = "success", action = null) {
    const root = $("toastRegion");
    if (!root) {
      return;
    }
    clearTimeout(toastTimer);
    const opened = [...document.querySelectorAll("dialog[open]")].at(-1);
    (opened || document.body).append(root);
    root.innerHTML = /* HTML */
    `<div
    class="toast ${type}"
    role="${type === "error" ? "alert" : "status"}"
  >
    ${icon(type === "success" ? "check" : "alert")}<span>${esc(message)}</span>${action ? '<button class="text-button" id="toastAction">Desfazer</button>' : ""}<button
      class="icon-button"
      id="toastDismiss"
      aria-label="Fechar aviso"
    >
      ${icon("x")}
    </button>
  </div>`;
    $("toastDismiss").onclick = () => root.replaceChildren();
    if (action) {
      $("toastAction").onclick = async () => {
        root.replaceChildren();
        try {
          await action();
        } catch (e) {
          showError(e);
        }
      };
    }
    toastTimer = setTimeout(() => root.replaceChildren(), action ? 15e3 : 6500);
  }
  function showError(e) {
    console.error(e);
    const message = e?.name === "QuotaExceededError" ? "O armazenamento deste navegador está cheio. Exporte um backup e libere espaço." : e?.message || "Não foi possível concluir. Tente novamente.";
    toast(message, "error");
    if ($("composerDialog").open) {
      $("composerError").textContent = message;
      $("composerError").hidden = false;
    }
  }
  function confirmAction(title, message, button = "Confirmar", danger = false) {
    if (confirmResolve) {
      confirmResolve(false);
    }
    $("confirmTitle").textContent = title;
    $("confirmMessage").textContent = message;
    $("confirmAccept").textContent = button;
    $("confirmAccept").className = "button " + (danger ? "danger" : "primary");
    $("confirmDialog").showModal();
    return new Promise((resolve) => {
      confirmResolve = resolve;
    });
  }
  function finishConfirm(value) {
    const resolve = confirmResolve;
    confirmResolve = null;
    $("confirmDialog").close();
    resolve?.(value);
  }

  // src/js/application/records.js
  function cleanTransaction(raw, key = account()) {
    return sanitizeTransaction(raw, key);
  }
  function cleanRule(raw, key = account()) {
    return sanitizeRule(raw, key);
  }

  // src/js/application/finance.js
  function isBillPaid(bill) {
    return !isCancelled(bill) && Boolean(transactionForBill(bill));
  }
  function balanceValue(totals) {
    return calculateBalance(totals, state.balanceMode);
  }
  function balanceSummary() {
    const cutoff = today(), confirmed = state.transactions.filter((entry) => entry.date <= cutoff), totals = sums(confirmed);
    return {
      total: balanceValue(totals),
      month: balanceValue(sums(monthTransactions())),
      investmentToDate: totals.investment,
      cutoff
    };
  }
  function transactionForBill(bill, transactions = state.transactions) {
    return transactions.find((t) => t.id === (bill.transactionId || txForBill(bill))) || null;
  }
  function reversalsFor(id, transactions = state.transactions) {
    return transactions.filter((t) => t.entryKind === "reversal" && t.relatedTransactionId === id);
  }
  function refundableCents(tx, transactions = state.transactions, ignore = "") {
    return cents(tx.amount) - reversalsFor(tx.id, transactions).filter((t) => t.id !== ignore).reduce((sum, t) => sum + cents(t.amount), 0);
  }
  function billPaidDate(bill) {
    return transactionForBill(bill)?.date || "";
  }
  function billPaidAmount(bill) {
    return transactionForBill(bill)?.amount || 0;
  }
  function isPending(bill) {
    return !isCancelled(bill) && !isBillPaid(bill);
  }
  function reversalRecord(tx, amount, date, note = "") {
    if (tx.entryKind === "reversal") {
      throw new Error("Edite ou exclua o estorno existente para corrigir seu valor.");
    }
    if (!amountOK(amount) || cents(amount) > refundableCents(tx)) {
      throw new Error("O estorno não pode ultrapassar o valor ainda disponível do lançamento.");
    }
    assertDate(date);
    if (date < tx.date) {
      throw new Error("A data do estorno não pode ser anterior ao lançamento original.");
    }
    return cleanTransaction({
      id: uid("rev"),
      type: tx.type,
      category: tx.category,
      amount,
      date,
      description: (note.trim() || "Estorno: " + tx.description).slice(0, 140),
      entryKind: "reversal",
      relatedTransactionId: tx.id,
      createdAt: Date.now()
    });
  }
  function paymentChanges(bill, date, amount = bill.amount) {
    assertDate(date);
    if (!isPending(bill)) {
      throw new Error("Esta parcela não está mais pendente. Atualize a lista.");
    }
    const tx = cleanTransaction({
      id: txForBill(bill),
      type: bill.type,
      category: bill.category,
      amount,
      date,
      description: bill.description + (bill.totalInstallments ? ` (${bill.installmentNumber}/${bill.totalInstallments})` : ""),
      createdAt: Date.now()
    });
    return [
      ["tx", tx],
      [
        "bills",
        {
          ...bill,
          status: "paid",
          transactionId: tx.id,
          paidAt: date,
          settledAmount: amount,
          cancelledAt: ""
        }
      ]
    ];
  }
  function updateLinkedBill(tx, bill) {
    return {
      ...bill,
      status: "paid",
      type: tx.type,
      category: tx.category,
      paidAt: tx.date,
      settledAmount: tx.amount
    };
  }

  // src/js/application/operations.js
  var settlementContext = null;
  var refundContext = null;
  var purchaseContext = null;
  var cancelContext = null;
  function clearOperationError(dialog) {
    const node = dialog.querySelector("[data-operation-error]");
    if (node) {
      node.hidden = true;
      node.textContent = "";
    }
  }
  async function operationSubmit(event, work) {
    event.preventDefault();
    const form = event.currentTarget, button = form.querySelector('button[type="submit"]');
    if (button.disabled) {
      return;
    }
    button.disabled = true;
    clearOperationError(form.closest("dialog"));
    try {
      await work();
    } catch (error) {
      console.error(error);
      const node = form.querySelector("[data-operation-error]");
      if (node) {
        node.textContent = error.message || "Não foi possível salvar.";
        node.hidden = false;
      } else {
        showError(error);
      }
    } finally {
      button.disabled = false;
    }
  }
  function payBill(id) {
    openSettlement([id]);
  }
  function openSettlement(ids, bulk = false) {
    const bills = ids.map((id) => state.bills.find((b) => b.id === id)).filter((b) => b && isPending(b));
    if (!bills.length) {
      toast("Não há parcelas pendentes para pagar.", "warning");
      return;
    }
    settlementContext = { accountKey: account(), ids: bills.map((b) => b.id), bulk };
    $("settlementTitle").textContent = bulk ? "Antecipar parcelas" : bills[0].type === "income" ? "Confirmar recebimento" : "Confirmar pagamento";
    $("settlementDate").value = today();
    $("settlementDate").max = today();
    $("settlementDiscount").value = "0,00";
    $("settlementDiscountField").hidden = !bulk;
    $("settlementItems").innerHTML = bills.map(
      (b) => (
        /* HTML */
        `<label class="operation-item checkbox"
          ><input
            type="checkbox"
            data-settle-id="${esc(b.id)}"
            checked
            ${bulk ? "" : "hidden"}
          /><span
            >${esc(b.description)}${b.totalInstallments ? ` · ${b.installmentNumber}/${b.totalInstallments}` : ""}<small
              >Vencimento: ${formatDateBR(b.dueDate)}</small
            ></span
          ><strong>${money(b.amount)}</strong></label
        >`
      )
    ).join("");
    clearOperationError($("settlementDialog"));
    refreshSettlement();
    $("settlementDialog").showModal();
  }
  function refreshSettlement() {
    const selected = [...$("settlementItems").querySelectorAll("input:checked")].map(
      (input) => state.bills.find((b) => b.id === input.dataset.settleId)
    );
    const total = selected.reduce((s, b) => s + cents(b.amount), 0) / 100, discount = parseAmount($("settlementDiscount").value) || 0;
    $("settlementSummary").textContent = `${selected.length} parcela(s) · original ${money(total)} · pagamento ${money(Math.max(0, total - discount))}`;
  }
  async function saveSettlement() {
    if (!settlementContext || account() !== settlementContext.accountKey) {
      throw new Error("Sua sessão mudou.");
    }
    const ids = [...$("settlementItems").querySelectorAll("input:checked")].map(
      (i) => i.dataset.settleId
    ), bills = ids.map((id) => state.bills.find((b) => b.id === id));
    if (!bills.length || bills.some((b) => !b || !isPending(b))) {
      throw new Error("Escolha parcelas que ainda estejam pendentes.");
    }
    const date = $("settlementDate").value;
    assertDate(date);
    if (date > today()) {
      throw new Error("A data do pagamento não pode estar no futuro.");
    }
    const discount = settlementContext.bulk ? parseAmount($("settlementDiscount").value) : 0, total = bills.reduce((s, b) => s + cents(b.amount), 0) / 100;
    if (!Number.isFinite(discount) || discount < 0) {
      throw new Error("Confira o desconto.");
    }
    const shares = allocatePayment(
      bills.map((b) => b.amount),
      Math.round((total - discount) * 100) / 100
    );
    const changes = bills.flatMap((bill, i) => paymentChanges(bill, date, shares[i]));
    await commitEntities(changes);
    $("settlementDialog").close();
    toast(
      bills.length > 1 ? "Parcelas antecipadas na data escolhida." : "Pagamento registrado na data escolhida."
    );
  }
  async function deleteTransaction(id) {
    const tx = state.transactions.find((t) => t.id === id);
    if (!tx) {
      return;
    }
    const reversals = tx.entryKind === "reversal" ? [] : reversalsFor(id);
    const linked = state.bills.find((b) => b.transactionId === id);
    if (!await confirmAction(
      "Excluir lançamento?",
      `${tx.description}, ${money(tx.amount)}.${reversals.length ? " Os estornos vinculados também serão excluídos." : ""} Você poderá desfazer por alguns instantes.`,
      "Excluir",
      true
    )) {
      return;
    }
    const rule = linked && state.rules.find((r) => r.id === linked.ruleId);
    const changes = linked ? [
      [
        "bills",
        {
          ...linked,
          status: rule?.cancelledAt ? "cancelled" : "pending",
          transactionId: "",
          paidAt: "",
          settledAmount: null
        }
      ]
    ] : [];
    await commitEntities(changes, [["tx", id], ...reversals.map((r) => ["tx", r.id])]);
    $("composerDialog").close();
    const key = account();
    toast("Lançamento excluído.", "success", async () => {
      if (account() !== key) {
        throw new Error("Entre na mesma conta para desfazer.");
      }
      await commitEntities([
        ["tx", tx],
        ...reversals.map((r) => ["tx", r]),
        ...linked ? [["bills", linked]] : []
      ]);
      toast("Lançamento e vínculos recuperados.");
    });
  }
  async function cancelBill(id) {
    const bill = state.bills.find((b) => b.id === id);
    if (!bill) {
      return;
    }
    if (isBillPaid(bill)) {
      openRefund(transactionForBill(bill).id);
      return;
    }
    if (!await confirmAction(
      "Cancelar esta conta?",
      `${bill.description}, vencimento em ${dateLabel(bill.dueDate)}. As demais parcelas serão mantidas.`,
      "Cancelar conta",
      true
    )) {
      return;
    }
    await commitEntities([
      [
        "bills",
        {
          ...bill,
          status: "cancelled",
          transactionId: "",
          paidAt: "",
          settledAmount: null,
          cancelledAt: today()
        }
      ]
    ]);
    const key = account();
    toast("Conta cancelada.", "success", async () => {
      if (account() !== key) {
        throw new Error("Entre na mesma conta para desfazer.");
      }
      await commitEntities([["bills", bill]]);
      toast("Conta recuperada.");
    });
  }
  async function stopRule(id) {
    const rule = state.rules.find((r) => r.id === id);
    if (!rule) {
      return;
    }
    if (!await confirmAction(
      "Encerrar esta recorrência?",
      `As contas pendentes de “${rule.description}” a partir de hoje serão canceladas. O histórico pago e os vencimentos antigos serão mantidos.`,
      "Encerrar",
      true
    )) {
      return;
    }
    const changes = state.bills.filter((b) => b.ruleId === id && isPending(b) && b.dueDate >= today()).map((b) => ["bills", { ...b, status: "cancelled", transactionId: "", cancelledAt: today() }]);
    await commitEntities([["rules", { ...rule, disabledAfter: today() }], ...changes]);
    toast("Recorrência encerrada.");
  }
  function openRefund(id) {
    const tx = state.transactions.find((t) => t.id === id);
    if (!tx || tx.entryKind === "reversal") {
      return;
    }
    const left = refundableCents(tx);
    if (left <= 0) {
      toast("Este lançamento já foi totalmente estornado.", "warning");
      return;
    }
    const bill = state.bills.find((b) => b.transactionId === tx.id), rule = bill && state.rules.find((r) => r.id === bill.ruleId);
    refundContext = {
      accountKey: account(),
      id,
      ruleId: rule?.frequency === "installment" ? rule.id : ""
    };
    $("refundDescription").textContent = `${tx.description} · disponível para estorno: ${money(left / 100)}. O valor será devolvido ao mesmo tipo de movimentação, sem virar uma nova receita.`;
    $("refundAmount").value = amountInput(left / 100);
    $("refundDate").value = today();
    $("refundDate").max = today();
    $("refundNote").value = "";
    $("refundCancelRemaining").checked = false;
    $("refundCancelField").hidden = !rule || rule.frequency !== "installment" || !state.bills.some((b) => b.ruleId === rule.id && isPending(b));
    clearOperationError($("refundDialog"));
    $("refundDialog").showModal();
  }
  async function saveRefund() {
    if (!refundContext || refundContext.accountKey !== account()) {
      throw new Error("Sua sessão mudou.");
    }
    const tx = state.transactions.find((t) => t.id === refundContext.id);
    if (!tx) {
      throw new Error("Lançamento não encontrado.");
    }
    const date = $("refundDate").value;
    if (date > today()) {
      throw new Error("Informe a data em que o estorno aconteceu.");
    }
    const reversal = reversalRecord(
      tx,
      parseAmount($("refundAmount").value),
      date,
      $("refundNote").value
    );
    const changes = [["tx", reversal]];
    if ($("refundCancelRemaining").checked && refundContext.ruleId) {
      const rule = state.rules.find((r) => r.id === refundContext.ruleId);
      changes.push(
        ["rules", { ...rule, cancelledAt: date, disabledAfter: rule.startDate }],
        ...state.bills.filter((b) => b.ruleId === rule.id && isPending(b)).map((b) => ["bills", { ...b, status: "cancelled", cancelledAt: date, transactionId: "" }])
      );
    }
    await commitEntities(changes);
    $("refundDialog").close();
    $("composerDialog").close();
    toast("Estorno registrado, preservando o lançamento original.");
  }
  function openPurchase(id) {
    const rule = state.rules.find((r) => r.id === id);
    if (!rule) {
      return;
    }
    purchaseContext = { accountKey: account(), id };
    clearOperationError($("purchaseDialog"));
    renderPurchase(true);
    if (!$("purchaseDialog").open) {
      $("purchaseDialog").showModal();
    }
  }
  function renderPurchase(reset = false) {
    if (!purchaseContext) {
      return;
    }
    const rule = state.rules.find((r) => r.id === purchaseContext.id);
    if (!rule) {
      return;
    }
    const bills = state.bills.filter((b) => b.ruleId === rule.id).sort(
      (a, b) => a.dueDate.localeCompare(b.dueDate) || a.installmentNumber - b.installmentNumber
    ), pending = bills.filter(isPending), settled = bills.some((b) => isBillPaid(b) || isCancelled(b));
    $("purchaseTitle").textContent = rule.description;
    $("purchaseInfo").textContent = `${rule.frequency === "installment" ? rule.totalInstallments + " parcelas" : "Recorrência mensal"} · ${pending.length} pendente(s), ${money(pending.reduce((s, b) => s + b.amount, 0))}${rule.cancelledAt ? " · programação cancelada" : ""}`;
    if (reset) {
      $("purchaseDescription").value = rule.description;
      $("purchaseCategory").innerHTML = categoryOptions(rule.type, rule.category);
      $("purchaseAmount").value = amountInput(rule.amount);
      $("purchaseCount").value = rule.totalInstallments || 2;
      $("purchaseStart").value = rule.startDate;
    }
    $("purchaseStructure").hidden = rule.frequency !== "installment";
    for (const id of ["purchaseAmount", "purchaseCount", "purchaseStart"]) {
      $(id).disabled = settled || Boolean(rule.cancelledAt);
    }
    $("purchaseEditHint").textContent = settled ? "Para preservar o histórico, ajuste valores e datas individualmente no botão Editar de cada parcela. Descrição e categoria podem ser alteradas para a compra inteira." : "Você pode ajustar o total, a quantidade e o primeiro vencimento antes de pagar ou cancelar parcelas.";
    $("purchaseBills").innerHTML = bills.map(
      (b) => (
        /* HTML */
        `<div class="purchase-bill">
          <div>
            <strong
              >${b.totalInstallments ? `${b.installmentNumber}/${b.totalInstallments} · ` : ""}${formatDateBR(b.dueDate)}</strong
            ><span
              >${isCancelled(b) ? "Cancelada" : isBillPaid(b) ? "Paga em " + formatDateBR(billPaidDate(b)) : "Pendente"}
              · ${money(isBillPaid(b) ? billPaidAmount(b) : b.amount)}</span
            >
          </div>
          <button class="button quiet" type="button" data-action="edit-bill" data-id="${esc(b.id)}">
            Editar
          </button>
        </div>`
      )
    ).join("");
    $("purchaseAdvance").hidden = rule.frequency !== "installment" || !pending.length;
    $("purchaseCancel").disabled = Boolean(rule.cancelledAt) && !pending.length;
  }
  async function savePurchase() {
    const rule = state.rules.find((r) => r.id === purchaseContext?.id);
    if (!rule || purchaseContext.accountKey !== account()) {
      throw new Error("Compra não encontrada.");
    }
    const description = $("purchaseDescription").value.trim();
    if (!description) {
      throw new Error("Informe a descrição da compra.");
    }
    const category = $("purchaseCategory").value, bills = state.bills.filter((b) => b.ruleId === rule.id), changes = [];
    let revised = { ...rule, description, category };
    const canRestructure = rule.frequency === "installment" && !rule.cancelledAt && !bills.some((b) => isBillPaid(b) || isCancelled(b));
    const deletes = [];
    if (canRestructure) {
      revised = cleanRule({
        ...revised,
        amount: parseAmount($("purchaseAmount").value),
        totalInstallments: Number($("purchaseCount").value),
        startDate: $("purchaseStart").value
      });
      const generated = buildBills(revised);
      changes.push(...generated.map((b) => ["bills", b]));
      const ids = new Set(generated.map((b) => b.id));
      deletes.push(...bills.filter((b) => !ids.has(b.id)).map((b) => ["bills", b.id]));
    } else {
      for (const bill of bills) {
        changes.push(["bills", { ...bill, description, category }]);
        const tx = transactionForBill(bill);
        if (tx) {
          changes.push([
            "tx",
            {
              ...tx,
              description: description + (bill.totalInstallments ? ` (${bill.installmentNumber}/${bill.totalInstallments})` : ""),
              category
            }
          ]);
          for (const rev of reversalsFor(tx.id)) {
            changes.push(["tx", { ...rev, category }]);
          }
        }
      }
    }
    await commitEntities([["rules", revised], ...changes], deletes);
    renderPurchase(true);
    toast("Compra atualizada.");
  }
  function openCancelPurchase(id) {
    const rule = state.rules.find((r) => r.id === id);
    if (!rule) {
      return;
    }
    const bills = state.bills.filter((b) => b.ruleId === id), pending = bills.filter(isPending), paid = bills.map((b) => transactionForBill(b)).filter(Boolean);
    const total = paid.reduce((sum, tx) => sum + refundableCents(tx), 0) / 100;
    cancelContext = { accountKey: account(), id };
    $("cancelPurchaseText").textContent = `Cancelar ${pending.length} conta(s) pendente(s) de “${rule.description}”, somando ${money(pending.reduce((sum, b) => sum + b.amount, 0))}. Os pagamentos anteriores continuam no histórico.`;
    $("cancelPurchaseDate").value = today();
    $("cancelPurchaseDate").max = today();
    $("cancelPurchaseRefund").checked = false;
    $("cancelPurchaseRefundField").hidden = total <= 0;
    $("cancelPurchaseRefundLabel").textContent = `Já recebi a devolução dos valores pagos (${money(total)}) e quero registrar os estornos.`;
    clearOperationError($("cancelPurchaseDialog"));
    $("cancelPurchaseDialog").showModal();
  }
  async function cancelPurchase() {
    const rule = state.rules.find((r) => r.id === cancelContext?.id);
    if (!rule || cancelContext.accountKey !== account()) {
      throw new Error("Compra não encontrada.");
    }
    const date = $("cancelPurchaseDate").value;
    assertDate(date);
    if (date > today()) {
      throw new Error("Informe uma data de cancelamento que já aconteceu.");
    }
    const bills = state.bills.filter((b) => b.ruleId === rule.id), changes = [
      ["rules", { ...rule, cancelledAt: date, disabledAfter: rule.startDate }],
      ...bills.filter(isPending).map((b) => [
        "bills",
        {
          ...b,
          status: "cancelled",
          transactionId: "",
          cancelledAt: date,
          paidAt: "",
          settledAmount: null
        }
      ])
    ];
    if ($("cancelPurchaseRefund").checked) {
      for (const bill of bills) {
        const tx = transactionForBill(bill);
        if (tx && refundableCents(tx) > 0) {
          changes.push(["tx", reversalRecord(tx, refundableCents(tx) / 100, date)]);
        }
      }
    }
    await commitEntities(changes);
    $("cancelPurchaseDialog").close();
    renderPurchase();
    toast("Compra cancelada. O histórico foi preservado.");
  }

  // src/js/application/forecast.js
  function projectedBills(endDate) {
    const known = new Set(state.bills.map((b) => b.id)), occurrences = new Set(
      state.bills.filter((b) => b.ruleId).map(
        (b) => b.ruleId + "|" + (b.totalInstallments ? b.installmentNumber : b.sequence || b.dueDate)
      )
    );
    const future = state.rules.flatMap((rule) => buildBills(rule, endDate)).filter(
      (b) => !known.has(b.id) && !occurrences.has(
        b.ruleId + "|" + (b.totalInstallments ? b.installmentNumber : b.sequence || b.dueDate)
      )
    );
    return [...state.bills, ...future];
  }
  function forecastMonths() {
    const now = /* @__PURE__ */ new Date(), start = Math.max(
      monthIndex(now.getFullYear(), now.getMonth()),
      monthIndex(state.selectedYear, state.selectedMonth)
    ), span = state.forecastSpan === 12 ? 12 : 6;
    const end = reportDate(Math.min(monthIndex(2200, 11), start + span - 1)), horizon = formatISO(new Date(end.getFullYear(), end.getMonth() + 1, 0)), bills = projectedBills(horizon);
    return Array.from({ length: Math.min(span, monthIndex(2200, 11) - start + 1) }, (_, i) => {
      const date = reportDate(start + i), prefix = isoMonth(date.getFullYear(), date.getMonth()), realized = sums(state.transactions.filter((t) => t.date.startsWith(prefix))), pending = bills.filter((b) => isPending(b) && b.dueDate.startsWith(prefix));
      const scheduled = pending.reduce(
        (sum, b) => {
          sum[b.type] += b.amount;
          return sum;
        },
        { income: 0, expense: 0, investment: 0 }
      );
      const income = realized.income + scheduled.income, expense = realized.expense + scheduled.expense, investment = realized.investment + scheduled.investment;
      return {
        prefix,
        label: date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
        income,
        expense,
        investment,
        pendingExpense: scheduled.expense,
        installments: pending.filter((b) => b.totalInstallments).reduce((sum, b) => sum + b.amount, 0),
        result: income - expense - (state.balanceMode === "integrated" ? investment : 0)
      };
    });
  }

  // src/js/ui/forecast.js
  function renderForecast() {
    const months = forecastMonths();
    $("forecastSpan").value = String(state.forecastSpan === 12 ? 12 : 6);
    $("forecastCards").innerHTML = months.map(
      (month) => (
        /* HTML */
        `<article class="forecast-card">
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
            <div class="forecast-result ${month.result < 0 ? "negative" : ""}">
              <dt>Resultado do mês</dt>
              <dd>${money(month.result)}</dd>
            </div>
          </dl>
          <p>
            ${month.income === 0 ? "Nenhuma entrada registrada ou programada." : "Inclui movimentações registradas e contas programadas."}
          </p>
        </article>`
      )
    ).join("");
    const overdue = state.bills.filter((b) => isPending(b) && b.dueDate < today() && b.type === "expense").reduce((sum, b) => sum + b.amount, 0);
    $("forecastNote").textContent = "Cada mês é independente, sem somar saldo anterior. A previsão usa apenas o que você registrou ou programou; não estima salário nem gastos ausentes." + (overdue > 0 ? ` Há ${money(overdue)} em atraso, apresentados no mês do vencimento.` : "");
  }

  // src/js/application/editing.js
  function editorPaymentFields() {
    const billId = $("editBillId").value, txId = $("editTransactionId").value, status = $("manualStatus").value, frequency = $("manualFrequency").value;
    const show = !txId && status === "paid" && (Boolean(billId) || frequency !== "once");
    $("manualActualFields").hidden = !show;
    $("manualPaymentDate").required = show;
    $("manualSettledField").hidden = !billId || !show;
    $("manualPaidAmount").required = Boolean(billId) && show;
  }
  function openEditor(id, isBill = false) {
    const item = isBill ? state.bills.find((b) => b.id === id) : state.transactions.find((t) => t.id === id);
    if (!item) {
      return;
    }
    openComposer("manual");
    $("composerTitle").textContent = isBill ? "Editar conta / parcela" : item.entryKind === "reversal" ? "Editar estorno" : "Editar lançamento";
    $("composerTabs").hidden = true;
    $("editTransactionId").value = isBill ? "" : item.id;
    $("editBillId").value = isBill ? item.id : "";
    document.querySelector(`input[name="manualType"][value="${item.type}"]`).checked = true;
    $("manualDescription").value = item.description;
    $("manualAmount").value = amountInput(item.amount);
    $("manualDate").value = isBill ? item.dueDate : item.date;
    $("manualCategory").innerHTML = categoryOptions(item.type, item.category);
    $("scheduleFields").hidden = true;
    $("paymentStatusField").hidden = !isBill;
    $("manualCancelledOption").hidden = !isBill;
    const tx = isBill ? transactionForBill(item) : item, bill = isBill ? item : state.bills.find((b) => b.transactionId === id), rule = bill && state.rules.find((r) => r.id === bill.ruleId);
    if (isBill) {
      $("manualStatus").value = isCancelled(item) ? "cancelled" : isBillPaid(item) ? "paid" : "pending";
      $("manualPaymentDate").value = tx?.date || today();
      $("manualPaidAmount").value = amountInput(tx?.amount || item.amount);
    }
    $("manualSaveButton").innerHTML = icon("check") + "Salvar alterações";
    $("deleteEditedTransaction").hidden = isBill;
    $("amountLabel").textContent = isBill ? "Valor do vencimento (R$)" : "Valor do lançamento (R$)";
    $("dateLabel").textContent = isBill ? "Vencimento" : "Data da movimentação";
    $("amountHelp").textContent = isBill ? "Vencimento e pagamento são datas separadas. Esta edição vale para esta conta." : item.entryKind === "reversal" ? "O estorno mantém vínculo com o original. Você pode corrigir descrição, data e valor." : "As alterações refletem somente no mês da data informada.";
    $("refundEditedTransaction").hidden = !tx || tx.entryKind === "reversal" || refundableCents(tx) <= 0;
    $("refundEditedTransaction").dataset.id = tx?.id || "";
    $("manageEditedPurchase").hidden = !rule;
    $("manageEditedPurchase").dataset.id = rule?.id || "";
    if (!isBill && item.entryKind === "reversal") {
      document.querySelectorAll('input[name="manualType"]').forEach((input) => input.disabled = true);
      $("manualCategory").disabled = true;
    }
    editorPaymentFields();
  }
  function editEntryChanges(previous, item) {
    let revised = cleanTransaction({ ...previous, ...item, createdAt: previous.createdAt });
    const changes = [];
    if (previous.entryKind === "reversal") {
      const original = state.transactions.find((t) => t.id === previous.relatedTransactionId);
      if (!original) {
        throw new Error("O lançamento original deste estorno não foi encontrado.");
      }
      if (cents(revised.amount) > refundableCents(original, state.transactions, previous.id)) {
        throw new Error("O estorno ultrapassa o valor disponível do original.");
      }
      revised = { ...revised, type: original.type, category: original.category };
    } else {
      const refunds = reversalsFor(previous.id);
      if (refunds.reduce((sum, r) => sum + cents(r.amount), 0) > cents(revised.amount)) {
        throw new Error(
          "O valor original não pode ser menor que a soma dos estornos. Corrija os estornos antes."
        );
      }
      changes.push(
        ...refunds.map((r) => ["tx", { ...r, type: revised.type, category: revised.category }])
      );
      const bill = state.bills.find((b) => b.transactionId === revised.id);
      if (bill) {
        changes.push([
          "bills",
          {
            ...updateLinkedBill(revised, bill),
            description: revised.description.replace(/\s+\(\d+\/\d+\)$/, "")
          }
        ]);
      }
    }
    changes.push(["tx", revised]);
    validateFinancialGraph(mergedFinancialState(changes), { entryOnly: true });
    return changes;
  }
  async function saveManual(event) {
    event.preventDefault();
    if ($("manualSaveButton").disabled) {
      return;
    }
    $("manualSaveButton").disabled = true;
    $("composerError").hidden = true;
    try {
      const type = document.querySelector('input[name="manualType"]:checked').value, description = $("manualDescription").value.trim(), amount = parseAmount($("manualAmount").value), date = $("manualDate").value, category = $("manualCategory").value, editTx = $("editTransactionId").value, editBill = $("editBillId").value, frequency = $("manualFrequency").value, status = $("manualStatus").value;
      if (!description || !amountOK(amount) || !isValidDate(date)) {
        throw new Error("Preencha a descrição, uma data válida e um valor maior que zero.");
      }
      const item = {
        id: editTx || uid("tx"),
        description,
        type,
        amount,
        date,
        category,
        createdAt: Date.now()
      };
      if (!editBill && duplicateOf(item, editTx) && !await confirmAction(
        "Possível lançamento repetido",
        "Já existe um lançamento com os mesmos dados. Deseja continuar?",
        "Salvar mesmo assim"
      )) {
        return;
      }
      if (editTx) {
        const previous = state.transactions.find((t) => t.id === editTx);
        if (!previous) {
          throw new Error("Este lançamento não está mais disponível.");
        }
        await commitEntities(editEntryChanges(previous, item));
      } else if (editBill) {
        const previous = state.bills.find((b) => b.id === editBill);
        if (!previous) {
          throw new Error("Esta conta não está mais disponível.");
        }
        const previousTx = transactionForBill(previous), changes = [], deletes = [];
        let bill = { ...previous, description, type, amount, category, dueDate: date, status };
        if (status === "paid") {
          const paymentDate = $("manualPaymentDate").value, paidAmount = parseAmount($("manualPaidAmount").value);
          assertDate(paymentDate);
          if (!amountOK(paidAmount)) {
            throw new Error("Informe o valor efetivamente pago.");
          }
          const tx = cleanTransaction({
            ...previousTx || {},
            id: previousTx?.id || txForBill(previous),
            description: description + (previous.totalInstallments ? ` (${previous.installmentNumber}/${previous.totalInstallments})` : ""),
            type,
            category,
            amount: paidAmount,
            date: paymentDate,
            createdAt: previousTx?.createdAt || Date.now()
          });
          if (previousTx) {
            const edited = editEntryChanges(previousTx, tx);
            changes.push(...edited.filter(([entity]) => entity === "tx"));
          } else {
            changes.push(["tx", tx]);
          }
          bill = {
            ...bill,
            transactionId: tx.id,
            paidAt: paymentDate,
            settledAmount: paidAmount,
            cancelledAt: ""
          };
        } else {
          if (previousTx) {
            if (!await confirmAction(
              "Alterar a situação do pagamento?",
              `O lançamento de ${money(previousTx.amount)} e seus estornos serão removidos para deixar a conta ${status === "cancelled" ? "cancelada" : "pendente"}.`,
              "Confirmar alteração"
            )) {
              return;
            }
            deletes.push(
              ["tx", previousTx.id],
              ...reversalsFor(previousTx.id).map((r) => ["tx", r.id])
            );
          }
          bill = {
            ...bill,
            transactionId: "",
            paidAt: "",
            settledAmount: null,
            cancelledAt: status === "cancelled" ? today() : ""
          };
        }
        changes.push(["bills", bill]);
        await commitEntities(changes, deletes);
      } else if (frequency !== "once") {
        if (type !== "expense" && frequency === "installment") {
          throw new Error("Use parcelamento para uma despesa.");
        }
        if (state.rules.some(
          (r) => !r.disabledAfter && !r.cancelledAt && r.description.toLowerCase() === description.toLowerCase() && r.amount === amount && r.startDate === date
        ) && !await confirmAction(
          "Programação semelhante",
          "Já existe uma programação com os mesmos dados. Deseja criar outra?",
          "Criar outra"
        )) {
          return;
        }
        const rule = cleanRule({
          id: uid("rule"),
          description,
          type,
          amount,
          category,
          startDate: date,
          frequency,
          totalInstallments: frequency === "installment" ? Number($("manualInstallments").value) : 0,
          cardName: frequency === "installment" ? $("manualCardName").value.trim() : ""
        });
        const horizon = addMonths(date, 12) > addMonths(today(), 12) ? addMonths(date, 12) : addMonths(today(), 12), bills = buildBills(rule, horizon), changes = [["rules", rule], ...bills.map((b) => ["bills", b])];
        if (status === "paid" && bills.length) {
          changes.push(...paymentChanges(bills[0], $("manualPaymentDate").value));
        }
        await commitEntities(changes);
      } else if (status === "pending") {
        await commitEntities([
          [
            "bills",
            {
              id: uid("bill"),
              description,
              type,
              amount,
              category,
              dueDate: date,
              status: "pending",
              createdAt: Date.now()
            }
          ]
        ]);
      } else {
        await commitEntities([["tx", item]]);
      }
      $("composerDialog").close();
      toast(
        editTx || editBill ? "Alterações salvas, com os vínculos preservados." : frequency !== "once" ? "Programação criada." : "Lançamento registrado."
      );
    } catch (error) {
      showError(error);
    } finally {
      $("manualSaveButton").disabled = false;
    }
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

  // src/js/application/installments.js
  function parseGeneralInput2(text) {
    return parseGeneralInput(text, selectedPeriod());
  }
  function installmentDraftPlan(item, ruleId = "plan_" + item.id) {
    if (!Number.isInteger(item.installments) || item.installments < 2 || item.installments > 120) {
      throw new Error("Informe de 2 a 120 parcelas.");
    }
    const rule = cleanRule({
      id: ruleId,
      description: item.description,
      amount: item.amount,
      startDate: item.date,
      type: "expense",
      category: item.category,
      frequency: "installment",
      totalInstallments: item.installments,
      cardName: item.cardName
    });
    return { rule, bills: buildBills(rule) };
  }

  // src/js/ui/installments.js
  function installmentSummaryHTML(item) {
    try {
      const { bills } = installmentDraftPlan(item);
      const first = bills[0], last = bills.at(-1), equal = bills.every((b) => b.amount === first.amount);
      return (
        /* HTML */
        `<div class="installment-total">
        <span>${item.installments} parcelas · total ${money(item.amount)}</span
        ><strong
          >${equal ? `${item.installments} × ${money(first.amount)}` : `Parcelas de ${money(last.amount)} a ${money(first.amount)}`}</strong
        >
      </div>
      <p class="field-hint">
        Primeiro vencimento em ${formatDateBR(first.dueDate)}.
        ${item.firstPaid ? "A primeira parcela será registrada como paga." : "As parcelas ficam pendentes; o total não será descontado de uma só vez."}
      </p>
      <details class="installment-details">
        <summary>Conferir as ${bills.length} parcelas</summary>
        <ol>
          ${bills.map((b) => (
          /* HTML */
          `<li><span>${b.installmentNumber}/${b.totalInstallments} · ${formatDateBR(b.dueDate)}</span><strong>${money(b.amount)}</strong></li>`
        )).join("")}
        </ol>
      </details>`
      );
    } catch {
      return '<p class="field-hint">Preencha o total, a quantidade de parcelas e o primeiro vencimento para conferir a divisão.</p>';
    }
  }
  function renderInstallmentCard(item, index) {
    return (
      /* HTML */
      `<div
    class="draft-card installment-draft"
    data-draft-id="${esc(item.id)}"
    data-draft-kind="installment"
  >
    <div class="draft-header">
      <strong>${icon("card")} Compra parcelada ${index + 1}</strong
      ><button
        class="icon-button"
        data-action="remove-draft"
        data-id="${esc(item.id)}"
        aria-label="Remover compra ${index + 1}"
      >
        ${icon("x")}
      </button>
    </div>
    <input type="hidden" data-draft-field="type" value="expense" /><label
      >O que você comprou?<input
        data-draft-field="description"
        maxlength="140"
        required
        value="${esc(item.description)}"
    /></label>
    <div class="form-grid">
      <label
        >Valor total (R$)<input
          data-draft-field="amount"
          inputmode="decimal"
          required
          value="${amountInput(item.amount)}" /></label
      ><label
        >Parcelas<input
          data-draft-field="installments"
          type="number"
          min="2"
          max="120"
          required
          value="${item.installments}"
      /></label>
    </div>
    <div class="form-grid">
      <label
        >Primeiro vencimento<input
          data-draft-field="date"
          type="date"
          required
          min="1900-01-01"
          max="2200-12-31"
          value="${esc(item.date)}" /></label
      ><label
        >Categoria<select data-draft-field="category">
          ${categoryOptions("expense", item.category)}
        </select></label
      >
    </div>
    <label
      >Cartão (opcional)<input
        data-draft-field="cardName"
        maxlength="60"
        placeholder="Ex.: Nubank, Itaú"
        value="${esc(item.cardName || "")}" /></label
    ><label class="checkbox"
      ><input data-draft-field="firstPaid" type="checkbox" ${item.firstPaid ? "checked" : ""} />A
      primeira parcela já foi paga</label
    ><label data-first-paid-date-wrap ${item.firstPaid ? "" : "hidden"}
      >Data do primeiro pagamento<input
        data-draft-field="firstPaidDate"
        type="date"
        min="1900-01-01"
        max="${today()}"
        value="${esc(item.firstPaidDate || today())}"
    /></label>
    <div data-installment-summary class="installment-summary">${installmentSummaryHTML(item)}</div>
  </div>`
    );
  }
  function refreshInstallmentSummary(card) {
    const get = (field) => card.querySelector(`[data-draft-field="${field}"]`);
    const item = {
      id: card.dataset.draftId,
      kind: "installment",
      type: "expense",
      description: get("description").value || "Compra parcelada",
      amount: parseAmount(get("amount").value),
      date: get("date").value,
      category: get("category").value,
      installments: Number(get("installments").value),
      cardName: get("cardName").value,
      firstPaid: get("firstPaid").checked
    };
    card.querySelector("[data-first-paid-date-wrap]").hidden = !item.firstPaid;
    card.querySelector("[data-installment-summary]").innerHTML = installmentSummaryHTML(item);
  }

  // src/js/ui/theme.js
  var themeMedia = window.matchMedia?.("(prefers-color-scheme: dark)");
  function applyTheme(preference) {
    state.themePreference = preference;
    const effective = preference === "auto" ? themeMedia?.matches ? "dark" : "light" : preference;
    document.documentElement.dataset.theme = effective;
    document.documentElement.setAttribute("data-bs-theme", effective);
    $("themeSelect").value = preference;
    $("themeButton").innerHTML = icon(effective === "dark" ? "moon" : "sun");
    $("authThemeButton").innerHTML = icon(effective === "dark" ? "moon" : "sun");
  }
  async function savePreference() {
    const key = state.loggedAccount ? "prefs_" + account() : "guestPreferences";
    await DB.put(STORE.session, {
      key,
      theme: state.themePreference,
      balance: state.balanceMode,
      hide: state.hideValues,
      lastExport: state.lastExport
    });
  }
  async function cycleTheme() {
    const order = ["auto", "light", "dark"];
    applyTheme(order[(order.indexOf(state.themePreference) + 1) % 3]);
    await savePreference();
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
  function speechErrorMessage(code) {
    return messages[code] || "Não foi possível reconhecer o áudio. Tente novamente ou digite o lançamento.";
  }

  // src/js/ui/voice.js
  var Voice = {
    recognition: null,
    setupVoiceRecognition(onToastCallback) {
      this.recognition = createSpeechRecognition();
      const btnMic = document.getElementById("btnMic");
      const micIcon = document.getElementById("micIcon");
      const banner = document.getElementById("recordingBanner");
      const btnStopBanner = document.getElementById("btnStopVoiceBanner");
      const inputEl = document.getElementById("commandInput");
      if (!this.recognition) {
        btnMic.addEventListener("click", () => {
          onToastCallback(
            "Seu navegador não suporta ditado por voz. Digite no campo de texto!",
            "warning"
          );
        });
        return;
      }
      this.submitVoiceOnEnd = false;
      this.hasVoiceTranscript = false;
      this.recognition.onstart = () => {
        state.isRecording = true;
        this.submitVoiceOnEnd = true;
        this.hasVoiceTranscript = false;
        btnMic.classList.add("recording");
        micIcon.innerHTML = icon("stop");
        document.getElementById("micButtonLabel").textContent = "Parar e conferir";
        banner.hidden = false;
      };
      this.recognition.onresult = (event) => {
        const transcript = speechTranscript(event);
        this.hasVoiceTranscript = Boolean(transcript.trim());
        inputEl.value = transcript;
      };
      this.recognition.onerror = (event) => {
        this.submitVoiceOnEnd = false;
        this.stopVoiceRecording(false);
        if (event.error !== "aborted") {
          onToastCallback(speechErrorMessage(event.error), "warning");
        }
      };
      this.recognition.onend = () => {
        const shouldSubmit = this.submitVoiceOnEnd && this.hasVoiceTranscript;
        this.submitVoiceOnEnd = false;
        this.stopVoiceRecording(false);
        if (shouldSubmit && inputEl.value.trim() && document.getElementById("composerDialog").open) {
          document.getElementById("commandForm").requestSubmit();
        }
      };
      btnMic.addEventListener("click", () => {
        if (state.isRecording) {
          this.stopVoiceRecording(true, true);
        } else {
          try {
            inputEl.value = "";
            this.hasVoiceTranscript = false;
            this.recognition.start();
          } catch (err) {
            console.error(err);
            this.submitVoiceOnEnd = false;
            this.stopVoiceRecording(false);
            onToastCallback(
              "Não foi possível iniciar o microfone. Verifique a permissão e tente novamente.",
              "warning"
            );
          }
        }
      });
      if (btnStopBanner) {
        btnStopBanner.addEventListener("click", () => {
          this.stopVoiceRecording(true, true);
        });
      }
    },
    stopVoiceRecording(shouldStopEngine = true, submitOnEnd = false) {
      if (shouldStopEngine) {
        this.submitVoiceOnEnd = submitOnEnd;
      }
      state.isRecording = false;
      const btnMic = document.getElementById("btnMic");
      const micIcon = document.getElementById("micIcon");
      const banner = document.getElementById("recordingBanner");
      if (btnMic) {
        btnMic.classList.remove("recording");
      }
      if (micIcon) {
        micIcon.innerHTML = icon("mic");
      }
      if (document.getElementById("micButtonLabel")) {
        document.getElementById("micButtonLabel").textContent = "Usar microfone";
      }
      if (banner) {
        banner.hidden = true;
      }
      if (shouldStopEngine && this.recognition) {
        try {
          this.recognition.stop();
        } catch {
        }
      }
    }
  };

  // src/js/ui/composer.js
  function setComposerTab(tab) {
    Voice.stopVoiceRecording(true, false);
    state.inputSource = "text";
    $("manualForm").hidden = tab !== "manual";
    $("assistantPane").hidden = tab === "manual";
    document.querySelectorAll("[data-compose]").forEach((b) => {
      const on = b.dataset.compose === tab;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    $("composerHelp").textContent = "Digite ou use o microfone para contar o que aconteceu. Confira antes de salvar.";
  }
  function openComposer(mode = "text", bill = false) {
    account();
    $("composerError").hidden = true;
    $("composerTitle").textContent = bill ? "Agendar uma conta" : "Novo lançamento";
    $("editTransactionId").value = "";
    $("editBillId").value = "";
    $("manualForm").reset();
    document.querySelectorAll('input[name="manualType"]').forEach((input) => input.disabled = false);
    $("manualCategory").disabled = false;
    $("manualCancelledOption").hidden = true;
    $("refundEditedTransaction").hidden = true;
    $("manageEditedPurchase").hidden = true;
    $("manualPaymentDate").value = today();
    $("manualDate").value = formatISO(
      getSafeDateForSelectedMonth(state.selectedYear, state.selectedMonth)
    );
    $("manualCategory").innerHTML = categoryOptions("expense");
    $("scheduleFields").hidden = false;
    $("paymentStatusField").hidden = false;
    $("composerTabs").hidden = false;
    $("deleteEditedTransaction").hidden = true;
    $("manualDuplicateWarning").hidden = true;
    $("manualStatus").value = bill ? "pending" : "paid";
    $("manualSaveButton").innerHTML = icon("check") + (bill ? "Agendar conta" : "Salvar lançamento");
    updateScheduleFields();
    setComposerTab(bill ? "manual" : mode);
    if (!$("composerDialog").open) {
      $("composerDialog").showModal();
    }
    $(bill || mode === "manual" ? "manualDescription" : "commandInput").focus();
  }
  function updateScheduleFields() {
    const freq = $("manualFrequency").value, installment = freq === "installment";
    $("installmentField").hidden = !installment;
    $("manualCardField").hidden = !installment;
    $("manualInstallments").required = installment;
    $("scheduleHint").hidden = freq === "once";
    $("amountLabel").textContent = installment ? "Valor total da compra (R$)" : "Valor (R$)";
    $("dateLabel").textContent = freq === "once" ? "Data" : "Primeiro vencimento";
    const amount = parseAmount($("manualAmount").value), n = Number($("manualInstallments").value);
    $("scheduleHint").textContent = installment ? amountOK(amount) && Number.isInteger(n) && n >= 2 ? `${n} parcelas de aproximadamente ${money(amount / n)}. Os centavos serão distribuídos para manter o total exato.` : "Informe o valor total da compra e o número de parcelas, de 2 a 120." : "Uma conta será criada a cada mês. Você poderá encerrar a recorrência quando quiser. Datas no fim do mês são ajustadas para o último dia disponível.";
    editorPaymentFields();
    $("amountHelp").textContent = installment ? "Informe o total, e não o valor de uma parcela." : "Use vírgula para os centavos.";
  }
  async function prepareDraft(event) {
    event.preventDefault();
    if (state.isSubmittingCommand || state.busy) {
      return;
    }
    const text = $("commandInput").value.trim();
    if (!text) {
      $("commandInput").focus();
      return;
    }
    Voice.stopVoiceRecording(true, false);
    $("composerError").hidden = true;
    const items = parseGeneralInput2(text);
    if (!items.length) {
      $("composerError").textContent = "Não identifiquei um valor. Experimente “Gastei 60 no mercado”.";
      $("composerError").hidden = false;
      return;
    }
    if (items.length > 30) {
      $("composerError").textContent = "Envie até 30 lançamentos por vez para conferir com calma.";
      $("composerError").hidden = false;
      return;
    }
    state.draftItems = items;
    $("previewSource").textContent = state.inputSource === "voice" ? "Por voz" : "Por texto";
    renderDraft();
    $("previewPanel").hidden = false;
    $("previewPanel").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  function renderDraft() {
    $("draftList").innerHTML = state.draftItems.map(
      (item, index) => item.kind === "installment" ? renderInstallmentCard(item, index) : (
        /* HTML */
        `<div class="draft-card" data-draft-id="${esc(item.id)}">
            <div class="draft-header">
              <strong>Lançamento ${index + 1}</strong
              ><button
                class="icon-button"
                data-action="remove-draft"
                data-id="${esc(item.id)}"
                aria-label="Remover lançamento ${index + 1}"
              >
                ${icon("x")}
              </button>
            </div>
            <label
              >Descrição<input
                data-draft-field="description"
                maxlength="140"
                required
                value="${esc(item.description)}"
            /></label>
            <div class="form-grid">
              <label
                >Valor (R$)<input
                  data-draft-field="amount"
                  inputmode="decimal"
                  required
                  value="${amountInput(item.amount)}" /></label
              ><label
                >Data<input data-draft-field="date" type="date" required value="${esc(item.date)}"
              /></label>
            </div>
            <div class="form-grid">
              <label
                >Tipo<select data-draft-field="type">
                  <option value="expense" ${item.type === "expense" ? "selected" : ""}>
                    Despesa
                  </option>
                  <option value="income" ${item.type === "income" ? "selected" : ""}>
                    Receita
                  </option>
                  <option value="investment" ${item.type === "investment" ? "selected" : ""}>
                    Investimento
                  </option>
                </select></label
              ><label
                >Categoria<select data-draft-field="category">
                  ${categoryOptions(item.type, item.category)}
                </select></label
              >
            </div>
            ${duplicateOf(item) ? '<p class="duplicate-warning">Já existe um lançamento com os mesmos dados. Confira se é uma repetição.</p>' : ""}
          </div>`
      )
    ).join("");
    $("confirmPreview").innerHTML = icon("check") + (state.draftItems.length > 1 ? `Confirmar ${state.draftItems.length} registros` : state.draftItems[0]?.kind === "installment" ? "Confirmar parcelamento" : "Confirmar lançamento");
  }
  function readDraft() {
    return [...document.querySelectorAll("[data-draft-id]")].map((card) => {
      const get = (field) => card.querySelector(`[data-draft-field="${field}"]`).value;
      if (!get("description").trim()) {
        throw new Error("Preencha a descrição de cada lançamento.");
      }
      const item = cleanTransaction({
        id: card.dataset.draftId,
        description: get("description").trim(),
        amount: parseAmount(get("amount")),
        type: get("type"),
        category: get("category"),
        date: get("date"),
        createdAt: Date.now()
      });
      if (card.dataset.draftKind === "installment") {
        item.kind = "installment";
        item.installments = Number(get("installments"));
        item.cardName = get("cardName").trim().slice(0, 60);
        item.firstPaid = card.querySelector('[data-draft-field="firstPaid"]').checked;
        item.firstPaidDate = get("firstPaidDate");
        if (item.firstPaid) {
          assertDate(item.firstPaidDate);
        }
        installmentDraftPlan(item);
      }
      return item;
    });
  }
  async function confirmDraft() {
    if (state.isSubmittingCommand || !state.draftItems.length) {
      return;
    }
    state.isSubmittingCommand = true;
    $("confirmPreview").disabled = true;
    $("composerError").hidden = true;
    try {
      const items = readDraft();
      const fingerprints = /* @__PURE__ */ new Set();
      let duplicate = false;
      for (const item of items) {
        const key = [
          item.description.trim().toLowerCase(),
          item.type,
          item.amount,
          item.date,
          item.kind || "tx",
          item.installments || 0
        ].join("|");
        const match = item.kind === "installment" ? state.rules.some(
          (r) => r.frequency === "installment" && r.description.toLowerCase() === item.description.toLowerCase() && r.amount === item.amount && r.startDate === item.date && r.totalInstallments === item.installments
        ) : duplicateOf(item);
        if (fingerprints.has(key) || match) {
          duplicate = true;
        }
        fingerprints.add(key);
      }
      if (duplicate && !await confirmAction(
        "Há um possível lançamento repetido",
        "Encontramos descrição, valor, tipo e data iguais. Deseja salvar mesmo assim?",
        "Salvar mesmo assim"
      )) {
        return;
      }
      const changes = [];
      for (const item of items) {
        if (item.kind !== "installment") {
          changes.push(["tx", item]);
          continue;
        }
        const { rule, bills } = installmentDraftPlan(item, uid("rule"));
        changes.push(["rules", rule], ...bills.map((b) => ["bills", b]));
        if (item.firstPaid) {
          changes.push(...paymentChanges(bills[0], item.firstPaidDate || today()));
        }
      }
      await commitEntities(changes);
      state.lastAddedIds = changes.filter(([entity]) => entity === "tx").map(([, t]) => t.id);
      const parcelCount = items.filter((i) => i.kind === "installment").reduce((sum, i) => sum + i.installments, 0);
      state.draftItems = [];
      $("commandInput").value = "";
      $("previewPanel").hidden = true;
      $("draftList").replaceChildren();
      $("composerDialog").close();
      toast(
        parcelCount ? `Compra(s) confirmada(s). ${parcelCount} parcelas organizadas em Contas.` : `${items.length} lançamento(s) confirmado(s).`
      );
    } catch (e) {
      showError(e);
    } finally {
      state.isSubmittingCommand = false;
      $("confirmPreview").disabled = false;
    }
  }
  function download(content, name, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    const parent = [...document.querySelectorAll("dialog[open]")].at(-1) || document.body;
    parent.append(link);
    link.click();
    setTimeout(() => {
      link.remove();
      URL.revokeObjectURL(url);
    }, 3e4);
  }
  async function exportBackup() {
    download(
      JSON.stringify(backupPayload(), null, 2),
      `financas-backup-${today()}.json`,
      "application/json;charset=utf-8"
    );
    state.lastExport = Date.now();
    await savePreference();
    renderSettings();
    toast("Backup preparado para download.");
  }
  function exportCSV() {
    const header = [
      "Data",
      "Tipo",
      "Categoria",
      "Descricao",
      "Valor",
      "Natureza",
      "LancamentoOriginal"
    ];
    const rows = [...state.transactions].sort((a, b) => a.date.localeCompare(b.date)).map(
      (t) => [
        t.date,
        { income: "Receita", expense: "Despesa", investment: "Investimento" }[t.type],
        t.category,
        t.description,
        amountInput(entryAmount(t)),
        t.entryKind === "reversal" ? "Estorno" : "Lançamento",
        t.relatedTransactionId || ""
      ].map((v) => sanitizeCSVCell(v)).join(";")
    );
    download(
      "\uFEFF" + [header.join(";"), ...rows].join("\r\n"),
      `financas-extrato-${today()}.csv`,
      "text/csv;charset=utf-8"
    );
    toast("Extrato preparado para download.");
  }

  // src/js/ui/reports.js
  function reportBounds() {
    const span = state.reportSpan === 12 ? 12 : 6;
    const selected = monthIndex(state.selectedYear, state.selectedMonth);
    const end = Math.max(
      monthIndex(1900, span - 1),
      Math.min(monthIndex(2200, 11), state.reportWindowEnd ?? selected)
    );
    state.reportWindowEnd = end;
    return { start: end - span + 1, end, span };
  }
  function alignReportWindow() {
    const selected = monthIndex(state.selectedYear, state.selectedMonth), range = reportBounds();
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
      const date = reportDate(start + i), year = date.getFullYear(), month = date.getMonth(), prefix = isoMonth(year, month);
      const amounts = sums(state.transactions.filter((t) => t.date.startsWith(prefix)));
      return {
        year,
        month,
        prefix,
        name: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        full: date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
        ...amounts,
        balance: amounts.income - amounts.expense - (state.balanceMode === "integrated" ? amounts.investment : 0)
      };
    });
  }
  async function shiftReportPeriod(direction) {
    const { start, end, span } = reportBounds(), offset = monthIndex(state.selectedYear, state.selectedMonth) - start;
    state.reportWindowEnd = Math.max(
      monthIndex(1900, span - 1),
      Math.min(monthIndex(2200, 11), end + direction * span)
    );
    const next = reportBounds();
    await changeMonth(0, reportDate(next.start + Math.max(0, Math.min(span - 1, offset))), {
      keepReportWindow: true
    });
  }
  async function resetReportPeriod() {
    state.reportWindowEnd = monthIndex((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth());
    await changeMonth(0, /* @__PURE__ */ new Date(), { keepReportWindow: true });
  }
  function renderReports() {
    const month = monthTransactions(), current = sums(month), previous = sums(monthTransactions(-1));
    const difference = current.expense - previous.expense;
    const categories = Object.entries(
      month.filter((t) => t.type === "expense").reduce((a, t) => {
        a[t.category] = (a[t.category] || 0) + entryAmount(t);
        return a;
      }, {})
    ).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]);
    const compare = !current.expense && !previous.expense ? "Os gastos dos dois meses aparecerão aqui quando você começar a registrar." : !previous.expense ? `Você registrou ${money(current.expense)} em despesas. O mês anterior ainda não tem gastos para comparar.` : Math.abs(difference) < 5e-3 ? "Seus gastos foram iguais aos do mês anterior." : `Você gastou ${money(Math.abs(difference))} ${difference > 0 ? "a mais" : "a menos"} que no mês anterior${state.hideValues ? "" : ` (${Math.round(Math.abs(difference) / previous.expense * 100)}%)`}.`;
    const balance = current.income - current.expense - (state.balanceMode === "integrated" ? current.investment : 0);
    const insights = [
      ["chart", "Em relação ao mês anterior", compare],
      [
        "bag",
        categories.length ? "Sua maior categoria de gasto" : "Conheça seus gastos",
        categories.length ? `${categories[0][0]} concentrou ${money(categories[0][1])} das despesas deste mês.` : "Classifique seus lançamentos para descobrir para onde o dinheiro vai."
      ],
      [
        "leaf",
        "Espaço para o futuro",
        `Seu saldo do mês é ${money(balance)}. Os aportes do mês somam ${money(current.investment)}${state.balanceMode === "independent" ? " e estão separados desse saldo" : ""}.`
      ]
    ];
    $("reportInsights").innerHTML = insights.map(
      ([name, title, text]) => (
        /* HTML */
        `<article class="insight-card">
          ${icon(name)}
          <h3>${esc(title)}</h3>
          <p>${esc(text)}</p>
        </article>`
      )
    ).join("");
    const { start, end, span } = reportBounds(), trend = reportTrend(), rangeLabel = trend[0].full + " a " + trend.at(-1).full;
    $("reportRangeLabel").textContent = trend[0].name + "/" + trend[0].year + " — " + trend.at(-1).name + "/" + trend.at(-1).year;
    $("reportRangeLabel").setAttribute("aria-label", rangeLabel);
    $("reportSpan").value = String(span);
    const now = monthIndex((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth());
    $("reportEyebrow").textContent = end === now ? span === 6 ? "OS ÚLTIMOS SEIS MESES" : "OS ÚLTIMOS DOZE MESES" : "PERÍODO EM ANÁLISE";
    $("reportPrev").disabled = start <= monthIndex(1900, 0);
    $("reportNext").disabled = end >= monthIndex(2200, 11);
    const totals = trend.reduce(
      (sum, t) => ({
        income: sum.income + t.income,
        expense: sum.expense + t.expense,
        investment: sum.investment + t.investment,
        balance: sum.balance + t.balance
      }),
      { income: 0, expense: 0, investment: 0, balance: 0 }
    );
    $("reportPeriodTotals").innerHTML = [
      ["income", "Receitas no período", totals.income],
      ["expense", "Despesas no período", totals.expense],
      ["investment", "Investimentos", totals.investment],
      ["balance", "Saldo do período", totals.balance]
    ].map(
      ([cls, label, amount]) => (
        /* HTML */
        `<div class="report-total ${cls}">
          <span>${label}</span><strong class="money">${money(amount)}</strong>
        </div>`
      )
    ).join("");
    const max = Math.max(
      1,
      ...trend.flatMap((t) => [Math.abs(t.income), Math.abs(t.expense), Math.abs(t.investment)])
    ), hasNegative = trend.some((t) => t.income < 0 || t.expense < 0 || t.investment < 0);
    $("trendChart").style.gridTemplateColumns = `repeat(${span},minmax(0,1fr))`;
    $("trendChart").classList.toggle("twelve-months", span === 12);
    $("trendChart").innerHTML = trend.map((t) => {
      const selected = t.year === state.selectedYear && t.month === state.selectedMonth;
      return (
        /* HTML */
        `<button
        class="chart-month ${selected ? "selected" : ""}"
        data-action="chart-month"
        data-year="${t.year}"
        data-month="${t.month}"
        aria-pressed="${selected}"
        aria-label="${esc(t.full)}, receitas ${money(t.income)}, despesas ${money(t.expense)}, investimentos ${money(t.investment)}"
      >
        <span class="chart-bars ${hasNegative ? "diverging" : ""}" aria-hidden="true"
          ><span
            class="bar income ${t.income < 0 ? "negative" : ""}"
            style="height:${t.income ? Math.max(1, Math.round(Math.abs(t.income) / max * (hasNegative ? 50 : 100))) : 0}%"
          ></span
          ><span
            class="bar expense ${t.expense < 0 ? "negative" : ""}"
            style="height:${t.expense ? Math.max(1, Math.round(Math.abs(t.expense) / max * (hasNegative ? 50 : 100))) : 0}%"
          ></span
          ><span
            class="bar investment ${t.investment < 0 ? "negative" : ""}"
            style="height:${t.investment ? Math.max(1, Math.round(Math.abs(t.investment) / max * (hasNegative ? 50 : 100))) : 0}%"
          ></span></span
        ><strong>${esc(t.name)}</strong><span>${t.year}</span>
      </button>`
      );
    }).join("");
    const selectedLabel = new Date(state.selectedYear, state.selectedMonth, 1).toLocaleDateString(
      "pt-BR",
      { month: "long", year: "numeric" }
    );
    $("reportSelection").innerHTML = /* HTML */
    `<strong>${esc(selectedLabel)}</strong
    ><span>Receitas <b class="money">${money(current.income)}</b></span
    ><span>Despesas <b class="money">${money(current.expense)}</b></span
    ><span>Aportes <b class="money">${money(current.investment)}</b></span
    ><span>Saldo <b class="money">${money(balance)}</b></span>`;
    $("trendTable").innerHTML = /* HTML */
    `<table>
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
      ${trend.map(
      (t) => (
        /* HTML */
        `<tr
              class="${t.year === state.selectedYear && t.month === state.selectedMonth ? "selected-row" : ""}"
            >
              <th scope="row">${esc(t.full)}</th>
              <td>${money(t.income)}</td>
              <td>${money(t.expense)}</td>
              <td>${money(t.investment)}</td>
              <td>${money(t.balance)}</td>
            </tr>`
      )
    ).join("")}
    </tbody>
  </table>`;
    renderBreakdown(
      "expense",
      month.filter((t) => t.type === "expense"),
      current.expense,
      "expenseBreakdownList",
      "panelExpenseTotalBadge"
    );
    renderBreakdown(
      "investment",
      month.filter((t) => t.type === "investment"),
      current.investment,
      "investBreakdownList",
      "panelInvestTotalBadge"
    );
  }
  function exportReportCSV() {
    const trend = reportTrend(), headers = ["Mes", "Receitas", "Despesas", "Investimentos", "Saldo"];
    const rows = trend.map(
      (t) => [
        t.prefix,
        amountInput(t.income),
        amountInput(t.expense),
        amountInput(t.investment),
        amountInput(t.balance)
      ].map((value) => sanitizeCSVCell(value)).join(";")
    );
    download(
      "\uFEFF" + [headers.join(";"), ...rows].join("\r\n"),
      `financas-relatorio-${trend[0].prefix}-a-${trend.at(-1).prefix}.csv`,
      "text/csv;charset=utf-8"
    );
    toast("Relatório do período preparado para download.");
  }

  // src/js/ui/views.js
  var viewInfo = {
    inicio: ["Visão geral", "Um olhar tranquilo para as suas finanças."],
    lancamentos: ["Lançamentos", "Tudo o que entrou, saiu ou foi investido."],
    contas: ["Suas próximas contas", "Organize vencimentos, mensalidades e parcelas."],
    relatorios: ["Seu dinheiro em perspectiva", "Entenda os movimentos e acompanhe sua evolução."]
  };
  function setView(view, focus = true) {
    state.view = viewInfo[view] ? view : "inicio";
    for (const key of Object.keys(viewInfo)) {
      $("view-" + key).hidden = key !== state.view;
    }
    document.querySelectorAll("[data-view]").forEach((link) => {
      const on = link.dataset.view === state.view;
      link.classList.toggle("active", on);
      if (on) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
    $("pageTitle").textContent = viewInfo[state.view][0];
    $("pageSubtitle").textContent = viewInfo[state.view][1];
    $("periodHint").textContent = state.view === "contas" ? "Vencimentos do mês" : "Movimentações realizadas";
    if (state.view === "relatorios") {
      alignReportWindow();
    }
    render();
    if (focus) {
      $("pageTitle").setAttribute("tabindex", "-1");
    }
    if (focus) {
      $("pageTitle").focus({ preventScroll: true });
    }
    if (state.view === "contas") {
      void ensurePlannedBills().catch(showError);
    }
  }
  function render() {
    if (!state.loggedAccount) {
      return;
    }
    $("currentMonthLabel").textContent = new Date(
      state.selectedYear,
      state.selectedMonth,
      1
    ).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    $("btnCurrentMonth").hidden = state.selectedYear === (/* @__PURE__ */ new Date()).getFullYear() && state.selectedMonth === (/* @__PURE__ */ new Date()).getMonth();
    const name = state.loggedAccount.displayName;
    $("loggedUserDisplay").textContent = name.split(" ")[0];
    $("userAvatar").textContent = name[0]?.toUpperCase() || "F";
    document.body.classList.toggle("hidden-values", state.hideValues);
    $("privacyButton").innerHTML = icon(state.hideValues ? "eye-off" : "eye");
    $("privacyButton").setAttribute(
      "aria-label",
      state.hideValues ? "Mostrar valores" : "Ocultar valores"
    );
    $("privacyButton").setAttribute("aria-pressed", String(state.hideValues));
    const overdue = realBills().filter((b) => !isBillPaid(b) && b.dueDate < today()).length;
    $("dueBadge").hidden = !overdue;
    $("dueBadge").textContent = overdue;
    renderHome();
    renderStatement();
    renderBills();
    renderForecast();
    renderReports();
    renderSync();
    if ($("purchaseDialog").open) {
      renderPurchase();
    }
    if ($("settingsDialog").open) {
      renderSettings();
    }
  }
  function renderHome() {
    const month = monthTransactions(), sum = sums(month), balances = balanceSummary();
    const balance = balances.total;
    const cards = [
      [
        "balance",
        "Saldo total hoje",
        balance,
        state.balanceMode === "integrated" ? "Acumulado até hoje, descontando aportes" : "Acumulado até hoje, investimentos separados",
        "wallet"
      ],
      [
        "income",
        "Entradas do mês",
        sum.income,
        `${month.filter((t) => t.type === "income").length} recebimento(s)`,
        "arrow-down"
      ],
      [
        "expense",
        "Saídas do mês",
        sum.expense,
        `${month.filter((t) => t.type === "expense").length} despesa(s), sem investimentos`,
        "arrow-up"
      ],
      [
        "investment",
        "Investido no mês",
        sum.investment,
        `Acumulado até hoje: ${money(balances.investmentToDate)}`,
        "leaf"
      ]
    ];
    $("summaryCards").innerHTML = cards.map(
      ([type, label, value, caption, name]) => (
        /* HTML */
        `<article class="summary-card ${type}">
          <div class="metric-label">
            <span>${label}</span><span class="metric-icon">${icon(name)}</span>
          </div>
          <div class="metric-value money" ${type === "balance" ? ' id="totalBalanceValue"' : ""}>
            ${money(value)}
          </div>
          <p class="metric-caption">${esc(caption)}</p>
        </article>`
      )
    ).join("");
    $("monthlyBalancePeriod").textContent = new Date(
      state.selectedYear,
      state.selectedMonth,
      1
    ).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    $("monthlyBalanceValue").textContent = money(balances.month);
    $("monthlyBalanceValue").classList.toggle("negative", balances.month < 0);
    $("monthlyBalanceFormula").textContent = state.balanceMode === "integrated" ? "Entradas − saídas − aportes do mês" : "Entradas − saídas do mês, com investimentos separados";
    const horizon = isoMonth() + "-31";
    const next = realBills().filter((b) => !isBillPaid(b) && b.dueDate <= horizon).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4);
    $("homeBills").innerHTML = next.length ? next.map((b) => billRow(b, true)).join("") : emptyState(
      "calendar",
      "Nenhuma conta pendente por aqui",
      "Agende contas e mensalidades para acompanhar os próximos vencimentos.",
      "new-bill",
      "Agendar conta"
    );
    const recent = [...month].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 5);
    $("homeTransactions").innerHTML = recent.length ? recent.map((t) => transactionRow(t, true)).join("") : emptyState(
      "wallet",
      "Seu mês começa aqui",
      "Registre uma entrada, uma despesa ou um investimento.",
      "new"
    );
    const unpaid = realBills().filter(
      (b) => !isBillPaid(b) && b.type === "expense" && b.dueDate.startsWith(isoMonth())
    );
    $("homeInsight").innerHTML = icon(unpaid.length ? "calendar" : "sparkles") + /* HTML */
    `<p>
        ${unpaid.length ? `Você tem <strong>${unpaid.length} conta(s)</strong> pendente(s) neste mês, somando <strong>${money(unpaid.reduce((s, b) => s + b.amount, 0))}</strong>.` : "Seu próximo passo pode ser simples: registre os pequenos gastos para enxergar o mês por inteiro."}
      </p>
      <a href="${unpaid.length ? "#contas" : "#relatorios"}" class="text-button"
        >${unpaid.length ? "Organizar contas" : "Ver relatórios"} ${icon("arrow-right")}</a
      >`;
  }
  function transactionRow(t, compact = false) {
    const names = { expense: "Despesa", income: "Receita", investment: "Investimento" }, delta = (t.type === "income" ? 1 : -1) * entryAmount(t), symbol = delta >= 0 ? "+" : "−", reversal = t.entryKind === "reversal";
    return (
      /* HTML */
      `<button
    class="transaction-row"
    data-action="edit-tx"
    data-id="${esc(t.id)}"
    aria-label="Editar ${esc(t.description)}, ${money(t.amount)}"
  >
    <span class="category-icon ${delta >= 0 ? "income" : t.type}"
      >${icon(reversal ? "undo" : t.type === "income" ? "arrow-down" : t.type === "investment" ? "leaf" : "bag")}</span
    ><span class="row-description"
      ><span class="row-title">${esc(t.description)}</span
      ><span class="row-subtitle"
        >${esc(t.category)}${compact ? " · " + dateLabel(t.date) : ' <span class="tag ' + t.type + '">' + names[t.type] + "</span>"}${reversal ? '<span class="tag warning">Estorno</span>' : ""}</span
      ></span
    ><span class="row-value money ${delta >= 0 ? "income" : t.type}"
      >${symbol} ${money(t.amount)}</span
    >${icon("chevron-right").replace('class="icon"', 'class="icon row-chevron"')}
  </button>`
    );
  }
  function renderStatement() {
    const search = state.searchQuery.toLocaleLowerCase("pt-BR");
    const items = monthTransactions().filter(
      (t) => (state.filterType === "all" || t.type === state.filterType) && (!search || (t.description + " " + t.category).toLocaleLowerCase("pt-BR").includes(search))
    ).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    document.querySelectorAll("[data-filter]").forEach((b) => {
      const active = b.dataset.filter === state.filterType;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    $("transactionsCountLabel").textContent = `${items.length} lançamento(s) ${search ? "encontrado(s)" : "neste mês"}`;
    if (!items.length) {
      $("transactionsListContainer").innerHTML = emptyState(
        "search",
        search || state.filterType !== "all" ? "Nenhum resultado" : "Ainda sem lançamentos",
        search ? "Tente outra descrição ou categoria." : "Os lançamentos confirmados aparecerão aqui.",
        search ? "" : "new"
      );
      return;
    }
    const grouped = /* @__PURE__ */ new Map();
    for (const t of items) {
      if (!grouped.has(t.date)) {
        grouped.set(t.date, []);
      }
      grouped.get(t.date).push(t);
    }
    $("transactionsListContainer").innerHTML = [...grouped].map(([date, list]) => {
      const daySum = sums(list);
      const value = daySum.income - daySum.expense - daySum.investment;
      return (
        /* HTML */
        `<div class="day-heading"><span>${date === today() ? "Hoje · " : ""}${(/* @__PURE__ */ new Date(date + "T12:00:00")).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "long" })}</span><span class="money">${money(value)}</span></div>` + list.map((t) => transactionRow(t)).join("")
      );
    }).join("");
  }
  function billRow(bill, compact = false) {
    const paid = isBillPaid(bill), cancelled = isCancelled(bill), overdue = isPending(bill) && bill.dueDate < today(), tx = transactionForBill(bill), refunded = tx && refundableCents(tx) < cents(tx.amount);
    const installment = bill.totalInstallments ? '<span class="tag">' + bill.installmentNumber + " de " + bill.totalInstallments + "</span>" : bill.ruleId ? '<span class="tag">Mensal</span>' : "";
    const status = cancelled ? '<span class="tag">Cancelada</span>' : paid ? '<span class="tag income">' + (bill.type === "income" ? "Recebido" : "Pago") + "</span>" : overdue ? '<span class="tag expense">Atrasada</span>' : '<span class="tag warning">A vencer</span>';
    return (
      /* HTML */
      `<div class="bill-row">
    <span class="category-icon ${bill.type}"
      >${icon(bill.totalInstallments ? "card" : "calendar")}</span
    ><button
      class="row-description row-text"
      data-action="edit-bill"
      data-id="${esc(bill.id)}"
      aria-label="Editar conta ${esc(bill.description)}"
    >
      <span class="row-title">${esc(bill.description)}</span
      ><span class="row-subtitle"
        >Vence: ${dateLabel(bill.dueDate)} ${installment} ${status}
        ${paid ? " · pago em " + dateLabel(billPaidDate(bill)) : ""}${refunded ? ' <span class="tag warning">' + (refundableCents(tx) === 0 ? "Estornado" : "Estorno parcial") + "</span>" : ""}${bill.cardName ? ' <span class="tag">' + esc(bill.cardName) + "</span>" : ""}</span
      ></button
    ><span class="row-value money">${money(paid ? billPaidAmount(bill) : bill.amount)}</span>
    <div class="bill-actions">
      ${isPending(bill) ? '<button class="button ' + (overdue ? "primary" : "secondary") + '" data-action="pay-bill" data-id="' + esc(bill.id) + '">' + (bill.type === "income" ? "Recebi" : "Pagar") + "</button>" + (!compact ? '<button class="icon-button" data-action="cancel-bill" data-id="' + esc(bill.id) + '" aria-label="Cancelar ' + esc(bill.description) + '">' + icon("x") + "</button>" : "") : paid ? '<button class="icon-button" data-action="edit-tx" data-id="' + esc(tx.id) + '" aria-label="Editar pagamento de ' + esc(bill.description) + '">' + icon("edit") + "</button>" : ""}
    </div>
  </div>`
    );
  }
  function renderBills() {
    const prefix = isoMonth(), all = state.bills, month = all.filter((b) => b.dueDate.startsWith(prefix)), pending = month.filter(isPending), overdue = all.filter((b) => isPending(b) && b.dueDate < today()), paid = all.filter((b) => isBillPaid(b) && billPaidDate(b).startsWith(prefix));
    $("billSummary").innerHTML = [
      ["", "A pagar no mês", pending.filter((b) => b.type !== "income"), false],
      ["danger", "Total em atraso", overdue, false],
      ["success", "Pago / recebido no mês", paid, true]
    ].map(
      ([cls, label, list, usePaid]) => '<article class="mini-card ' + cls + '"><span>' + label + '</span><strong class="money">' + money(list.reduce((sum, b) => sum + (usePaid ? billPaidAmount(b) : b.amount), 0)) + "</strong><small>" + list.length + " conta(s) · " + (usePaid ? "pela data do pagamento" : "pela data do vencimento") + "</small></article>"
    ).join("");
    let items = state.billFilter === "overdue" ? overdue : state.billFilter === "paid" ? paid : state.billFilter === "cancelled" ? month.filter(isCancelled) : state.billFilter === "all" ? all.filter(
      (b) => b.dueDate.startsWith(prefix) || isBillPaid(b) && billPaidDate(b).startsWith(prefix)
    ) : month.filter((b) => isPending(b) && b.dueDate >= today());
    items = [...items].sort(
      (a, b) => (state.billFilter === "paid" ? billPaidDate(a).localeCompare(billPaidDate(b)) : a.dueDate.localeCompare(b.dueDate)) || a.description.localeCompare(b.description)
    );
    document.querySelectorAll("[data-bill-filter]").forEach((button) => {
      const on = button.dataset.billFilter === state.billFilter;
      button.classList.toggle("active", on);
      button.setAttribute("aria-pressed", String(on));
    });
    const message = state.billFilter === "overdue" ? ["Tudo em dia", "Nenhuma conta vencida pendente."] : state.billFilter === "paid" ? [
      "Nenhum pagamento neste mês",
      "Os pagamentos aparecem pela data em que o dinheiro entrou ou saiu."
    ] : state.billFilter === "cancelled" ? [
      "Nenhuma conta cancelada",
      "Contas canceladas continuam disponíveis para consulta e edição."
    ] : ["Nenhuma conta neste filtro", "Agende uma conta ou escolha outro mês."];
    $("billsList").innerHTML = items.length ? items.map((b) => billRow(b)).join("") : emptyState(
      "calendar",
      message[0],
      message[1],
      state.billFilter === "cancelled" ? "" : "new-bill",
      "Agendar conta"
    );
    const rules = [...state.rules].sort((a, b) => b.createdAt - a.createdAt);
    $("rulesList").innerHTML = rules.length ? rules.map((rule) => {
      const pending2 = state.bills.filter((b) => b.ruleId === rule.id && isPending(b)), label = rule.cancelledAt ? "Cancelada" : rule.disabledAfter ? "Encerrada" : pending2.length || rule.frequency === "monthly" ? "Ativa" : "Concluída";
      return '<div class="rule-row"><button class="row-description row-text" data-action="manage-rule" data-id="' + esc(rule.id) + '"><span class="row-title">' + esc(rule.description) + '</span><span class="row-subtitle">' + (rule.frequency === "monthly" ? "Todo mês" : rule.totalInstallments + " parcelas") + " · " + pending2.length + ' pendente(s) <span class="tag">' + label + '</span></span></button><div class="rule-actions"><button class="text-button" data-action="manage-rule" data-id="' + esc(rule.id) + '">Gerenciar</button>' + (!rule.cancelledAt && !rule.disabledAfter && rule.frequency === "monthly" ? '<button class="text-button danger-text" data-action="stop-rule" data-id="' + esc(rule.id) + '">Encerrar</button>' : "") + "</div></div>";
    }).join("") : emptyState(
      "repeat",
      "Sem compras ou recorrências",
      "Ao cadastrar uma conta, escolha “Todo mês” ou “Compra parcelada”."
    );
  }
  function renderBreakdown(type, items, total, id, badge) {
    $(badge).textContent = money(total);
    const group = Object.entries(
      items.reduce((a, t) => {
        a[t.category] = (a[t.category] || 0) + entryAmount(t);
        return a;
      }, {})
    ).sort((a, b) => b[1] - a[1]);
    $(id).innerHTML = group.length ? group.map(([category, value]) => {
      const pct = total ? Math.round(Math.abs(value / total) * 100) : 0;
      return (
        /* HTML */
        `<div class="breakdown-row">
            <div>
              <span>${esc(category)}</span
              ><strong class="money"
                >${money(value)}
                <small
                  >${state.hideValues ? "" : value < 0 ? "estorno" : total > 0 ? pct + "%" : ""}</small
                ></strong
              >
            </div>
            <div
              class="progress"
              role="img"
              aria-label="${esc(category)}: ${state.hideValues ? "valor oculto" : pct + "%"}"
            >
              <span
                style="width:${Math.min(100, pct)}%;background:${type === "investment" ? "var(--purple)" : "var(--primary)"}"
              ></span>
            </div>
          </div>`
      );
    }).join("") : emptyState(
      type === "expense" ? "bag" : "leaf",
      "Nenhum registro neste mês",
      type === "expense" ? "As categorias aparecem ao registrar suas despesas." : "Seus investimentos ficam separados dos gastos."
    );
  }
  function renderSync() {
    if (!$("dbStatusBadge")) {
      return;
    }
    let text = "Salvo neste aparelho", cls = "";
    if (state.busy) {
      text = "Salvando…";
      cls = "saving";
    } else if (state.saveError) {
      text = state.saveError;
      cls = "error";
    } else if (state.syncBusy) {
      text = "Sincronizando…";
      cls = "saving";
    } else if (Cloud.configured && state.syncError) {
      text = "Salvo no aparelho · sincronização pendente";
      cls = "pending";
    } else if (Cloud.configured && !navigator.onLine) {
      text = "Sem conexão · salvo no aparelho";
      cls = "pending";
    } else if (Cloud.ready && state.pendingCount) {
      text = `Salvo · ${state.pendingCount} alteração(ões) na fila`;
      cls = "pending";
    } else if (Cloud.ready && state.lastSync) {
      text = "Sincronizado";
    }
    $("syncStatusText").textContent = text;
    $("dbStatusBadge").className = "sync-status " + cls;
    const latest = state.snapshots[0];
    $("backupFooter").textContent = latest ? `Cópia local · ${new Date(latest.createdAt).toLocaleDateString("pt-BR")}` : "Ver backup e proteção dos dados";
  }
  function renderSettings() {
    if (!state.loggedAccount) {
      return;
    }
    $("settingsName").textContent = state.loggedAccount.displayName;
    $("settingsIdentifier").textContent = state.loggedAccount.identifier;
    $("settingsAvatar").textContent = state.loggedAccount.displayName[0]?.toUpperCase() || "F";
    $("themeSelect").value = state.themePreference;
    $("balanceModeSelect").value = state.balanceMode;
    $("syncDetail").textContent = Cloud.configured ? state.syncError ? "Seus dados estão salvos neste aparelho. A conexão com a nuvem precisa ser retomada; tentaremos novamente quando houver conexão." : `As alterações são guardadas primeiro neste aparelho e enviadas à nuvem. ${state.pendingCount ? state.pendingCount + " alteração(ões) aguardando envio." : "Nenhuma alteração na fila."}` : "Este projeto está funcionando no modo local. Para transferir seus dados para outro aparelho, exporte e restaure um backup. A sincronização automática depende da ativação da nuvem na instalação.";
    $("lastSyncLabel").textContent = state.lastSync ? "Última sincronização: " + new Date(state.lastSync).toLocaleString("pt-BR") : "Ainda não houve sincronização com a nuvem.";
    $("btnForceSyncNow").disabled = !Cloud.configured || state.syncBusy;
    $("btnForceSyncNow").innerHTML = icon("refresh") + (state.syncBusy ? "Sincronizando…" : "Tentar sincronizar");
    $("lastExportLabel").textContent = state.lastExport ? "Último backup exportado: " + new Date(state.lastExport).toLocaleString("pt-BR") : "Você ainda não exportou um backup nesta conta.";
    $("snapshotsList").innerHTML = state.snapshots.length ? '<p class="small muted">Cópias locais disponíveis</p>' + state.snapshots.map(
      (s) => (
        /* HTML */
        `<div class="snapshot-row">
              <span
                >${esc(s.label)} ·
                ${new Date(s.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span
              ><button class="text-button" data-action="download-snapshot" data-id="${esc(s.id)}">
                Baixar
              </button>
            </div>`
      )
    ).join("") : '<p class="small muted">A primeira cópia diária será criada após seus primeiros registros.</p>';
  }

  // src/js/services/cloud-config.js
  function readSupabaseConfig(raw) {
    const url = String(raw?.url ?? "").trim().replace(/\/$/, "");
    const publishableKey = String(raw?.publishableKey ?? "").trim();
    if (!/^https:\/\/[a-z0-9]{3,24}\.supabase\.co$/.test(url)) {
      throw new Error("Informe a URL HTTPS do projeto Supabase.");
    }
    if (!/^sb_publishable_[a-zA-Z0-9_-]+$/.test(publishableKey)) {
      throw new Error("Informe a chave Publishable do Supabase.");
    }
    return { url, publishableKey };
  }

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

  // src/js/services/cloud.js
  var TABLE = "ff_finance_records";
  var PAGE_SIZE = 500;
  var Cloud = {
    configured: (window.FF_SUPABASE_CONFIG ?? null) !== null,
    client: null,
    connecting: null,
    ready: false,
    owner: null,
    timer: null,
    resync: false,
    subscription: null
  };
  var rememberSession = true;
  var readReturnPreference = null;
  var sessionMemory = /* @__PURE__ */ new Map();
  var isVerifier = (key) => key.endsWith("-code-verifier") && !key.endsWith("-flows-code-verifier");
  var preferenceKey = (key) => key + "-ff-remember";
  var authStorage = {
    getItem(key) {
      const value = sessionMemory.get(key) ?? localStorage.getItem(key);
      if (value && readReturnPreference && isVerifier(key)) {
        readReturnPreference(localStorage.getItem(preferenceKey(key)));
      }
      return value;
    },
    setItem(key, value) {
      if (isVerifier(key)) {
        localStorage.setItem(preferenceKey(key), rememberSession ? "yes" : "no");
      }
      if (key.endsWith("-code-verifier") || rememberSession) {
        localStorage.setItem(key, value);
        sessionMemory.delete(key);
      } else {
        sessionMemory.set(key, value);
        localStorage.removeItem(key);
      }
    },
    removeItem(key) {
      sessionMemory.delete(key);
      localStorage.removeItem(key);
      if (isVerifier(key)) {
        localStorage.removeItem(preferenceKey(key));
      }
    }
  };
  function rememberCloudSession() {
    rememberSession = true;
    for (const [key, value] of sessionMemory) {
      authStorage.setItem(key, value);
    }
  }
  async function connectCloud() {
    if (!Cloud.configured || Cloud.client) {
      return Cloud.client;
    }
    if (!Cloud.connecting) {
      Cloud.connecting = (async () => {
        const config = readSupabaseConfig(window.FF_SUPABASE_CONFIG);
        const { createClient } = await deadline(
          import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm")
        ).catch(() => {
          throw new Error("Não foi possível conectar ao login. Confira sua conexão e recarregue.");
        });
        Cloud.client = createClient(config.url, config.publishableKey, {
          auth: {
            storage: authStorage,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
            flowType: "pkce"
          }
        });
        return Cloud.client;
      })().finally(() => {
        Cloud.connecting = null;
      });
    }
    return Cloud.connecting;
  }
  async function resumeCloudUser() {
    const client = await connectCloud();
    const url = new URL(location.href);
    const { code, flowId, redirectError } = readAuthReturn(url);
    if (code || redirectError) {
      for (const key of callbackKeys) {
        url.searchParams.delete(key);
      }
      if (redirectError) {
        url.hash = "";
      }
      history.replaceState(null, "", url.href);
      const legacyPreference = sessionStorage.getItem("ff-auth-remember");
      sessionStorage.removeItem("ff-auth-remember");
      if (redirectError) {
        throw new Error("O link não pôde ser usado. Tente entrar ou solicite um novo link.");
      }
      rememberSession = false;
      let preference = null;
      readReturnPreference = (value) => {
        preference ??= value;
      };
      try {
        const { data: data2, error: error2 } = await deadline(
          client.auth.exchangeCodeForSession(code, flowId ? { flowId } : void 0)
        );
        if (error2 || !data2.user || !data2.session) {
          throw new Error("Link expirado ou aberto em outro navegador. Solicite um novo link.");
        }
        const recovery = data2.redirectType === "recovery";
        const remember = preference === null ? recovery || legacyPreference !== "no" : preference === "yes";
        if (!recovery && remember) {
          rememberCloudSession();
        }
        return { user: data2.user, recovery, remember };
      } finally {
        readReturnPreference = null;
      }
    }
    const { data, error } = await deadline(client.auth.getSession());
    if (error) {
      throw error;
    }
    if (!data.session) {
      return { user: null, recovery: false };
    }
    const verified = await deadline(client.auth.getUser());
    if (verified.error) {
      throw verified.error;
    }
    return { user: verified.data.user, recovery: false };
  }
  async function signInCloud(email, password, remember) {
    const client = await connectCloud();
    rememberSession = remember;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error?.code === "email_not_confirmed") {
      throw new Error("Confirme seu e-mail pelo link recebido e tente entrar novamente.");
    }
    if (error || !data.user) {
      throw new Error("Confira seu e-mail e sua senha do Supabase e tente novamente.");
    }
    return data.user;
  }
  function redirectToApp() {
    return location.protocol === "file:" ? new URL("index.html", location.href).href : location.origin + "/";
  }
  function cloudAuthError(error, fallback) {
    const messages2 = {
      signup_disabled: "O cadastro está fechado no momento. Entre com uma conta existente.",
      weak_password: "Escolha uma senha mais forte e tente novamente.",
      email_address_not_authorized: "O serviço de e-mail ainda não está disponível para este endereço.",
      over_email_send_rate_limit: "Limite de e-mails atingido. Aguarde e tente novamente.",
      over_request_rate_limit: "Muitas tentativas. Aguarde um pouco antes de repetir.",
      same_password: "Escolha uma senha diferente da atual.",
      invalid_credentials: "Confira sua senha atual e tente novamente.",
      current_password_required: "Informe a senha atual ou use a recuperação pelo e-mail.",
      reauthentication_needed: "Entre novamente na sua conta antes de alterar a senha."
    };
    return new Error(Object.hasOwn(messages2, error?.code) ? messages2[error.code] : fallback);
  }
  async function signUpCloud(email, password, name, remember) {
    const client = await connectCloud();
    rememberSession = remember;
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { display_name: name }, emailRedirectTo: redirectToApp() }
    });
    if (error) {
      throw cloudAuthError(error, "Não foi possível criar a conta agora. Tente novamente.");
    }
    return data.session ? data.user : null;
  }
  async function sendCloudReset(email, remember) {
    const client = await connectCloud();
    rememberSession = remember;
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: redirectToApp()
    });
    if (error) {
      throw cloudAuthError(error, "Não foi possível enviar o link agora. Tente novamente.");
    }
  }
  function cloudProviderEnabled(provider) {
    return Cloud.configured && (provider === "google" || provider === "apple") && window.FF_SUPABASE_CONFIG.authProviders?.[provider] === true;
  }
  async function signInWithCloudProvider(provider, remember) {
    if (!cloudProviderEnabled(provider)) {
      throw new Error("Este método de entrada está indisponível.");
    }
    const client = await connectCloud();
    rememberSession = remember;
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectToApp() }
    });
    if (error) {
      throw new Error("Não foi possível abrir o login deste provedor. Tente novamente.");
    }
  }
  async function updateCloudUser(attributes, expectedOwner) {
    const client = await connectCloud();
    const { data: identity, error: identityError } = await deadline(client.auth.getUser());
    if (identityError || identity.user?.id !== expectedOwner) {
      throw new Error("Sua sessão mudou ou expirou. Entre novamente para continuar.");
    }
    const { data, error } = await client.auth.updateUser(attributes);
    if (error) {
      throw cloudAuthError(error, "Não foi possível atualizar sua conta agora. Tente novamente.");
    }
    return data.user;
  }
  function bindCloudUser(user, onSessionEnd) {
    const { url } = readSupabaseConfig(window.FF_SUPABASE_CONFIG);
    const project = new URL(url).hostname.split(".")[0];
    Cloud.owner = user.id;
    Cloud.ready = true;
    Cloud.subscription?.unsubscribe();
    const { data } = Cloud.client.auth.onAuthStateChange((_event, session) => {
      if (Cloud.owner && session?.user?.id !== Cloud.owner) {
        stopCloudSession();
        setTimeout(onSessionEnd, 0);
      }
    });
    Cloud.subscription = data.subscription;
    const name = user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name;
    return {
      accountKey: ["sb", project, user.id.replaceAll("-", "")].join("_"),
      identifier: user.email,
      displayName: String(name || "").trim().slice(0, 60) || String(user.email || "Minha conta").split("@")[0],
      needsCurrentPassword: (user.identities ?? []).some((identity) => identity.provider === "email") || user.app_metadata?.provider === "email"
    };
  }
  function stopCloudSession() {
    clearTimeout(Cloud.timer);
    Cloud.subscription?.unsubscribe();
    Cloud.subscription = null;
    Cloud.owner = null;
    Cloud.ready = false;
    Cloud.resync = false;
  }
  async function signOutCloud() {
    const { error } = await deadline(Cloud.client.auth.signOut({ scope: "local" }));
    if (error) {
      throw new Error("Não foi possível encerrar a sessão. Tente sair novamente.");
    }
    stopCloudSession();
  }
  function queueCloudSync() {
    if (!Cloud.ready || !state.loggedAccount) {
      return;
    }
    clearTimeout(Cloud.timer);
    Cloud.timer = setTimeout(() => void syncCloud(), 600);
  }
  async function syncCloud(explicit = false) {
    if (!state.loggedAccount) {
      return;
    }
    if (!Cloud.ready || !navigator.onLine) {
      if (explicit) {
        toast(
          "A sincronização precisa de uma sessão online. Seus dados estão salvos neste aparelho.",
          "warning"
        );
      }
      return;
    }
    if (state.syncBusy) {
      Cloud.resync = true;
      return;
    }
    const key = account();
    const owner = Cloud.owner;
    const generation = sessionLifecycle.generation;
    const currentSession = () => generation === sessionLifecycle.generation && Cloud.owner === owner;
    state.syncBusy = true;
    state.syncError = "";
    renderSync();
    try {
      const jobs = (await DB.getAll(STORE.outbox)).filter(
        (job) => job.accountKey === key && Object.hasOwn(entities, job.entity)
      );
      for (let offset = 0; offset < jobs.length && currentSession(); offset += PAGE_SIZE) {
        const batch = jobs.slice(offset, offset + PAGE_SIZE);
        const rows = batch.map((job) => ({
          owner_id: owner,
          entity: job.entity,
          record_id: job.recordId,
          updated_ms: job.updatedAt,
          revision: job.revision,
          payload: job.kind === "delete" ? null : job.data
        }));
        const { error } = await Cloud.client.from(TABLE).upsert(rows, { onConflict: "owner_id,entity,record_id" }).abortSignal(AbortSignal.timeout(12e3));
        if (error) {
          throw error;
        }
        await enqueueWork(async () => {
          if (!currentSession()) {
            return;
          }
          const completed = [];
          for (const job of batch) {
            const pending = await DB.get(STORE.outbox, job.id);
            if (pending?.accountKey === key && pending.revision === job.revision) {
              completed.push([STORE.outbox, job.id]);
            }
          }
          await DB.commit([], completed);
        });
      }
      const records = [];
      for (let offset = 0; currentSession(); offset += PAGE_SIZE) {
        const { data, error } = await Cloud.client.from(TABLE).select("entity,record_id,updated_ms,payload").eq("owner_id", owner).order("entity").order("record_id").range(offset, offset + PAGE_SIZE - 1).abortSignal(AbortSignal.timeout(12e3));
        if (error) {
          throw error;
        }
        records.push(...data);
        if (data.length < PAGE_SIZE) {
          break;
        }
      }
      await enqueueWork(async () => {
        if (!currentSession()) {
          return;
        }
        const puts = [];
        const deletes = [];
        for (const row of records) {
          if (!Object.hasOwn(entities, row.entity)) {
            continue;
          }
          const store = entities[row.entity];
          const local = await DB.get(store, row.record_id);
          const pending = await DB.get(STORE.outbox, row.entity + "_" + row.record_id);
          if (pending || local && (local.accountKey !== key || local.updatedAt > row.updated_ms)) {
            continue;
          }
          if (row.payload === null) {
            if (local) {
              deletes.push([store, row.record_id]);
            }
          } else {
            try {
              const item = sanitizeEntity(
                row.entity,
                {
                  ...row.payload,
                  id: row.record_id,
                  updatedAt: row.updated_ms,
                  syncedWithCloud: true
                },
                key
              );
              puts.push([store, item]);
            } catch {
            }
          }
        }
        await DB.commit(puts, deletes);
        await loadAccountData();
      });
      if (!currentSession()) {
        return;
      }
      state.lastSync = Date.now();
      await DB.put(STORE.session, { key: "lastSync_" + key, time: state.lastSync });
      if (!currentSession()) {
        return;
      }
      await ensurePlannedBills();
      render();
      if (explicit) {
        toast("Sincronização concluída.");
      }
    } catch (error) {
      if (currentSession()) {
        await enqueueWork(() => currentSession() && loadAccountData()).catch(console.warn);
      }
      if (currentSession()) {
        state.syncError = "Não foi possível sincronizar com o Supabase.";
        console.warn("Sincronização adiada:", error);
        if (explicit) {
          toast("A sincronização falhou. Sua cópia local foi preservada.", "warning");
        }
      }
    } finally {
      state.syncBusy = false;
      renderSync();
      renderSettings();
      if (Cloud.resync) {
        Cloud.resync = false;
        queueCloudSync();
      }
    }
  }

  // src/js/application/profile.js
  function validateNewPassword(password, confirmation) {
    if (password.length < 8 || password.length > 128) {
      throw new Error("Use entre 8 e 128 caracteres na nova senha.");
    }
    if (password !== confirmation) {
      throw new Error("As duas senhas precisam ser iguais.");
    }
    return password;
  }
  async function runProfileAction(button, action, onError = showError) {
    if (button.disabled) {
      return;
    }
    button.disabled = true;
    state.busy++;
    renderSync();
    try {
      if (Cloud.configured && !Cloud.ready) {
        throw new Error("Sua sessão expirou. Entre novamente para continuar.");
      }
      await action();
    } catch (error) {
      onError(error);
    } finally {
      state.busy--;
      button.disabled = false;
      renderSync();
    }
  }
  async function saveProfileName() {
    const key = account();
    const name = $("profileName").value.trim().slice(0, 60);
    if (!name) {
      throw new Error("Informe o nome que deseja exibir.");
    }
    if (Cloud.configured) {
      await updateCloudUser({ data: { display_name: name } }, Cloud.owner);
    } else {
      await enqueueWork(async () => {
        const user = await DB.get(STORE.users, key);
        if (!user) {
          throw new Error("Sua conta local precisa ser aberta novamente.");
        }
        const active = await DB.get(STORE.session, "activeUser");
        const puts = [[STORE.users, { ...user, displayName: name }]];
        if (active?.accountKey === key) {
          puts.push([STORE.session, { ...active, displayName: name }]);
        }
        await DB.commit(puts);
      });
    }
    if (state.loggedAccount?.accountKey === key) {
      state.loggedAccount.displayName = name;
      $("profileName").value = name;
      render();
      renderSettings();
      toast("Seu nome foi atualizado.");
    }
  }
  async function savePassword() {
    const key = account();
    const current = $("currentPassword").value;
    const password = validateNewPassword($("newPassword").value, $("newPasswordAgain").value);
    if (Cloud.configured) {
      await updateCloudUser({ password, ...current && { current_password: current } }, Cloud.owner);
    } else {
      await enqueueWork(async () => {
        const user = await DB.get(STORE.users, key);
        if (!user || !await passwordMatches(user, current)) {
          throw new Error("Confira a senha atual e tente novamente.");
        }
        const salt = generateRandomSaltHex();
        const passwordHash = await derivePbkdf2Hash(password, `${key}::${salt}`);
        await DB.put(STORE.users, { ...user, salt, passwordHash, kdf: "PBKDF2-SHA256" });
      });
    }
    $("changePasswordDialog").close();
    toast("Sua senha foi alterada.");
  }
  function bindProfileEvents() {
    $("profileForm").addEventListener("submit", (event) => {
      event.preventDefault();
      void runProfileAction($("btnSaveProfile"), saveProfileName);
    });
    $("btnChangePassword").addEventListener("click", () => {
      const requiresPassword = !Cloud.configured || state.loggedAccount.needsCurrentPassword;
      $("currentPasswordGroup").hidden = !requiresPassword;
      $("currentPassword").required = Boolean(requiresPassword);
      $("changePasswordForm").reset();
      $("changePasswordAlert").hidden = true;
      $("changePasswordDialog").showModal();
    });
    $("changePasswordForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const alert = $("changePasswordAlert");
      alert.hidden = true;
      void runProfileAction($("btnSavePassword"), savePassword, (error) => {
        alert.textContent = error.message;
        alert.hidden = false;
      });
    });
    $("changePasswordDialog").addEventListener("close", () => $("changePasswordForm").reset());
  }

  // src/js/application/auth.js
  var authCopy = {
    login: ["Entre na sua conta", "Informe seus dados de acesso.", "Entrar"],
    register: ["Crie sua conta", "Preencha seus dados para criar seu acesso.", "Criar conta"],
    recover: [
      "Recupere o acesso",
      "Informe o e-mail cadastrado para receber um link.",
      "Enviar link"
    ],
    reset: [
      "Defina uma nova senha",
      "Escolha uma senha com pelo menos 8 caracteres.",
      "Salvar senha"
    ]
  };
  var recoverySession = null;
  var authBusy = false;
  function authMessage(message, success = false) {
    const alert = $("authAlert");
    const notice = $("authNotice");
    alert.hidden = success || !message;
    notice.hidden = !success || !message;
    (success ? notice : alert).textContent = message;
  }
  async function runAuth(button, action) {
    if (authBusy) {
      return;
    }
    authBusy = true;
    const controls = [
      "tabLoginBtn",
      "tabRegisterBtn",
      "btnAuthSubmit",
      "btnForgotPassword",
      "btnAuthGoogle",
      "btnAuthApple",
      "btnBackToLogin",
      "btnCancelReset"
    ];
    for (const id of controls) {
      $(id).disabled = true;
    }
    button.disabled = true;
    authMessage("");
    try {
      await action();
    } catch (error) {
      authMessage(error.message || "Não foi possível concluir. Tente novamente.");
    } finally {
      authBusy = false;
      for (const id of controls) {
        $(id).disabled = false;
      }
      button.disabled = false;
      $("authSubmitText").textContent = authCopy[state.authMode][2];
    }
  }
  function switchAuthTab(mode) {
    const [title, subtitle, submit] = authCopy[mode];
    const register = mode === "register";
    const normal = mode === "login" || register;
    state.authMode = mode;
    $("authTitle").textContent = title;
    $("authSubtitle").textContent = subtitle;
    $("authAccountLinks").hidden = !normal;
    $("authRegisterLink").hidden = mode !== "login";
    $("authLoginLink").hidden = !register;
    $("authForm").hidden = !normal;
    $("forgotPasswordForm").hidden = mode !== "recover";
    $("resetPasswordForm").hidden = mode !== "reset";
    $("registerNameGroup").hidden = !register;
    $("authName").required = register && Cloud.configured;
    $("authSubmitText").textContent = submit;
    $("authPassword").value = "";
    $("authPassword").type = "password";
    $("authPassword").autocomplete = register ? "new-password" : "current-password";
    $("authPassword").minLength = register && Cloud.configured ? 8 : 4;
    $("authPassword").placeholder = register && Cloud.configured ? "Pelo menos 8 caracteres" : "Sua senha";
    $("btnTogglePassword").setAttribute("aria-label", "Mostrar senha");
    $("btnTogglePassword").innerHTML = icon("eye");
    $("btnForgotPassword").hidden = mode !== "login" || !Cloud.configured;
    const google = cloudProviderEnabled("google");
    const apple = cloudProviderEnabled("apple");
    $("btnAuthGoogle").hidden = !google;
    $("btnAuthApple").hidden = !apple;
    $("authSocial").hidden = !normal || !google && !apple;
    authMessage("");
  }
  async function enterAccount() {
    sessionLifecycle.generation++;
    const key = account();
    await loadAccountData();
    const [prefs, theme, lastSync] = await Promise.all([
      DB.get(STORE.session, `prefs_${key}`),
      DB.get(STORE.session, "themePreference"),
      DB.get(STORE.session, `lastSync_${key}`)
    ]);
    state.hideValues = Boolean(prefs?.hide);
    state.balanceMode = prefs?.balance === "integrated" ? "integrated" : "independent";
    state.lastExport = prefs?.lastExport || null;
    state.lastSync = lastSync?.time || null;
    applyTheme(prefs?.theme || theme?.mode || "auto");
    await ensurePlannedBills();
    $("authScreen").hidden = true;
    $("appWrapper").hidden = false;
    $("skipContentLink").href = "#mainContent";
    document.title = "Painel | FinançasFácil";
    $("bootMessage").hidden = true;
    setView(location.hash.slice(1) || "inicio", false);
    render();
    void autoSnapshot().catch(console.warn);
    if (Cloud.ready) {
      void syncCloud();
    }
  }
  async function logout() {
    if (state.busy || state.syncBusy) {
      toast("Aguarde a operação terminar antes de sair.", "warning");
      return;
    }
    if (Cloud.ready) {
      await signOutCloud();
    }
    await clearAccount();
  }
  async function clearAccount() {
    if (!state.loggedAccount) {
      return;
    }
    sessionLifecycle.generation++;
    stopCloudSession();
    if (!Cloud.configured) {
      await DB.delete(STORE.session, "activeUser");
    }
    Voice.stopVoiceRecording(true, false);
    state.loggedAccount = null;
    state.transactions = [];
    state.bills = [];
    state.rules = [];
    state.snapshots = [];
    state.draftItems = [];
    state.syncError = "";
    state.saveError = "";
    state.hideValues = false;
    state.lastSync = null;
    state.pendingCount = 0;
    state.filterType = "all";
    state.searchQuery = "";
    state.billFilter = "pending";
    for (const dialog of document.querySelectorAll("dialog[open]")) {
      dialog.close();
    }
    $("commandInput").value = "";
    $("draftList").replaceChildren();
    $("previewPanel").hidden = true;
    $("searchInput").value = "";
    $("appWrapper").hidden = true;
    $("authScreen").hidden = false;
    $("skipContentLink").href = "#authTitle";
    document.title = "Entrar | FinançasFácil";
    switchAuthTab("login");
    history.replaceState(null, "", location.pathname + location.search);
    $("authIdentifier").focus();
    toast("Você saiu da sua conta.");
  }
  async function enterOnlineAccount(user) {
    state.loggedAccount = bindCloudUser(user, () => void clearAccount().catch(console.error));
    await enterAccount();
  }
  async function restoreOnlineSession() {
    $("authIdentifierLabel").textContent = "E-mail";
    $("authIdentifier").type = "email";
    $("authIdentifier").placeholder = "voce@exemplo.com";
    $("authStorageHint").hidden = true;
    if (!navigator.onLine) {
      authMessage("Você está sem conexão. Quando a internet voltar, recarregue para entrar.");
      return;
    }
    try {
      const { user, recovery, remember } = await resumeCloudUser();
      if (user && recovery) {
        recoverySession = { owner: user.id, remember };
        switchAuthTab("reset");
      } else if (user) {
        await enterOnlineAccount(user);
      }
    } catch (error) {
      stopCloudSession();
      state.loggedAccount = null;
      authMessage(
        error instanceof Error ? error.message : "Não foi possível retomar a sessão online. Tente entrar novamente."
      );
      console.warn(error);
    }
  }
  function bindAuthRecovery() {
    $("btnForgotPassword").addEventListener("click", () => {
      $("forgotEmail").value = $("authIdentifier").value;
      switchAuthTab("recover");
      $("forgotEmail").focus();
    });
    $("btnBackToLogin").addEventListener("click", () => {
      $("authIdentifier").value = $("forgotEmail").value;
      switchAuthTab("login");
      $("authIdentifier").focus();
    });
    $("forgotPasswordForm").addEventListener("submit", (event) => {
      event.preventDefault();
      void runAuth($("btnSendReset"), async () => {
        await sendCloudReset($("forgotEmail").value.trim(), $("authRememberMe").checked);
        authMessage(
          "Se esse e-mail estiver cadastrado, você receberá um link. Abra-o neste mesmo navegador.",
          true
        );
      });
    });
    $("resetPasswordForm").addEventListener("submit", (event) => {
      event.preventDefault();
      void runAuth($("btnResetPassword"), async () => {
        if (!recoverySession) {
          throw new Error("Solicite um novo link de recuperação.");
        }
        const password = validateNewPassword($("resetPassword").value, $("resetPasswordAgain").value);
        const user = await updateCloudUser({ password }, recoverySession.owner);
        if (recoverySession.remember) {
          rememberCloudSession();
        }
        recoverySession = null;
        $("resetPasswordForm").reset();
        switchAuthTab("login");
        await enterOnlineAccount(user);
        toast("Sua senha foi redefinida.");
      });
    });
    $("btnCancelReset").addEventListener("click", () => {
      void runAuth($("btnCancelReset"), async () => {
        await signOutCloud();
        recoverySession = null;
        $("resetPasswordForm").reset();
        switchAuthTab("login");
        $("authIdentifier").focus();
      });
    });
    for (const [id, provider] of [
      ["btnAuthGoogle", "google"],
      ["btnAuthApple", "apple"]
    ]) {
      $(id).addEventListener("click", () => {
        void runAuth($(id), () => signInWithCloudProvider(provider, $("authRememberMe").checked));
      });
    }
  }
  function loginIdentifier(value) {
    return String(value || "").normalize("NFKC").trim().toLocaleLowerCase("pt-BR");
  }
  function accountMatches(user, identifier) {
    return loginIdentifier(user.loginId || user.identifier || user.accountKey) === identifier;
  }
  async function localAccountByIdentifier(identifier) {
    const users = (await DB.getAll(STORE.users)).filter((user) => accountMatches(user, identifier));
    if (users.length > 1) {
      throw new Error(
        "Há mais de uma conta com esse usuário. Use um identificador diferente para evitar acessar uma conta incorreta."
      );
    }
    return users[0] || null;
  }
  async function addUniqueLocalAccount(user) {
    const db = await DB.open();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE.users, "readwrite"), store = tx.objectStore(STORE.users), request = store.getAll();
      let duplicate = false;
      request.onsuccess = () => {
        if (request.result.some((existing) => accountMatches(existing, user.loginId))) {
          duplicate = true;
          tx.abort();
        } else {
          store.add(user);
        }
      };
      tx.oncomplete = resolve;
      tx.onabort = () => reject(
        new Error(
          duplicate ? "Esta conta já existe. Use Entrar." : "Não foi possível criar a conta."
        )
      );
      tx.onerror = () => reject(tx.error);
    });
  }
  async function handleAuth(event) {
    event.preventDefault();
    if (Date.now() < state.lockoutUntil) {
      $("authAlert").textContent = "Aguarde alguns segundos antes de tentar novamente.";
      $("authAlert").hidden = false;
      return;
    }
    const identifier = $("authIdentifier").value.trim(), password = $("authPassword").value, loginId = loginIdentifier(identifier);
    if (!loginId || loginId.length > 80 || password.length < 4 || password.length > 128) {
      return;
    }
    await runAuth($("btnAuthSubmit"), async () => {
      $("authSubmitText").textContent = "Aguarde…";
      if (Cloud.configured) {
        const remember = $("authRememberMe").checked;
        let user;
        if (state.authMode === "register") {
          const name = $("authName").value.trim();
          if (!name || password.length < 8) {
            throw new Error("Informe seu nome e uma senha com pelo menos 8 caracteres.");
          }
          user = await signUpCloud(loginId, password, name, remember);
          if (!user) {
            switchAuthTab("login");
            authMessage(
              "Confira seu e-mail e abra o link de confirmação neste navegador. Depois, entre com sua senha.",
              true
            );
            return;
          }
        } else {
          user = await signInCloud(loginId, password, remember);
        }
        await enterOnlineAccount(user);
        $("authPassword").value = "";
        toast("Você entrou na sua conta online.");
        return;
      }
      let existing = await localAccountByIdentifier(loginId);
      if (state.authMode === "register") {
        if (existing) {
          throw new Error("Esta conta já existe. Use a opção Entrar.");
        }
        const accountKey = "acct_" + crypto.randomUUID().replace(/-/g, ""), salt = generateRandomSaltHex();
        existing = {
          accountKey,
          loginId,
          identifier: identifier.toLocaleLowerCase("pt-BR"),
          displayName: ($("authName").value.trim() || identifier.split("@")[0]).slice(0, 60),
          salt,
          kdf: "PBKDF2-SHA256",
          passwordHash: await derivePbkdf2Hash(password, `${accountKey}::${salt}`),
          createdAt: Date.now()
        };
        await addUniqueLocalAccount(existing);
      } else {
        if (!existing) {
          throw new Error(
            "Conta não encontrada. Confira o usuário ou crie sua conta neste aparelho."
          );
        }
        const key = existing.accountKey;
        if (!await passwordMatches(existing, password)) {
          state.failedLoginAttempts++;
          if (state.failedLoginAttempts >= 5) {
            state.lockoutUntil = Date.now() + 15e3;
          }
          throw new Error("Usuário ou senha incorretos.");
        }
        existing.loginId = loginId;
        if (existing.kdf !== "PBKDF2-SHA256") {
          existing.salt = generateRandomSaltHex();
          existing.kdf = "PBKDF2-SHA256";
          existing.passwordHash = await derivePbkdf2Hash(password, `${key}::${existing.salt}`);
        }
        await DB.put(STORE.users, existing);
      }
      state.failedLoginAttempts = 0;
      state.loggedAccount = {
        accountKey: existing.accountKey,
        identifier: existing.identifier,
        displayName: existing.displayName || identifier
      };
      if ($("authRememberMe").checked) {
        await DB.put(STORE.session, { key: "activeUser", ...state.loggedAccount });
      } else {
        await DB.delete(STORE.session, "activeUser");
      }
      await enterAccount();
      $("authPassword").value = "";
      toast(`Bem-vindo(a), ${state.loggedAccount.displayName.split(" ")[0]}.`);
    });
  }

  // src/js/application/restore.js
  async function importBackup(file) {
    if (!file) {
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new Error("Escolha um backup de até 20 MB.");
    }
    let data;
    try {
      data = JSON.parse(await file.text());
    } catch {
      throw new Error("Este arquivo não é um backup JSON válido.");
    }
    if (!data || typeof data !== "object" || data.application && data.application !== "FinancasFacil" || Number(data.schemaVersion) > 3) {
      throw new Error("O formato ou a versão deste backup não é compatível.");
    }
    const raw = {
      tx: Array.isArray(data) ? data : data.transactions,
      bills: data.bills === void 0 ? [] : data.bills,
      rules: data.rules === void 0 ? [] : data.rules
    };
    if (!Array.isArray(raw.tx) || !Array.isArray(raw.bills) || !Array.isArray(raw.rules) || raw.tx.length + raw.bills.length + raw.rules.length > 5e4) {
      throw new Error("O backup não tem listas válidas ou ultrapassa 50 mil registros.");
    }
    const key = account(), maps = { tx: /* @__PURE__ */ new Map(), bills: /* @__PURE__ */ new Map(), rules: /* @__PURE__ */ new Map() }, validated = { tx: [], bills: [], rules: [] };
    for (const entity of ["tx", "bills", "rules"]) {
      const owners = new Map((await DB.getAll(entities[entity])).map((t) => [t.id, t.accountKey])), ids = /* @__PURE__ */ new Set();
      for (const row of raw[entity]) {
        if (!row || typeof row !== "object" || !row.id) {
          throw new Error("Há um registro sem identificador válido. Nenhuma alteração foi feita.");
        }
        if (entity === "tx" && row.entryKind && !["normal", "reversal"].includes(row.entryKind)) {
          throw new Error("O backup contém um tipo de movimentação desconhecido.");
        }
        if (entity === "bills") {
          if (row.status && !["pending", "paid", "cancelled"].includes(row.status)) {
            throw new Error("O backup contém uma situação de pagamento desconhecida.");
          }
          if (row.paidAt && !isValidDate(row.paidAt) || row.cancelledAt && !isValidDate(row.cancelledAt)) {
            throw new Error("O backup contém uma data de pagamento ou cancelamento inválida.");
          }
          if (row.settledAmount !== null && row.settledAmount !== void 0 && !amountOK(Number(row.settledAmount))) {
            throw new Error("O backup contém um valor pago inválido.");
          }
        }
        let id = sanitizeTransactionId(row.id);
        if (owners.has(id) && owners.get(id) !== key) {
          id = "import_" + (await sha256Hash(key + "_" + entity + "_" + id)).slice(0, 56);
        }
        if (ids.has(id) || maps[entity].has(String(row.id))) {
          throw new Error("O backup contém identificadores repetidos ou conflitantes.");
        }
        ids.add(id);
        maps[entity].set(String(row.id), id);
        const sequence = entity === "bills" ? Number(row.sequence) || Number(row.installmentNumber) || (row.ruleId && String(row.id).startsWith(row.ruleId + "_") ? Number(String(row.id).slice(row.ruleId.length + 1)) || 0 : 0) : void 0;
        validated[entity].push(
          sanitizeEntity(entity, { ...row, sequence, id, syncedWithCloud: false }, key)
        );
      }
    }
    validated.tx = validated.tx.map((tx) => ({
      ...tx,
      relatedTransactionId: tx.relatedTransactionId ? maps.tx.get(tx.relatedTransactionId) || tx.relatedTransactionId : ""
    }));
    validated.bills = validated.bills.map((b) => ({
      ...b,
      ruleId: maps.rules.get(b.ruleId) || b.ruleId,
      transactionId: b.transactionId ? maps.tx.get(b.transactionId) || b.transactionId : ""
    }));
    const changes = Object.entries(validated).flatMap(
      ([entity, list]) => list.map((item) => [entity, item])
    );
    if (!changes.length) {
      throw new Error("Este backup está vazio.");
    }
    validateFinancialGraph(mergedFinancialState(changes));
    if (!await confirmAction(
      "Restaurar backup validado?",
      `Serão mesclados ${validated.tx.length} lançamento(s), ${validated.bills.length} conta(s) e ${validated.rules.length} programação(ões). Pagamentos e estornos foram conferidos. IDs iguais serão atualizados e os demais registros serão mantidos. Uma cópia local será feita antes.`,
      "Restaurar"
    )) {
      return;
    }
    await autoSnapshot(true);
    await commitEntities(changes, [], { validateGraph: true });
    await ensurePlannedBills();
    render();
    toast("Backup restaurado com pagamentos e estornos consistentes.");
  }

  // src/js/application/events.js
  async function changeMonth(delta, absolute = null, options = {}) {
    const date = absolute || new Date(state.selectedYear, state.selectedMonth + delta, 1);
    if (date.getFullYear() < 1900 || date.getFullYear() > 2200) {
      return;
    }
    state.selectedYear = date.getFullYear();
    state.selectedMonth = date.getMonth();
    if (!options.keepReportWindow) {
      alignReportWindow();
    }
    render();
    if (state.view === "contas" || state.view === "inicio") {
      await ensurePlannedBills();
    }
  }
  async function runAction(button) {
    const action = button.dataset.action, id = button.dataset.id;
    if (action === "new") {
      openComposer();
    } else if (action === "new-bill") {
      openComposer("manual", true);
    } else if (action === "settings") {
      renderSettings();
      $("profileName").value = state.loggedAccount.displayName;
      $("settingsDialog").showModal();
    } else if (action === "edit-tx") {
      openEditor(id);
    } else if (action === "edit-bill") {
      openEditor(id, true);
    } else if (action === "pay-bill") {
      await payBill(id);
    } else if (action === "cancel-bill") {
      await cancelBill(id);
    } else if (action === "stop-rule") {
      await stopRule(id);
    } else if (action === "manage-rule") {
      openPurchase(id);
    } else if (action === "remove-draft") {
      const remaining = state.draftItems.filter((t) => t.id !== id);
      state.draftItems = remaining;
      document.querySelector(`[data-draft-id="${CSS.escape(id)}"]`)?.remove();
      $("previewPanel").hidden = !remaining.length;
      $("confirmPreview").innerHTML = icon("check") + (remaining.length > 1 ? `Confirmar ${remaining.length} registros` : remaining[0]?.kind === "installment" ? "Confirmar parcelamento" : "Confirmar lançamento");
    } else if (action === "download-snapshot") {
      const snapshot = state.snapshots.find((s) => s.id === id);
      if (snapshot) {
        download(
          JSON.stringify(snapshot.payload, null, 2),
          `financas-copia-${new Date(snapshot.createdAt).toISOString().slice(0, 10)}.json`,
          "application/json;charset=utf-8"
        );
      }
    } else if (action === "chart-month") {
      await changeMonth(0, new Date(Number(button.dataset.year), Number(button.dataset.month), 1), {
        keepReportWindow: true
      });
    } else if (action === "report-period-prev") {
      await shiftReportPeriod(-1);
    } else if (action === "report-period-next") {
      await shiftReportPeriod(1);
    } else if (action === "report-today") {
      await resetReportPeriod();
    } else if (action === "export-report") {
      exportReportCSV();
    }
  }
  function bindEvents() {
    bindAuthRecovery();
    bindProfileEvents();
    $("tabLoginBtn").addEventListener("click", () => {
      switchAuthTab("login");
      $("authIdentifier").focus();
    });
    $("tabRegisterBtn").addEventListener("click", () => {
      switchAuthTab("register");
      $("authName").focus();
    });
    $("authForm").addEventListener("submit", handleAuth);
    $("btnTogglePassword").addEventListener("click", () => {
      const show = $("authPassword").type === "password";
      $("authPassword").type = show ? "text" : "password";
      $("btnTogglePassword").setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha");
      $("btnTogglePassword").innerHTML = icon(show ? "eye-off" : "eye");
    });
    $("themeButton").addEventListener("click", () => cycleTheme().catch(showError));
    $("authThemeButton").addEventListener("click", () => cycleTheme().catch(showError));
    $("themeSelect").addEventListener("change", () => {
      applyTheme($("themeSelect").value);
      void savePreference().catch(showError);
    });
    themeMedia?.addEventListener("change", () => {
      if (state.themePreference === "auto") {
        applyTheme("auto");
      }
    });
    $("balanceModeSelect").addEventListener("change", async () => {
      state.balanceMode = $("balanceModeSelect").value;
      render();
      try {
        await savePreference();
      } catch (e) {
        showError(e);
      }
    });
    $("privacyButton").addEventListener("click", () => {
      state.hideValues = !state.hideValues;
      render();
      void savePreference().catch(showError);
    });
    $("btnPrevMonth").addEventListener("click", () => changeMonth(-1).catch(showError));
    $("btnNextMonth").addEventListener("click", () => changeMonth(1).catch(showError));
    $("btnCurrentMonth").addEventListener("click", () => resetReportPeriod().catch(showError));
    $("reportSpan").addEventListener("change", () => {
      state.reportSpan = Number($("reportSpan").value) === 12 ? 12 : 6;
      alignReportWindow();
      renderReports();
    });
    $("forecastSpan").addEventListener("change", () => {
      state.forecastSpan = Number($("forecastSpan").value) === 12 ? 12 : 6;
      renderForecast();
    });
    $("trendChart").addEventListener("keydown", async (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) {
        return;
      }
      const button = event.target.closest(".chart-month");
      if (!button) {
        return;
      }
      const items = [...$("trendChart").querySelectorAll(".chart-month")], target = items[items.indexOf(button) + (event.key === "ArrowRight" ? 1 : -1)];
      if (!target) {
        return;
      }
      event.preventDefault();
      const year = target.dataset.year, month = target.dataset.month;
      try {
        await runAction(target);
        $("trendChart").querySelector(`[data-year="${year}"][data-month="${month}"]`)?.focus();
      } catch (e) {
        showError(e);
      }
    });
    $("searchInput").addEventListener("input", (event) => {
      state.searchQuery = event.target.value;
      renderStatement();
    });
    $("typeFilterTabs").addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (button) {
        state.filterType = button.dataset.filter;
        renderStatement();
      }
    });
    $("billFilterTabs").addEventListener("click", (event) => {
      const button = event.target.closest("[data-bill-filter]");
      if (button) {
        state.billFilter = button.dataset.billFilter;
        renderBills();
      }
    });
    $("composerTabs").addEventListener("click", (event) => {
      const button = event.target.closest("[data-compose]");
      if (button) {
        setComposerTab(button.dataset.compose);
      }
    });
    $("commandForm").addEventListener("submit", (event) => {
      try {
        void prepareDraft(event).catch(showError);
      } catch (e) {
        showError(e);
      }
    });
    $("commandInput").addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        $("commandForm").requestSubmit();
        event.preventDefault();
      }
    });
    $("commandInput").addEventListener("input", () => {
      if (!state.isRecording) {
        state.inputSource = "text";
      }
    });
    $("btnMic").addEventListener("click", () => {
      state.inputSource = "voice";
      $("composerError").hidden = true;
    });
    $("cancelPreview").addEventListener("click", () => {
      state.draftItems = [];
      $("previewPanel").hidden = true;
      $("draftList").replaceChildren();
    });
    $("confirmPreview").addEventListener("click", confirmDraft);
    $("draftList").addEventListener("change", (event) => {
      if (event.target.dataset.draftField === "type") {
        const card = event.target.closest("[data-draft-id]");
        card.querySelector('[data-draft-field="category"]').innerHTML = categoryOptions(
          event.target.value
        );
      }
    });
    $("draftList").addEventListener("input", (event) => {
      const card = event.target.closest('[data-draft-kind="installment"]');
      if (card) {
        refreshInstallmentSummary(card);
      }
    });
    $("manualForm").addEventListener("submit", saveManual);
    document.querySelectorAll('input[name="manualType"]').forEach(
      (input) => input.addEventListener("change", () => {
        $("manualCategory").innerHTML = categoryOptions(input.value);
        if (input.value !== "expense" && $("manualFrequency").value === "installment") {
          $("manualFrequency").value = "monthly";
        }
        updateScheduleFields();
      })
    );
    for (const id of ["manualFrequency", "manualInstallments", "manualAmount"]) {
      $(id).addEventListener("input", updateScheduleFields);
    }
    $("manualStatus").addEventListener("change", editorPaymentFields);
    $("refundEditedTransaction").addEventListener(
      "click",
      () => openRefund($("refundEditedTransaction").dataset.id)
    );
    $("manageEditedPurchase").addEventListener("click", () => {
      const id = $("manageEditedPurchase").dataset.id;
      $("composerDialog").close();
      openPurchase(id);
    });
    $("settlementForm").addEventListener("submit", (event) => operationSubmit(event, saveSettlement));
    $("settlementItems").addEventListener("change", refreshSettlement);
    $("settlementDiscount").addEventListener("input", refreshSettlement);
    $("refundForm").addEventListener("submit", (event) => operationSubmit(event, saveRefund));
    $("purchaseForm").addEventListener("submit", (event) => operationSubmit(event, savePurchase));
    $("cancelPurchaseForm").addEventListener(
      "submit",
      (event) => operationSubmit(event, cancelPurchase)
    );
    $("purchaseAdvance").addEventListener("click", () => {
      if (purchaseContext) {
        openSettlement(
          state.bills.filter((b) => b.ruleId === purchaseContext.id && isPending(b)).map((b) => b.id),
          true
        );
      }
    });
    $("purchaseCancel").addEventListener("click", () => {
      if (purchaseContext) {
        openCancelPurchase(purchaseContext.id);
      }
    });
    $("deleteEditedTransaction").addEventListener(
      "click",
      () => deleteTransaction($("editTransactionId").value).catch(showError)
    );
    $("btnExportJSON").addEventListener("click", () => exportBackup().catch(showError));
    $("btnExportCSV").addEventListener("click", exportCSV);
    $("inputImportJSON").addEventListener("change", async (event) => {
      const file = event.target.files[0];
      try {
        await importBackup(file);
      } catch (e) {
        showError(e);
      } finally {
        event.target.value = "";
      }
    });
    $("btnLogout").addEventListener("click", () => logout().catch(showError));
    $("btnForceSyncNow").addEventListener("click", () => syncCloud(true).catch(showError));
    $("confirmAccept").addEventListener("click", () => finishConfirm(true));
    $("confirmCancel").addEventListener("click", () => finishConfirm(false));
    $("confirmDialog").addEventListener("cancel", (event) => {
      event.preventDefault();
      finishConfirm(false);
    });
    for (const dialog of document.querySelectorAll("dialog")) {
      dialog.addEventListener("click", (event) => {
        if (event.target.closest("[data-close]")) {
          if (dialog.id === "confirmDialog") {
            finishConfirm(false);
          } else {
            dialog.close();
          }
        }
      });
      dialog.addEventListener("close", () => {
        if (dialog.id === "composerDialog") {
          Voice.stopVoiceRecording(true, false);
        }
      });
      dialog.addEventListener("cancel", (event) => {
        if (state.busy || state.isSubmittingCommand) {
          event.preventDefault();
          toast("Aguarde o salvamento terminar.", "warning");
        }
      });
    }
    document.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-action]");
      if (button) {
        if (button.disabled) {
          return;
        }
        const lock = ![
          "chart-month",
          "report-period-prev",
          "report-period-next",
          "report-today"
        ].includes(button.dataset.action);
        if (lock) {
          button.disabled = true;
        }
        try {
          await runAction(button);
        } catch (e) {
          showError(e);
        } finally {
          if (lock) {
            button.disabled = false;
          }
        }
        return;
      }
      const example = event.target.closest("[data-example]");
      if (example) {
        $("commandInput").value = example.dataset.example;
        state.inputSource = "text";
        $("commandForm").requestSubmit();
      }
    });
    window.addEventListener("hashchange", () => {
      if (state.loggedAccount) {
        setView(location.hash.slice(1));
      }
    });
    window.addEventListener("online", () => {
      renderSync();
      if (Cloud.ready) {
        queueCloudSync();
      }
    });
    window.addEventListener("offline", renderSync);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && state.loggedAccount) {
        void ensurePlannedBills().then(render).catch(showError);
        if (Cloud.ready) {
          queueCloudSync();
        }
      }
    });
    window.addEventListener("beforeunload", (event) => {
      if (state.busy) {
        event.preventDefault();
        event.returnValue = "";
      }
    });
  }
  async function boot() {
    hydrateIcons();
    applyTheme("auto");
    switchAuthTab("login");
    try {
      Voice.setupVoiceRecognition((message, type) => {
        toast(message, type === "warning" ? "warning" : "success");
        if ($("composerDialog").open) {
          $("composerError").textContent = message;
          $("composerError").hidden = false;
        }
      });
    } catch (e) {
      console.warn("Ditado indisponível:", e);
      $("btnMic").disabled = true;
    }
    bindEvents();
    try {
      const [session, guest] = await Promise.all([
        DB.get(STORE.session, "activeUser"),
        DB.get(STORE.session, "guestPreferences")
      ]);
      if (guest?.theme) {
        applyTheme(guest.theme);
      }
      if (Cloud.configured) {
        await restoreOnlineSession();
      } else if (session?.accountKey) {
        state.loggedAccount = {
          accountKey: normalizeAccountKey(session.accountKey),
          identifier: String(session.identifier || session.accountKey),
          displayName: String(session.displayName || session.identifier || "Você")
        };
        await enterAccount();
      }
      if (!state.loggedAccount) {
        $("authScreen").hidden = false;
        $("bootMessage").hidden = true;
      }
    } catch (e) {
      $("bootMessage").hidden = true;
      $("authScreen").hidden = false;
      $("authAlert").textContent = "Não foi possível abrir seus dados locais. Feche outras abas do sistema, verifique o armazenamento permitido no navegador e recarregue a página.";
      $("authAlert").hidden = false;
      console.error(e);
    }
  }

  // src/js/testing/browser-adapter.js
  function installTestAdapter() {
    Object.assign(window, {
      FF_STATE: state,
      FF_LocalDB: DB,
      FF_Finance: {
        allocatePayment,
        entryAmount,
        validateFinancialGraph,
        balanceSummary,
        forecastMonths
      },
      FF_Planning: { addMonths, buildBills, parseAmount, isValidDate, parseGeneralInput: parseGeneralInput2 },
      FF_NLP: Object.assign(Voice, {
        parseNaturalLanguageInput: (text) => parseNaturalLanguageInput(text, selectedPeriod())
      })
    });
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

  // src/js/main.js
  onLifecycle("notice", ([message, type]) => toast(message, type));
  onLifecycle("save:state", renderSync);
  onLifecycle("data:changed", render);
  onLifecycle("backups:changed", renderSettings);
  onLifecycle("sync:request", queueCloudSync);
  onLifecycle("backup:request", () => {
    void autoSnapshot().catch((error) => console.warn("Cópia diária indisponível:", error));
  });
  if (window.__FF_ENABLE_TEST_API__ === true) {
    installTestAdapter();
  }
  initInstallApp();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    void boot();
  }
})();
