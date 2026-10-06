/*
 * Service worker for offline use. On install it precaches the app shell and
 * every build asset listed in /precache-manifest.json (generated at build
 * time), so all calculator engines work offline after the first visit.
 * Navigations are network-first with the cached SPA shell as fallback;
 * static assets are cache-first (they are content-hashed).
 * No calculation ever depends on the network.
 */
const VERSION = 'v1'
const CACHE = `calc-hub-${VERSION}`

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      let assets = []
      try {
        const res = await fetch('/precache-manifest.json', { cache: 'no-store' })
        if (res.ok) assets = await res.json()
      } catch {
        assets = []
      }
      await cache.addAll(['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', ...assets])
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k.startsWith('calc-hub-') && k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req)
          const cache = await caches.open(CACHE)
          cache.put('/index.html', fresh.clone())
          return fresh
        } catch {
          return (await caches.match('/index.html')) || (await caches.match('/')) || Response.error()
        }
      })(),
    )
    return
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(req)
      if (cached) return cached
      const res = await fetch(req)
      if (res.ok && (url.pathname.startsWith('/assets/') || /\.(png|svg|webmanifest|json)$/.test(url.pathname))) {
        const cache = await caches.open(CACHE)
        cache.put(req, res.clone())
      }
      return res
    })(),
  )
})
