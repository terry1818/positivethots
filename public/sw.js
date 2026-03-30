const CACHE_NAME = 'pt-cache-v1';
const APP_SHELL = ['/', '/index.html'];

// Install — precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and auth callback routes
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/~oauth')) return;

  // Google Fonts — cache-first
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.open('google-fonts').then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              cache.put(request, response.clone());
              return response;
            })
        )
      )
    );
    return;
  }

  // Supabase API — network-first with 10s timeout
  if (url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/rest/')) {
    event.respondWith(
      caches.open('supabase-api').then((cache) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        return fetch(request, { signal: controller.signal })
          .then((response) => {
            clearTimeout(timeout);
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => {
            clearTimeout(timeout);
            return cache.match(request);
          });
      })
    );
    return;
  }

  // Hashed static assets — stale-while-revalidate
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Everything else — network-first, fall back to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
