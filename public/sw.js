const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `librarytracker-cache-${CACHE_VERSION}`;

// Instalar: omitir espera para tomar el control rápido
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activar: eliminar versiones de caché antiguas automáticamente
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Interceptar peticiones con estrategia híbrida inteligente
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar peticiones no GET, API de Supabase, API de IGDB o rutas de API locales
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('igdb.com')
  ) {
    return;
  }

  // 1. Assets estáticos compilados con Hash (/_astro/, fuentes, svg) -> Cache First (Ultrarrápido)
  if (url.pathname.startsWith('/_astro/') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.png')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. Documentos HTML (/) -> Network First con fallback a Caché para ver siempre la última versión de Vercel
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
