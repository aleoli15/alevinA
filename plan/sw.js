// Partidos Alevín A — funcionamiento sin conexión
var CACHE = "alevin-plan-v3";
var FILES = ["./", "index.html", "sync.js", "manifest.webmanifest", "icons/plancal-192.png", "icons/plancal-512.png", "icons/plancal-touch-180.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k.indexOf("alevin-plan-") === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Red primero (para recibir actualizaciones); si no hay conexión, copia guardada.
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request, new URL(e.request.url).origin === location.origin ? { cache: "no-cache" } : {}).then(function (r) {
      if (r && r.ok && new URL(e.request.url).origin === location.origin) {
        var copy = r.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return r;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true }).then(function (m) { return m || caches.match("index.html"); });
    })
  );
});
