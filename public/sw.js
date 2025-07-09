// Service Worker optimisé pour la production
const CACHE_NAME = 'consortium-v2.0';
const STATIC_CACHE = 'consortium-static-v2.0';
const DYNAMIC_CACHE = 'consortium-dynamic-v2.0';

// Ressources à mettre en cache immédiatement
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Ressources à mettre en cache dynamiquement
const CACHE_STRATEGIES = {
  // Cache first pour les assets statiques
  static: [
    /\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/,
    /\/assets\//
  ],
  // Network first pour les données API
  network: [
    /\/api\//,
    /supabase\.co/
  ]
};

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Claiming clients');
        return self.clients.claim();
      })
  );
});

// Stratégie de cache pour les requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorer les requêtes vers des domaines externes (sauf Supabase)
  if (url.origin !== location.origin && !url.hostname.includes('supabase.co')) {
    return;
  }
  
  // Stratégie Cache First pour les assets statiques
  if (CACHE_STRATEGIES.static.some(pattern => pattern.test(request.url))) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Stratégie Network First pour les API
  if (CACHE_STRATEGIES.network.some(pattern => pattern.test(request.url))) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Stratégie par défaut: Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// Cache First Strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache First failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network First Strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Nettoyage périodique du cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    cleanOldCaches();
  }
});

async function cleanOldCaches() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 heures
  
  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const responseDate = new Date(dateHeader).getTime();
        if (now - responseDate > maxAge) {
          await cache.delete(request);
        }
      }
    }
  }
}