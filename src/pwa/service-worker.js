const { version, files } = /* @release */ {};
const scope = self.registration.scope;
const cachePrefix = 'financasfacil-shell:' + scope + ':';
const cacheName = cachePrefix + version;
const shell = files.map((file) => new URL(file, scope).href);
const shellUrls = new Set(shell);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) => cache.addAll(shell.map((url) => new Request(url, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(cachePrefix) && key !== cacheName)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }
  const url = new URL(request.url);
  if (request.mode === 'navigate') {
    // A página é estática. O endereço na barra preserva os parâmetros do Supabase.
    url.search = '';
  }
  const resource = url.href === scope ? new URL('index.html', scope).href : url.href;
  if (!shellUrls.has(resource)) {
    return;
  }
  event.respondWith(
    caches
      .open(cacheName)
      .then((cache) => cache.match(resource))
      .then((response) => response ?? fetch(request)),
  );
});
