// ImaginaLab PWA Service Worker — lean app-shell cache strategy.
//
// SOFT HANDS RULES:
//   1. NEVER cache /api/ proxy requests (ImageKit credentials / pagination).
//   2. NEVER cache external imagekit.io media (avoids storage exhaustion).
//   3. Only cache the local static shell so the app opens on poor connections.

const CACHE_NAME = 'imaginalab-shell-v1';

/** Static assets that form the offline app shell. */
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ---------------------------------------------------------------------------
// Install — pre-cache the shell, activate immediately
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------------------
// Activate — delete stale caches from previous versions
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// Fetch — route requests through the appropriate strategy
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // --- BYPASS: ImageKit proxy API and external ImageKit media delivery ---
  // These must always go to the network: they carry auth tokens, dynamic
  // transformations, and large binary payloads unsuitable for local storage.
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('imagekit.io') ||
    url.hostname.includes('ik.imagekit.io')
  ) {
    return; // Hand off to the browser's default network fetch
  }

  // --- BYPASS: Chrome extensions and non-http(s) schemes ---
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // --- BYPASS: Vite development server internals, scripts, modules, and HMR ---
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('node_modules') ||
    url.search.includes('t=') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx')
  ) {
    return;
  }

  // --- HTML navigation: network-first, fall back to cached shell ---
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // --- Static shell assets: cache-first ---
  event.respondWith(
    caches
      .match(request)
      .then((cached) => cached || fetch(request))
  );
});
