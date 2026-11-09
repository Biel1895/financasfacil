import { installmentDraftPlan } from '../application/installments.js';
import { amountInput, formatDateBR, parseAmount, today } from '../domain/format.js';
import { categoryOptions, esc, icon, money } from './dom.js';

function installmentSummaryHTML(item) {
  try {
    const { bills } = installmentDraftPlan(item);
    const first = bills[0],
      last = bills.at(-1),
      equal = bills.every((b) => b.amount === first.amount);
    return /* HTML */ `<div class="installment-total">
        <span>${item.installments} parcelas · total ${money(item.amount)}</span
        ><strong
          >${equal ? `${item.installments} × ${money(first.amount)}` : `Parcelas de ${money(last.amount)} a ${money(first.amount)}`}</strong
        >
      </div>
      <p class="field-hint">
        Primeiro vencimento em ${formatDateBR(first.dueDate)}.
        ${item.firstPaid ? 'A primeira parcela será registrada como paga.' : 'As parcelas ficam pendentes; o total não será descontado de uma só vez.'}
      </p>
      <details class="installment-details">
        <summary>Conferir as ${bills.length} parcelas</summary>
        <ol>
          ${bills.map((b) => /* HTML */ `<li><span>${b.installmentNumber}/${b.totalInstallments} · ${formatDateBR(b.dueDate)}</span><strong>${money(b.amount)}</strong></li>`).join('')}
        </ol>
      </details>`;
  } catch {
    return '<p class="field-hint">Preencha o total, a quantidade de parcelas e o primeiro vencimento para conferir a divisão.</p>';
  }
}

function renderInstallmentCard(item, index) {
  return /* HTML */ `<div
    class="draft-card installment-draft"
    data-draft-id="${esc(item.id)}"
    data-draft-kind="installment"
  >
    <div class="draft-header">
      <strong>${icon('card')} Compra parcelada ${index + 1}</strong
      ><button
        class="icon-button"
        data-action="remove-draft"
        data-id="${esc(item.id)}"
        aria-label="Remover compra ${index + 1}"
      >
        ${icon('x')}
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
          ${categoryOptions('expense', item.category)}
        </select></label
      >
    </div>
    <label
      >Cartão (opcional)<input
        data-draft-field="cardName"
        maxlength="60"
        placeholder="Ex.: Nubank, Itaú"
        value="${esc(item.cardName || '')}" /></label
    ><label class="checkbox"
      ><input data-draft-field="firstPaid" type="checkbox" ${item.firstPaid ? 'checked' : ''} />A
      primeira parcela já foi paga</label
    ><label data-first-paid-date-wrap ${item.firstPaid ? '' : 'hidden'}
      >Data do primeiro pagamento<input
        data-draft-field="firstPaidDate"
        type="date"
        min="1900-01-01"
        max="${today()}"
        value="${esc(item.firstPaidDate || today())}"
    /></label>
    <div data-installment-summary class="installment-summary">${installmentSummaryHTML(item)}</div>
  </div>`;
}

function refreshInstallmentSummary(card) {
  const get = (field) => card.querySelector(`[data-draft-field="${field}"]`);
  const item = {
    id: card.dataset.draftId,
    kind: 'installment',
    type: 'expense',
    description: get('description').value || 'Compra parcelada',
    amount: parseAmount(get('amount').value),
    date: get('date').value,
    category: get('category').value,
    installments: Number(get('installments').value),
    cardName: get('cardName').value,
    firstPaid: get('firstPaid').checked,
  };
  card.querySelector('[data-first-paid-date-wrap]').hidden = !item.firstPaid;
  card.querySelector('[data-installment-summary]').innerHTML = installmentSummaryHTML(item);
}

export { refreshInstallmentSummary, renderInstallmentCard };
