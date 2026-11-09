import { today, uid } from '../domain/format.js';
import { DB, STORE } from '../infrastructure/database.js';
import { publish } from '../infrastructure/lifecycle.js';
import { account, state } from '../state/store.js';

let snapshotBusy = false;

function backupPayload() {
  return {
    application: 'FinancasFacil',
    schemaVersion: 3,
    exportedAt: new Date().toISOString(),
    account: account(),
    transactions: state.transactions,
    bills: state.bills,
    rules: state.rules,
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
  if (!state.loggedAccount || (!force && !state.transactions.length && !state.bills.length)) {
    return;
  }
  const key = account(),
    id = force ? uid('snapshot') : `daily_${key}_${today()}`;
  if (!force && state.snapshots.some((s) => s.id === id)) {
    return;
  }
  snapshotBusy = true;
  try {
    const snap = {
      id,
      accountKey: key,
      createdAt: Date.now(),
      label: force ? 'Antes da restauração' : 'Cópia diária',
      payload: backupPayload(),
    };
    const all = [snap, ...state.snapshots.filter((s) => s.id !== id)].sort(
      (a, b) => b.createdAt - a.createdAt,
    );
    await DB.commit(
      [[STORE.backups, snap]],
      all.slice(7).map((s) => [STORE.backups, s.id]),
    );
    if (state.loggedAccount?.accountKey === key) {
      state.snapshots = all.slice(0, 7);
      publish('backups:changed');
    }
  } finally {
    snapshotBusy = false;
  }
}

export { autoSnapshot, backupPayload };
