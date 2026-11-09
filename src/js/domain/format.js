function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
}

function formatISO(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateBR(isoStr) {
  if (!isoStr) {
    return '';
  }
  const parts = isoStr.split('-');
  if (parts.length !== 3) {
    return isoStr;
  }
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getSafeDateForSelectedMonth(year, monthIndex, preferredDay = null) {
  const maxDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const rawDay = preferredDay !== null ? preferredDay : new Date().getDate();
  const safeDay = Math.min(Math.max(1, rawDay), maxDaysInMonth);
  return new Date(year, monthIndex, safeDay);
}

function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeCSVCell(value) {
  let str = String(value ?? '').replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
}

function normalizeAccountKey(identifier) {
  return String(identifier || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._@-]/g, '_')
    .slice(0, 80);
}

function sanitizeTransactionId(rawId) {
  const cleanId = String(rawId || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 96);
  if (!cleanId) {
    return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
  return cleanId;
}

function today() {
  return formatISO(new Date());
}

function uid(prefix = 'tx') {
  return `${prefix}_${Date.now()}_${crypto.getRandomValues(new Uint32Array(2)).join('_')}`;
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [y, m, d] = value.split('-').map(Number);
  return y >= 1900 && y <= 2200 && m >= 1 && m <= 12 && d >= 1 && d <= new Date(y, m, 0).getDate();
}

function addMonths(date, n) {
  const [y, m, d] = date.split('-').map(Number);
  const base = new Date(y, m - 1 + n, 1);
  return formatISO(
    new Date(
      base.getFullYear(),
      base.getMonth(),
      Math.min(d, new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()),
    ),
  );
}

function dateLabel(date) {
  return new Date(date + 'T12:00:00')
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    .replace('.', '');
}

function amountInput(n) {
  return Number(n).toFixed(2).replace('.', ',');
}

function parseAmount(value) {
  let s = String(value)
    .trim()
    .replace(/R\$|\s/g, '');
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) {
    return NaN;
  }
  return Math.round(Number(s) * 100) / 100;
}

function normalizeCategory(category) {
  return category === 'Lazer & Restaurantes' ? 'Lazer & Viagens' : category;
}

function amountOK(n) {
  return Number.isFinite(n) && n >= 0.01 && n <= 999999999.99;
}

function monthIndex(year, month) {
  return year * 12 + month;
}

function reportDate(index) {
  return new Date(Math.floor(index / 12), index % 12, 1);
}

function currentPeriod() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export {
  addMonths,
  amountInput,
  amountOK,
  currentPeriod,
  dateLabel,
  escapeHTML,
  formatCurrency,
  formatDateBR,
  formatISO,
  getSafeDateForSelectedMonth,
  isValidDate,
  monthIndex,
  normalizeAccountKey,
  normalizeCategory,
  parseAmount,
  reportDate,
  sanitizeCSVCell,
  sanitizeTransactionId,
  today,
  uid,
};
