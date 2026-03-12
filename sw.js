const CACHE = 'alima-v1';
const ASSETS = ['/'];

// Installation — mise en cache de la page principale
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activation — supprimer les anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Network first, fallback cache
// Stratégie : on essaie toujours le réseau en priorité
// Si offline → cache. Les données localStorage ne passent pas par le SW.
self.addEventListener('fetch', e => {
  // Ne pas intercepter les appels API Anthropic / Netlify Functions
  if (e.request.url.includes('/.netlify/') || 
      e.request.url.includes('api.anthropic.com') ||
      e.request.url.includes('fonts.googleapis.com') ||
      e.request.url.includes('fonts.gstatic.com')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Mettre en cache la réponse fraîche
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
