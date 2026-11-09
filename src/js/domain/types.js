/**
 * Contratos dos registros persistidos. Valores monetários são reais positivos;
 * cálculos que distribuem ou totalizam dinheiro convertem para centavos inteiros.
 * @typedef {'income' | 'expense' | 'investment'} TransactionType
 * @typedef {'normal' | 'reversal'} EntryKind
 * @typedef {'pending' | 'paid' | 'cancelled'} BillStatus
 *
 * @typedef {Object} Transaction
 * @property {string} id Identificador estável, preservado ao editar.
 * @property {string} accountKey Identidade interna da conta proprietária.
 * @property {TransactionType} type
 * @property {number} amount Valor positivo em reais, com até duas casas decimais.
 * @property {string} date Data da movimentação efetiva: YYYY-MM-DD.
 * @property {string} description
 * @property {string} category
 * @property {EntryKind} [entryKind]
 * @property {string} [relatedTransactionId] Original obrigatório em um estorno.
 * @property {number} [createdAt] Instante em milissegundos.
 * @property {number} [updatedAt]
 * @property {boolean} [syncedWithCloud]
 *
 * @typedef {Object} Bill
 * @property {string} id
 * @property {string} accountKey
 * @property {TransactionType} type
 * @property {string} description
 * @property {string} category
 * @property {number} amount Valor previsto, independente do valor pago.
 * @property {string} dueDate Vencimento original: YYYY-MM-DD.
 * @property {BillStatus} status
 * @property {string} [transactionId] Lançamento efetivo quando paga.
 * @property {string} [paidAt] Data efetiva do pagamento.
 * @property {number | null} [settledAmount] Valor efetivamente pago.
 * @property {string} [ruleId] Compra ou recorrência que gerou a conta.
 * @property {number} [installmentNumber]
 * @property {number} [totalInstallments]
 * @property {number} [sequence] Índice de uma ocorrência mensal.
 * @property {string} [cancelledAt]
 *
 * @typedef {Object} RecurrenceRule
 * @property {string} id
 * @property {string} accountKey
 * @property {TransactionType} type
 * @property {string} description
 * @property {string} category
 * @property {number} amount Total da compra parcelada ou valor de cada ocorrência mensal.
 * @property {string} startDate Primeiro vencimento: YYYY-MM-DD.
 * @property {'monthly' | 'installment'} frequency
 * @property {number} totalInstallments
 * @property {string | null} [disabledAfter] Limite exclusivo para novos vencimentos.
 * @property {string} [cancelledAt]
 * @property {string} [cardName] Rótulo opcional, sem cadastro de cartão ou fatura.
 *
 * @typedef {Object} FinancialData
 * @property {Transaction[]} transactions
 * @property {Bill[]} bills
 * @property {RecurrenceRule[]} rules
 */
export {};
