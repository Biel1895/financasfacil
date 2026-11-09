import { autoSnapshot } from '../data/backups.js';
import { commitEntities, ensurePlannedBills, entities } from '../data/repository.js';
import { validateFinancialGraph } from '../domain/finance.js';
import { amountOK, isValidDate, sanitizeTransactionId } from '../domain/format.js';
import { sanitizeEntity } from '../domain/records.js';
import { sha256Hash } from '../infrastructure/credentials.js';
import { DB } from '../infrastructure/database.js';
import { mergedFinancialState } from '../state/selectors.js';
import { account } from '../state/store.js';
import { confirmAction, toast } from '../ui/feedback.js';
import { render } from '../ui/views.js';

async function importBackup(file) {
  if (!file) {
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Escolha um backup de até 20 MB.');
  }
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error('Este arquivo não é um backup JSON válido.');
  }
  if (
    !data ||
    typeof data !== 'object' ||
    (data.application && data.application !== 'FinancasFacil') ||
    Number(data.schemaVersion) > 3
  ) {
    throw new Error('O formato ou a versão deste backup não é compatível.');
  }
  const raw = {
    tx: Array.isArray(data) ? data : data.transactions,
    bills: data.bills === undefined ? [] : data.bills,
    rules: data.rules === undefined ? [] : data.rules,
  };
  if (
    !Array.isArray(raw.tx) ||
    !Array.isArray(raw.bills) ||
    !Array.isArray(raw.rules) ||
    raw.tx.length + raw.bills.length + raw.rules.length > 50000
  ) {
    throw new Error('O backup não tem listas válidas ou ultrapassa 50 mil registros.');
  }
  const key = account(),
    maps = { tx: new Map(), bills: new Map(), rules: new Map() },
    validated = { tx: [], bills: [], rules: [] };
  for (const entity of ['tx', 'bills', 'rules']) {
    const owners = new Map((await DB.getAll(entities[entity])).map((t) => [t.id, t.accountKey])),
      ids = new Set();
    for (const row of raw[entity]) {
      if (!row || typeof row !== 'object' || !row.id) {
        throw new Error('Há um registro sem identificador válido. Nenhuma alteração foi feita.');
      }
      if (entity === 'tx' && row.entryKind && !['normal', 'reversal'].includes(row.entryKind)) {
        throw new Error('O backup contém um tipo de movimentação desconhecido.');
      }
      if (entity === 'bills') {
        if (row.status && !['pending', 'paid', 'cancelled'].includes(row.status)) {
          throw new Error('O backup contém uma situação de pagamento desconhecida.');
        }
        if (
          (row.paidAt && !isValidDate(row.paidAt)) ||
          (row.cancelledAt && !isValidDate(row.cancelledAt))
        ) {
          throw new Error('O backup contém uma data de pagamento ou cancelamento inválida.');
        }
        if (
          row.settledAmount !== null &&
          row.settledAmount !== undefined &&
          !amountOK(Number(row.settledAmount))
        ) {
          throw new Error('O backup contém um valor pago inválido.');
        }
      }
      let id = sanitizeTransactionId(row.id);
      if (owners.has(id) && owners.get(id) !== key) {
        id = 'import_' + (await sha256Hash(key + '_' + entity + '_' + id)).slice(0, 56);
      }
      if (ids.has(id) || maps[entity].has(String(row.id))) {
        throw new Error('O backup contém identificadores repetidos ou conflitantes.');
      }
      ids.add(id);
      maps[entity].set(String(row.id), id);
      const sequence =
        entity === 'bills'
          ? Number(row.sequence) ||
            Number(row.installmentNumber) ||
            (row.ruleId && String(row.id).startsWith(row.ruleId + '_')
              ? Number(String(row.id).slice(row.ruleId.length + 1)) || 0
              : 0)
          : undefined;
      validated[entity].push(
        sanitizeEntity(entity, { ...row, sequence, id, syncedWithCloud: false }, key),
      );
    }
  }
  validated.tx = validated.tx.map((tx) => ({
    ...tx,
    relatedTransactionId: tx.relatedTransactionId
      ? maps.tx.get(tx.relatedTransactionId) || tx.relatedTransactionId
      : '',
  }));
  validated.bills = validated.bills.map((b) => ({
    ...b,
    ruleId: maps.rules.get(b.ruleId) || b.ruleId,
    transactionId: b.transactionId ? maps.tx.get(b.transactionId) || b.transactionId : '',
  }));
  const changes = Object.entries(validated).flatMap(([entity, list]) =>
    list.map((item) => [entity, item]),
  );
  if (!changes.length) {
    throw new Error('Este backup está vazio.');
  }
  validateFinancialGraph(mergedFinancialState(changes));
  if (
    !(await confirmAction(
      'Restaurar backup validado?',
      `Serão mesclados ${validated.tx.length} lançamento(s), ${validated.bills.length} conta(s) e ${validated.rules.length} programação(ões). Pagamentos e estornos foram conferidos. IDs iguais serão atualizados e os demais registros serão mantidos. Uma cópia local será feita antes.`,
      'Restaurar',
    ))
  ) {
    return;
  }
  await autoSnapshot(true);
  await commitEntities(changes, [], { validateGraph: true });
  await ensurePlannedBills();
  render();
  toast('Backup restaurado com pagamentos e estornos consistentes.');
}

export { importBackup };
