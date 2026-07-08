// SKYOPS service worker — network-first for app shell (same fix as LEDGERAPP)
const CACHE = "skyops-v5";
const ASSETS = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Never cache Supabase API calls
  if (url.hostname.endsWith("supabase.co")) return;
  if (e.request.method !== "GET") return;
  // Network-first so updates always show; cache fallback when offline
  e.respondWith(
    fetch(e.request).then(res => {
      if (url.origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
