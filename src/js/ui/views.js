import {
  balanceSummary,
  billPaidAmount,
  billPaidDate,
  isBillPaid,
  isPending,
  refundableCents,
  transactionForBill,
} from '../application/finance.js';
import { renderPurchase } from '../application/operations.js';
import { ensurePlannedBills } from '../data/repository.js';
import { cents, entryAmount, isCancelled, sums } from '../domain/finance.js';
import { dateLabel, today } from '../domain/format.js';
import { Cloud } from '../services/cloud.js';
import { isoMonth, monthTransactions, realBills } from '../state/selectors.js';
import { state } from '../state/store.js';
import { $, emptyState, esc, icon, money } from './dom.js';
import { showError } from './feedback.js';
import { renderForecast } from './forecast.js';
import { alignReportWindow, renderReports } from './reports.js';

const viewInfo = {
  inicio: ['Visão geral', 'Um olhar tranquilo para as suas finanças.'],
  lancamentos: ['Lançamentos', 'Tudo o que entrou, saiu ou foi investido.'],
  contas: ['Suas próximas contas', 'Organize vencimentos, mensalidades e parcelas.'],
  relatorios: ['Seu dinheiro em perspectiva', 'Entenda os movimentos e acompanhe sua evolução.'],
};

function setView(view, focus = true) {
  state.view = viewInfo[view] ? view : 'inicio';
  for (const key of Object.keys(viewInfo)) {
    $('view-' + key).hidden = key !== state.view;
  }
  document.querySelectorAll('[data-view]').forEach((link) => {
    const on = link.dataset.view === state.view;
    link.classList.toggle('active', on);
    if (on) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
  $('pageTitle').textContent = viewInfo[state.view][0];
  $('pageSubtitle').textContent = viewInfo[state.view][1];
  $('periodHint').textContent =
    state.view === 'contas' ? 'Vencimentos do mês' : 'Movimentações realizadas';
  if (state.view === 'relatorios') {
    alignReportWindow();
  }
  render();
  if (focus) {
    $('pageTitle').setAttribute('tabindex', '-1');
  }
  if (focus) {
    $('pageTitle').focus({ preventScroll: true });
  }
  if (state.view === 'contas') {
    void ensurePlannedBills().catch(showError);
  }
}

function render() {
  if (!state.loggedAccount) {
    return;
  }
  $('currentMonthLabel').textContent = new Date(
    state.selectedYear,
    state.selectedMonth,
    1,
  ).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  $('btnCurrentMonth').hidden =
    state.selectedYear === new Date().getFullYear() &&
    state.selectedMonth === new Date().getMonth();
  const name = state.loggedAccount.displayName;
  $('loggedUserDisplay').textContent = name.split(' ')[0];
  $('userAvatar').textContent = name[0]?.toUpperCase() || 'F';
  document.body.classList.toggle('hidden-values', state.hideValues);
  $('privacyButton').innerHTML = icon(state.hideValues ? 'eye-off' : 'eye');
  $('privacyButton').setAttribute(
    'aria-label',
    state.hideValues ? 'Mostrar valores' : 'Ocultar valores',
  );
  $('privacyButton').setAttribute('aria-pressed', String(state.hideValues));
  const overdue = realBills().filter((b) => !isBillPaid(b) && b.dueDate < today()).length;
  $('dueBadge').hidden = !overdue;
  $('dueBadge').textContent = overdue;
  renderHome();
  renderStatement();
  renderBills();
  renderForecast();
  renderReports();
  renderSync();
  if ($('purchaseDialog').open) {
    renderPurchase();
  }
  if ($('settingsDialog').open) {
    renderSettings();
  }
}

function renderHome() {
  const month = monthTransactions(),
    sum = sums(month),
    balances = balanceSummary();
  const balance = balances.total;
  const cards = [
    [
      'balance',
      'Saldo total hoje',
      balance,
      state.balanceMode === 'integrated'
        ? 'Acumulado até hoje, descontando aportes'
        : 'Acumulado até hoje, investimentos separados',
      'wallet',
    ],
    [
      'income',
      'Entradas do mês',
      sum.income,
      `${month.filter((t) => t.type === 'income').length} recebimento(s)`,
      'arrow-down',
    ],
    [
      'expense',
      'Saídas do mês',
      sum.expense,
      `${month.filter((t) => t.type === 'expense').length} despesa(s), sem investimentos`,
      'arrow-up',
    ],
    [
      'investment',
      'Investido no mês',
      sum.investment,
      `Acumulado até hoje: ${money(balances.investmentToDate)}`,
      'leaf',
    ],
  ];
  $('summaryCards').innerHTML = cards
    .map(
      ([type, label, value, caption, name]) =>
        /* HTML */ `<article class="summary-card ${type}">
          <div class="metric-label">
            <span>${label}</span><span class="metric-icon">${icon(name)}</span>
          </div>
          <div class="metric-value money" ${type === 'balance' ? ' id="totalBalanceValue"' : ''}>
            ${money(value)}
          </div>
          <p class="metric-caption">${esc(caption)}</p>
        </article>`,
    )
    .join('');
  $('monthlyBalancePeriod').textContent = new Date(
    state.selectedYear,
    state.selectedMonth,
    1,
  ).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  $('monthlyBalanceValue').textContent = money(balances.month);
  $('monthlyBalanceValue').classList.toggle('negative', balances.month < 0);
  $('monthlyBalanceFormula').textContent =
    state.balanceMode === 'integrated'
      ? 'Entradas − saídas − aportes do mês'
      : 'Entradas − saídas do mês, com investimentos separados';
  const horizon = isoMonth() + '-31';
  const next = realBills()
    .filter((b) => !isBillPaid(b) && b.dueDate <= horizon)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);
  $('homeBills').innerHTML = next.length
    ? next.map((b) => billRow(b, true)).join('')
    : emptyState(
        'calendar',
        'Nenhuma conta pendente por aqui',
        'Agende contas e mensalidades para acompanhar os próximos vencimentos.',
        'new-bill',
        'Agendar conta',
      );
  const recent = [...month]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .slice(0, 5);
  $('homeTransactions').innerHTML = recent.length
    ? recent.map((t) => transactionRow(t, true)).join('')
    : emptyState(
        'wallet',
        'Seu mês começa aqui',
        'Registre uma entrada, uma despesa ou um investimento.',
        'new',
      );
  const unpaid = realBills().filter(
    (b) => !isBillPaid(b) && b.type === 'expense' && b.dueDate.startsWith(isoMonth()),
  );
  $('homeInsight').innerHTML =
    icon(unpaid.length ? 'calendar' : 'sparkles') +
    /* HTML */ `<p>
        ${unpaid.length ? `Você tem <strong>${unpaid.length} conta(s)</strong> pendente(s) neste mês, somando <strong>${money(unpaid.reduce((s, b) => s + b.amount, 0))}</strong>.` : 'Seu próximo passo pode ser simples: registre os pequenos gastos para enxergar o mês por inteiro.'}
      </p>
      <a href="${unpaid.length ? '#contas' : '#relatorios'}" class="text-button"
        >${unpaid.length ? 'Organizar contas' : 'Ver relatórios'} ${icon('arrow-right')}</a
      >`;
}

function transactionRow(t, compact = false) {
  const names = { expense: 'Despesa', income: 'Receita', investment: 'Investimento' },
    delta = (t.type === 'income' ? 1 : -1) * entryAmount(t),
    symbol = delta >= 0 ? '+' : '−',
    reversal = t.entryKind === 'reversal';
  return /* HTML */ `<button
    class="transaction-row"
    data-action="edit-tx"
    data-id="${esc(t.id)}"
    aria-label="Editar ${esc(t.description)}, ${money(t.amount)}"
  >
    <span class="category-icon ${delta >= 0 ? 'income' : t.type}"
      >${icon(reversal ? 'undo' : t.type === 'income' ? 'arrow-down' : t.type === 'investment' ? 'leaf' : 'bag')}</span
    ><span class="row-description"
      ><span class="row-title">${esc(t.description)}</span
      ><span class="row-subtitle"
        >${esc(t.category)}${compact ? ' · ' + dateLabel(t.date) : ' <span class="tag ' + t.type + '">' + names[t.type] + '</span>'}${reversal ? '<span class="tag warning">Estorno</span>' : ''}</span
      ></span
    ><span class="row-value money ${delta >= 0 ? 'income' : t.type}"
      >${symbol} ${money(t.amount)}</span
    >${icon('chevron-right').replace('class="icon"', 'class="icon row-chevron"')}
  </button>`;
}

function renderStatement() {
  const search = state.searchQuery.toLocaleLowerCase('pt-BR');
  const items = monthTransactions()
    .filter(
      (t) =>
        (state.filterType === 'all' || t.type === state.filterType) &&
        (!search || (t.description + ' ' + t.category).toLocaleLowerCase('pt-BR').includes(search)),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  document.querySelectorAll('[data-filter]').forEach((b) => {
    const active = b.dataset.filter === state.filterType;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', String(active));
  });
  $('transactionsCountLabel').textContent =
    `${items.length} lançamento(s) ${search ? 'encontrado(s)' : 'neste mês'}`;
  if (!items.length) {
    $('transactionsListContainer').innerHTML = emptyState(
      'search',
      search || state.filterType !== 'all' ? 'Nenhum resultado' : 'Ainda sem lançamentos',
      search
        ? 'Tente outra descrição ou categoria.'
        : 'Os lançamentos confirmados aparecerão aqui.',
      search ? '' : 'new',
    );
    return;
  }
  const grouped = new Map();
  for (const t of items) {
    if (!grouped.has(t.date)) {
      grouped.set(t.date, []);
    }
    grouped.get(t.date).push(t);
  }
  $('transactionsListContainer').innerHTML = [...grouped]
    .map(([date, list]) => {
      const daySum = sums(list);
      const value = daySum.income - daySum.expense - daySum.investment;
      return (
        /* HTML */ `<div class="day-heading"><span>${date === today() ? 'Hoje · ' : ''}${new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'long' })}</span><span class="money">${money(value)}</span></div>` +
        list.map((t) => transactionRow(t)).join('')
      );
    })
    .join('');
}

function billRow(bill, compact = false) {
  const paid = isBillPaid(bill),
    cancelled = isCancelled(bill),
    overdue = isPending(bill) && bill.dueDate < today(),
    tx = transactionForBill(bill),
    refunded = tx && refundableCents(tx) < cents(tx.amount);
  const installment = bill.totalInstallments
    ? '<span class="tag">' + bill.installmentNumber + ' de ' + bill.totalInstallments + '</span>'
    : bill.ruleId
      ? '<span class="tag">Mensal</span>'
      : '';
  const status = cancelled
    ? '<span class="tag">Cancelada</span>'
    : paid
      ? '<span class="tag income">' + (bill.type === 'income' ? 'Recebido' : 'Pago') + '</span>'
      : overdue
        ? '<span class="tag expense">Atrasada</span>'
        : '<span class="tag warning">A vencer</span>';
  return /* HTML */ `<div class="bill-row">
    <span class="category-icon ${bill.type}"
      >${icon(bill.totalInstallments ? 'card' : 'calendar')}</span
    ><button
      class="row-description row-text"
      data-action="edit-bill"
      data-id="${esc(bill.id)}"
      aria-label="Editar conta ${esc(bill.description)}"
    >
      <span class="row-title">${esc(bill.description)}</span
      ><span class="row-subtitle"
        >Vence: ${dateLabel(bill.dueDate)} ${installment} ${status}
        ${paid ? ' · pago em ' + dateLabel(billPaidDate(bill)) : ''}${refunded ? ' <span class="tag warning">' + (refundableCents(tx) === 0 ? 'Estornado' : 'Estorno parcial') + '</span>' : ''}${bill.cardName ? ' <span class="tag">' + esc(bill.cardName) + '</span>' : ''}</span
      ></button
    ><span class="row-value money">${money(paid ? billPaidAmount(bill) : bill.amount)}</span>
    <div class="bill-actions">
      ${isPending(bill) ? '<button class="button ' + (overdue ? 'primary' : 'secondary') + '" data-action="pay-bill" data-id="' + esc(bill.id) + '">' + (bill.type === 'income' ? 'Recebi' : 'Pagar') + '</button>' + (!compact ? '<button class="icon-button" data-action="cancel-bill" data-id="' + esc(bill.id) + '" aria-label="Cancelar ' + esc(bill.description) + '">' + icon('x') + '</button>' : '') : paid ? '<button class="icon-button" data-action="edit-tx" data-id="' + esc(tx.id) + '" aria-label="Editar pagamento de ' + esc(bill.description) + '">' + icon('edit') + '</button>' : ''}
    </div>
  </div>`;
}

function renderBills() {
  const prefix = isoMonth(),
    all = state.bills,
    month = all.filter((b) => b.dueDate.startsWith(prefix)),
    pending = month.filter(isPending),
    overdue = all.filter((b) => isPending(b) && b.dueDate < today()),
    paid = all.filter((b) => isBillPaid(b) && billPaidDate(b).startsWith(prefix));
  $('billSummary').innerHTML = [
    ['', 'A pagar no mês', pending.filter((b) => b.type !== 'income'), false],
    ['danger', 'Total em atraso', overdue, false],
    ['success', 'Pago / recebido no mês', paid, true],
  ]
    .map(
      ([cls, label, list, usePaid]) =>
        '<article class="mini-card ' +
        cls +
        '"><span>' +
        label +
        '</span><strong class="money">' +
        money(list.reduce((sum, b) => sum + (usePaid ? billPaidAmount(b) : b.amount), 0)) +
        '</strong><small>' +
        list.length +
        ' conta(s) · ' +
        (usePaid ? 'pela data do pagamento' : 'pela data do vencimento') +
        '</small></article>',
    )
    .join('');
  let items =
    state.billFilter === 'overdue'
      ? overdue
      : state.billFilter === 'paid'
        ? paid
        : state.billFilter === 'cancelled'
          ? month.filter(isCancelled)
          : state.billFilter === 'all'
            ? all.filter(
                (b) =>
                  b.dueDate.startsWith(prefix) ||
                  (isBillPaid(b) && billPaidDate(b).startsWith(prefix)),
              )
            : month.filter((b) => isPending(b) && b.dueDate >= today());
  items = [...items].sort(
    (a, b) =>
      (state.billFilter === 'paid'
        ? billPaidDate(a).localeCompare(billPaidDate(b))
        : a.dueDate.localeCompare(b.dueDate)) || a.description.localeCompare(b.description),
  );
  document.querySelectorAll('[data-bill-filter]').forEach((button) => {
    const on = button.dataset.billFilter === state.billFilter;
    button.classList.toggle('active', on);
    button.setAttribute('aria-pressed', String(on));
  });
  const message =
    state.billFilter === 'overdue'
      ? ['Tudo em dia', 'Nenhuma conta vencida pendente.']
      : state.billFilter === 'paid'
        ? [
            'Nenhum pagamento neste mês',
            'Os pagamentos aparecem pela data em que o dinheiro entrou ou saiu.',
          ]
        : state.billFilter === 'cancelled'
          ? [
              'Nenhuma conta cancelada',
              'Contas canceladas continuam disponíveis para consulta e edição.',
            ]
          : ['Nenhuma conta neste filtro', 'Agende uma conta ou escolha outro mês.'];
  $('billsList').innerHTML = items.length
    ? items.map((b) => billRow(b)).join('')
    : emptyState(
        'calendar',
        message[0],
        message[1],
        state.billFilter === 'cancelled' ? '' : 'new-bill',
        'Agendar conta',
      );
  const rules = [...state.rules].sort((a, b) => b.createdAt - a.createdAt);
  $('rulesList').innerHTML = rules.length
    ? rules
        .map((rule) => {
          const pending = state.bills.filter((b) => b.ruleId === rule.id && isPending(b)),
            label = rule.cancelledAt
              ? 'Cancelada'
              : rule.disabledAfter
                ? 'Encerrada'
                : pending.length || rule.frequency === 'monthly'
                  ? 'Ativa'
                  : 'Concluída';
          return (
            '<div class="rule-row"><button class="row-description row-text" data-action="manage-rule" data-id="' +
            esc(rule.id) +
            '"><span class="row-title">' +
            esc(rule.description) +
            '</span><span class="row-subtitle">' +
            (rule.frequency === 'monthly' ? 'Todo mês' : rule.totalInstallments + ' parcelas') +
            ' · ' +
            pending.length +
            ' pendente(s) <span class="tag">' +
            label +
            '</span></span></button><div class="rule-actions"><button class="text-button" data-action="manage-rule" data-id="' +
            esc(rule.id) +
            '">Gerenciar</button>' +
            (!rule.cancelledAt && !rule.disabledAfter && rule.frequency === 'monthly'
              ? '<button class="text-button danger-text" data-action="stop-rule" data-id="' +
                esc(rule.id) +
                '">Encerrar</button>'
              : '') +
            '</div></div>'
          );
        })
        .join('')
    : emptyState(
        'repeat',
        'Sem compras ou recorrências',
        'Ao cadastrar uma conta, escolha “Todo mês” ou “Compra parcelada”.',
      );
}

function renderBreakdown(type, items, total, id, badge) {
  $(badge).textContent = money(total);
  const group = Object.entries(
    items.reduce((a, t) => {
      a[t.category] = (a[t.category] || 0) + entryAmount(t);
      return a;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  $(id).innerHTML = group.length
    ? group
        .map(([category, value]) => {
          const pct = total ? Math.round(Math.abs(value / total) * 100) : 0;
          return /* HTML */ `<div class="breakdown-row">
            <div>
              <span>${esc(category)}</span
              ><strong class="money"
                >${money(value)}
                <small
                  >${state.hideValues ? '' : value < 0 ? 'estorno' : total > 0 ? pct + '%' : ''}</small
                ></strong
              >
            </div>
            <div
              class="progress"
              role="img"
              aria-label="${esc(category)}: ${state.hideValues ? 'valor oculto' : pct + '%'}"
            >
              <span
                style="width:${Math.min(100, pct)}%;background:${type === 'investment' ? 'var(--purple)' : 'var(--primary)'}"
              ></span>
            </div>
          </div>`;
        })
        .join('')
    : emptyState(
        type === 'expense' ? 'bag' : 'leaf',
        'Nenhum registro neste mês',
        type === 'expense'
          ? 'As categorias aparecem ao registrar suas despesas.'
          : 'Seus investimentos ficam separados dos gastos.',
      );
}

function renderSync() {
  if (!$('dbStatusBadge')) {
    return;
  }
  let text = 'Salvo neste aparelho',
    cls = '';
  if (state.busy) {
    text = 'Salvando…';
    cls = 'saving';
  } else if (state.saveError) {
    text = state.saveError;
    cls = 'error';
  } else if (state.syncBusy) {
    text = 'Sincronizando…';
    cls = 'saving';
  } else if (Cloud.configured && state.syncError) {
    text = 'Salvo no aparelho · sincronização pendente';
    cls = 'pending';
  } else if (Cloud.configured && !navigator.onLine) {
    text = 'Sem conexão · salvo no aparelho';
    cls = 'pending';
  } else if (Cloud.ready && state.pendingCount) {
    text = `Salvo · ${state.pendingCount} alteração(ões) na fila`;
    cls = 'pending';
  } else if (Cloud.ready && state.lastSync) {
    text = 'Sincronizado';
  }
  $('syncStatusText').textContent = text;
  $('dbStatusBadge').className = 'sync-status ' + cls;
  const latest = state.snapshots[0];
  $('backupFooter').textContent = latest
    ? `Cópia local · ${new Date(latest.createdAt).toLocaleDateString('pt-BR')}`
    : 'Ver backup e proteção dos dados';
}

function renderSettings() {
  if (!state.loggedAccount) {
    return;
  }
  $('settingsName').textContent = state.loggedAccount.displayName;
  $('settingsIdentifier').textContent = state.loggedAccount.identifier;
  $('settingsAvatar').textContent = state.loggedAccount.displayName[0]?.toUpperCase() || 'F';
  $('themeSelect').value = state.themePreference;
  $('balanceModeSelect').value = state.balanceMode;
  $('syncDetail').textContent = Cloud.configured
    ? state.syncError
      ? 'Seus dados estão salvos neste aparelho. A conexão com a nuvem precisa ser retomada; tentaremos novamente quando houver conexão.'
      : `As alterações são guardadas primeiro neste aparelho e enviadas à nuvem. ${state.pendingCount ? state.pendingCount + ' alteração(ões) aguardando envio.' : 'Nenhuma alteração na fila.'}`
    : 'Este projeto está funcionando no modo local. Para transferir seus dados para outro aparelho, exporte e restaure um backup. A sincronização automática depende da ativação da nuvem na instalação.';
  $('lastSyncLabel').textContent = state.lastSync
    ? 'Última sincronização: ' + new Date(state.lastSync).toLocaleString('pt-BR')
    : 'Ainda não houve sincronização com a nuvem.';
  $('btnForceSyncNow').disabled = !Cloud.configured || state.syncBusy;
  $('btnForceSyncNow').innerHTML =
    icon('refresh') + (state.syncBusy ? 'Sincronizando…' : 'Tentar sincronizar');
  $('lastExportLabel').textContent = state.lastExport
    ? 'Último backup exportado: ' + new Date(state.lastExport).toLocaleString('pt-BR')
    : 'Você ainda não exportou um backup nesta conta.';
  $('snapshotsList').innerHTML = state.snapshots.length
    ? '<p class="small muted">Cópias locais disponíveis</p>' +
      state.snapshots
        .map(
          (s) =>
            /* HTML */ `<div class="snapshot-row">
              <span
                >${esc(s.label)} ·
                ${new Date(s.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span
              ><button class="text-button" data-action="download-snapshot" data-id="${esc(s.id)}">
                Baixar
              </button>
            </div>`,
        )
        .join('')
    : '<p class="small muted">A primeira cópia diária será criada após seus primeiros registros.</p>';
}

export {
  render,
  renderBills,
  renderBreakdown,
  renderSettings,
  renderStatement,
  renderSync,
  setView,
};
