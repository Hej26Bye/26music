const scope = self.registration.scope;
const index = new URL('index.html', scope).href;
const shellCache = `ymusic-shell-v1:${scope}`;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(shellCache);
    await cache.add(new Request(index, { cache: 'reload' }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.mode !== 'navigate' || request.method !== 'GET') return;
  const url = new URL(request.url);
  url.search = '';
  url.hash = '';
  if (url.href !== scope && url.href !== index) return;

  event.respondWith((async () => {
    const cache = await caches.open(shellCache).catch(() => null);
    try {
      const response = await fetch(request);
      if (cache && response.ok && response.headers.get('content-type')?.includes('text/html')) {
        try { await cache.put(index, response.clone()); } catch {}
      }
      if (response.ok) return response;
      return (await cache?.match(index)) || response;
    } catch {
      return (await cache?.match(index)) || Response.error();
    }
  })());
});
