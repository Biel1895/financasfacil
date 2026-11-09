function readSupabaseConfig(raw) {
  const url = String(raw?.url ?? '')
    .trim()
    .replace(/\/$/, '');
  const publishableKey = String(raw?.publishableKey ?? '').trim();
  if (!/^https:\/\/[a-z0-9]{3,24}\.supabase\.co$/.test(url)) {
    throw new Error('Informe a URL HTTPS do projeto Supabase.');
  }
  if (!/^sb_publishable_[a-zA-Z0-9_-]+$/.test(publishableKey)) {
    throw new Error('Informe a chave Publishable do Supabase.');
  }
  return { url, publishableKey };
}

export { readSupabaseConfig };
