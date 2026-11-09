import { validateFinancialGraph } from '../domain/finance.js';
import { addMonths, today, uid } from '../domain/format.js';
import { buildBills } from '../domain/planning.js';
import { sanitizeEntity } from '../domain/records.js';
import { DB, STORE } from '../infrastructure/database.js';
import { publish } from '../infrastructure/lifecycle.js';
import { isoMonth, mergedFinancialState } from '../state/selectors.js';
import { account, sessionLifecycle, state } from '../state/store.js';

const entities = { tx: STORE.tx, bills: STORE.bills, rules: STORE.rules };

let mutationQueue = Promise.resolve();

function enqueueWork(work) {
  const next = mutationQueue.then(work, work);
  mutationQueue = next.catch(() => {});
  return next;
}

async function loadAccountData() {
  const key = account(),
    generation = sessionLifecycle.generation;
  const [tx, bills, rules, backups, jobs] = await Promise.all([
    DB.getAll(STORE.tx),
    DB.getAll(STORE.bills),
    DB.getAll(STORE.rules),
    DB.getAll(STORE.backups),
    DB.getAll(STORE.outbox),
  ]);
  if (generation !== sessionLifecycle.generation) {
    return;
  }
  let invalid = 0;
  const read = (list, entity) =>
    list
      .filter((v) => v.accountKey === key)
      .flatMap((v) => {
        try {
          return [sanitizeEntity(entity, v, key)];
        } catch {
          invalid++;
          return [];
        }
      });
  state.transactions = read(tx, 'tx');
  state.bills = read(bills, 'bills');
  state.rules = read(rules, 'rules');
  state.snapshots = backups
    .filter((v) => v.accountKey === key)
    .sort((a, b) => b.createdAt - a.createdAt);
  state.pendingCount = jobs.filter((v) => v.accountKey === key).length;
  if (invalid) {
    publish('notice', [
      `${invalid} registro(s) antigo(s) inválido(s) foram preservados no armazenamento, mas não são exibidos.`,
      'warning',
    ]);
  }
}

/** Serializa alterações locais. Registros e fila da nuvem entram na mesma
 * transação do IndexedDB; uma falha não pode salvar apenas metade da operação.
 * A geração da sessão impede concluir uma gravação para outra conta após logout.
 */
function commitEntities(changes = [], deletions = [], options = {}) {
  const key = account(),
    generation = sessionLifecycle.generation;
  const task = async () => {
    if (generation !== sessionLifecycle.generation) {
      throw new Error('Sua sessão mudou. Entre novamente para continuar.');
    }
    state.busy++;
    state.saveError = '';
    publish('save:state');
    try {
      const now = Date.now(),
        puts = [],
        dels = [];
      for (const [entity, raw] of changes) {
        const item = sanitizeEntity(
          entity,
          { ...raw, updatedAt: now, syncedWithCloud: false },
          key,
        );
        const existing = await DB.get(entities[entity], item.id);
        if (existing && existing.accountKey !== key) {
          throw new Error('Este registro pertence a outra conta e não pode ser alterado.');
        }
        puts.push(
          [entities[entity], item],
          [
            STORE.outbox,
            {
              id: `${entity}_${item.id}`,
              recordId: item.id,
              entity,
              kind: 'put',
              accountKey: key,
              data: item,
              revision: uid('job'),
              updatedAt: now,
            },
          ],
        );
      }
      for (const [entity, id] of deletions) {
        const existing = await DB.get(entities[entity], id);
        if (existing && existing.accountKey !== key) {
          throw new Error('Este registro pertence a outra conta.');
        }
        dels.push([entities[entity], id]);
        puts.push([
          STORE.outbox,
          {
            id: `${entity}_${id}`,
            recordId: id,
            entity,
            kind: 'delete',
            accountKey: key,
            revision: uid('job'),
            updatedAt: now,
          },
        ]);
      }
      if (options.validateGraph) {
        validateFinancialGraph(
          mergedFinancialState(
            changes.map(([entity, item]) => [entity, sanitizeEntity(entity, item, key)]),
            deletions,
          ),
        );
      }
      await DB.commit(puts, dels);
      await loadAccountData();
      publish('data:changed');
      if (!options.skipBackup) {
        publish('backup:request');
      }
      publish('sync:request');
    } catch (e) {
      state.saveError = 'Falha ao salvar — tente novamente';
      throw e;
    } finally {
      state.busy--;
      publish('save:state');
    }
  };
  return enqueueWork(task);
}

async function ensurePlannedBills() {
  if (!state.loggedAccount) {
    return;
  }
  const keys = new Set(state.bills.map((b) => b.id)),
    occurrences = new Set(
      state.bills
        .filter((b) => b.ruleId)
        .map(
          (b) =>
            `${b.ruleId}|${b.totalInstallments ? b.installmentNumber : b.sequence || b.dueDate}`,
        ),
    );
  const horizon =
    addMonths(isoMonth() + '-01', 12) > addMonths(today(), 12)
      ? addMonths(isoMonth() + '-01', 12)
      : addMonths(today(), 12);
  const changes = state.rules
    .flatMap((r) => buildBills(r, horizon))
    .filter(
      (b) =>
        !keys.has(b.id) &&
        !occurrences.has(
          `${b.ruleId}|${b.totalInstallments ? b.installmentNumber : b.sequence || b.dueDate}`,
        ),
    )
    .map((b) => ['bills', b]);
  if (changes.length) {
    await commitEntities(changes, [], { skipBackup: true });
  }
}

function duplicateOf(item, ignoreId = '') {
  return state.transactions.find(
    (t) =>
      t.id !== ignoreId &&
      t.date === item.date &&
      t.type === item.type &&
      Math.round(t.amount * 100) === Math.round(item.amount * 100) &&
      t.description.trim().toLocaleLowerCase('pt-BR') ===
        item.description.trim().toLocaleLowerCase('pt-BR'),
  );
}

export { commitEntities, duplicateOf, enqueueWork, ensurePlannedBills, entities, loadAccountData };
