/**
 * Minimal service worker: makes the static shell (html/css/js/fonts/assets)
 * installable and available with a flaky connection. Stale-while-revalidate
 * for same-origin GET requests -- serve the cached copy instantly (or fall
 * back to network on a cold cache), but always also re-fetch in the
 * background and update the cache for next time. No hardcoded file list to
 * keep in sync as views/assets are added, and edits don't get stuck behind
 * a stale cache forever (a plain cache-first strategy would -- confirmed by
 * hand while building this: editing a JS file kept serving the old version
 * indefinitely with cache-first, since nothing ever re-checked the network).
 *
 * Deliberately does NOT touch cross-origin requests (Firebase/Firestore,
 * Google Fonts, the gstatic Firebase SDK) -- those always hit the network.
 * Tracker data needs a live connection regardless; Firestore's own client
 * queues offline writes, this service worker isn't involved in that.
 */
const CACHE_VERSION = 'hb-cache-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(request);
      const networked = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      });
      // Don't let a background revalidate reject the response when a cached
      // copy exists (e.g. offline) -- only surface the network error when
      // there's nothing cached to fall back on.
      if (cached) {
        networked.catch(() => {});
        return cached;
      }
      return networked;
    })
  );
});
