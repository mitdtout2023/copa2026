const CACHE_NAME = "figurinhas-copa-2026-v41-sync-album-state";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./google-apps-script-sync.gs",
  "./favicon.png",
  "./apple-touch-icon.png",
  "./apple-touch-icon-167x167.png",
  "./apple-touch-icon-152x152.png",
  "./apple-touch-icon-120x120.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/apple-touch-icon-167x167.png",
  "./icons/apple-touch-icon-152x152.png",
  "./icons/apple-touch-icon-120x120.png",
  "./icons/marstech-logo.png",
  "./marstech-logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : null)))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
