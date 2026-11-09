import { callbackKeys, readAuthReturn } from './services/auth-return.js';

const current = new URL(location.href);
const { code, redirectError } = readAuthReturn(current);
const oldAppBookmark = ['#inicio', '#lancamentos', '#contas', '#relatorios'].includes(current.hash);

// O Supabase continua voltando à URL inicial já configurada no projeto.
if (code || redirectError || oldAppBookmark) {
  const destination = new URL('login.html', current);
  for (const key of callbackKeys) {
    if (current.searchParams.has(key)) {
      destination.searchParams.set(key, current.searchParams.get(key));
    }
  }
  destination.hash = current.hash;
  location.replace(destination.href);
}
