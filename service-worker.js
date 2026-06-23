const CACHE_NAME = 'stock-locator-v44'; // Changing this version forces a cache reset
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './search192.png'
];

// Install Event - Caches the essential shell files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      // Forces the waiting service worker to become the active service worker immediately
      return self.skipWaiting();
    })
  );
});

// Activate Event - Cleans up old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Forces all open browser tabs to immediately fall under the control of this new service worker
      return self.clients.claim();
    })
  );
});

// Fetch Event - Network-First Strategy for the CSV data, Cache-First for local assets
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // CRITICAL: If fetching the inventory CSV file, always go to the network directly!
  if (requestUrl.pathname.endsWith('.csv') || requestUrl.search.includes('v=')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Fallback to cache only if completely offline
        return caches.match(event.request);
      })
    );
    return;
  }

  // For app layout assets (HTML, CSS, Icons), look in cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
