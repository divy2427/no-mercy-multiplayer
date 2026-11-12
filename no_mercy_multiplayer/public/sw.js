const CACHE = 'no-mercy-room-v11';
const ASSETS = ['/', '/styles.css', '/table.css', '/table-layout.js', '/app.js', '/hand-csv.js', '/room-tools.js', '/engine.js', '/solo.js', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png', '/fonts/dm-sans-latin.woff2', '/fonts/barlow-condensed-800.woff2'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(url => new Request(url, {cache:'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('no-mercy-room-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !ASSETS.includes(url.pathname)) return;
  const refresh = fetch(event.request).then(async response => {
    if (!response.ok) throw new Error('Asset unavailable');
    const cache = await caches.open(CACHE);
    await cache.put(event.request, response.clone());
    return response;
  });
  // Finish updating the cache even if a sleeping server requires the cached shell.
  event.waitUntil(refresh.catch(() => {}));
  event.respondWith((async () => {
    const cached = await caches.match(event.request, {cacheName:CACHE});
    if (!cached) return refresh;
    let timer;
    try {
      return await Promise.race([refresh, new Promise(resolve => {timer = setTimeout(() => resolve(cached), 3000);})]);
    } catch { return cached; }
    finally { clearTimeout(timer); }
  })());
});
