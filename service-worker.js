const CACHE_NAME = 'abrantes-calc-v2';

const CORE_ASSETS = [
    './',
    'index.html',
    'planner.html',
    'style.css',
    'planner.css',
    'script.js',
    'planner.js'
];

// Install: pre-cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch: network-first strategy
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Only handle GET requests
    if (request.method !== 'GET') return;

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Don't cache non-ok responses or opaque responses from CDNs we don't control
                if (response.ok || response.type === 'opaque') {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(request).then((cached) => {
                    return cached || new Response('', { status: 503, statusText: 'Offline' });
                });
            })
    );
});
