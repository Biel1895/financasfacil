import { publish } from './lifecycle.js';

const STORE = {
  tx: 'movimentacoes',
  users: 'usuarios_cache',
  session: 'sessao_ativa',
  tombs: 'exclusoes_pendentes',
  bills: 'contas_programadas',
  rules: 'regras_recorrentes',
  outbox: 'fila_sincronizacao',
  backups: 'copias_diarias',
};

const DB = {
  IDB_NAME: 'FinancasFacilMultiDeviceDB',
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
              keyPath: name === 'users' ? 'accountKey' : name === 'session' ? 'key' : 'id',
            });
          }
        }
      };
      request.onsuccess = () => {
        const conn = request.result;
        conn.onversionchange = () => {
          conn.close();
          this.cached = null;
          publish('notice', ['Há uma versão nova. Recarregue a página para continuar.', 'warning']);
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
            'Não foi possível abrir seus dados. Verifique o armazenamento permitido pelo navegador.',
          ),
        );
      };
      request.onblocked = () => {
        publish('notice', [
          'Feche outras abas do FinançasFácil para atualizar o armazenamento.',
          'warning',
        ]);
      };
    });
    return this.cached;
  },
  async read(store, key, all = false) {
    const conn = await this.open();
    return new Promise((resolve, reject) => {
      const tx = conn.transaction(store, 'readonly');
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
    const names = [...new Set([...puts.map((p) => p[0]), ...deletes.map((p) => p[0])])];
    if (!names.length) {
      return;
    }
    const conn = await this.open();
    return new Promise((resolve, reject) => {
      const tx = conn.transaction(names, 'readwrite');
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
      tx.onerror = () => reject(tx.error || new Error('Falha ao salvar no aparelho.'));
      tx.onabort = () => reject(tx.error || new Error('Gravação cancelada.'));
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
  },
};

export { DB, STORE };
