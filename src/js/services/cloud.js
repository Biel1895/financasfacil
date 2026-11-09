import { enqueueWork, ensurePlannedBills, entities, loadAccountData } from '../data/repository.js';
import { sanitizeEntity } from '../domain/records.js';
import { DB, STORE } from '../infrastructure/database.js';
import { deadline } from '../infrastructure/deadline.js';
import { account, sessionLifecycle, state } from '../state/store.js';
import { toast } from '../ui/feedback.js';
import { render, renderSettings, renderSync } from '../ui/views.js';
import { readSupabaseConfig } from './cloud-config.js';

const TABLE = 'ff_finance_records';
const PAGE_SIZE = 500;
const Cloud = {
  configured: (window.FF_SUPABASE_CONFIG ?? null) !== null,
  client: null,
  connecting: null,
  ready: false,
  owner: null,
  timer: null,
  resync: false,
  subscription: null,
};

let rememberSession = null;
const sessionMemory = new Map();
const authStorage = {
  getItem(key) {
    return sessionMemory.get(key) ?? localStorage.getItem(key);
  },
  setItem(key, value) {
    if (rememberSession ?? localStorage.getItem(key) !== null) {
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
  },
};

async function connectCloud() {
  if (!Cloud.configured || Cloud.client) {
    return Cloud.client;
  }
  if (!Cloud.connecting) {
    Cloud.connecting = (async () => {
      const config = readSupabaseConfig(window.FF_SUPABASE_CONFIG);
      const { createClient } = await deadline(
        import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm'),
      );
      Cloud.client = createClient(config.url, config.publishableKey, {
        auth: { storage: authStorage, detectSessionInUrl: false },
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
  const { data, error } = await deadline(client.auth.getSession());
  if (error) {
    throw error;
  }
  if (!data.session) {
    return null;
  }
  const verified = await deadline(client.auth.getUser());
  if (verified.error) {
    throw verified.error;
  }
  return verified.data.user;
}

async function signInCloud(email, password, remember) {
  const client = await connectCloud();
  rememberSession = remember;
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    throw new Error('Confira seu e-mail e sua senha do Supabase e tente novamente.');
  }
  return data.user;
}

function bindCloudUser(user, onSessionEnd) {
  const { url } = readSupabaseConfig(window.FF_SUPABASE_CONFIG);
  const project = new URL(url).hostname.split('.')[0];
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
  return {
    accountKey: ['sb', project, user.id.replaceAll('-', '')].join('_'),
    identifier: user.email,
    displayName: String(user.email || 'Minha conta').split('@')[0],
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
  const { error } = await deadline(Cloud.client.auth.signOut({ scope: 'local' }));
  if (error) {
    throw new Error('Não foi possível encerrar a sessão. Tente sair novamente.');
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
        'A sincronização precisa de uma sessão online. Seus dados estão salvos neste aparelho.',
        'warning',
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
  state.syncError = '';
  renderSync();
  try {
    const jobs = (await DB.getAll(STORE.outbox)).filter(
      (job) => job.accountKey === key && Object.hasOwn(entities, job.entity),
    );
    for (let offset = 0; offset < jobs.length && currentSession(); offset += PAGE_SIZE) {
      const batch = jobs.slice(offset, offset + PAGE_SIZE);
      const rows = batch.map((job) => ({
        owner_id: owner,
        entity: job.entity,
        record_id: job.recordId,
        updated_ms: job.updatedAt,
        revision: job.revision,
        payload: job.kind === 'delete' ? null : job.data,
      }));
      const { error } = await Cloud.client
        .from(TABLE)
        .upsert(rows, { onConflict: 'owner_id,entity,record_id' })
        .abortSignal(AbortSignal.timeout(12000));
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
      const { data, error } = await Cloud.client
        .from(TABLE)
        .select('entity,record_id,updated_ms,payload')
        .eq('owner_id', owner)
        .order('entity')
        .order('record_id')
        .range(offset, offset + PAGE_SIZE - 1)
        .abortSignal(AbortSignal.timeout(12000));
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
        const pending = await DB.get(STORE.outbox, row.entity + '_' + row.record_id);
        if (pending || (local && (local.accountKey !== key || local.updatedAt > row.updated_ms))) {
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
                syncedWithCloud: true,
              },
              key,
            );
            puts.push([store, item]);
          } catch {
            // Preserve the local copy when a remote record is invalid.
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
    await DB.put(STORE.session, { key: 'lastSync_' + key, time: state.lastSync });
    if (!currentSession()) {
      return;
    }
    await ensurePlannedBills();
    render();
    if (explicit) {
      toast('Sincronização concluída.');
    }
  } catch (error) {
    if (currentSession()) {
      await enqueueWork(() => currentSession() && loadAccountData()).catch(console.warn);
    }
    if (currentSession()) {
      state.syncError = 'Não foi possível sincronizar com o Supabase.';
      console.warn('Sincronização adiada:', error);
      if (explicit) {
        toast('A sincronização falhou. Sua cópia local foi preservada.', 'warning');
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

export {
  Cloud,
  bindCloudUser,
  queueCloudSync,
  resumeCloudUser,
  signInCloud,
  signOutCloud,
  stopCloudSession,
  syncCloud,
};
